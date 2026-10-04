import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, MapPin, Phone, Mail, Calendar, CheckCircle, Clock, Truck, Box, Bell } from "lucide-react";
import { toast } from "sonner";

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: Package },
  { key: 'processing', label: 'Processing', icon: Clock },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previousStatus, setPreviousStatus] = useState(null);

  useEffect(() => {
    const loadOrder = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error loading order:', error);
      } else {
        setOrder(data);
        setPreviousStatus(data.status);
      }
      setLoading(false);
    };
    loadOrder();

    // Set up realtime subscription for order updates
    const channel = supabase
      .channel(`order_tracking_${id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${id}`
      }, (payload) => {
        if (payload.new) {
          const newStatus = payload.new.status;
          setOrder(payload.new);
          
          // Show notification when status changes
          if (previousStatus && newStatus !== previousStatus) {
            const statusLabels = {
              pending: 'Order Placed',
              processing: 'Processing',
              shipped: 'Shipped',
              delivered: 'Delivered',
              cancelled: 'Cancelled'
            };
            
            toast.success(`Order status updated to: ${statusLabels[newStatus] || newStatus}`, {
              icon: <Bell className="w-4 h-4" />,
            });
            
            setPreviousStatus(newStatus);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, previousStatus]);

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    const statusMap = { 'pending': 0, 'processing': 1, 'shipped': 2, 'delivered': 3 };
    return statusMap[order.status] || 0;
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#22C55E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#0A3D2E]/60">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-[#0A3D2E]/40 text-lg mb-4">Order not found</p>
          <Button onClick={() => navigate('/shop')} className="bg-[#22C55E] text-[#051510] hover:bg-[#16a34a] rounded-xl">
            Back to Shop
          </Button>
        </div>
      </div>
    );
  }

  const currentStep = getCurrentStepIndex();

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-12 py-12">
      <Button 
        variant="ghost" 
        onClick={() => navigate(`/order/${order.id}`)}
        className="text-[#0A3D2E] hover:text-[#0A3D2E] mb-8"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Receipt
      </Button>

      <div className="bg-white dark:bg-[#071f15] border border-[#E2F1E7] dark:border-[#22C55E]/10 rounded-2xl p-8 mb-6">
        <h1 className="font-heading font-bold text-3xl text-[#0A3D2E] dark:text-white mb-2">Track Your Order</h1>
        <p className="text-sm text-[#0A3D2E]/60 dark:text-white/60 mb-8">
          Order ID: {order.id}
        </p>

        {/* Status Timeline */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STATUS_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index <= currentStep;
              const isCurrent = index === currentStep;
              
              return (
                <div key={step.key} className="flex flex-col items-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    isCompleted 
                      ? 'bg-[#22C55E] text-[#051510]' 
                      : 'bg-[#E2F1E7] dark:bg-white/10 text-[#0A3D2E]/40 dark:text-white/40'
                  } ${isCurrent ? 'ring-4 ring-[#22C55E]/20' : ''}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className={`text-xs font-medium text-center ${
                    isCompleted 
                      ? 'text-[#22C55E]' 
                      : 'text-[#0A3D2E]/40 dark:text-white/40'
                  }`}>
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="h-2 bg-[#E2F1E7] dark:bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#22C55E] transition-all duration-500"
              style={{ width: `${((currentStep + 1) / STATUS_STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Status */}
        <div className="bg-[#E2F1E7] dark:bg-[#22C55E]/10 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#22C55E] flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-[#051510]" />
            </div>
            <div>
              <p className="text-sm text-[#0A3D2E]/60 dark:text-white/60">Current Status</p>
              <p className="font-heading font-bold text-lg text-[#0A3D2E] dark:text-white capitalize">
                {order.status}
              </p>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="font-semibold text-[#0A3D2E] dark:text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#22C55E]" /> Customer Details
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#0A3D2E]/40 mt-0.5" />
                <div>
                  <p className="text-xs text-[#0A3D2E]/40">Email</p>
                  <p className="text-sm text-[#0A3D2E] dark:text-white">{order.customer_email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#0A3D2E]/40 mt-0.5" />
                <div>
                  <p className="text-xs text-[#0A3D2E]/40">Phone</p>
                  <p className="text-sm text-[#0A3D2E] dark:text-white">{order.customer_phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#0A3D2E]/40 mt-0.5" />
                <div>
                  <p className="text-xs text-[#0A3D2E]/40">Delivery Address</p>
                  <p className="text-sm text-[#0A3D2E] dark:text-white">{order.customer_address}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-semibold text-[#0A3D2E] dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#22C55E]" /> Order Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-[#0A3D2E]/40">Order Date</p>
                <p className="text-sm text-[#0A3D2E] dark:text-white">
                  {new Date(order.created_date).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#0A3D2E]/40">Payment Reference</p>
                <p className="text-sm text-[#0A3D2E] dark:text-white font-mono">
                  {order.payment_reference}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#0A3D2E]/40">Total Amount</p>
                <p className="text-sm font-heading font-bold text-[#22C55E]">
                  ₦{order.total.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="border-t border-[#E2F1E7] dark:border-[#22C55E]/10 pt-6">
          <h2 className="font-semibold text-[#0A3D2E] dark:text-white mb-4 flex items-center gap-2">
            <Box className="w-5 h-5 text-[#22C55E]" /> Order Items
          </h2>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-3 border-b border-[#E2F1E7] dark:border-[#22C55E]/10 last:border-0">
                <div>
                  <p className="font-medium text-[#0A3D2E] dark:text-white">{item.product_name}</p>
                  <p className="text-sm text-[#0A3D2E]/60">Quantity: {item.quantity}</p>
                </div>
                <p className="font-heading font-bold text-[#0A3D2E] dark:text-white">
                  ₦{(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-[#E2F1E7] dark:bg-[#22C55E]/10 rounded-xl p-6">
        <h3 className="font-semibold text-[#0A3D2E] dark:text-white mb-2">Need Help?</h3>
        <p className="text-sm text-[#0A3D2E]/60 dark:text-white/60 mb-4">
          If you have any questions about your order, please contact our support team.
        </p>
        <Button 
          onClick={() => window.location.href = 'mailto:owner@bennycare.com'}
          variant="outline"
          className="border-[#0A3D2E]/20 text-[#0A3D2E] dark:border-white/10 dark:text-white dark:hover:bg-white/5 rounded-xl h-10 font-semibold"
        >
          Contact Support
        </Button>
      </div>
    </div>
  );
}
