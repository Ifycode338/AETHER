import React, { createContext, useContext, useState, useEffect } from 'react';
import { requestNotificationPermission, onMessageListener } from './firebase';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [token, setToken] = useState(null);
  const [permission, setPermission] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Load notifications from database
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const loadNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (error) {
          console.error('Error loading notifications:', error);
        } else {
          setNotifications(data || []);
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    loadNotifications();

    // Listen for Firebase notifications (foreground)
    const handleFirebaseNotification = (event) => {
      const { title, body, url } = event.detail;
      // Add to notification state temporarily
      const tempNotification = {
        id: Date.now().toString(),
        user_id: user?.id,
        title,
        body,
        type: 'promotion',
        link: url,
        read: false,
        created_at: new Date().toISOString()
      };
      setNotifications(prev => [tempNotification, ...prev]);
      toast(title, {
        description: body,
        action: {
          label: 'View',
          onClick: () => {
            if (url) {
              window.location.href = url;
            }
          }
        }
      });
    };

    window.addEventListener('firebase-notification', handleFirebaseNotification);

    // Set up real-time subscription for new notifications
    const channelName = `notifications-${user.id}`;
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 Real-time notification received:', payload);
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new, ...prev]);
            // Show toast for new notification
            toast(payload.new.title, {
              description: payload.new.body,
              action: {
                label: 'View',
                onClick: () => {
                  if (payload.new.link) {
                    window.location.href = payload.new.link;
                  }
                }
              }
            });
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev => 
              prev.map(notif => 
                notif.id === payload.new.id ? payload.new : notif
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => 
              prev.filter(notif => notif.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('🔔 Successfully subscribed to notifications');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.error('🔔 Subscription error:', status);
        }
      });

    return () => {
      console.log('🔔 Cleaning up notification subscription');
      supabase.removeChannel(subscription);
      window.removeEventListener('firebase-notification', handleFirebaseNotification);
    };
  }, [user]);

  useEffect(() => {
    // Request notification permission on mount
    const setupNotifications = async () => {
      const fcmToken = await requestNotificationPermission();
      setToken(fcmToken);
      setPermission(Notification.permission);
    };

    setupNotifications();

    // Listen for incoming messages
    const unsubscribe = onMessageListener().then((payload) => {
      if (payload) {
        // Show toast notification when message received
        toast(payload.notification?.title || 'New Notification', {
          description: payload.notification?.body,
          action: {
            label: 'View',
            onClick: () => {
              // Handle click action based on notification type
              if (payload.data?.type === 'order') {
                window.location.href = `/order/${payload.data.orderId}`;
              } else if (payload.data?.type === 'low_stock') {
                window.location.href = '/admin/products';
              }
            }
          }
        });
      }
    });

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const sendLocalNotification = async (title, body, type = 'info', data = {}, targetUserId = null) => {
    // If targetUserId is provided, send to that user (for admin -> customer notifications)
    // Otherwise, send to current user
    const userId = targetUserId || user?.id;
    
    if (!userId) {
      console.error('No user ID available for notification');
      return;
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          body,
          type,
          data,
          link: data.link,
          read: false
        });

      if (error) {
        console.error('Error creating notification:', error);
      } else {
        console.log('Notification created successfully');
      }
    } catch (error) {
      console.error('Error creating notification:', error);
    }

    // Also show toast for current user
    if (!targetUserId || targetUserId === user?.id) {
      toast(title, {
        description: body,
        action: {
          label: 'View',
          onClick: () => {
            if (type === 'order') {
              window.location.href = `/order/${data.orderId}`;
            } else if (type === 'low_stock') {
              window.location.href = '/admin/products';
            } else if (type === 'new_order') {
              window.location.href = '/admin/orders';
            } else if (data.link) {
              window.location.href = data.link;
            }
          }
        }
      });
    }
  };

  const markAsRead = async (id) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) {
        console.error('Error marking notification as read:', error);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const clearAll = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error clearing notifications:', error);
        toast.error('Failed to clear notifications');
      } else {
        setNotifications([]);
        toast.success('All notifications cleared');
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  const deleteNotification = async (id) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting notification:', error);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const resetNotifications = () => {
    // Not needed with database, but kept for compatibility
    clearAll();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ 
      token, 
      permission, 
      sendLocalNotification,
      notifications,
      markAsRead,
      markAllAsRead,
      clearAll,
      deleteNotification,
      resetNotifications,
      unreadCount
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
