import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useLikesCount = () => {
  const [count, setCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchCount = async () => {
      const { data, error } = await supabase.rpc('get_likes_received_count', {
        p_user_id: userId
      });
      if (!error && data !== null) {
        setCount(data);
      }
    };

    fetchCount();

    // Subscribe to new likes
    const channel = supabase
      .channel('likes-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'swipes',
        },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return count;
};
