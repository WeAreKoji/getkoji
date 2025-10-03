import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const POINTS_MAP: Record<string, number> = {
  match: 10,
  message: 5,
  profile_view: 2,
  profile_complete: 50,
  photo_upload: 10,
  daily_login: 5,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const { activity_type, metadata } = await req.json();

    if (!activity_type) {
      throw new Error("activity_type is required");
    }

    const points = POINTS_MAP[activity_type] || 0;

    if (points > 0) {
      // Award points
      await supabaseClient.rpc("award_points", {
        _user_id: user.id,
        _points: points,
        _activity_type: activity_type,
        _metadata: metadata || null,
      });

      // Update streak
      await supabaseClient.rpc("update_streak", {
        _user_id: user.id,
      });

      // Check for new achievements
      await supabaseClient.rpc("check_achievements", {
        _user_id: user.id,
      });

      // Check for newly earned achievements
      const { data: newAchievements } = await supabaseClient
        .from("user_achievements")
        .select("achievement:achievements(name, icon, points)")
        .eq("user_id", user.id)
        .gte("earned_at", new Date(Date.now() - 10000).toISOString());

      if (newAchievements && newAchievements.length > 0) {
        // Send notification for new achievement
        for (const ua of newAchievements) {
          const achievement = ua.achievement as any;
          await supabaseClient.rpc("create_notification", {
            _user_id: user.id,
            _type: "achievement",
            _title: "Achievement Unlocked! 🎉",
            _message: `You've earned "${achievement.name}"`,
            _data: { achievement },
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        points_awarded: points,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in award-activity-points function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
