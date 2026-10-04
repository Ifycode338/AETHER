import React from "react";
import { Bell, X, Check, Package, ShoppingCart, AlertTriangle, Tag, Clock, ChevronRight, Filter, MoreVertical, Trash2, Archive, Settings, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/lib/NotificationContext";

export default function NotificationCenter({ isOpen, onClose }) {
  const { notifications, markAsRead, markAllAsRead, clearAll: clearAllNotifications, deleteNotification } = useNotifications();
  const [activeTab, setActiveTab] = React.useState("all");

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return <Package className="w-4 h-4" />;
      case 'new_order':
        return <ShoppingCart className="w-4 h-4" />;
      case 'low_stock':
        return <AlertTriangle className="w-4 h-4" />;
      case 'promotion':
        return <Tag className="w-4 h-4" />;
      case 'system':
        return <Settings className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'order':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20';
      case 'new_order':
        return 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20';
      case 'low_stock':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20';
      case 'promotion':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20';
      case 'system':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20';
    }
  };

  const getNotificationEmoji = (type) => {
    switch (type) {
      case 'order':
        return '📦';
      case 'new_order':
        return '🛒';
      case 'low_stock':
        return '⚠️';
      case 'promotion':
        return '🎉';
      case 'system':
        return '⚙️';
      default:
        return '🔔';
    }
  };

  const filterNotifications = (filter) => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter(n => !n.read);
    return notifications.filter(n => n.type === filter);
  };

  const filteredNotifications = filterNotifications(activeTab);
  const unreadCount = notifications.filter(n => !n.read).length;

  const groupNotificationsByDate = (notifs) => {
    const groups = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    notifs.forEach(notif => {
      const date = new Date(notif.created_at).toDateString();
      let label = date;
      
      if (date === today) {
        label = 'Today';
      } else if (date === yesterday) {
        label = 'Yesterday';
      } else {
        label = new Date(notif.created_at).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
      }
      
      if (!groups[label]) groups[label] = [];
      groups[label].push(notif);
    });
    
    return groups;
  };

  const groupedNotifications = groupNotificationsByDate(filteredNotifications);

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-end pt-16 px-2 sm:px-4 sm:pt-16 pointer-events-none"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-full sm:max-w-md pointer-events-auto"
        >
          <div className="bg-white dark:bg-[#071f15] border border-[#E2F1E7] dark:border-[#22C55E]/10 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-[#E2F1E7] dark:border-[#22C55E]/10 flex items-center justify-between bg-gradient-to-r from-[#E2F1E7]/50 to-transparent dark:from-[#22C55E]/10 dark:to-transparent">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-[#0A3D2E] dark:text-white" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#22C55E] animate-pulse" />
                  )}
                </div>
                <h2 className="font-semibold text-[#0A3D2E] dark:text-white text-sm sm:text-base">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="bg-[#22C55E] text-[#051510] text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 hover:bg-[#22C55E]/10"
                  >
                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                    <span className="hidden sm:inline">Mark all read</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllNotifications}
                  className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 text-red-400 hover:text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                  <span className="hidden sm:inline">Clear all</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-7 sm:h-8 w-7 sm:w-8 p-0"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-3 sm:px-4 py-2 border-b border-[#E2F1E7] dark:border-[#22C55E]/10 flex gap-1.5 sm:gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-[#22C55E] text-[#051510]'
                    : 'bg-[#E2F1E7] dark:bg-white/10 text-[#0A3D2E] dark:text-white hover:bg-[#22C55E]/20'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'unread'
                    ? 'bg-[#22C55E] text-[#051510]'
                    : 'bg-[#E2F1E7] dark:bg-white/10 text-[#0A3D2E] dark:text-white hover:bg-[#22C55E]/20'
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setActiveTab('order')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'order'
                    ? 'bg-blue-500 text-white'
                    : 'bg-[#E2F1E7] dark:bg-white/10 text-[#0A3D2E] dark:text-white hover:bg-blue-500/20'
                }`}
              >
                Orders
              </button>
              <button
                onClick={() => setActiveTab('new_order')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'new_order'
                    ? 'bg-green-500 text-white'
                    : 'bg-[#E2F1E7] dark:bg-white/10 text-[#0A3D2E] dark:text-white hover:bg-green-500/20'
                }`}
              >
                New Orders
              </button>
              <button
                onClick={() => setActiveTab('low_stock')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'low_stock'
                    ? 'bg-orange-500 text-white'
                    : 'bg-[#E2F1E7] dark:bg-white/10 text-[#0A3D2E] dark:text-white hover:bg-orange-500/20'
                }`}
              >
                Low Stock
              </button>
            </div>

            {/* Notifications List */}
            <div className="max-h-[400px] sm:max-h-[500px] overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 sm:p-12 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#E2F1E7] dark:bg-[#22C55E]/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-[#0A3D2E]/30 dark:text-white/30" />
                  </div>
                  <p className="text-[#0A3D2E]/60 dark:text-white/60 text-xs sm:text-sm font-medium">No notifications yet</p>
                  <p className="text-[#0A3D2E]/40 dark:text-white/40 text-[10px] sm:text-xs mt-1">We'll notify you when something happens</p>
                </div>
              ) : (
                <div className="divide-y divide-[#E2F1E7] dark:divide-[#22C55E]/10">
                  {Object.entries(groupedNotifications).map(([dateLabel, notifs]) => (
                    <div key={dateLabel}>
                      <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#E2F1E7]/30 dark:bg-white/5 text-[10px] sm:text-xs font-medium text-[#0A3D2E]/60 dark:text-white/60 sticky top-0">
                        {dateLabel}
                      </div>
                      {notifs.map((notification, index) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`group relative p-3 sm:p-4 hover:bg-[#E2F1E7]/50 dark:hover:bg-white/5 transition-all cursor-pointer ${
                            !notification.read ? 'bg-[#22C55E]/5 dark:bg-[#22C55E]/10 border-l-4 border-[#22C55E]' : ''
                          }`}
                          onClick={() => {
                            markAsRead(notification.id);
                            if (notification.link) {
                              window.location.href = notification.link;
                            }
                          }}
                        >
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border ${getNotificationColor(notification.type)} flex-shrink-0 text-sm sm:text-lg`}>
                              {getNotificationEmoji(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-semibold text-[#0A3D2E] dark:text-white text-xs sm:text-sm">
                                  {notification.title}
                                </p>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {!notification.read && (
                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#22C55E] flex-shrink-0" />
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteNotification(notification.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/10 rounded"
                                  >
                                    <X className="w-3 h-3 text-[#0A3D2E]/40 hover:text-red-400" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-[#0A3D2E]/60 dark:text-white/60 text-xs sm:text-sm mt-1 line-clamp-2">
                                {notification.body}
                              </p>
                              <div className="flex items-center gap-1 mt-1 sm:mt-2 text-[#0A3D2E]/40 dark:text-white/40 text-[10px] sm:text-xs">
                                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                <span>{getTimeAgo(notification.created_at)}</span>
                              </div>
                            </div>
                            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-[#0A3D2E]/20 dark:text-white/20 group-hover:text-[#22C55E] transition-colors flex-shrink-0 mt-1 sm:mt-2" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {filteredNotifications.length > 0 && (
              <div className="p-3 border-t border-[#E2F1E7] dark:border-[#22C55E]/10 bg-[#E2F1E7]/30 dark:bg-[#22C55E]/5 flex items-center justify-between">
                <p className="text-xs text-[#0A3D2E]/40 dark:text-white/40">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All notifications read'}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('unread')}
                    className="text-xs text-[#0A3D2E]/40 dark:text-white/40 hover:text-[#22C55E] transition-colors"
                  >
                    Show unread only
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
