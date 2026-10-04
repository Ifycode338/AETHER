import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { useNotifications } from "@/lib/NotificationContext";
import { Package, ShoppingCart, DollarSign, TrendingUp, Users, CreditCard, AlertCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart, Bar, BarChart, PieChart, Pie, Cell, Legend } from "recharts";

function StatCard({ icon: Icon, label, value, change, changeType = "positive" }) {
  return (
    <div className="bg-[#071f15] border border-[#22C55E]/10 rounded-2xl p-6 hover:border-[#22C55E]/20 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-[#22C55E]" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            changeType === "positive" ? "text-[#22C55E]" : "text-red-400"
          }`}>
            {changeType === "positive" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {change}
          </div>
        )}
      </div>
      <p className="text-3xl font-heading font-bold text-white">{value}</p>
      <p className="text-sm text-white/40 mt-1">{label}</p>
    </div>
  );
}

export default function Dashboard() {
  const { sendLocalNotification } = useNotifications();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [previousLowStockCount, setPreviousLowStockCount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ordersData, productsData, usersData] = await Promise.all([
          supabase.from('orders').select('*').order('created_date', { ascending: false }).limit(100),
          supabase.from('products').select('*').order('id', { ascending: false }).limit(100),
          supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100)
        ]);
        console.log('Dashboard data:', { orders: ordersData.data?.length, products: productsData.data?.length, users: usersData.data?.length });
        setOrders(ordersData.data || []);
        setProducts(productsData.data || []);
        setUsers(usersData.data || []);
        
        // Identify low stock products (stock <= 5)
        const lowStock = (productsData.data || []).filter(p => p.stock <= 5 && p.stock > 0);
        setLowStockProducts(lowStock);

        // Send notification if low stock count increased
        if (lowStock.length > previousLowStockCount && previousLowStockCount > 0) {
          const newLowStockCount = lowStock.length - previousLowStockCount;
          sendLocalNotification(
            'Low Stock Alert',
            `${newLowStockCount} product${newLowStockCount > 1 ? 's' : ''} running low on stock`,
            'low_stock',
            { link: '/admin/products' }
          );
        }
        setPreviousLowStockCount(lowStock.length);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Listen for new order events
    const handleNewOrder = (event) => {
      const { orderId, customerName, total } = event.detail;
      sendLocalNotification(
        'New Order Received',
        `Order #${orderId.slice(0, 8)} from ${customerName} - ₦${total}`,
        'new_order',
        { link: '/admin/orders' }
      );
      // Reload dashboard data
      loadData();
    };

    window.addEventListener('newOrder', handleNewOrder);
    return () => window.removeEventListener('newOrder', handleNewOrder);
  }, [previousLowStockCount]);

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const paidOrders = orders.filter(o => o.status === "paid").length;
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const processingOrders = orders.filter(o => o.status === "processing").length;
  const shippedOrders = orders.filter(o => o.status === "shipped").length;
  const deliveredOrders = orders.filter(o => o.status === "delivered").length;
  const cancelledOrders = orders.filter(o => o.status === "cancelled").length;
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  // Build chart data from last 7 days
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const dayOrders = orders.filter(o => o.created_date?.startsWith(dateStr));
    chartData.push({
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      revenue: dayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
      orders: dayOrders.length
    });
  }

  // Order status distribution for pie chart
  const statusData = [
    { name: "Paid", value: paidOrders, color: "#22C55E" },
    { name: "Pending", value: pendingOrders, color: "#EAB308" },
    { name: "Processing", value: processingOrders, color: "#3B82F6" },
    { name: "Shipped", value: shippedOrders, color: "#A855F7" },
    { name: "Delivered", value: deliveredOrders, color: "#22C55E" },
    { name: "Cancelled", value: cancelledOrders, color: "#EF4444" }
  ].filter(d => d.value > 0);

  // Category breakdown
  const categoryData = [
    { name: "Supplements", value: products.filter(p => p.category === "supplements").length },
    { name: "Oral Care", value: products.filter(p => p.category === "oral_care").length }
  ];

  // Top selling products
  const productSales = {};
  orders.forEach(order => {
    order.items?.forEach(item => {
      productSales[item.product_name] = (productSales[item.product_name] || 0) + item.quantity;
    });
  });
  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, sales]) => ({ name, sales }));

  const recentOrders = orders.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[#22C55E]/20 border-t-[#22C55E] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading font-bold text-2xl text-white">Dashboard</h1>
        <p className="text-sm text-white/40 mt-1">Welcome to BennyCare Admin</p>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-medium text-white">
                {lowStockProducts.length} {lowStockProducts.length === 1 ? 'product' : 'products'} low on stock
              </span>
            </div>
            <div className="flex items-center gap-1">
              {lowStockProducts.slice(0, 3).map(product => (
                <span key={product.id} className="text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded-full">
                  {product.name} ({product.stock})
                </span>
              ))}
              {lowStockProducts.length > 3 && (
                <span className="text-xs text-white/40">+{lowStockProducts.length - 3} more</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={DollarSign} label="Total Revenue" value={`₦${totalRevenue.toFixed(2)}`} change="+12.5%" />
        <StatCard icon={ShoppingCart} label="Total Orders" value={orders.length} change="+8.2%" />
        <StatCard icon={Package} label="Products" value={products.length} change="+3.1%" />
        <StatCard icon={Users} label="Users" value={users.length} change="+15.3%" />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={CreditCard} label="Avg Order Value" value={`₦${avgOrderValue.toFixed(2)}`} change="+5.4%" />
        <StatCard icon={TrendingUp} label="Paid Orders" value={paidOrders} change={paidOrders > 0 ? "New orders" : null} changeType="positive" />
        <StatCard icon={Package} label="Delivered" value={deliveredOrders} change="+2.1%" />
        <StatCard icon={AlertCircle} label="Cancelled" value={cancelledOrders} change={cancelledOrders > 0 ? "-1.2%" : null} changeType={cancelledOrders > 0 ? "negative" : "positive"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-[#071f15] border border-[#22C55E]/10 rounded-2xl p-6">
          <h3 className="font-heading font-semibold text-white mb-6">Revenue Pulse (7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="pulseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#ffffff20" tick={{ fill: "#ffffff50", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#ffffff20" tick={{ fill: "#ffffff50", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ 
                    background: "#071f15", 
                    border: "1px solid rgba(34,197,94,0.2)", 
                    borderRadius: "12px", 
                    color: "#fff", 
                    fontSize: 12,
                    boxShadow: "0 4px 6px rgba(0,0,0,0.3)"
                  }}
                  cursor={{ stroke: "#22C55E", strokeWidth: 2 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#22C55E" strokeWidth={2} fill="url(#pulseGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-[#071f15] border border-[#22C55E]/10 rounded-2xl p-6">
          <h3 className="font-heading font-semibold text-white mb-6">Order Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ 
                    background: "#071f15", 
                    border: "1px solid rgba(34,197,94,0.2)", 
                    borderRadius: "12px", 
                    color: "#fff", 
                    fontSize: 12,
                    boxShadow: "0 4px 6px rgba(0,0,0,0.3)"
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: "12px", color: "#ffffff50" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Selling Products */}
        <div className="bg-[#071f15] border border-[#22C55E]/10 rounded-2xl p-6">
          <h3 className="font-heading font-semibold text-white mb-6">Top Selling Products</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts}>
                <XAxis dataKey="name" stroke="#ffffff20" tick={{ fill: "#ffffff50", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#ffffff20" tick={{ fill: "#ffffff50", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ 
                    background: "#071f15", 
                    border: "1px solid rgba(34,197,94,0.2)", 
                    borderRadius: "12px", 
                    color: "#fff", 
                    fontSize: 12,
                    boxShadow: "0 4px 6px rgba(0,0,0,0.3)"
                  }}
                  cursor={{ fill: "rgba(34,197,94,0.1)" }}
                />
                <Bar dataKey="sales" fill="#22C55E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-[#071f15] border border-[#22C55E]/10 rounded-2xl p-6">
          <h3 className="font-heading font-semibold text-white mb-6">Product Categories</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#22C55E" />
                  <Cell fill="#3B82F6" />
                </Pie>
                <Tooltip
                  contentStyle={{ 
                    background: "#071f15", 
                    border: "1px solid rgba(34,197,94,0.2)", 
                    borderRadius: "12px", 
                    color: "#fff", 
                    fontSize: 12,
                    boxShadow: "0 4px 6px rgba(0,0,0,0.3)"
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: "12px", color: "#ffffff50" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-[#071f15] border border-[#22C55E]/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#22C55E]/10 flex items-center justify-between">
          <h3 className="font-heading font-semibold text-white">Recent Orders</h3>
          <span className="text-xs text-white/40">Last 5 orders</span>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-white/30 text-sm">No orders yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#22C55E]/10">
                  <th className="text-left px-6 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Order ID</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Items</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Total</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id} className="border-b border-[#22C55E]/5 hover:bg-[#22C55E]/5 transition-colors">
                    <td className="px-6 py-4 text-white/60 font-mono text-xs">#{order.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-white/80">{order.customer_name}</td>
                    <td className="px-6 py-4 text-white/50">{order.items?.length || 0} items</td>
                    <td className="px-6 py-4 text-white font-medium">₦{order.total?.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 text-white/50 text-xs">
                      {order.created_date ? new Date(order.created_date).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    paid: "bg-green-500/10 text-green-400",
    pending: "bg-yellow-500/10 text-yellow-400",
    processing: "bg-blue-500/10 text-blue-400",
    shipped: "bg-purple-500/10 text-purple-400",
    delivered: "bg-[#22C55E]/10 text-[#22C55E]",
    cancelled: "bg-red-500/10 text-red-400",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${styles[status] || styles.paid}`}>
      {status}
    </span>
  );
}