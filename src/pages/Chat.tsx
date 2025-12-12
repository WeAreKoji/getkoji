import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  const [loading, setLoading] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const currentUserId = user?.id;

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  const markMessagesAsRead = useCallback(async (userId: string) => {
    if (!matchId) return;
    try {
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("match_id", matchId)
        .neq("sender_id", userId)
        .is("read_at", null);
    } catch (error) {
      logError(error, 'Chat.markMessagesAsRead');
    }
  }, [matchId]);

  const fetchMatchData = useCallback(async (userId: string) => {
    if (!matchId) return;
    
    try {
      console.log('📥 Fetching match data for:', matchId);
      
      // Verify match exists and user is part of it
      const { data: match, error: matchError } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .single();

      if (matchError || !match) {
        console.error('❌ Match not found:', matchError);
        toast({
          title: "Error",
          description: "Match not found",
          variant: "destructive",
        });
        navigate("/matches");
        return;
      }

      const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
      console.log('👤 Other user ID:', otherUserId);

      // Fetch other user's profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .eq("id", otherUserId)
        .single();

      if (profileError) {
        console.error('❌ Profile fetch error:', profileError);
      } else {
        console.log('✅ Other profile loaded:', profile);
        let avatarUrl = profile.avatar_url;
        
        // If no avatar_url, try to get first photo from profile_photos
        if (!avatarUrl) {
          const { data: photos } = await supabase
            .from("profile_photos")
            .select("photo_url")
            .eq("user_id", otherUserId)
            .order("order_index", { ascending: true })
            .limit(1);
          
          if (photos && photos.length > 0) {
            avatarUrl = photos[0].photo_url;
          }
        }
        
        setOtherProfile({
          id: profile.id,
          display_name: profile.display_name,
          avatar_url: avatarUrl || null
        });
      }

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error('❌ Messages fetch error:', messagesError);
        throw messagesError;
      }
      
      console.log('✅ Messages loaded:', messagesData?.length || 0);
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
  }, [matchId, navigate, toast, markMessagesAsRead]);

  const setupRealtimeSubscription = useCallback((userId: string) => {
    if (!matchId) return;
    
    // Remove existing channel if any
    if (channelRef.current) {
      console.log('🔌 Removing existing channel');
      supabase.removeChannel(channelRef.current);
    }

    console.log('📡 Setting up realtime subscription for match:', matchId);

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          console.log('📨 Realtime message received:', payload.new);
          const newMessage = payload.new as Message;
          
          // Add message if not already present
          setMessages((prev) => {
            const exists = prev.some(m => m.id === newMessage.id);
            const tempIndex = prev.findIndex(m => 
              m.id.startsWith('temp-') && 
              m.sender_id === newMessage.sender_id &&
              m.content === newMessage.content
            );
            
            if (exists) {
              console.log('⏭️ Message already exists, skipping');
              return prev;
            }
            
            // Replace temp message with real one
            if (tempIndex !== -1) {
              console.log('🔄 Replacing temp message with real one');
              const updated = [...prev];
              updated[tempIndex] = { ...newMessage, delivery_status: 'sent' };
              return updated;
            }
            
            console.log('➕ Adding new message to state');
            return [...prev, newMessage];
          });
          
          // Mark as read if from other user
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
  }, [matchId, markMessagesAsRead]);

  // Initial data fetch
  useEffect(() => {
    if (currentUserId && matchId) {
      fetchMatchData(currentUserId);
    }

    keyboard.addListener((info) => {
      if (info.keyboardHeight > 0) {
        setTimeout(() => scrollToBottom(), 100);
      }
    });

    return () => {
      keyboard.removeAllListeners();
    };
  }, [matchId, currentUserId, fetchMatchData, scrollToBottom]);

  // Realtime subscription
  useEffect(() => {
    if (!currentUserId || !matchId) return;
    
    setupRealtimeSubscription(currentUserId);

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [matchId, currentUserId, setupRealtimeSubscription]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Scroll button visibility
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
    
    // Create optimistic message with temp ID
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
    
    // Add message optimistically - shows immediately
    console.log('📤 Adding optimistic message:', optimisticMessage);
    setMessages(prev => [...prev, optimisticMessage]);
    setTimeout(() => scrollToBottom(false), 50);

    try {
      haptics.light();
      
      const { data, error } = await supabase
        .from("messages")
        .insert({
          match_id: matchId,
          sender_id: currentUserId,
          content: content || '',
          message_type: mediaUrl ? "photo" : "text",
          media_url: mediaUrl || null,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to send message:', error);
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== optimisticId));
        throw error;
      }

      console.log('✅ Message sent successfully:', data);
      
      // Replace optimistic message with real one from DB
      setMessages(prev => prev.map(m => 
        m.id === optimisticId 
          ? { ...data, delivery_status: 'sent' } 
          : m
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
          {/* Tinder-style Header - Centered avatar and name */}
          <div className="bg-card border-b border-border px-4 py-3 relative">
            {/* Back button - absolute left */}
            <button 
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 -ml-2 text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            
            {/* Centered avatar and name - clickable to view profile */}
            <button 
              onClick={() => otherProfile?.id && navigate(`/profile/${otherProfile.id}`)}
              className="flex flex-col items-center w-full cursor-pointer group"
            >
              <Avatar className="w-14 h-14 border-2 border-primary/30 group-hover:border-primary/50 transition-colors">
                <AvatarImage src={otherProfile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10">
                  <User className="w-7 h-7 text-primary" />
                </AvatarFallback>
              </Avatar>
              <h2 className="font-semibold text-foreground mt-1 text-sm group-hover:text-primary transition-colors">
                {otherProfile?.display_name || 'Loading...'}
              </h2>
            </button>
          </div>

          {/* Messages */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-3 py-4 relative bg-background">
            {messages.length === 0 ? (
              <div className="text-center py-16">
                <Avatar className="w-20 h-20 mx-auto border-2 border-primary/20">
                  <AvatarImage src={otherProfile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10">
                    <User className="w-10 h-10 text-primary/60" />
                  </AvatarFallback>
                </Avatar>
                <p className="text-muted-foreground font-medium mt-4">
                  You matched with {otherProfile?.display_name || 'someone'}!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Say something nice to start the conversation
                </p>
              </div>
            ) : (
              <>
                {messages.map((message, index) => {
                  const isOwnMessage = message.sender_id === currentUserId;
                  // Show avatar only for first message in a group from same sender
                  const prevMessage = messages[index - 1];
                  const showAvatar = !prevMessage || prevMessage.sender_id !== message.sender_id;
                  
                  return (
                    <MessageBubble
                      key={message.id}
                      content={message.content}
                      isOwnMessage={isOwnMessage}
                      timestamp={message.created_at}
                      messageType={message.message_type}
                      mediaUrl={message.media_url}
                      messageId={message.id}
                      currentUserId={currentUserId || ''}
                      deliveryStatus={message.delivery_status}
                      senderAvatar={isOwnMessage ? user?.user_metadata?.avatar_url : otherProfile?.avatar_url}
                      senderName={isOwnMessage ? 'You' : otherProfile?.display_name}
                      showAvatar={showAvatar && !isOwnMessage}
                    />
                  );
                })}
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
                variant="secondary"
                className="absolute bottom-4 right-4 rounded-full shadow-lg h-10 w-10"
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
          <div className="bg-card border-t border-border px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
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