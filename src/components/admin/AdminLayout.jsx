import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingCart, Menu, X, ChevronLeft, MessageCircle, Tags, Percent, Bell } from "lucide-react";
import { useNotifications } from "@/lib/NotificationContext";
import NotificationCenter from "@/components/NotificationCenter";

const NAV_ITEMS = [
  { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/admin/products", icon: Package, label: "Products" },
  { path: "/admin/orders", icon: ShoppingCart, label: "Orders" },
  { path: "/admin/chat", icon: MessageCircle, label: "Live Chat" },
  { path: "/admin/discount-codes", icon: Percent, label: "Discount Codes" },
  { path: "/admin/categories", icon: Tags, label: "Categories" },
];

export default function AdminLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { unreadCount } = useNotifications();

  const pageTitle = NAV_ITEMS.find(item => item.path === location.pathname)?.label || "Admin";

  return (
    <div className="dark min-h-screen bg-[#051510] text-[#E2F1E7] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 sm:w-72 bg-[#071f15] border-r border-[#22C55E]/10 flex flex-col transform transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center">
              <span className="text-[#051510] font-bold text-sm">B</span>
            </div>
            <span className="font-heading font-bold text-base sm:text-lg text-white tracking-tight">BennyCare</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setNotificationOpen(true)}
              className={`relative p-2 rounded-full transition-colors ${
                notificationOpen ? 'bg-[#22C55E]/20' : 'hover:bg-white/10'
              }`}
            >
              <Bell className={`w-5 h-5 ${notificationOpen ? 'text-[#22C55E]' : 'text-white/50'}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
            <button className="lg:hidden p-2 hover:bg-white/10 rounded-full transition-colors" onClick={() => setSidebarOpen(false)}>
              <X className="w-6 h-6 text-white/50" />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-3 sm:px-4 py-2 space-y-1">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 sm:py-3 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#22C55E]/10 text-[#22C55E]"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm sm:text-base">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 sm:p-4 border-t border-[#22C55E]/10">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 sm:py-3 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm sm:text-base">Back to Store</span>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen bg-[#051510]">
        <header className="h-14 sm:h-16 bg-[#071f15] border-b border-[#22C55E]/10 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <button onClick={() => setSidebarOpen(true)} className="p-3 -ml-2 lg:hidden hover:bg-white/10 rounded-full transition-colors">
              <Menu className="w-6 h-6 text-white/70" />
            </button>
            <span className="font-heading font-semibold text-white ml-3 text-sm sm:text-base">{pageTitle}</span>
          </div>
          <button
            onClick={() => setNotificationOpen(true)}
            className={`relative p-2 rounded-full transition-colors ${
              notificationOpen ? 'bg-[#22C55E]/20' : 'hover:bg-white/10'
            }`}
          >
            <Bell className={`w-5 h-5 ${notificationOpen ? 'text-[#22C55E]' : 'text-white/70'}`} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      <NotificationCenter isOpen={notificationOpen} onClose={() => setNotificationOpen(false)} />
    </div>
  );
}