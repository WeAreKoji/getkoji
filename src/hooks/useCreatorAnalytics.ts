import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CreatorAnalytics {
  subscriberCount: number;
  totalEarnings: number;
  subscriptionPrice: number;
  postCount: number;
  activeSubscriptions: number;
}

export const useCreatorAnalytics = (creatorId: string | null) => {
  const [analytics, setAnalytics] = useState<CreatorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!creatorId) {
      setLoading(false);
      return;
    }

    fetchAnalytics();
  }, [creatorId]);

  const fetchAnalytics = async () => {
    if (!creatorId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch creator profile
      const { data: creatorProfile, error: profileError } = await supabase
        .from("creator_profiles")
        .select("*")
        .eq("user_id", creatorId)
        .single();

      if (profileError) throw profileError;

      // Fetch post count
      const { count: postCount, error: postsError } = await supabase
        .from("creator_posts")
        .select("*", { count: "exact", head: true })
        .eq("creator_id", creatorId);

      if (postsError) throw postsError;

      // Fetch active subscriptions
      const { count: activeSubscriptions, error: subsError } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("creator_id", creatorId)
        .eq("status", "active");

      if (subsError) throw subsError;

      setAnalytics({
        subscriberCount: creatorProfile.subscriber_count,
        totalEarnings: creatorProfile.total_earnings,
        subscriptionPrice: creatorProfile.subscription_price,
        postCount: postCount || 0,
        activeSubscriptions: activeSubscriptions || 0,
      });
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching creator analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    fetchAnalytics();
  };

  return { analytics, loading, error, refresh };
};
