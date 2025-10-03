import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Users, ShieldCheck, Heart, X } from "lucide-react";

interface QuickFilter {
  id: string;
  label: string;
  icon: React.ReactNode;
  filters: {
    show_creators_only?: boolean;
    show_verified_only?: boolean;
    interested_in?: string[];
  };
}

const quickFilters: QuickFilter[] = [
  {
    id: "trending",
    label: "Trending",
    icon: <Sparkles className="w-4 h-4" />,
    filters: {
      show_creators_only: true,
    },
  },
  {
    id: "verified",
    label: "Verified",
    icon: <ShieldCheck className="w-4 h-4" />,
    filters: {
      show_verified_only: true,
    },
  },
  {
    id: "dating",
    label: "Dating",
    icon: <Heart className="w-4 h-4" />,
    filters: {
      interested_in: ["open_to_dating"],
    },
  },
  {
    id: "friends",
    label: "Friends",
    icon: <Users className="w-4 h-4" />,
    filters: {
      interested_in: ["make_friends"],
    },
  },
];

interface QuickFiltersBarProps {
  activeFilters: string[];
  onFilterToggle: (filterId: string, filters: any) => void;
  onClearAll: () => void;
}

export const QuickFiltersBar = ({
  activeFilters,
  onFilterToggle,
  onClearAll,
}: QuickFiltersBarProps) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {quickFilters.map((filter) => {
        const isActive = activeFilters.includes(filter.id);
        return (
          <Button
            key={filter.id}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterToggle(filter.id, filter.filters)}
            className="flex-shrink-0"
          >
            {filter.icon}
            <span className="ml-1">{filter.label}</span>
          </Button>
        );
      })}
      {activeFilters.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="flex-shrink-0 text-muted-foreground"
        >
          <X className="w-4 h-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
};
