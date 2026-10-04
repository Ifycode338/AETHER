import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { X, Search, Download, Filter, Check, XCircle, Calendar, DollarSign, Package, User, MapPin, Phone, Mail, ChevronDown } from "lucide-react";
import { sendShippingUpdateEmail } from "@/lib/emailService";
import { useNotifications } from "@/lib/NotificationContext";
import { getUserFCMTokens, sendPushNotification } from "@/lib/firebase";

const STATUS_OPTIONS = ["paid", "pending", "processing", "shipped", "delivered", "cancelled"];
const STATUS_STYLES = {
  paid: "bg-green-500/10 text-green-400 border-green-500/20",
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  processing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  shipped: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  delivered: "bg-green-500/10 text-green-400 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function Orders() {
  const { sendLocalNotification } = useNotifications();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [dateFilter, setDateFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_date', { ascending: false })
      .limit(100);
    if (error) console.error('Error loading orders:', error);
    else setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = orders.filter(order => {
    const matchesStatus = filter === "all" || order.status === filter;
    const matchesSearch = 
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesDate = true;
    if (dateFilter !== "all") {
      const orderDate = new Date(order.created_date);
      const now = new Date();
      const daysAgo = {
        "7": 7,
        "30": 30,
        "90": 90
      };
      if (daysAgo[dateFilter]) {
        const cutoffDate = new Date(now.setDate(now.getDate() - daysAgo[dateFilter]));
        matchesDate = orderDate >= cutoffDate;
      }
    }
    
    return matchesStatus && matchesSearch && matchesDate;
  });

  const updateStatus = async (orderId, status) => {
    console.log('Updating order status:', orderId, 'to:', status);
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status: ' + error.message);
    } else {
      console.log('Order status updated successfully');
      
      // Fetch order details to get user_id for notification
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      
      // Send notification to the customer who placed the order
      if (order && order.user_id) {
        sendLocalNotification(
          `Order Status Updated`,
          `Your order #${orderId.slice(0, 8)} status has been updated to "${status}"`,
          'order',
          { orderId, link: `/order/${orderId}` },
          order.user_id // Send to the order's user_id
        );
        
        // Send push notification to customer
        try {
          const customerTokens = await getUserFCMTokens(order.user_id);
          if (customerTokens.length > 0) {
            await sendPushNotification(
              customerTokens[0],
              'Order Status Updated',
              `Your order #${orderId.slice(0, 8)} status is now "${status}"`,
              {
                type: 'order',
                orderId,
                url: `/order/${orderId}`
              }
            );
            console.log('Customer push notification sent');
          } else {
            console.log('No customer FCM tokens found');
          }
        } catch (notificationError) {
          console.error('Error sending customer push notification:', notificationError);
          // Don't fail the order update if notification fails
        }
      }
      
      // Send shipping update email (non-blocking)
      if (order) {
        sendShippingUpdateEmail({
          ...order,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
        }).then(result => {
          if (result.success) {
            console.log('Shipping update email sent successfully');
          } else {
            console.error('Failed to send shipping update email:', result.error);
          }
        }).catch(err => {
          console.error('Error sending shipping update email:', err);
        });
      }
      
      load();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status }));
      }
    }
  };

  const bulkUpdateStatus = async (status) => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .in('id', Array.from(selectedOrders));
    
    if (error) console.error('Error bulk updating orders:', error);
    else {
      load();
      setSelectedOrders(new Set());
      setShowBulkActions(false);
    }
  };

  const toggleOrderSelection = (orderId) => {
    const newSelection = new Set(selectedOrders);
    if (newSelection.has(orderId)) {
      newSelection.delete(orderId);
    } else {
      newSelection.add(orderId);
    }
    setSelectedOrders(newSelection);
    setShowBulkActions(newSelection.size > 0);
  };

  const toggleAllOrders = () => {
    if (selectedOrders.size === filtered.length) {
      setSelectedOrders(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedOrders(new Set(filtered.map(o => o.id)));
      setShowBulkActions(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-[#22C55E]/20 border-t-[#22C55E] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading font-bold text-2xl text-white">Orders</h1>
        <p className="text-sm text-white/40 mt-1">{orders.length} total orders</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#071f15] border border-[#22C55E]/10 rounded-2xl p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search by name, email, or order ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap relative">
            <div className="relative">
              <select
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="appearance-none px-4 py-2.5 pr-10 text-sm rounded-xl border border-white/10 bg-[#051510] text-white focus:outline-none focus:ring-2 focus:ring-[#22C55E] cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", ...STATUS_OPTIONS].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors capitalize ${
              filter === s ? "bg-[#22C55E] text-[#051510]" : "bg-white/5 text-white/50 hover:text-white"
            }`}
          >
            {s} {s !== "all" && `(${orders.filter(o => o.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-sm text-white">{selectedOrders.size} orders selected</span>
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map(status => (
              <button
                key={status}
                onClick={() => bulkUpdateStatus(status)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border capitalize transition-colors ${
                  STATUS_STYLES[status]
                }`}
              >
                Mark as {status}
              </button>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-white/30 text-sm">No orders found</div>
      ) : (
        <div className="bg-[#071f15] border border-[#22C55E]/10 rounded-2xl overflow-hidden">
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3 p-4">
            {filtered.map(order => (
              <div key={order.id} className="bg-[#051510] border border-white/5 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <input
                    type="checkbox"
                    checked={selectedOrders.has(order.id)}
                    onChange={() => toggleOrderSelection(order.id)}
                    className="rounded border-white/20 bg-white/5 text-[#22C55E] focus:ring-[#22C55E] mt-1"
                  />
                  <span className="text-white/60 font-mono text-xs">#{order.id.slice(0, 8)}</span>
                </div>
                <div className="mb-3">
                  <p className="text-white font-medium text-sm">{order.customer_name}</p>
                  <p className="text-white/40 text-xs">{order.customer_email}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                  <div>
                    <span className="text-white/40 block">Items</span>
                    <span className="text-white/70">{order.items?.length || 0}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block">Total</span>
                    <span className="text-white font-medium">₦{order.total?.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block">Status</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLES[order.status] || ""}`}>
                      {order.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/40 block">Date</span>
                    <span className="text-white/50">{order.created_date ? new Date(order.created_date).toLocaleDateString() : "—"}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="w-full p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors text-xs"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#22C55E]/10">
                  <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider w-10">
                    <input
                      type="checkbox"
                      checked={selectedOrders.size === filtered.length}
                      onChange={toggleAllOrders}
                      className="rounded border-white/20 bg-white/5 text-[#22C55E] focus:ring-[#22C55E]"
                    />
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Order ID</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Items</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Total</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="border-b border-[#22C55E]/5 hover:bg-[#22C55E]/5 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedOrders.has(order.id)}
                        onChange={() => toggleOrderSelection(order.id)}
                        className="rounded border-white/20 bg-white/5 text-[#22C55E] focus:ring-[#22C55E]"
                      />
                    </td>
                    <td className="px-6 py-4 text-white/60 font-mono text-xs">#{order.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-white/80 font-medium">{order.customer_name}</td>
                    <td className="px-6 py-4 text-white/40">{order.customer_email}</td>
                    <td className="px-6 py-4 text-white/50">{order.items?.length || 0}</td>
                    <td className="px-6 py-4 text-white font-medium">₦{order.total?.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${STATUS_STYLES[order.status] || ""}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/30 text-xs">
                      {order.created_date ? new Date(order.created_date).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetail
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={updateStatus}
        />
      )}
    </div>
  );
}

function OrderDetail({ order, onClose, onUpdateStatus }) {
  const discountAmount = order.discount_amount || 0;
  const shippingRate = order.shipping_rate || 0;
  const subtotal = order.total - shippingRate + discountAmount;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#071f15] border border-[#22C55E]/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#22C55E]/10 sticky top-0 bg-[#071f15] z-10">
          <div>
            <h2 className="font-heading font-semibold text-white text-lg sm:text-xl">Order Details</h2>
            <p className="text-xs text-white/40 mt-1">Order ID: #{order.id.slice(0, 8)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Customer Information */}
          <div className="bg-[#051510] rounded-xl p-4 border border-white/5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-[#22C55E]" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-white/30 mt-0.5" />
                <div>
                  <p className="text-xs text-white/40 mb-1">Name</p>
                  <p className="text-sm text-white font-medium">{order.customer_name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-white/30 mt-0.5" />
                <div>
                  <p className="text-xs text-white/40 mb-1">Email</p>
                  <p className="text-sm text-white/70 break-all">{order.customer_email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-white/30 mt-0.5" />
                <div>
                  <p className="text-xs text-white/40 mb-1">Phone</p>
                  <p className="text-sm text-white/70">{order.customer_phone || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-white/30 mt-0.5" />
                <div>
                  <p className="text-xs text-white/40 mb-1">Order Date</p>
                  <p className="text-sm text-white/70">
                    {order.created_date ? new Date(order.created_date).toLocaleString() : "—"}
                  </p>
                </div>
              </div>
            </div>
            {order.customer_address && (
              <div className="flex items-start gap-3 mt-4">
                <MapPin className="w-4 h-4 text-white/30 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-white/40 mb-1">Delivery Address</p>
                  <p className="text-sm text-white/70">{order.customer_address}</p>
                </div>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="bg-[#051510] rounded-xl p-4 border border-white/5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#22C55E]" />
              Order Items
            </h3>
            <div className="space-y-3">
              {order.items?.map((item, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-[#071f15] rounded-lg p-3 border border-white/5 gap-2">
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">{item.product_name}</p>
                    <p className="text-xs text-white/40">Qty: {item.quantity} × ₦{item.price.toFixed(2)}</p>
                  </div>
                  <span className="text-sm text-[#22C55E] font-bold">₦{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-[#051510] rounded-xl p-4 border border-white/5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#22C55E]" />
              Order Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-white/70">
                <span>Subtotal</span>
                <span>₦{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Shipping</span>
                <span>₦{shippingRate.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#22C55E]">
                  <span>Discount</span>
                  <span>-₦{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-white/10">
                <span>Total</span>
                <span className="text-[#22C55E]">₦{order.total?.toFixed(2)}</span>
              </div>
            </div>
            {order.discount_code && (
              <div className="mt-3 text-xs text-[#22C55E] bg-[#22C55E]/10 rounded-lg px-3 py-2 inline-block">
                Discount code applied: {order.discount_code}
              </div>
            )}
          </div>

          {/* Status Update */}
          <div className="bg-[#051510] rounded-xl p-4 border border-white/5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#22C55E]" />
              Update Status
            </h3>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(status => (
                <button
                  key={status}
                  onClick={() => onUpdateStatus(order.id, status)}
                  className={`text-xs font-medium px-4 py-2 rounded-lg border capitalize transition-colors ${
                    order.status === status
                      ? STATUS_STYLES[status]
                      : "border-white/10 text-white/30 hover:text-white hover:border-white/20"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}