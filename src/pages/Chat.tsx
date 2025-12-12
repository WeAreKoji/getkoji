import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import MessageBubble from "@/components/chat/MessageBubble";
import MessageInput from "@/components/chat/MessageInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, User, Loader2, ArrowDown } from "lucide-react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { BackGesture } from "@/components/navigation/BackGesture";
import { PageTransition } from "@/components/transitions/PageTransition";
import { haptics, keyboard } from "@/lib/native";
import { logError, getUserFriendlyError } from "@/lib/error-logger";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  message_type?: string;
  media_url?: string | null;
  delivery_status?: string;
}

interface MatchProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

const Chat = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherProfile, setOtherProfile] = useState<MatchProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (user) {
      setCurrentUserId(user.id);
      fetchMatchData(user.id);
    }

    // Keyboard listeners
    keyboard.addListener((info) => {
      if (info.keyboardHeight > 0) {
        // Keyboard opened - scroll to bottom
        setTimeout(() => scrollToBottom(), 100);
      }
    });

    return () => {
      keyboard.removeAllListeners();
    };
  }, [matchId, user]);

  // Separate effect for realtime subscription that depends on currentUserId
  useEffect(() => {
    if (!currentUserId || !matchId) return;
    
    setupRealtimeSubscription(currentUserId);

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [matchId, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Detect if user has scrolled up
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };


  const fetchMatchData = async (userId: string) => {
    try {
      // Verify match exists and user is part of it
      const { data: match, error: matchError } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .single();

      if (matchError || !match) {
        toast({
          title: "Error",
          description: "Match not found",
          variant: "destructive",
        });
        navigate("/matches");
        return;
      }

      const otherUserId =
        match.user1_id === userId ? match.user2_id : match.user1_id;

      // Fetch other user's profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .eq("id", otherUserId)
        .single();

      setOtherProfile(profile);

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);

      // Mark unread messages as read
      await markMessagesAsRead(userId);
    } catch (error) {
      logError(error, 'Chat.fetchMatchData');
      toast({
        title: "Error",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async (userId: string) => {
    try {
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("match_id", matchId)
        .neq("sender_id", userId)
        .is("read_at", null);
    } catch (error) {
      // Silent fail - not critical to user experience
      logError(error, 'Chat.markMessagesAsRead');
    }
  };

  const setupRealtimeSubscription = (userId: string) => {
    // Remove existing channel if any
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`messages:${matchId}:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          console.log('📨 New message received via realtime:', payload.new);
          const newMessage = payload.new as Message;
          
          // Check for duplicates before adding
          setMessages((prev) => {
            if (prev.some(m => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
          
          // Mark as read if it's not from current user
          if (newMessage.sender_id !== userId) {
            setTimeout(() => markMessagesAsRead(userId), 100);
            setOtherUserTyping(false);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "typing_indicators",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          console.log('⌨️ Typing indicator update:', payload);
          if (payload.new && 'user_id' in payload.new) {
            const typingUserId = (payload.new as any).user_id;
            const isTyping = (payload.new as any).is_typing;
            if (typingUserId !== userId) {
              setOtherUserTyping(isTyping);
            }
          } else if (payload.eventType === 'DELETE') {
            setOtherUserTyping(false);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;
  };

  const handleTyping = async (isTyping: boolean) => {
    if (!currentUserId || !matchId) return;

    try {
      if (isTyping) {
        await supabase.from("typing_indicators").upsert({
          match_id: matchId,
          user_id: currentUserId,
          is_typing: true,
          expires_at: new Date(Date.now() + 5000).toISOString(),
        });
      } else {
        await supabase
          .from("typing_indicators")
          .delete()
          .eq("match_id", matchId)
          .eq("user_id", currentUserId);
      }
    } catch (error) {
      console.error("Error updating typing indicator:", error);
    }
  };

  const sendMessage = async (content: string, mediaUrl?: string) => {
    if (!currentUserId || !matchId || sendingMessage) return;
    if (!content.trim() && !mediaUrl) return;

    setSendingMessage(true);
    
    // Create optimistic message
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      content: content || '',
      sender_id: currentUserId,
      created_at: new Date().toISOString(),
      message_type: mediaUrl ? "photo" : "text",
      media_url: mediaUrl || null,
      delivery_status: "sending"
    };
    
    // Add message optimistically
    setMessages(prev => [...prev, optimisticMessage]);
    setTimeout(() => scrollToBottom(false), 50);

    try {
      haptics.light();
      console.log('📤 Sending message:', { content, mediaUrl, matchId, senderId: currentUserId });
      
      const { data, error } = await supabase.from("messages").insert({
        match_id: matchId,
        sender_id: currentUserId,
        content: content || '',
        message_type: mediaUrl ? "photo" : "text",
        media_url: mediaUrl || null,
      }).select().single();

      if (error) {
        console.error('❌ Failed to send message:', error);
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== optimisticId));
        throw error;
      }

      console.log('✅ Message sent successfully:', data);
      
      // Replace optimistic message with real one
      setMessages(prev => prev.map(m => 
        m.id === optimisticId ? { ...data, delivery_status: 'sent' } : m
      ));
      
      // Clear typing indicator
      await handleTyping(false);
    } catch (error) {
      logError(error, 'Chat.sendMessage');
      toast({
        title: "Failed to send",
        description: "Check your connection and try again",
        variant: "destructive"
      });
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageTransition type="slide">
      <BackGesture>
        <div className="flex flex-col h-screen bg-background">
          {/* Header */}
          <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
            <Link to="/matches" aria-label="Back to matches">
              <ArrowLeft className="w-6 h-6 text-foreground hover:text-primary transition-colors" />
            </Link>
            <Avatar className="w-10 h-10">
              <AvatarImage src={otherProfile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10">
                <User className="w-5 h-5 text-primary" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="font-semibold">{otherProfile?.display_name}</h2>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <span className="text-xs text-muted-foreground">
                  {isConnected ? 'Connected' : 'Connecting...'}
                </span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-6 relative">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No messages yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start the conversation!
                </p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    content={message.content}
                    isOwnMessage={message.sender_id === currentUserId}
                    timestamp={message.created_at}
                    messageType={message.message_type}
                    mediaUrl={message.media_url}
                    messageId={message.id}
                    currentUserId={currentUserId || ''}
                    deliveryStatus={message.delivery_status}
                  />
                ))}
                {otherUserTyping && (
                  <TypingIndicator
                    otherUserName={otherProfile?.display_name || "User"}
                    isTyping={otherUserTyping}
                  />
                )}
                <div ref={messagesEndRef} />
              </>
            )}

            {/* Scroll to bottom button */}
            {showScrollButton && (
              <Button
                size="icon"
                className="absolute bottom-4 right-4 rounded-full shadow-lg"
                onClick={() => {
                  haptics.light();
                  scrollToBottom();
                }}
              >
                <ArrowDown className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Input */}
          <div className="bg-card border-t border-border px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <MessageInput 
              onSend={sendMessage} 
              onTyping={handleTyping}
              disabled={sendingMessage || !isConnected} 
              matchId={matchId || ''} 
            />
          </div>
        </div>
      </BackGesture>
    </PageTransition>
  );
};

export default Chat;
