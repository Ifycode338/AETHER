/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import React, { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Truck, Tag, X, MapPin, CreditCard, ShoppingBag, User, Phone, ChevronRight, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { sendOrderConfirmationEmail } from "@/lib/emailService";
import { useAuth } from "@/lib/AuthContext";

// Update this to the inbox where you want order alerts delivered.
const ADMIN_EMAIL = "kellyrhodesyey517@gmail.com";

export default function Checkout() {
  const { user } = useAuth();
  const outletContext = useOutletContext();
  const cart = outletContext?.cart || [];
  const setCart = outletContext?.setCart || (() => {});
  const navigate = useNavigate();
  const [form, setForm] = useState({ customer_name: "", customer_email: "", customer_phone: "", customer_address: "" });
  const [localCart, setLocalCart] = useState([]);
  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(null);
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formErrors, setFormErrors] = useState({});

  // Auto-fill email from logged-in user
  useEffect(() => {
    if (user?.email && !form.customer_email) {
      setForm(prev => ({ ...prev, customer_email: user.email }));
    }
  }, [user, form.customer_email]);
  
  // Shipping is temporarily free while the fee is removed.
  const shippingRate = 0;
  const subtotal = localCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = discountApplied ? subtotal * (discountApplied.percentage / 100) : 0;
  const total = subtotal + shippingRate - discountAmount;

  // Store cart in localStorage for persistence during payment
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('checkout_cart', JSON.stringify(cart));
    }
    setLocalCart(cart);
  }, [cart]);

  // Load cart from localStorage if cart is empty
  useEffect(() => {
    if (cart.length === 0) {
      const savedCart = localStorage.getItem('checkout_cart');
      if (savedCart) {
        try {
          setLocalCart(JSON.parse(savedCart));
        } catch (e) {
          console.error('Error parsing saved cart:', e);
        }
      }
    }
  }, [cart]);



  const validateStep = (step) => {
    const errors = {};
    
    if (step === 1) {
      if (!form.customer_name.trim()) errors.customer_name = "Name is required";
      if (!form.customer_email.trim()) errors.customer_email = "Email is required";
      if (form.customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email)) {
        errors.customer_email = "Invalid email address";
      }
      if (!form.customer_phone.trim()) errors.customer_phone = "Phone is required";
      if (!form.customer_address.trim()) errors.customer_address = "Address is required";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handleProceedToPayment = async () => {
    if (validateStep(currentStep)) {
      // Validate stock availability before proceeding to payment
      try {
        const { data: products, error: stockError } = await supabase
          .from('products')
          .select('id, stock, name')
          .in('id', localCart.map(item => item.product_id));
        
        if (stockError) {
          toast.error('Failed to check stock availability');
          return;
        }
        
        // Create stock map
        const stockMap = {};
        products?.forEach(p => stockMap[p.id] = { stock: p.stock, name: p.name });
        
        // Validate each item
        for (const item of localCart) {
          const productInfo = stockMap[item.product_id];
          const availableStock = productInfo?.stock || 0;
          
          if (availableStock < item.quantity) {
            toast.error(
              `Insufficient stock for ${item.name}. Only ${availableStock} available, but you have ${item.quantity} in cart.`
            );
            return;
          }
        }
        
        // Stock validation passed, proceed to payment
        const orderData = {
          customer_name: form.customer_name,
          customer_email: form.customer_email,
          customer_phone: form.customer_phone,
          customer_address: form.customer_address,
          items: localCart.map(i => ({
            product_id: i.product_id,
            product_name: i.name,
            quantity: i.quantity,
            price: i.price
          })),
          subtotal,
          shipping_rate: shippingRate,
          discount_code: discountApplied?.code || null,
          discount_amount: discountAmount,
          total
        };
        
        sessionStorage.removeItem("pending_paystack_attempt");
        navigate('/payment', { state: orderData });
      } catch (err) {
        console.error('Error validating stock:', err);
        toast.error('Failed to validate stock. Please try again.');
      }
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    
    setApplyingDiscount(true);
    try {
      // Query database for discount code
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', discountCode.toUpperCase())
        .eq('is_active', true)
        .single();
      
      if (error) {
        console.error('Error fetching discount code:', error);
        setDiscountApplied(null);
        toast.error('Invalid discount code');
        return;
      }
      
      // Check if discount is valid
      const now = new Date();
      const validFrom = data.valid_from ? new Date(data.valid_from) : null;
      const validUntil = data.valid_until ? new Date(data.valid_until) : null;
      
      if (validFrom && now < validFrom) {
        setDiscountApplied(null);
        toast.error('This discount code is not yet valid');
        return;
      }
      
      if (validUntil && now > validUntil) {
        setDiscountApplied(null);
        toast.error('This discount code has expired');
        return;
      }
      
      if (data.max_uses && data.used_count >= data.max_uses) {
        setDiscountApplied(null);
        toast.error('This discount code has reached its usage limit');
        return;
      }
      
      // Apply discount
      setDiscountApplied({
        code: data.code,
        percentage: data.percentage,
        id: data.id
      });
      toast.success(`Discount applied: ${data.percentage}% off!`);
    } catch (error) {
      console.error('Error applying discount:', error);
      setDiscountApplied(null);
      toast.error('Invalid discount code');
    } finally {
      setApplyingDiscount(false);
    }
  };



  if (localCart.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-[#0A3D2E]/40 dark:text-white/40 text-lg mb-4">Your cart is empty</p>
          <Link to="/shop" className="text-[#22C55E] text-sm font-medium hover:underline">Back to Shop</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
      <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-[#0A3D2E]/50 dark:text-white/50 hover:text-[#0A3D2E] dark:hover:text-white transition-colors mb-6 sm:mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to Shop
      </Link>

      <h1 className="font-heading font-bold text-2xl sm:text-3xl text-[#0A3D2E] dark:text-white mb-8 sm:mb-10">Checkout</h1>

      {/* Progress Steps */}
      <div className="mb-8 sm:mb-12">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                  currentStep >= step 
                    ? 'bg-[#22C55E] text-white' 
                    : 'bg-[#E2F1E7] text-[#0A3D2E]/40'
                }`}>
                  {currentStep > step ? <CheckCircle className="w-5 h-5" /> : step}
                </div>
                <span className={`text-xs mt-2 font-medium transition-colors ${
                  currentStep >= step ? 'text-[#22C55E]' : 'text-[#0A3D2E]/40'
                }`}>
                  {step === 1 ? 'Information' : step === 2 ? 'Review' : 'Payment'}
                </span>
              </div>
              {step < 3 && (
                <div className={`flex-1 h-1 mx-4 rounded-full transition-colors ${
                  currentStep > step ? 'bg-[#22C55E]' : 'bg-[#E2F1E7]'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="bg-[#E2F1E7]/30 dark:bg-white/5 rounded-2xl p-6 border border-[#E2F1E7] dark:border-white/10">
                <h2 className="font-heading font-semibold text-lg text-[#0A3D2E] dark:text-white mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#22C55E]" />
                  Contact Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0A3D2E] dark:text-white mb-1.5">Full Name</label>
                    <input
                      required 
                      value={form.customer_name} 
                      onChange={e => setForm({ ...form, customer_name: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border ${
                        formErrors.customer_name ? 'border-red-500' : 'border-[#E2F1E7] dark:border-white/10'
                      } bg-white dark:bg-white/5 text-[#0A3D2E] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]`}
                    />
                    {formErrors.customer_name && <p className="text-xs text-red-500 mt-1">{formErrors.customer_name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0A3D2E] dark:text-white mb-1.5">Email</label>
                    <input
                      required 
                      type="email" 
                      value={form.customer_email} 
                      onChange={e => setForm({ ...form, customer_email: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border ${
                        formErrors.customer_email ? 'border-red-500' : 'border-[#E2F1E7] dark:border-white/10'
                      } bg-white dark:bg-white/5 text-[#0A3D2E] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]`}
                    />
                    {formErrors.customer_email && <p className="text-xs text-red-500 mt-1">{formErrors.customer_email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0A3D2E] dark:text-white mb-1.5">Phone</label>
                    <input
                      value={form.customer_phone} 
                      onChange={e => setForm({ ...form, customer_phone: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border ${
                        formErrors.customer_phone ? 'border-red-500' : 'border-[#E2F1E7] dark:border-white/10'
                      } bg-white dark:bg-white/5 text-[#0A3D2E] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]`}
                    />
                    {formErrors.customer_phone && <p className="text-xs text-red-500 mt-1">{formErrors.customer_phone}</p>}
                  </div>
                </div>
              </div>

              <div className="bg-[#E2F1E7]/30 dark:bg-white/5 rounded-2xl p-6 border border-[#E2F1E7] dark:border-white/10">
                <h2 className="font-heading font-semibold text-lg text-[#0A3D2E] dark:text-white mb-6 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#22C55E]" />
                  Delivery Address
                </h2>
                <div>
                  <label className="block text-sm font-medium text-[#0A3D2E] dark:text-white mb-1.5">Delivery Address</label>
                  <textarea
                    required 
                    rows={3} 
                    value={form.customer_address} 
                    onChange={e => setForm({ ...form, customer_address: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      formErrors.customer_address ? 'border-red-500' : 'border-[#E2F1E7] dark:border-white/10'
                    } bg-white dark:bg-white/5 text-[#0A3D2E] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] resize-none`}
                  />
                  {formErrors.customer_address && <p className="text-xs text-red-500 mt-1">{formErrors.customer_address}</p>}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleNextStep}
                  className="bg-[#22C55E] text-[#051510] hover:bg-[#16a34a] font-semibold h-12 px-8 rounded-xl flex items-center gap-2"
                >
                  Continue to Review <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="bg-[#E2F1E7]/30 dark:bg-white/5 rounded-2xl p-6 border border-[#E2F1E7] dark:border-white/10">
                <h2 className="font-heading font-semibold text-lg text-[#0A3D2E] dark:text-white mb-6 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#22C55E]" />
                  Order Review
                </h2>
                <div className="space-y-4">
                  {localCart.map(item => (
                    <div key={item.product_id} className="flex gap-4 p-4 bg-white dark:bg-[#071f15] rounded-xl border border-[#E2F1E7] dark:border-[#22C55E]/10">
                      {item.image_url && (
                        <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-[#0A3D2E] dark:text-white">{item.name}</h4>
                        <p className="text-xs text-[#0A3D2E]/60 dark:text-white/60">Quantity: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-[#0A3D2E] dark:text-white">₦{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#E2F1E7]/30 dark:bg-white/5 rounded-2xl p-6 border border-[#E2F1E7] dark:border-white/10">
                <h2 className="font-heading font-semibold text-lg text-[#0A3D2E] dark:text-white mb-4">Delivery Details</h2>
                <div className="space-y-2 text-sm">
                  <p><span className="text-[#0A3D2E]/60 dark:text-white/60">Name:</span> {form.customer_name}</p>
                  <p><span className="text-[#0A3D2E]/60 dark:text-white/60">Email:</span> {form.customer_email}</p>
                  <p><span className="text-[#0A3D2E]/60 dark:text-white/60">Phone:</span> {form.customer_phone}</p>
                  <p><span className="text-[#0A3D2E]/60 dark:text-white/60">Address:</span> {form.customer_address}</p>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  onClick={handlePrevStep}
                  variant="outline"
                  className="border-[#0A3D2E]/20 text-[#0A3D2E] dark:border-white/10 dark:text-white h-12 px-8 rounded-xl flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <Button
                  onClick={handleProceedToPayment}
                  className="bg-[#22C55E] text-[#051510] hover:bg-[#16a34a] font-semibold h-12 px-8 rounded-xl flex items-center gap-2"
                >
                  Continue to Payment <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="bg-[#E2F1E7]/30 dark:bg-white/5 rounded-2xl p-6 border border-[#E2F1E7] dark:border-white/10">
                <h2 className="font-heading font-semibold text-lg text-[#0A3D2E] dark:text-white mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#22C55E]" />
                  Payment Summary
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#0A3D2E]/70 dark:text-white/70">Subtotal</span>
                    <span className="text-[#0A3D2E] dark:text-white">₦{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#0A3D2E]/70 dark:text-white/70">Shipping</span>
                    <span className="text-[#0A3D2E] dark:text-white">₦{shippingRate.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-[#22C55E]">
                      <span>Discount</span>
                      <span>-₦{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-4 border-t border-[#E2F1E7] dark:border-white/10">
                    <span className="text-[#0A3D2E] dark:text-white">Total</span>
                    <span className="text-[#22C55E]">₦{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  onClick={handlePrevStep}
                  variant="outline"
                  className="border-[#0A3D2E]/20 text-[#0A3D2E] dark:border-white/10 dark:text-white h-12 px-8 rounded-xl flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <Button
                  onClick={handleProceedToPayment}
                  className="bg-[#22C55E] text-[#051510] hover:bg-[#16a34a] font-semibold h-12 px-8 rounded-xl flex items-center gap-2"
                >
                  Proceed to Payment <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-2">
          {/* Mobile toggle for order summary */}
          <button
            onClick={() => setShowOrderSummary(!showOrderSummary)}
            className="lg:hidden w-full mb-4 p-4 bg-[#E2F1E7]/30 dark:bg-white/5 rounded-xl border border-[#E2F1E7] dark:border-white/10 flex items-center justify-between"
          >
            <span className="font-heading font-semibold text-[#0A3D2E] dark:text-white">Order Summary</span>
            <span className="text-[#0A3D2E] dark:text-white">₦{total.toFixed(2)}</span>
          </button>

          <div className={`bg-[#E2F1E7]/30 dark:bg-white/5 rounded-2xl p-4 sm:p-6 border border-[#E2F1E7] dark:border-white/10 sticky top-24 ${!showOrderSummary ? 'hidden lg:block' : ''}`}>
            <h3 className="font-heading font-semibold text-[#0A3D2E] dark:text-white mb-4 hidden lg:block">Order Summary</h3>
            
            {/* Items */}
            <div className="space-y-3 mb-4">
              {localCart.map(item => (
                <div key={item.product_id} className="flex justify-between text-sm">
                  <span className="text-[#0A3D2E]/70 dark:text-white/70">{item.name} × {item.quantity}</span>
                  <span className="font-medium text-[#0A3D2E] dark:text-white">₦{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Discount Code */}
            <div className="mb-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A3D2E]/30 dark:text-white/30" />
                  <input
                    type="text"
                    placeholder="Discount code"
                    value={discountCode}
                    onChange={e => setDiscountCode(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-[#E2F1E7] dark:border-white/10 bg-white dark:bg-white/5 text-[#0A3D2E] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                  />
                  {discountApplied && (
                    <button
                      onClick={() => { setDiscountApplied(null); setDiscountCode(''); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#22C55E] hover:text-[#16a34a]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleApplyDiscount}
                  disabled={applyingDiscount || !discountCode.trim()}
                  className="px-4 py-2.5 bg-[#0A3D2E] dark:bg-white/10 text-white dark:text-white text-sm font-medium rounded-lg hover:bg-[#0A3D2E]/90 dark:hover:bg-white/20 disabled:opacity-50 transition-colors"
                >
                  {applyingDiscount ? '...' : 'Apply'}
                </button>
              </div>
              {discountApplied && (
                <p className="text-xs text-[#22C55E] mt-2 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {discountApplied.percentage}% discount applied
                </p>
              )}
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between text-[#0A3D2E]/70 dark:text-white/70">
                <span>Subtotal</span>
                <span>₦{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#0A3D2E]/70 dark:text-white/70">
                <span className="flex items-center gap-1">
                  <Truck className="w-4 h-4" />
                  Shipping
                </span>
                <span>₦0.00</span>
              </div>
              {discountApplied && (
                <div className="flex justify-between text-[#22C55E]">
                  <span>Discount ({discountApplied.percentage}%)</span>
                  <span>-₦{discountAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="border-t border-[#E2F1E7] dark:border-white/10 pt-4 flex justify-between">
              <span className="font-semibold text-[#0A3D2E] dark:text-white">Total</span>
              <span className="font-heading font-bold text-lg text-[#0A3D2E] dark:text-white">₦{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}