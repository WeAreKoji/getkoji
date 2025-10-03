import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay, startOfMonth, endOfMonth } from "date-fns";
import { Calendar as CalendarIcon, Image, Video, FileText } from "lucide-react";

interface Post {
  id: string;
  content: string | null;
  media_type: string | null;
  status: string;
  scheduled_publish_at: string | null;
  created_at: string;
}

interface ContentCalendarProps {
  creatorId: string;
  onPostClick?: (post: Post) => void;
}

export const ContentCalendar = ({ creatorId, onPostClick }: ContentCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, [creatorId]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("creator_posts")
        .select("*")
        .eq("creator_id", creatorId)
        .order("scheduled_publish_at", { ascending: true });

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPostsForDate = (date: Date) => {
    return posts.filter((post) => {
      if (post.status === "scheduled" && post.scheduled_publish_at) {
        return isSameDay(new Date(post.scheduled_publish_at), date);
      }
      if (post.status === "published") {
        return isSameDay(new Date(post.created_at), date);
      }
      return false;
    });
  };

  const getDatesWithPosts = () => {
    const dates = new Set<string>();
    posts.forEach((post) => {
      const date = post.status === "scheduled" && post.scheduled_publish_at
        ? new Date(post.scheduled_publish_at)
        : new Date(post.created_at);
      dates.add(format(date, "yyyy-MM-dd"));
    });
    return Array.from(dates).map(d => new Date(d));
  };

  const getMediaIcon = (mediaType: string | null) => {
    if (!mediaType) return <FileText className="h-4 w-4" />;
    if (mediaType.startsWith("image")) return <Image className="h-4 w-4" />;
    if (mediaType.startsWith("video")) return <Video className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const selectedDatePosts = selectedDate ? getPostsForDate(selectedDate) : [];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Content Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={{
              hasPosts: getDatesWithPosts(),
            }}
            modifiersStyles={{
              hasPosts: { fontWeight: "bold", textDecoration: "underline" },
            }}
            className="rounded-md border"
          />
          <div className="mt-4 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span>Scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Published</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDatePosts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No posts scheduled for this date</p>
          ) : (
            <div className="space-y-3">
              {selectedDatePosts.map((post) => (
                <div
                  key={post.id}
                  className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => onPostClick?.(post)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getMediaIcon(post.media_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2">
                        {post.content || "No content"}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant={post.status === "published" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {post.status}
                        </Badge>
                        {post.scheduled_publish_at && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(post.scheduled_publish_at), "h:mm a")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
