import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/api/supabaseClient";
import { Send, ArrowLeft, Trash2, AlertCircle, Search, MoreVertical, Clock, Check, CheckCheck, Smile, Paperclip, X, Filter, ChevronDown } from "lucide-react";

export default function Chat() {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const scrollRef = useRef(null);
  const channelRef = useRef(null);

  const quickReplies = [
    "Thank you for reaching out! How can I help you today?",
    "I'll look into that for you right away.",
    "Is there anything else I can help you with?",
    "Thanks for your patience. I'm checking on that now.",
    "Your order has been processed successfully!",
    "Please provide your order number so I can assist you better."
  ];

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .in('status', ['active', 'closed'])
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) {
        console.error('Error loading conversations:', error);
        setConversations([]);
      } else {
        setConversations(data || []);
      }
    } catch (error) {
      console.error('Error in loadConversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    const matchesSearch = 
      c.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.last_message?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Setup conversations subscription
  const setupConversationsSubscription = useCallback(() => {
    const channel = supabase
      .channel('admin_chat_conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_conversations' }, () => {
        loadConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadConversations]);

  // Load messages for selected conversation
  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;
    
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(200);
      
      if (error) {
        console.error('Error loading messages:', error);
        setMessages([]);
      } else {
        setMessages(data || []);
      }
      
      // Mark admin_unread as 0 when admin opens conversation
      const { error: resetError } = await supabase.from('chat_conversations')
        .update({ admin_unread: 0 })
        .eq('id', conversationId);
      
      if (!resetError) {
        setConversations(prev => 
          prev.map(c => 
            c.id === conversationId ? { ...c, admin_unread: 0 } : c
          )
        );
      }
    } catch (error) {
      console.error('Error in loadMessages:', error);
    }
  }, []);

  // Setup messages subscription
  const setupMessagesSubscription = useCallback((conversationId) => {
    // Clean up existing subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (!conversationId) return;

    const channel = supabase
      .channel(`admin_chat_messages_${conversationId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages', 
        filter: `conversation_id=eq.${conversationId}` 
      }, (payload) => {
        if (payload.new && selected?.id === conversationId && selected?.status === 'active') {
          setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) {
              return prev;
            }
            return [...prev, payload.new];
          });
        }
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'chat_conversations', 
        filter: `id=eq.${conversationId}` 
      }, (payload) => {
        if (payload.new && selected?.id === conversationId) {
          setSelected(prev => ({ ...prev, ...payload.new }));
          setConversations(prev => 
            prev.map(c => 
              c.id === conversationId ? { ...c, ...payload.new } : c
            )
          );
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [selected?.id, selected?.status]);

  // Initial load and subscriptions
  useEffect(() => {
    loadConversations();
    const cleanupConversations = setupConversationsSubscription();
    return cleanupConversations;
  }, [loadConversations, setupConversationsSubscription]);

  // Load messages when conversation changes
  useEffect(() => {
    if (selected?.id) {
      loadMessages(selected.id);
    }
    
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [selected?.id, loadMessages]);

  // Setup messages subscription when conversation changes
  useEffect(() => {
    if (selected?.id) {
      const cleanup = setupMessagesSubscription(selected.id);
      return cleanup;
    }
  }, [selected?.id, setupMessagesSubscription]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = useCallback(async (e) => {
    e.preventDefault();
    if (!text.trim() || !selected?.id) return;
    
    const messageText = text.trim();
    setText("");
    setShowQuickReplies(false);
    
    try {
      const { data: msg, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: selected.id,
          sender_role: "admin",
          sender_name: "BennyCare Support",
          message: messageText,
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      // Update conversation
      const { data: currentConv } = await supabase
        .from('chat_conversations')
        .select('user_unread')
        .eq('id', selected.id)
        .single();

      const currentUserUnread = currentConv?.user_unread || 0;

      await supabase
        .from('chat_conversations')
        .update({
          last_message: messageText,
          last_message_at: new Date().toISOString(),
          user_unread: currentUserUnread + 1,
        })
        .eq('id', selected.id);

      loadConversations();
    } catch (error) {
      console.error('Error in send:', error);
    }
  }, [text, selected, loadConversations]);

  const closeConversation = useCallback(async () => {
    if (!selected?.id) return;
    
    try {
      const { error } = await supabase
        .from('chat_conversations')
        .update({ 
          status: "closed",
          admin_unread: 0 
        })
        .eq('id', selected.id);

      if (!error) {
        setSelected(null);
        loadConversations();
      }
    } catch (error) {
      console.error('Error in closeConversation:', error);
    }
  }, [selected?.id, loadConversations]);

  const reopenConversation = useCallback(async (conversationId) => {
    try {
      const { error } = await supabase
        .from('chat_conversations')
        .update({ 
          status: "active" 
        })
        .eq('id', conversationId);

      if (!error) {
        loadConversations();
      }
    } catch (error) {
      console.error('Error in reopenConversation:', error);
    }
  }, [loadConversations]);

  const clearAllChats = useCallback(async () => {
    setShowClearConfirm(true);
  }, []);

  const performClearChats = useCallback(async () => {
    setClearing(true);
    setShowClearConfirm(false);

    try {
      const { data: conversations } = await supabase
        .from('chat_conversations')
        .select('id');
      
      if (!conversations || conversations.length === 0) {
        setConversations([]);
        setSelected(null);
        setMessages([]);
        setText("");
        setClearing(false);
        return;
      }

      const conversationIds = conversations.map(c => c.id);
      
      await supabase
        .from('chat_messages')
        .delete()
        .in('conversation_id', conversationIds);

      await supabase
        .from('chat_conversations')
        .delete()
        .in('id', conversationIds);

      setConversations([]);
      setSelected(null);
      setMessages([]);
      setText("");
    } catch (error) {
      console.error('Error clearing chats:', error);
    } finally {
      setClearing(false);
    }
  }, []);

  const renderMessage = useCallback((message) => {
    const isMine = message.sender_role === 'admin';
    const isAdmin = message.sender_role === 'admin';
    
    return (
      <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap break-words ${
            isMine
              ? "bg-[#22C55E] text-[#051510] rounded-br-md"
              : "bg-[#E2F1E7] dark:bg-white/10 text-[#0A3D2E] dark:text-white rounded-bl-md"
          }`}
        >
          {(isAdmin || !isAdmin) && message.sender_name && (
            <div className="text-xs font-semibold mb-1 opacity-70">{message.sender_name}</div>
          )}
          {message.message}
          <div className="text-xs opacity-50 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  }, []);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-white mb-1">Live Chat</h1>
          <p className="text-sm text-white/40">Customer support inbox</p>
        </div>
        <button
          onClick={clearAllChats}
          disabled={clearing}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <AlertCircle className="w-4 h-4" />
          {clearing ? 'Clearing...' : 'Clear All Chats'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-14rem)]">
        <div className={`bg-[#071f15] border border-[#22C55E]/10 rounded-2xl overflow-hidden flex-col ${selected ? "hidden lg:flex" : "flex"}`}>
          {/* Search and Filters */}
          <div className="p-3 sm:p-4 border-b border-[#22C55E]/10 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-white/10 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-[#051510] text-white focus:outline-none focus:ring-2 focus:ring-[#22C55E] cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            </div>
          </div>
          
          <div className="p-3 sm:p-4 border-b border-[#22C55E]/10 text-sm font-medium text-white/70 flex items-center justify-between">
            <span>Conversations</span>
            <span className="text-xs text-white/40">{filteredConversations.length}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-white/30 text-sm">Loading…</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-white/30 text-sm">No conversations found.</div>
            ) : (
              filteredConversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    if (c.status === 'closed') {
                      reopenConversation(c.id);
                    } else {
                      setSelected(c);
                    }
                  }}
                  className={`w-full text-left px-3 sm:px-4 py-3 border-b border-[#22C55E]/5 hover:bg-white/5 transition-colors ${selected?.id === c.id ? "bg-[#22C55E]/10" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white text-sm truncate">{c.customer_name}</span>
                    <div className="flex items-center gap-2">
                      {c.status === 'closed' && (
                        <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded">Closed</span>
                      )}
                      {c.admin_unread > 0 && (
                        <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#22C55E] text-[#051510] text-xs font-bold flex items-center justify-center">
                          {c.admin_unread}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-white/40 truncate mt-1">
                    {c.last_message || "—"} · {new Date(c.last_message_at || c.created_at).toLocaleString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className={`lg:col-span-2 bg-[#071f15] border border-[#22C55E]/10 rounded-2xl overflow-hidden flex-col ${selected ? "flex" : "hidden lg:flex"}`}>
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-white/30 text-sm">
              Select a conversation to view messages.
            </div>
          ) : (
            <>
              <div className="p-3 sm:p-4 border-b border-[#22C55E]/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button className="lg:hidden p-1 mr-1 text-white/50" onClick={() => setSelected(null)}>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <p className="font-medium text-white text-sm">{selected.customer_name}</p>
                    <p className="text-xs text-white/40 break-all">{selected.customer_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selected.status === 'closed' && (
                    <button
                      onClick={() => reopenConversation(selected.id)}
                      className="text-xs text-green-400 hover:text-green-300 px-3 py-1.5 rounded-lg hover:bg-white/5"
                    >
                      Reopen
                    </button>
                  )}
                  <button
                    onClick={closeConversation}
                    className="text-xs text-white/40 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-white/5"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-[#051510]">
                {messages.map((m) => renderMessage(m))}
              </div>
              <div className="p-3 border-t border-[#22C55E]/10">
                {showQuickReplies && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {quickReplies.map((reply, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setText(reply);
                          setShowQuickReplies(false);
                        }}
                        className="text-xs px-3 py-1.5 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
                <form onSubmit={send} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowQuickReplies(!showQuickReplies)}
                    className="w-10 h-10 rounded-xl bg-white/5 text-white/50 hover:bg-white/10 flex items-center justify-center transition-colors flex-shrink-0"
                    title="Quick replies"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Reply to customer…"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#051510] border border-[#22C55E]/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] placeholder-white/30"
                    disabled={selected?.status === 'closed'}
                  />
                  <button
                    type="submit"
                    disabled={!text.trim() || selected?.status === 'closed'}
                    className="w-10 h-10 rounded-xl bg-[#22C55E] text-[#051510] flex items-center justify-center disabled:opacity-40 hover:bg-[#16a34a] transition-colors flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#071f15] border border-[#22C55E]/10 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-white text-lg">Clear All Chats</h3>
                <p className="text-xs text-white/40">Destructive action</p>
              </div>
            </div>
            
            <p className="text-sm text-white/70 mb-6">
              Are you sure you want to delete ALL chat conversations and messages? This action cannot be undone and will permanently remove all chat history.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={clearing}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={performClearChats}
                disabled={clearing}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {clearing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    Clear All
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}