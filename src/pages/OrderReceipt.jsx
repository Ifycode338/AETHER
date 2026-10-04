import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Package, MapPin, Phone, Mail, Calendar, CheckCircle } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function OrderReceipt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const receiptRef = useRef(null);

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
      }
      setLoading(false);
    };
    loadOrder();
  }, [id]);

  const downloadReceipt = async () => {
    if (!order || !receiptRef.current) return;
    
    try {
      const element = receiptRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`BennyCare-Receipt-${order.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
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

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-12 py-12">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/shop')}
        className="text-[#0A3D2E] hover:text-[#0A3D2E] mb-8"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Shop
      </Button>

      <div 
        ref={receiptRef}
        className="bg-white dark:bg-[#071f15] border border-[#E2F1E7] dark:border-[#22C55E]/10 rounded-2xl p-8 mb-6" 
        style={{ backgroundColor: '#ffffff' }}
      >
        {/* Header */}
        <div className="text-center mb-8 pb-6 border-b-2 border-[#22C55E]">
          <h1 className="font-heading font-bold text-4xl text-[#0A3D2E] mb-2">BennyCare</h1>
          <p className="text-sm text-[#0A3D2E]/60">Your Health, Our Priority</p>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-heading font-bold text-2xl text-[#0A3D2E] mb-2">Order Receipt</h2>
            <p className="text-sm text-[#0A3D2E]/60">
              Order ID: {order.id}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-[#22C55E]" />
            <span className="text-sm font-medium text-[#22C55E] capitalize">{order.status}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="font-semibold text-[#0A3D2E] mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#22C55E]" /> Customer Details
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#0A3D2E]/40 mt-0.5" />
                <div>
                  <p className="text-xs text-[#0A3D2E]/40">Email</p>
                  <p className="text-sm text-[#0A3D2E]">{order.customer_email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#0A3D2E]/40 mt-0.5" />
                <div>
                  <p className="text-xs text-[#0A3D2E]/40">Phone</p>
                  <p className="text-sm text-[#0A3D2E]">{order.customer_phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#0A3D2E]/40 mt-0.5" />
                <div>
                  <p className="text-xs text-[#0A3D2E]/40">Delivery Address</p>
                  <p className="text-sm text-[#0A3D2E]">{order.customer_address}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-semibold text-[#0A3D2E] mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#22C55E]" /> Order Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-[#0A3D2E]/40">Order Date</p>
                <p className="text-sm text-[#0A3D2E]">
                  {new Date(order.created_at || order.created_date).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#0A3D2E]/40">Payment Reference</p>
                <p className="text-sm text-[#0A3D2E] font-mono">
                  {order.payment_reference}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#0A3D2E]/40">Status</p>
                <p className="text-sm font-medium text-[#22C55E] capitalize">{order.status}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[#E2F1E7] pt-6 mb-6">
          <h2 className="font-semibold text-[#0A3D2E] mb-4">Order Items</h2>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-3 border-b border-[#E2F1E7] last:border-0">
                <div>
                  <p className="font-medium text-[#0A3D2E]">{item.product_name}</p>
                  <p className="text-sm text-[#0A3D2E]/60">Quantity: {item.quantity}</p>
                </div>
                <p className="font-heading font-bold text-[#0A3D2E]">
                  ₦{(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#E2F1E7] rounded-xl p-6">
          <div className="flex justify-between items-center">
            <span className="font-heading font-bold text-xl text-[#0A3D2E]">Total</span>
            <span className="font-heading font-bold text-2xl text-[#22C55E]">₦{order.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t-2 border-[#E2F1E7] text-center">
          <p className="text-sm text-[#0A3D2E]/60 mb-2">Thank you for shopping with BennyCare!</p>
          <p className="text-xs text-[#0A3D2E]/40">For inquiries, contact us at owner@bennycare.com</p>
          <p className="text-xs text-[#0A3D2E]/30 mt-2">
            Generated on {new Date().toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <Button 
          onClick={downloadReceipt}
          className="flex-1 bg-[#22C55E] text-[#051510] hover:bg-[#16a34a] font-semibold h-12 rounded-xl flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" /> Download Receipt
        </Button>
        <Button 
          onClick={() => navigate(`/track/${order.id}`)}
          variant="outline"
          className="flex-1 border-[#0A3D2E]/20 text-[#0A3D2E] dark:border-white/10 dark:text-white dark:hover:bg-white/5 rounded-xl h-12 font-semibold"
        >
          Track Order
        </Button>
      </div>
    </div>
  );
}
