import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/api/supabaseClient";
import { Link } from "react-router-dom";
import { Package, Calendar, DollarSign, CheckCircle, Clock, Truck, XCircle, Filter, Search } from "lucide-react";

const STATUS_STYLES = {
  paid: "bg-green-500/10 text-green-400 border-green-500/20",
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  processing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  shipped: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  delivered: "bg-green-500/10 text-green-400 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

const STATUS_ICONS = {
  paid: CheckCircle,
  pending: Clock,
  processing: Clock,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

export default function UserOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) return;
    
    const loadOrders = async () => {
      console.log('UserOrders: Loading orders for user ID:', user.id);
      
      // Load user's orders by user_id OR customer_email (for backward compatibility)
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
        .order('created_date', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('UserOrders: Error loading orders:', error);
      } else {
        console.log('UserOrders: Orders loaded:', data);
        setOrders(data || []);
      }
      setLoading(false);
    };
    
    loadOrders();
  }, [user]);

  const filtered = orders.filter(order => {
    const matchesStatus = filter === "all" || order.status === filter;
    const productNames = order.items?.map(item => item.product_name).join(' ').toLowerCase() || '';
    const matchesSearch = 
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      productNames.includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const getStatusInfo = (status) => {
    const icon = STATUS_ICONS[status] || Package;
    const style = STATUS_STYLES[status] || "bg-gray-500/10 text-gray-400 border-gray-500/20";
    return { icon, style };
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#22C55E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#0A3D2E]/60 dark:text-white/60">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-[#0A3D2E] dark:text-white mb-2">My Orders</h1>
        <p className="text-sm text-[#0A3D2E]/60 dark:text-white/60">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'}
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#E2F1E7]/30 dark:bg-white/5 rounded-2xl p-4 mb-6 border border-[#E2F1E7] dark:border-white/10">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A3D2E]/30 dark:text-white/30" />
            <input
              type="text"
              placeholder="Search by order ID or product name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#E2F1E7] dark:border-white/10 bg-white dark:bg-white/5 text-[#0A3D2E] dark:text-white placeholder-[#0A3D2E]/30 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
            />
          </div>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", "paid", "pending", "processing", "shipped", "delivered", "cancelled"].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors capitalize ${
              filter === s 
                ? "bg-[#22C55E] text-[#051510]" 
                : "bg-[#E2F1E7]/30 dark:bg-white/5 text-[#0A3D2E]/50 dark:text-white/50 hover:text-[#0A3D2E] dark:hover:text-white"
            }`}
          >
            {s} {s !== "all" && `(${orders.filter(o => o.status === s).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#22C55E]/10 rounded-full flex items-center justify-center">
            <Package className="w-8 h-8 text-[#22C55E]" />
          </div>
          <p className="text-[#0A3D2E]/60 dark:text-white/60 text-sm mb-4">
            {searchQuery || filter !== "all" ? "No orders match your search" : "No orders yet"}
          </p>
          {searchQuery || filter !== "all" ? (
            <button
              onClick={() => { setSearchQuery(""); setFilter("all"); }}
              className="text-[#22C55E] hover:text-[#16a34a] font-medium text-sm"
            >
              Clear filters
            </button>
          ) : (
            <Link to="/shop" className="text-[#22C55E] hover:text-[#16a34a] font-medium text-sm">
              Start shopping
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(order => {
            const { icon: StatusIcon, style } = getStatusInfo(order.status);
            const productNames = order.items?.map(item => item.product_name).slice(0, 2);
            const hasMoreProducts = (order.items?.length || 0) > 2;
            
            return (
              <Link
                key={order.id}
                to={`/order/${order.id}`}
                className="block bg-white dark:bg-[#071f15] border border-[#E2F1E7] dark:border-[#22C55E]/10 rounded-2xl p-6 hover:shadow-lg dark:hover:shadow-none transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs text-[#0A3D2E]/60 dark:text-white/60 font-mono">
                        #{order.id.slice(0, 8)}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize flex items-center gap-1 ${style}`}>
                        <StatusIcon className="w-3 h-3" />
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-[#0A3D2E] dark:text-white font-medium mb-1">
                      {productNames?.join(', ')}
                      {hasMoreProducts && <span className="text-[#0A3D2E]/60 dark:text-white/60"> +{order.items.length - 2} more</span>}
                    </p>
                    <p className="text-xs text-[#0A3D2E]/40 dark:text-white/40">
                      {order.created_date ? new Date(order.created_date).toLocaleString() : "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-heading font-bold text-xl text-[#0A3D2E] dark:text-white">
                      ₦{order.total?.toFixed(2)}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
