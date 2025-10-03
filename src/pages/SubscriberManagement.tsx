import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Search,
  Download,
  Filter,
  Users,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { SubscriberDetailsModal } from "@/components/creator/SubscriberDetailsModal";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import BottomNav from "@/components/navigation/BottomNav";

interface Subscriber {
  id: string;
  subscriber_id: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  profile: {
    display_name: string;
    avatar_url: string | null;
    email: string;
    created_at: string;
  };
}

export default function SubscriberManagement() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [filteredSubscribers, setFilteredSubscribers] = useState<Subscriber[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("joined_desc");
  const [selectedSubscriber, setSelectedSubscriber] = useState<{
    subscriberId: string;
    subscriptionId: string;
  } | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    cancelled: 0,
    newThisMonth: 0,
  });

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [subscribers, searchTerm, statusFilter, sortBy]);

  const checkAuthAndFetch = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check creator role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "creator")
        .maybeSingle();

      if (!roleData) {
        toast.error("Access denied - Creator role required");
        navigate("/");
        return;
      }

      await fetchSubscribers(user.id);
    } catch (error) {
      console.error("Error checking auth:", error);
      setLoading(false);
    }
  };

  const fetchSubscribers = async (creatorId: string) => {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          id,
          subscriber_id,
          status,
          started_at,
          expires_at,
          profiles!subscriptions_subscriber_id_fkey (
            display_name,
            avatar_url,
            email,
            created_at
          )
        `)
        .eq("creator_id", creatorId)
        .order("started_at", { ascending: false });

      if (error) throw error;

      const formattedData = data?.map((sub: any) => ({
        id: sub.id,
        subscriber_id: sub.subscriber_id,
        status: sub.status,
        started_at: sub.started_at,
        expires_at: sub.expires_at,
        profile: Array.isArray(sub.profiles) ? sub.profiles[0] : sub.profiles,
      })) || [];

      setSubscribers(formattedData);

      // Calculate stats
      const now = new Date();
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      
      setStats({
        total: formattedData.length,
        active: formattedData.filter((s: Subscriber) => s.status === "active").length,
        cancelled: formattedData.filter((s: Subscriber) => s.status === "cancelled").length,
        newThisMonth: formattedData.filter(
          (s: Subscriber) => new Date(s.started_at) > monthAgo
        ).length,
      });
    } catch (error) {
      console.error("Error fetching subscribers:", error);
      toast.error("Failed to load subscribers");
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...subscribers];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (sub) =>
          sub.profile?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((sub) => sub.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "joined_desc":
          return new Date(b.profile?.created_at || 0).getTime() - new Date(a.profile?.created_at || 0).getTime();
        case "joined_asc":
          return new Date(a.profile?.created_at || 0).getTime() - new Date(b.profile?.created_at || 0).getTime();
        case "name_asc":
          return (a.profile?.display_name || "").localeCompare(b.profile?.display_name || "");
        case "name_desc":
          return (b.profile?.display_name || "").localeCompare(a.profile?.display_name || "");
        default:
          return 0;
      }
    });

    setFilteredSubscribers(filtered);
  };

  const exportToCSV = () => {
    const csvData = [
      ["Name", "Email", "Status", "Joined Date", "Duration"],
      ...filteredSubscribers.map((sub) => [
        sub.profile?.display_name || "",
        sub.profile?.email || "",
        sub.status,
        format(new Date(sub.profile?.created_at || new Date()), "yyyy-MM-dd"),
        formatDistanceToNow(new Date(sub.profile?.created_at || new Date())),
      ]),
    ];

    const csv = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `subscribers-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success("Subscribers exported to CSV");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading subscribers..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className={isMobile ? "w-full" : "container max-w-6xl mx-auto"}>
        {/* Header */}
        <div className={`sticky top-0 bg-background/95 backdrop-blur-sm border-b z-10 ${isMobile ? "px-3 py-2.5" : "px-4 py-3"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/creator/dashboard")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className={isMobile ? "text-base font-bold" : "text-xl font-bold"}>
                Subscriber Management
              </h1>
            </div>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className={isMobile ? "p-3 space-y-4" : "p-6 space-y-6"}>
          {/* Stats Cards */}
          <div className={isMobile ? "grid grid-cols-2 gap-3" : "grid grid-cols-4 gap-4"}>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-xs text-muted-foreground">Active</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-xs text-muted-foreground">Cancelled</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">New (30d)</span>
              </div>
              <p className="text-2xl font-bold text-primary">{stats.newThisMonth}</p>
            </Card>
          </div>

          {/* Filters */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold">Filters & Search</h3>
            </div>
            
            <div className={isMobile ? "space-y-3" : "grid grid-cols-3 gap-4"}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="joined_desc">Newest First</SelectItem>
                  <SelectItem value="joined_asc">Oldest First</SelectItem>
                  <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Subscribers List */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">
              Subscribers ({filteredSubscribers.length})
            </h3>
            
            <div className="space-y-3">
              {filteredSubscribers.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">
                  {searchTerm || statusFilter !== "all"
                    ? "No subscribers match your filters"
                    : "No subscribers yet"}
                </p>
              ) : (
                filteredSubscribers.map((subscriber) => (
                  <div
                    key={subscriber.id}
                    onClick={() =>
                      setSelectedSubscriber({
                        subscriberId: subscriber.subscriber_id,
                        subscriptionId: subscriber.id,
                      })
                    }
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar>
                        <AvatarImage
                          src={subscriber.profile?.avatar_url || undefined}
                        />
                        <AvatarFallback>
                          {subscriber.profile?.display_name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {subscriber.profile?.display_name}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {subscriber.profile?.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Joined{" "}
                          {formatDistanceToNow(new Date(subscriber.profile?.created_at || new Date()), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        subscriber.status === "active"
                          ? "default"
                          : subscriber.status === "cancelled"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {subscriber.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {isMobile && <BottomNav />}

      {/* Subscriber Details Modal */}
      {selectedSubscriber && (
        <SubscriberDetailsModal
          open={!!selectedSubscriber}
          onOpenChange={(open) => !open && setSelectedSubscriber(null)}
          subscriberId={selectedSubscriber.subscriberId}
          subscriptionId={selectedSubscriber.subscriptionId}
        />
      )}
    </div>
  );
}
