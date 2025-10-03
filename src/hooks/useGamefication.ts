import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useGamification = () => {
  const { user } = useAuth();

  const awardPoints = async (activityType: string, metadata?: any) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke("award-activity-points", {
        body: { activity_type: activityType, metadata },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Failed to award points:", error);
    }
  };

  // Auto-track certain activities
  useEffect(() => {
    if (!user) return;

    // Track daily login
    const trackDailyLogin = async () => {
      const lastLogin = localStorage.getItem(`last_login_${user.id}`);
      const today = new Date().toDateString();

      if (lastLogin !== today) {
        await awardPoints("daily_login");
        localStorage.setItem(`last_login_${user.id}`, today);
      }
    };

    trackDailyLogin();
  }, [user]);

  return {
    awardPoints,
  };
};
