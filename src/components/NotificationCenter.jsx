import React from "react";
import { Bell, X, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/lib/NotificationContext";

export default function NotificationCenter({ isOpen, onClose }) {
  const { notifications, markAsRead, clearAll: clearAllNotifications } = useNotifications();

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

  const unreadCount = notifications.filter(n => !n.read).length;

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
            <div className="p-4 border-b border-[#E2F1E7] dark:border-[#22C55E]/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#0A3D2E] dark:text-white" />
                <h2 className="font-semibold text-[#0A3D2E] dark:text-white">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="bg-[#22C55E] text-[#051510] text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllNotifications}
                    className="text-xs h-8 px-3 text-red-400 hover:text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[400px] sm:max-h-[500px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#E2F1E7] dark:bg-[#22C55E]/10 flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-[#0A3D2E]/30 dark:text-white/30" />
                  </div>
                  <p className="text-[#0A3D2E]/60 dark:text-white/60 text-sm font-medium">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-[#E2F1E7] dark:divide-[#22C55E]/10">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 hover:bg-[#E2F1E7]/50 dark:hover:bg-white/5 transition-all cursor-pointer ${
                        !notification.read ? 'bg-[#22C55E]/5 dark:bg-[#22C55E]/10' : ''
                      }`}
                      onClick={() => {
                        markAsRead(notification.id);
                        if (notification.link) {
                          window.location.href = notification.link;
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#0A3D2E] dark:text-white text-sm mb-1">
                            {notification.title}
                          </p>
                          <p className="text-[#0A3D2E]/60 dark:text-white/60 text-sm mb-2 line-clamp-2">
                            {notification.body}
                          </p>
                          <div className="flex items-center gap-1 text-[#0A3D2E]/40 dark:text-white/40 text-xs">
                            <Clock className="w-3 h-3" />
                            <span>{getTimeAgo(notification.created_at)}</span>
                          </div>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-[#22C55E] flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
