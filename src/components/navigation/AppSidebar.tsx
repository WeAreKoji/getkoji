import { Heart, Sparkles, Users, Home, User, LayoutDashboard } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import logo from "@/assets/logo.png";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Discover", url: "/discover", icon: Sparkles },
  { title: "Matches", url: "/matches", icon: Heart },
  { title: "Creators", url: "/creators", icon: Users },
  { title: "Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { user } = useAuth();
  const [isCreator, setIsCreator] = useState(false);
  const [profile, setProfile] = useState<{ display_name: string; avatar_url: string | null } | null>(null);

  useEffect(() => {
    checkCreatorStatus();
    fetchProfile();
  }, [user]);

  const checkCreatorStatus = async () => {
    if (!user) return;

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "creator")
      .single();

    setIsCreator(!!roleData);
  };

  const fetchProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .single();

    if (data) setProfile(data);
  };

  const isActive = (path: string) => currentPath === path;

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary text-primary-foreground font-semibold hover:bg-primary/90" 
      : "hover:bg-accent hover:text-accent-foreground";

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto">
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 py-4 flex items-center justify-center">
              <img 
                src={logo} 
                alt="Koji" 
                className={open ? "h-10 w-auto" : "h-8 w-8"}
              />
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} end className={getNavCls}>
                        <item.icon className={open ? "mr-2 h-5 w-5" : "h-5 w-5"} />
                        {open && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {isCreator && (
            <SidebarGroup>
              <SidebarGroupLabel className="px-4">Creator</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/creator/dashboard" className={getNavCls}>
                        <LayoutDashboard className={open ? "mr-2 h-5 w-5" : "h-5 w-5"} />
                        {open && <span>Dashboard</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </div>

        {/* User Profile Section at Bottom */}
        {profile && (
          <div className="border-t mt-auto">
            <NavLink to="/profile" className="block p-3 hover:bg-accent transition-colors">
              <div className={open ? "flex items-center gap-3" : "flex justify-center"}>
                <Avatar className={open ? "w-9 h-9" : "w-8 h-8"}>
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {profile.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {open && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{profile.display_name}</p>
                    <p className="text-xs text-muted-foreground">View Profile</p>
                  </div>
                )}
              </div>
            </NavLink>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
