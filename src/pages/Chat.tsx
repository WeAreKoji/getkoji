import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import MessageBubble from "@/components/chat/MessageBubble";
import MessageInput from "@/components/chat/MessageInput";
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherProfile, setOtherProfile] = useState<MatchProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    checkAuth();

    // Keyboard listeners
    keyboard.addListener((info) => {
      if (info.keyboardHeight > 0) {
        // Keyboard opened - scroll to bottom
        setTimeout(() => scrollToBottom(), 100);
      }
    });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      keyboard.removeAllListeners();
    };
  }, [matchId]);

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

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setCurrentUserId(user.id);
    await fetchMatchData(user.id);
    setupRealtimeSubscription();
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

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  const sendMessage = async (content: string) => {
    if (!currentUserId || !matchId) return;

    try {
      haptics.light();
      
      const { error } = await supabase.from("messages").insert({
        match_id: matchId,
        sender_id: currentUserId,
        content,
      });

      if (error) throw error;
      
      // Scroll to bottom after sending
      setTimeout(() => scrollToBottom(false), 100);
    } catch (error) {
      logError(error, 'Chat.sendMessage');
      toast({
        title: "Error",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
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
            <div>
              <h2 className="font-semibold">{otherProfile?.display_name}</h2>
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
                  />
                ))}
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
            <MessageInput onSend={sendMessage} />
          </div>
        </div>
      </BackGesture>
    </PageTransition>
  );
};

export default Chat;
