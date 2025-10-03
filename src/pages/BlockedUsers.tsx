import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyStateCard } from "@/components/shared/EmptyStateCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronLeft, UserX, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface BlockedUser {
  id: string;
  blocked_id: string;
  created_at: string;
  reason?: string;
  profile: {
    display_name: string;
    username: string;
    avatar_url: string;
  };
}

const BlockedUsers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<BlockedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const [showUnblockDialog, setShowUnblockDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<BlockedUser | null>(null);

  useEffect(() => {
    if (user) {
      fetchBlockedUsers();
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = blockedUsers.filter(
        (bu) =>
          bu.profile.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bu.profile.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(blockedUsers);
    }
  }, [searchQuery, blockedUsers]);

  const fetchBlockedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("blocked_users")
        .select(`
          id,
          blocked_id,
          created_at,
          reason,
          profile:profiles!blocked_users_blocked_id_fkey(
            display_name,
            username,
            avatar_url
          )
        `)
        .eq("blocker_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setBlockedUsers(data as any);
      setFilteredUsers(data as any);
    } catch (error: any) {
      toast.error("Failed to load blocked users");
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockClick = (blockedUser: BlockedUser) => {
    setSelectedUser(blockedUser);
    setShowUnblockDialog(true);
  };

  const handleUnblock = async () => {
    if (!selectedUser) return;

    setUnblockingId(selectedUser.id);
    try {
      const { error } = await supabase
        .from("blocked_users")
        .delete()
        .eq("id", selectedUser.id);

      if (error) throw error;

      setBlockedUsers((prev) => prev.filter((bu) => bu.id !== selectedUser.id));
      toast.success(`Unblocked ${selectedUser.profile.display_name}`);
    } catch (error: any) {
      toast.error("Failed to unblock user");
    } finally {
      setUnblockingId(null);
      setShowUnblockDialog(false);
      setSelectedUser(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/settings")}
            className="flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <UserX className="w-5 h-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Blocked Users</h1>
          {blockedUsers.length > 0 && (
            <span className="ml-auto text-sm text-muted-foreground">
              {blockedUsers.length}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {blockedUsers.length > 0 && (
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search blocked users..."
          />
        )}

        {filteredUsers.length === 0 ? (
          <EmptyStateCard
            icon={UserX}
            title={searchQuery ? "No users found" : "No blocked users"}
            description={
              searchQuery
                ? "Try a different search term"
                : "You haven't blocked anyone yet. Blocked users won't be able to see your profile or contact you."
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((blockedUser) => (
              <Card key={blockedUser.id} className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    <AvatarImage src={blockedUser.profile.avatar_url} />
                    <AvatarFallback>
                      {blockedUser.profile.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">
                      {blockedUser.profile.display_name}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      @{blockedUser.profile.username}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Blocked {formatDistanceToNow(new Date(blockedUser.created_at), { addSuffix: true })}
                    </p>
                    {blockedUser.reason && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        Reason: {blockedUser.reason}
                      </p>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnblockClick(blockedUser)}
                    disabled={unblockingId === blockedUser.id}
                  >
                    {unblockingId === blockedUser.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Unblock"
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showUnblockDialog}
        onOpenChange={setShowUnblockDialog}
        onConfirm={handleUnblock}
        title="Unblock User"
        description={`Are you sure you want to unblock ${selectedUser?.profile.display_name}? They'll be able to see your profile and contact you again.`}
        confirmLabel="Unblock"
      />
    </div>
  );
};

export default BlockedUsers;
