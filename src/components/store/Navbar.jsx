import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Menu, X, User as UserIcon, LogOut, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { useNotifications } from "@/lib/NotificationContext";
import ThemeToggle from "@/components/store/ThemeToggle";
import NotificationCenter from "@/components/NotificationCenter";

export default function Navbar({ cartCount = 0, onCartClick }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#F8FAFC]/80 dark:bg-[#051510]/80 border-b border-[#E2F1E7] dark:border-[#22C55E]/10 select-none shadow-sm" style={{ paddingTop: "env(safe-area-inset-top)" }} role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:scale-105 transition-transform duration-200" aria-label="BennyCare Home">
          <div className="w-8 h-8 rounded-full bg-[#0A3D2E] dark:bg-[#22C55E] flex items-center justify-center shadow-md" aria-hidden="true">
            <span className="text-white dark:text-[#051510] font-bold text-sm">B</span>
          </div>
          <span className="font-heading font-bold text-lg text-[#0A3D2E] dark:text-white tracking-tight">BennyCare</span>
        </Link>

        <div className="hidden md:flex items-center gap-8" role="menubar">
          <Link to="/" className="text-sm font-medium text-[#0A3D2E]/70 dark:text-white/80 hover:text-[#0A3D2E] dark:hover:text-white transition-colors duration-200 hover:scale-105" role="menuitem">Home</Link>
          <Link to="/shop" className="text-sm font-medium text-[#0A3D2E]/70 dark:text-white/80 hover:text-[#0A3D2E] dark:hover:text-white transition-colors duration-200 hover:scale-105" role="menuitem">Shop</Link>
          <Link to="/categories" className="text-sm font-medium text-[#0A3D2E]/70 dark:text-white/80 hover:text-[#0A3D2E] dark:hover:text-white transition-colors duration-200 hover:scale-105" role="menuitem">Categories</Link>
          <Link to="/about" className="text-sm font-medium text-[#0A3D2E]/70 dark:text-white/80 hover:text-[#0A3D2E] dark:hover:text-white transition-colors duration-200 hover:scale-105" role="menuitem">About</Link>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={onCartClick}
            className="relative p-2 rounded-full hover:bg-[#E2F1E7] dark:hover:bg-white/10 transition-all duration-200 hover:scale-110 select-none"
            aria-label={`Shopping cart ${cartCount > 0 ? `with ${cartCount} items` : 'is empty'}`}
          >
            <ShoppingBag className="w-5 h-5 text-[#0A3D2E] dark:text-white" aria-hidden="true" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#22C55E] text-[#051510] text-xs font-bold flex items-center justify-center shadow-md" aria-label={`${cartCount} items in cart`}>
                {cartCount}
              </span>
            )}
          </button>

          {isAuthenticated && (
            <button
              onClick={() => setNotificationOpen(true)}
              className={`relative p-2 rounded-full transition-all duration-200 hover:scale-110 select-none ${
                notificationOpen
                  ? 'bg-[#22C55E]/20'
                  : 'hover:bg-[#E2F1E7] dark:hover:bg-white/10'
              }`}
              aria-label={`Notifications ${unreadCount > 0 ? `with ${unreadCount} unread` : 'none'}`}
            >
              <Bell className={`w-5 h-5 ${notificationOpen ? 'text-[#22C55E]' : 'text-[#0A3D2E] dark:text-white'}`} aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center animate-pulse shadow-md" aria-label={`${unreadCount} unread notifications`}>
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-1" role="group" aria-label="User menu">
              <Link to="/profile" className="p-2 rounded-full hover:bg-[#E2F1E7] dark:hover:bg-white/10 transition-all duration-200 hover:scale-110 select-none" aria-label="View profile">
                <UserIcon className="w-5 h-5 text-[#0A3D2E] dark:text-white" aria-hidden="true" />
              </Link>
              <button onClick={() => logout()} className="p-2 rounded-full hover:bg-[#E2F1E7] dark:hover:bg-white/10 transition-all duration-200 hover:scale-110 select-none" aria-label="Sign out">
                <LogOut className="w-5 h-5 text-[#0A3D2E] dark:text-white" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2" role="group" aria-label="Authentication">
              <Link to="/login">
                <Button variant="ghost" className="text-sm text-[#0A3D2E] dark:text-white hover:bg-[#E2F1E7] dark:hover:bg-white/10 rounded-xl select-none transition-all duration-200 hover:scale-105">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button className="bg-[#0A3D2E] text-white hover:bg-[#0A3D2E]/90 dark:bg-[#22C55E] dark:text-[#051510] rounded-xl text-sm select-none transition-all duration-200 hover:scale-105 shadow-md">Sign Up</Button>
              </Link>
            </div>
          )}

          <button
            className="md:hidden p-3 hover:bg-[#E2F1E7] dark:hover:bg-white/10 rounded-full transition-all duration-200"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            {mobileOpen ? <X className="w-6 h-6 text-[#0A3D2E] dark:text-white" aria-hidden="true" /> : <Menu className="w-6 h-6 text-[#0A3D2E] dark:text-white" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div id="mobile-menu" className="md:hidden bg-white dark:bg-[#051510] border-t border-[#E2F1E7] dark:border-[#22C55E]/10 px-6 py-4 flex flex-col gap-3 animate-in slide-in-from-top duration-300" role="menu">
          <Link to="/" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-[#0A3D2E] dark:text-white/90 py-2 hover:text-[#22C55E] dark:hover:text-[#22C55E] transition-colors" role="menuitem">Home</Link>
          <Link to="/shop" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-[#0A3D2E] dark:text-white/90 py-2 hover:text-[#22C55E] dark:hover:text-[#22C55E] transition-colors" role="menuitem">Shop</Link>
          <Link to="/categories" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-[#0A3D2E] dark:text-white/90 py-2 hover:text-[#22C55E] dark:hover:text-[#22C55E] transition-colors" role="menuitem">Categories</Link>
          <Link to="/about" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-[#0A3D2E] dark:text-white/90 py-2 hover:text-[#22C55E] dark:hover:text-[#22C55E] transition-colors" role="menuitem">About</Link>
          <div className="border-t border-[#E2F1E7] dark:border-[#22C55E]/10 pt-3 mt-1 flex flex-col gap-2" role="group" aria-label="Account">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => { setMobileOpen(false); setNotificationOpen(true); }}
                  className="text-left text-sm font-medium text-[#0A3D2E] dark:text-white/90 py-2 flex items-center justify-between hover:text-[#22C55E] dark:hover:text-[#22C55E] transition-colors"
                  role="menuitem"
                >
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-[#0A3D2E] dark:text-white/90 py-2 hover:text-[#22C55E] dark:hover:text-[#22C55E] transition-colors" role="menuitem">Profile</Link>
                <button onClick={() => { setMobileOpen(false); logout(); }} className="text-left text-sm font-medium text-[#0A3D2E] dark:text-white/90 py-2 hover:text-[#22C55E] dark:hover:text-[#22C55E] transition-colors" role="menuitem">Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-[#0A3D2E] dark:text-white/90 py-2 hover:text-[#22C55E] dark:hover:text-[#22C55E] transition-colors" role="menuitem">Sign In</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-[#22C55E] py-2 hover:text-[#16a34a] transition-colors" role="menuitem">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
      
      <NotificationCenter isOpen={notificationOpen} onClose={() => setNotificationOpen(false)} />
    </nav>
  );
}