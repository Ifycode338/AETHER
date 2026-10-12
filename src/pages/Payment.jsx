import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { useNotifications } from "@/lib/NotificationContext";
import { getAdminFCMTokens, sendBroadcastNotification } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

const PAYSTACK_PUBLIC_KEY = "pk_live_6ac0339e04b162798a65338e16c2c91f32c0814e";
const PENDING_PAYMENT_KEY = "pending_payment_order";

let paystackScriptPromise;

function loadPaystackScript() {
  if (window.PaystackPop) {
    return Promise.resolve();
  }

  if (!paystackScriptPromise) {
    paystackScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      script.onload = () => {
        if (window.PaystackPop) {
          resolve();
        } else {
          reject(new Error("Paystack loaded without its payment interface."));
        }
      };
      script.onerror = () => {
        script.remove();
        reject(new Error("Failed to load the Paystack script."));
      };
      document.body.appendChild(script);
    }).catch((loadError) => {
      paystackScriptPromise = null;
      throw loadError;
    });
  }

  return paystackScriptPromise;
}

export default function Payment() {
  const { user } = useAuth();
  const { sendLocalNotification } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);
  const processingRef = useRef(false);
  const finalizingPaymentRef = useRef(false);
  const returnedFromBackgroundRef = useRef(false);
  const resumeTimeoutRef = useRef(null);

  useEffect(() => {
    let active = true;
    let data = location.state;

    if (!data) {
      try {
        const savedOrder = sessionStorage.getItem(PENDING_PAYMENT_KEY);
        data = savedOrder ? JSON.parse(savedOrder) : null;
      } catch (storageError) {
        console.error("Failed to restore pending payment:", storageError);
        setError("Could not restore your pending payment. Please return to checkout.");
        setLoading(false);
        return () => {
          active = false;
        };
      }
    }

    if (!data) {
      setError("No order data found. Please start checkout again.");
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setOrderData(data);
    try {
      sessionStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(data));
    } catch (storageError) {
      console.error("Failed to save pending payment:", storageError);
      setError("Could not save your pending payment. Please try again.");
      setLoading(false);
      return () => {
        active = false;
      };
    }

    loadPaystackScript()
      .then(() => {
        if (active) setLoading(false);
      })
      .catch((loadError) => {
        console.error("Failed to load Paystack script:", loadError);
        if (active) {
          setError("Failed to load payment system. Please try again.");
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [location.state]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (processingRef.current && !finalizingPaymentRef.current) {
          returnedFromBackgroundRef.current = true;
        }
        return;
      }

      if (!returnedFromBackgroundRef.current) return;
      returnedFromBackgroundRef.current = false;
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = setTimeout(() => {
        if (processingRef.current && !finalizingPaymentRef.current) {
          processingRef.current = false;
          setProcessing(false);
          toast.info(
            "The Paystack window did not resume. Your order details are saved; tap Pay to continue. If you already completed the transfer, check its status before retrying."
          );
        }
      }, 1500);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearTimeout(resumeTimeoutRef.current);
    };
  }, []);

  // Prevent navigation when payment is in progress
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (processing) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    const handlePopState = (e) => {
      if (processing) {
        e.preventDefault();
        const shouldLeave = window.confirm('Payment is in progress. Are you sure you want to leave? The payment will be cancelled.');
        if (!shouldLeave) {
          window.history.pushState(null, '', window.location.href);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [processing]);

  const handlePayment = () => {
    if (!orderData) return;
    if (!window.PaystackPop) {
      setError("Payment system is unavailable. Please try again.");
      return;
    }

    console.log('Starting payment process...');
    console.log('Paystack available:', typeof window.PaystackPop !== 'undefined');
    console.log('Order data:', orderData);

    setProcessing(true);
    processingRef.current = true;
    finalizingPaymentRef.current = false;
    setError(null);

    try {
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: orderData.customer_email,
        amount: orderData.total * 100, // Convert to kobo
        currency: 'NGN',
        ref: '' + Math.floor((Math.random() * 1000000000) + 1),
        metadata: {
          custom_fields: [
            {
              display_name: "Customer Name",
              variable_name: "customer_name",
              value: orderData.customer_name
            }
          ]
        },
        callback: (response) => {
          console.log('Payment callback triggered:', response);
          if (finalizingPaymentRef.current) return;
          finalizingPaymentRef.current = true;
          createOrder(response);
        },
        onClose: () => {
          console.log('Payment modal closed');
          if (finalizingPaymentRef.current) return;
          processingRef.current = false;
          setProcessing(false);
          toast.info('Payment cancelled');
        },
        onOpen: () => {
          console.log('Payment modal opened');
        }
      });

      console.log('Opening Paystack modal...');
      handler.openIframe();
    } catch (err) {
      console.error('Error opening Paystack modal:', err);
      setError('Failed to open payment modal. Please try again.');
      processingRef.current = false;
      finalizingPaymentRef.current = false;
      setProcessing(false);
      toast.error('Failed to open payment modal');
    }
  };



  const createOrder = async (paymentResponse) => {
    try {
      console.log('Creating order with payment response:', paymentResponse);

      // Final stock validation before creating order
      const { data: products, error: stockError } = await supabase
        .from('products')
        .select('id, stock')
        .in('id', orderData.items.map(item => item.product_id));
      
      if (stockError) {
        console.error('Stock check error:', stockError);
        throw new Error('Failed to verify stock availability');
      }
      
      const stockMap = {};
      products?.forEach(p => stockMap[p.id] = p.stock);
      
      for (const item of orderData.items) {
        const availableStock = stockMap[item.product_id] || 0;
        if (availableStock < item.quantity) {
          throw new Error(`Insufficient stock for ${item.product_name}. Only ${availableStock} available.`);
        }
      }

      // Create order in Supabase
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id || null,
          customer_name: orderData.customer_name,
          customer_email: orderData.customer_email,
          customer_phone: orderData.customer_phone,
          customer_address: orderData.customer_address,
          items: orderData.items,
          subtotal: orderData.subtotal,
          shipping_rate: orderData.shipping_rate,
          discount_code: orderData.discount_code || null,
          discount_amount: orderData.discount_amount || 0,
          total: orderData.total,
          status: "paid",
          payment_reference: paymentResponse.reference
        })
        .select()
        .single();

      if (error) {
        console.error('Order creation error:', error);
        throw error;
      }

      console.log('Order created successfully:', order);

      // Reduce stock for each product
      console.log('Starting stock reduction for items:', orderData.items);
      
      for (const item of orderData.items) {
        console.log(`Processing stock reduction for product ${item.product_id}, quantity: ${item.quantity}`);
        
        const { data: currentProduct, error: fetchError } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single();

        if (fetchError) {
          console.error('Error fetching product stock:', item.product_id, fetchError);
          continue;
        }

        const currentStock = currentProduct.stock || 0;
        const newStock = Math.max(0, currentStock - item.quantity);
        
        console.log(`Product ${item.product_id}: current stock ${currentStock}, reducing by ${item.quantity}, new stock ${newStock}`);

        const { data: updatedProduct, error: updateError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.product_id)
          .select('stock')
          .single();

        if (updateError) {
          console.error('Error updating stock for product:', item.product_id, updateError);
        } else {
          console.log(`Successfully updated stock for product ${item.product_id} to ${updatedProduct.stock}`);
        }
      }

      console.log('Stock reduction completed');

      // Send push notification to admins
      try {
        const adminTokens = await getAdminFCMTokens();
        if (adminTokens.length > 0) {
          await sendBroadcastNotification(
            adminTokens,
            'New Order Received!',
            `Order #${order.id.slice(0, 8)} from ${order.customer_name} - ₦${order.total.toFixed(2)}`,
            {
              type: 'new_order',
              orderId: order.id,
              url: `/admin/orders`
            }
          );
          console.log('Admin push notification sent');
        } else {
          console.log('No admin FCM tokens found');
        }
      } catch (notificationError) {
        console.error('Error sending admin notification:', notificationError);
        // Don't fail the order if notification fails
      }

      // Clear cart from localStorage and trigger cart clear in app
      localStorage.removeItem('checkout_cart');
      localStorage.removeItem('cart');
      sessionStorage.removeItem(PENDING_PAYMENT_KEY);
      
      // Also clear any cart data that might be stored
      const cartClearEvent = new CustomEvent('cartClear');
      window.dispatchEvent(cartClearEvent);
      
      console.log('Cart cleared, redirecting to receipt...');

      processingRef.current = false;
      finalizingPaymentRef.current = false;
      setProcessing(false);
      toast.success('Payment successful!');

      // Send notification to customer
      sendLocalNotification(
        'Order Confirmed!',
        `Your order #${order.id.slice(0, 8)} has been placed successfully.`,
        'order',
        { orderId: order.id, link: `/order/${order.id}` }
      );

      // Trigger new order notification for admin (via localStorage event)
      const newOrderEvent = new CustomEvent('newOrder', { 
        detail: { 
          orderId: order.id, 
          customerName: order.customer_name,
          total: order.total 
        } 
      });
      window.dispatchEvent(newOrderEvent);

      // Redirect to receipt
      navigate(`/order/${order.id}`, { replace: true });

    } catch (err) {
      console.error('Error creating order:', err);
      setError(err.message || 'Failed to create order. Please try again.');
      processingRef.current = false;
      finalizingPaymentRef.current = false;
      setProcessing(false);
      toast.error('Failed to create order');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#22C55E] animate-spin mx-auto mb-4" />
          <p className="text-[#0A3D2E]/60 dark:text-white/60">Loading payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-[#0A3D2E] dark:text-white mb-3">Payment Error</h1>
          <p className="text-[#0A3D2E]/60 dark:text-white/70 text-sm mb-8">{error}</p>
          <Button onClick={() => navigate('/shop')} className="bg-[#22C55E] text-[#051510] hover:bg-[#16a34a] font-semibold h-12 px-8 rounded-xl">
            Back to Shop
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
      {processing && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Payment in progress. If the Paystack window closes while you switch apps, return here to continue. If you already completed the transfer, check its status before trying again.
          </p>
        </div>
      )}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        disabled={processing}
        className="text-[#0A3D2E] hover:text-[#0A3D2E] mb-8"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      <div className="bg-white dark:bg-[#071f15] border border-[#E2F1E7] dark:border-[#22C55E]/10 rounded-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[#22C55E]" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-[#0A3D2E] dark:text-white mb-2">Complete Payment</h1>
          <p className="text-sm text-[#0A3D2E]/60 dark:text-white/60">
            Total amount: ₦{orderData?.total?.toFixed(2)}
          </p>
        </div>

        <div className="bg-[#E2F1E7]/30 dark:bg-white/5 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-[#0A3D2E] dark:text-white mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            {orderData?.items?.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-[#0A3D2E]/70 dark:text-white/70">
                  {item.product_name} x {item.quantity}
                </span>
                <span className="text-[#0A3D2E] dark:text-white font-medium">
                  ₦{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="pt-2 mt-2 border-t border-[#E2F1E7] dark:border-white/10">
              <div className="flex justify-between font-bold">
                <span className="text-[#0A3D2E] dark:text-white">Total</span>
                <span className="text-[#22C55E]">₦{orderData?.total?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#E2F1E7]/30 dark:bg-white/5 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-[#0A3D2E] dark:text-white mb-4">Payment Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#0A3D2E]/70 dark:text-white/70">Email</span>
              <span className="text-[#0A3D2E] dark:text-white">{orderData?.customer_email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#0A3D2E]/70 dark:text-white/70">Name</span>
              <span className="text-[#0A3D2E] dark:text-white">{orderData?.customer_name}</span>
            </div>
          </div>
        </div>

        <Button
          onClick={handlePayment}
          disabled={processing}
          className="w-full bg-[#22C55E] text-[#051510] hover:bg-[#16a34a] font-semibold h-14 rounded-xl"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay ₦${orderData?.total?.toFixed(2)}`
          )}
        </Button>

        <p className="text-xs text-center text-[#0A3D2E]/40 dark:text-white/40 mt-4">
          Secure payment powered by Paystack
        </p>
      </div>
    </div>
  );
}
