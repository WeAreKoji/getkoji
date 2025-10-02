import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { EmptyState } from "@/components/shared/EmptyState";
import { Users } from "lucide-react";

interface Subscriber {
  id: string;
  subscriber_id: string;
  profiles: {
    display_name: string;
    avatar_url: string | null;
    email: string;
  };
  started_at: string;
  status: string;
  total_paid?: number;
}

export default function SubscriberManagement() {
  const { user } = useAuth();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [filteredSubscribers, setFilteredSubscribers] = useState<Subscriber[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscribers();
    }
  }, [user]);

  useEffect(() => {
    const filtered = subscribers.filter(sub =>
      sub.profiles.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.profiles.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredSubscribers(filtered);
  }, [searchQuery, subscribers]);

  const fetchSubscribers = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        id,
        subscriber_id,
        started_at,
        status,
        profiles!subscriptions_subscriber_id_fkey (
          display_name,
          avatar_url,
          email
        )
      `)
      .eq('creator_id', user.id)
      .order('started_at', { ascending: false });

    if (data && !error) {
      setSubscribers(data as any);
      setFilteredSubscribers(data as any);
    }

    setLoading(false);
  };

  const exportToCSV = () => {
    const csv = [
      ['Name', 'Email', 'Status', 'Subscribed Since', 'Total Paid'],
      ...filteredSubscribers.map(sub => [
        sub.profiles.display_name,
        sub.profiles.email,
        sub.status,
        new Date(sub.started_at).toLocaleDateString(),
        `$${sub.total_paid || 0}`
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  if (subscribers.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <EmptyState
          icon={Users}
          title="No Subscribers Yet"
          description="When users subscribe to your content, they'll appear here."
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Subscriber Management</h1>
          <p className="text-muted-foreground">
            Manage and view your {subscribers.length} subscriber{subscribers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredSubscribers.map((subscriber) => (
          <Card key={subscriber.id}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={subscriber.profiles.avatar_url || undefined} />
                  <AvatarFallback>
                    {subscriber.profiles.display_name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{subscriber.profiles.display_name}</p>
                  <p className="text-sm text-muted-foreground">{subscriber.profiles.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Subscribed {formatDistanceToNow(new Date(subscriber.started_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={subscriber.status === 'active' ? 'default' : 'secondary'}>
                  {subscriber.status}
                </Badge>
                <Button variant="ghost" size="icon">
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSubscribers.length === 0 && searchQuery && (
        <EmptyState
          icon={Search}
          title="No Results Found"
          description={`No subscribers match "${searchQuery}"`}
        />
      )}
    </div>
  );
}
