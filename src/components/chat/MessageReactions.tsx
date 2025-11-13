import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Heart, Laugh, ThumbsUp, Frown, Angry, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Reaction {
  id: string;
  user_id: string;
  reaction_type: string;
}

interface MessageReactionsProps {
  messageId: string;
  currentUserId: string;
}

const reactionIcons: Record<string, { icon: React.ComponentType<any>; label: string; color: string }> = {
  like: { icon: ThumbsUp, label: "Like", color: "text-blue-500" },
  love: { icon: Heart, label: "Love", color: "text-red-500" },
  laugh: { icon: Laugh, label: "Laugh", color: "text-yellow-500" },
  wow: { icon: Sparkles, label: "Wow", color: "text-purple-500" },
  sad: { icon: Frown, label: "Sad", color: "text-gray-500" },
  angry: { icon: Angry, label: "Angry", color: "text-orange-500" },
};

export const MessageReactions = ({ messageId, currentUserId }: MessageReactionsProps) => {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [userReaction, setUserReaction] = useState<string | null>(null);

  useEffect(() => {
    fetchReactions();
    
    const channel = supabase
      .channel(`reactions-${messageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
          filter: `message_id=eq.${messageId}`
        },
        () => {
          fetchReactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messageId]);

  const fetchReactions = async () => {
    const { data, error } = await supabase
      .from('message_reactions')
      .select('*')
      .eq('message_id', messageId);

    if (error) {
      console.error('Error fetching reactions:', error);
      return;
    }

    setReactions(data || []);
    const myReaction = data?.find(r => r.user_id === currentUserId);
    setUserReaction(myReaction?.reaction_type || null);
  };

  const handleReaction = async (reactionType: string) => {
    try {
      if (userReaction === reactionType) {
        // Remove reaction
        const { error } = await supabase
          .from('message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', currentUserId);

        if (error) throw error;
        setUserReaction(null);
      } else {
        // Add or update reaction
        const { error } = await supabase
          .from('message_reactions')
          .upsert({
            message_id: messageId,
            user_id: currentUserId,
            reaction_type: reactionType
          });

        if (error) throw error;
        setUserReaction(reactionType);
      }
    } catch (error) {
      console.error('Error updating reaction:', error);
      toast.error('Failed to update reaction');
    }
  };

  const reactionCounts = reactions.reduce((acc, r) => {
    acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex items-center gap-1">
      {Object.entries(reactionCounts).map(([type, count]) => {
        const config = reactionIcons[type];
        if (!config) return null;
        const Icon = config.icon;
        
        return (
          <Button
            key={type}
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 gap-1 px-2 text-xs",
              userReaction === type && "bg-accent"
            )}
            onClick={() => handleReaction(type)}
          >
            <Icon className={cn("h-3 w-3", config.color)} />
            <span>{count}</span>
          </Button>
        );
      })}

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <span className="text-lg">+</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex gap-1">
            {Object.entries(reactionIcons).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <Button
                  key={type}
                  variant={userReaction === type ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleReaction(type)}
                  title={config.label}
                >
                  <Icon className={cn("h-4 w-4", config.color)} />
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
