import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { MessageCircle, X, Send } from "lucide-react";
import { toast } from "sonner";

const GREETING =
  "Hi! 👋 Welcome to BennyCare. Our team typically replies within a few minutes — how can we help you today?";

export default function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [form, setForm] = useState({ name: "", email: "" });
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminTyping, setAdminTyping] = useState(false);
  const scrollRef = useRef(null);
  const channelRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const adminTypingTimeoutRef = useRef(null);

  // Debug user state
  useEffect(() => {
    console.log('ChatWidget: User state changed:', user);
    console.log('ChatWidget: User details:', {
      exists: !!user,
      id: user?.id,
      email: user?.email,
      full_name: user?.full_name,
      metadata: user?.user_metadata
    });
  }, [user]);

  // Get user display name with fallbacks
  const getUserDisplayName = useCallback(() => {
    if (!user) {
      console.log('getUserDisplayName: No user, using form name:', form.name.trim());
      return form.name.trim();
    }
    
    // Try multiple sources for the name
    const name = 
      user?.full_name ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.display_name ||
      user?.email?.split('@')[0] ||
      form.name.trim();
    
    const result = name || "User";
    console.log('getUserDisplayName returning:', result, 'from user object');
    return result;
  }, [user, form.name]);

  // Get user email with fallback
  const getUserEmail = useCallback(() => {
    if (!user) {
      console.log('getUserEmail: No user, using form email:', form.email.trim());
      return form.email.trim();
    }
    const result = user?.email || form.email.trim();
    console.log('getUserEmail returning:', result, 'from user object');
    return result;
  }, [user, form.email]);

  // Load messages for conversation
  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;
    
    try {
      console.log('Loading messages for conversation:', conversationId);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(100);
      
      if (error) {
        console.error('Error loading messages:', error);
        setMessages([]);
      } else {
        console.log('Loaded messages:', data?.length || 0);
        setMessages(data || []);
      }
      
      // Reset unread count when opening chat
      setUnreadCount(0);
      
      // Mark user_unread as 0 in database
      console.log('Resetting user_unread to 0 for conversation:', conversationId);
      const { error: resetError } = await supabase.from('chat_conversations')
        .update({ user_unread: 0 })
        .eq('id', conversationId);
      
      if (resetError) {
        console.error('Error resetting user_unread:', resetError);
      } else {
        console.log('user_unread reset successfully');
      }
    } catch (error) {
      console.error('Error in loadMessages:', error);
    }
  }, []);

  // Setup real-time subscription
  const setupSubscription = useCallback((conversationId) => {
    // Clean up existing subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (!conversationId) return;

    console.log('Setting up real-time subscription for:', conversationId);

    const channel = supabase
      .channel(`chat_${conversationId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload?.sender_role !== 'admin') return;

        if (adminTypingTimeoutRef.current) {
          clearTimeout(adminTypingTimeoutRef.current);
          adminTypingTimeoutRef.current = null;
        }

        const isTyping = Boolean(payload.is_typing);
        setAdminTyping(isTyping);
        if (isTyping) {
          adminTypingTimeoutRef.current = setTimeout(() => {
            setAdminTyping(false);
            adminTypingTimeoutRef.current = null;
          }, 3000);
        }
      })
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages', 
        filter: `conversation_id=eq.${conversationId}` 
      }, (payload) => {
        console.log('New message received:', payload);
        console.log('Message details:', payload.new);
        console.log('Current chat state:', { open, sender_role: payload.new?.sender_role });
        
        if (payload.new) {
          const isAdmin = payload.new.sender_role === 'admin';
          console.log('Is admin message:', isAdmin);
          
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === payload.new.id)) {
              return prev;
            }
            return [...prev, payload.new];
          });
          
          // Increment unread if chat is closed AND it's an admin message
          if (isAdmin && !open) {
            console.log('Conditions met for notification: admin message AND chat not open');
            setUnreadCount(prev => prev + 1);
            console.log('Unread count incremented to:', prev + 1);
            
            // Show toast notification for new admin message
            console.log('Attempting to show toast notification...');
            try {
              toast.success(`New message from ${payload.new.sender_name || 'BennyCare Support'}`, {
                description: payload.new.message?.substring(0, 50) + (payload.new.message?.length > 50 ? '...' : ''),
                duration: 5000,
                action: {
                  label: 'View',
                  onClick: () => {
                    console.log('View button clicked, opening chat');
                    setOpen(true);
                  }
                }
              });
              console.log('Toast notification shown successfully');
            } catch (toastError) {
              console.error('Error showing toast notification:', toastError);
            }
          } else {
            console.log('Notification conditions not met:', { isAdmin, open });
          }
        }
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'chat_conversations', 
        filter: `id=eq.${conversationId}` 
      }, (payload) => {
        console.log('Conversation updated:', payload);
        if (payload.new) {
          // Update conversation state
          setConversation(prev => ({ ...prev, ...payload.new }));
          
          // Sync unread count from database
          const newUnreadCount = payload.new.user_unread || 0;
          console.log('Syncing unread count from database:', newUnreadCount);
          
          if (open) {
            setUnreadCount(0);
          } else {
            setUnreadCount(newUnreadCount);
          }
        }
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'CHANNEL_ERROR') {
          console.error('Channel error, attempting to reconnect...');
          // Simple retry logic
          setTimeout(() => setupSubscription(conversationId), 2000);
        }
      });

    channelRef.current = channel;

    return () => {
      console.log('Cleaning up subscription for:', conversationId);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [open]);

  const sendTypingStatus = useCallback((isTyping) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    const channel = channelRef.current;
    if (!channel) return;

    const broadcastTyping = (typing) => {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { sender_role: 'customer', is_typing: typing },
      }).then((status) => {
        if (status !== 'ok') {
          console.error('Failed to broadcast customer typing status:', status);
        }
      }).catch((error) => {
        console.error('Failed to broadcast customer typing status:', error);
      });
    };

    broadcastTyping(isTyping);
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        broadcastTyping(false);
        typingTimeoutRef.current = null;
      }, 1200);
    }
  }, []);

  useEffect(() => {
    setAdminTyping(false);
    if (adminTypingTimeoutRef.current) {
      clearTimeout(adminTypingTimeoutRef.current);
      adminTypingTimeoutRef.current = null;
    }
  }, [conversation?.id]);

  useEffect(() => () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (adminTypingTimeoutRef.current) clearTimeout(adminTypingTimeoutRef.current);
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (conversation?.id) {
      loadMessages(conversation.id);
    }
    
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversation?.id, loadMessages]);

  // Setup subscription when conversation changes
  useEffect(() => {
    if (conversation?.id) {
      const cleanup = setupSubscription(conversation.id);
      return cleanup;
    }
  }, [conversation?.id, setupSubscription]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Reset unread when opening chat
  useEffect(() => {
    if (open && conversation?.id) {
      console.log('Chat opened, resetting unread count to 0');
      setUnreadCount(0);
    }
  }, [open, conversation?.id]);

  const startChat = useCallback(async () => {
    console.log('=== Start Chat Function Called ===');
    
    if (!user) {
      console.log('No user found, showing login error');
      toast.error("Please login to use live chat");
      return;
    }

    setBusy(true);
    try {
      const email = getUserEmail();
      const name = getUserDisplayName();
      
      console.log('Starting chat with:', { email, name, user });
      console.log('User object details:', {
        id: user?.id,
        email: user?.email,
        metadata: user?.user_metadata,
        full_name: user?.full_name
      });

      // Check for existing active conversation
      console.log('Step 1: Searching for existing conversations...');
      const { data: existing, error: searchError } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('customer_email', email)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (searchError) {
        console.error('Error searching for conversation:', searchError);
        throw searchError;
      }

      console.log('Existing conversations found:', existing?.length || 0);

      if (existing && existing.length > 0) {
        console.log('Found existing conversation:', existing[0]);
        setConversation(existing[0]);
        return;
      }

      // Create new conversation
      console.log('Step 2: Creating new conversation...');
      const { data: conv, error: insertError } = await supabase
        .from('chat_conversations')
        .insert({
          customer_name: name,
          customer_email: email,
          status: "active",
          last_message: GREETING,
          last_message_at: new Date().toISOString(),
          admin_unread: 0,
          user_unread: 0,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating conversation:', insertError);
        console.error('Error details:', {
          message: insertError.message,
          code: insertError.code,
          hint: insertError.hint,
          details: insertError.details
        });
        throw insertError;
      }

      console.log('Created new conversation successfully:', conv);

      // Add greeting message
      console.log('Step 3: Adding greeting message...');
      const { error: messageError } = await supabase.from('chat_messages').insert({
        conversation_id: conv.id,
        sender_role: "admin",
        sender_name: "BennyCare Support",
        message: GREETING,
      });

      if (messageError) {
        console.error('Error adding greeting:', messageError);
      } else {
        console.log('Greeting message added successfully');
      }

      console.log('Setting conversation state...');
      setConversation(conv);
      console.log('=== Chat started successfully ===');
    } catch (error) {
      console.error('=== Error starting chat ===', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        hint: error.hint,
        details: error.details
      });
      toast.error(`Failed to start chat: ${error.message || 'Please try again.'}`);
    } finally {
      setBusy(false);
    }
  }, [user, getUserEmail, getUserDisplayName]);

  const closeChat = useCallback(async () => {
    if (!conversation?.id) return;
    
    try {
      console.log('Closing conversation:', conversation.id);
      const { error } = await supabase
        .from('chat_conversations')
        .update({ 
          status: "closed",
          user_unread: 0 
        })
        .eq('id', conversation.id);

      if (error) {
        console.error('Error closing conversation:', error);
      } else {
        console.log('Conversation closed successfully');
      }
    } catch (error) {
      console.error('Error in closeChat:', error);
    }
  }, [conversation?.id]);

  const handleChatIconClick = useCallback(() => {
    if (open) {
      // If chat is open, close it (hide the widget)
      setOpen(false);
    } else {
      // If chat is closed, open it
      setOpen(true);
    }
  }, [open]);

  const handleClose = useCallback(() => {
    sendTypingStatus(false);
    closeChat();
    setOpen(false);
    setConversation(null);
    setMessages([]);
    setUnreadCount(0);
  }, [closeChat, sendTypingStatus]);

  const send = useCallback(async (e) => {
    e.preventDefault();
    if (!text.trim() || !conversation?.id) return;
    
    const messageText = text.trim();
    setText("");
    sendTypingStatus(false);
    
    try {
      const senderName = getUserDisplayName();
      
      console.log('Sending message:', { senderName, conversationId: conversation.id });

      const { data: msg, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversation.id,
          sender_role: "customer",
          sender_name: senderName,
          message: messageText,
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
        return;
      }

      console.log('Message sent successfully:', msg);

      // Update conversation with new message - fetch current admin_unread first to avoid stale data
      const { data: currentConv, error: fetchError } = await supabase
        .from('chat_conversations')
        .select('admin_unread')
        .eq('id', conversation.id)
        .single();

      if (fetchError) {
        console.error('Error fetching current conversation:', fetchError);
      }

      const currentAdminUnread = currentConv?.admin_unread || 0;
      console.log('Current admin_unread before increment:', currentAdminUnread);

      const { error: updateError } = await supabase
        .from('chat_conversations')
        .update({
          last_message: messageText,
          last_message_at: new Date().toISOString(),
          admin_unread: currentAdminUnread + 1,
          user_unread: 0,
        })
        .eq('id', conversation.id);

      if (updateError) {
        console.error('Error updating conversation:', updateError);
      } else {
        console.log('Conversation updated successfully, admin_unread set to:', currentAdminUnread + 1);
      }

      setConversation(prev => ({ 
        ...prev, 
        admin_unread: currentAdminUnread + 1,
        user_unread: 0 
      }));
    } catch (error) {
      console.error('Error in send:', error);
      toast.error('Failed to send message');
    }
  }, [text, conversation, getUserDisplayName, sendTypingStatus]);



  const renderMessage = useCallback((message) => {
    const isAdmin = message.sender_role === 'admin';
    const isMine = message.sender_role === 'customer';
    
    return (
      <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
            isMine
              ? "bg-[#22C55E] text-[#051510] rounded-br-md"
              : "bg-[#E2F1E7] dark:bg-white/10 text-[#0A3D2E] dark:text-white rounded-bl-md"
          }`}
        >
          {isAdmin && (
            <div className="text-xs font-semibold mb-1 opacity-70">BennyCare Support</div>
          )}
          {message.message}
        </div>
      </div>
    );
  }, []);

  return (
    <>
      <button
        onClick={handleChatIconClick}
        className="fixed z-40 bottom-20 md:bottom-6 right-4 md:right-6 w-14 h-14 rounded-full bg-[#22C55E] text-[#051510] shadow-lg shadow-[#22C55E]/30 flex items-center justify-center hover:bg-[#16a34a] transition-colors"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Chat with support"
      >
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {open && (
        <div
          className="fixed z-40 bottom-36 md:bottom-24 right-4 md:right-6 w-[calc(100vw-2rem)] max-w-[380px] bg-white dark:bg-[#071f15] rounded-2xl shadow-2xl border border-[#E2F1E7] dark:border-[#22C55E]/10 flex flex-col overflow-hidden h-[70vh] max-h-[560px]"
          style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="bg-[#0A3D2E] dark:bg-[#051510] px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-[#22C55E] flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-[#051510]" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-[#0A3D2E] dark:border-[#051510]" />
              </div>
              <div>
                <p className="font-heading font-semibold text-white text-sm">BennyCare Support</p>
                <p className="text-white/60 text-xs">Online · replies in minutes</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={handleClose}
                className="p-1.5 rounded-full hover:bg-white/10"
                title="Close chat"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>
          </div>

          {!conversation ? (
            <div className="flex-1 p-5 flex flex-col justify-center text-center">
              <div className="w-14 h-14 rounded-full bg-[#E2F1E7] dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-7 h-7 text-[#22C55E]" />
              </div>
              <h3 className="font-heading font-bold text-lg text-[#0A3D2E] dark:text-white mb-1">Chat with us</h3>
              <p className="text-sm text-[#0A3D2E]/60 dark:text-white/60 mb-5">
                We're here 24/7. Ask us anything about our products or your order.
              </p>
              {!user && (
                <div className="space-y-3 text-left mb-4">
                  <input
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2F1E7] dark:border-white/10 bg-transparent text-sm text-[#0A3D2E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                  />
                  <input
                    type="email"
                    placeholder="Your email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2F1E7] dark:border-white/10 bg-transparent text-sm text-[#0A3D2E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                  />
                </div>
              )}
              <button
                onClick={startChat}
                disabled={busy || (!user && (!form.name.trim() || !form.email.trim()))}
                className="w-full bg-[#22C55E] text-[#051510] font-semibold py-3 rounded-xl text-sm hover:bg-[#16a34a] disabled:opacity-50 transition-colors"
              >
                {busy ? "Starting…" : "Start Chat"}
              </button>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC] dark:bg-[#051510]">
                {messages.map((m) => renderMessage(m))}
                {adminTyping && (
                  <div className="flex justify-start">
                    <div className="bg-[#E2F1E7] dark:bg-white/10 text-[#0A3D2E] dark:text-white px-3.5 py-2 rounded-2xl rounded-bl-md text-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-[#0A3D2E]/40 dark:bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-[#0A3D2E]/40 dark:bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-[#0A3D2E]/40 dark:bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <form onSubmit={send} className="p-3 border-t border-[#E2F1E7] dark:border-white/10 flex items-center gap-2">
                <input
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    sendTypingStatus(Boolean(e.target.value.trim()));
                  }}
                  placeholder="Type a message…"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#E2F1E7]/40 dark:bg-white/5 text-sm text-[#0A3D2E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#22C55E] placeholder-[#0A3D2E]/40 dark:placeholder-white/30"
                />
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="w-10 h-10 rounded-xl bg-[#22C55E] text-[#051510] flex items-center justify-center disabled:opacity-40 hover:bg-[#16a34a] transition-colors flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}