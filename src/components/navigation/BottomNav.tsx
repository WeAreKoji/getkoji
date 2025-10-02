import { Link, useLocation } from "react-router-dom";
import { Heart, MessageCircle, User, Sparkles, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const BottomNav = () => {
  const location = useLocation();
  const { isCreator } = useAuth();

  const baseNavItems = [
    {
      path: "/discover",
      icon: Heart,
      label: "Discover",
    },
    {
      path: "/creators",
      icon: Sparkles,
      label: "Creators",
    },
    {
      path: "/matches",
      icon: MessageCircle,
      label: "Matches",
    },
    {
      path: "/profile",
      icon: User,
      label: "Profile",
    },
  ];

  const creatorNavItem = {
    path: "/creator/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  };

  const navItems = isCreator 
    ? [baseNavItems[0], creatorNavItem, baseNavItems[1], baseNavItems[2], baseNavItems[3]]
    : baseNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? "fill-current" : ""}`} />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
