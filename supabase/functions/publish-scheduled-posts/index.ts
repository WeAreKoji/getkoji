import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Call the database function to publish scheduled posts
    const { error: publishError } = await supabaseClient.rpc('publish_scheduled_posts');

    if (publishError) {
      throw publishError;
    }

    // Get the posts that were just published
    const { data: publishedPosts } = await supabaseClient
      .from('creator_posts')
      .select('id, creator_id, content')
      .eq('moderation_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);

    // Send notifications to admins for newly published posts that need moderation
    if (publishedPosts && publishedPosts.length > 0) {
      const { data: admins } = await supabaseClient
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (admins) {
        for (const admin of admins) {
          for (const post of publishedPosts) {
            await supabaseClient.rpc('create_notification', {
              _user_id: admin.user_id,
              _type: 'new_post_pending',
              _title: 'New Post Pending Moderation',
              _message: `A scheduled post has been published and needs moderation.`,
              _data: { post_id: post.id, creator_id: post.creator_id }
            });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        published_count: publishedPosts?.length || 0
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in publish-scheduled-posts function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
