import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, BadgeCheck, DollarSign } from "lucide-react";
import { CreatorFilterState } from "./CreatorFilters";
import { cn } from "@/lib/utils";

interface CreatorQuickFiltersProps {
  onApplyPreset: (preset: Partial<CreatorFilterState>) => void;
}

export const CreatorQuickFilters = ({ onApplyPreset }: CreatorQuickFiltersProps) => {
  const presets = [
    {
      name: "New Creators",
      icon: Sparkles,
      filters: {
        sortBy: "created_at" as const,
        sortDirection: "desc" as const,
        minSubscribers: 0,
        maxPrice: 20,
      },
    },
    {
      name: "Popular",
      icon: TrendingUp,
      filters: {
        sortBy: "subscriber_count" as const,
        sortDirection: "desc" as const,
        minSubscribers: 100,
      },
    },
    {
      name: "Verified",
      icon: BadgeCheck,
      filters: {
        verifiedOnly: true,
        sortBy: "subscriber_count" as const,
        sortDirection: "desc" as const,
      },
    },
    {
      name: "Affordable",
      icon: DollarSign,
      filters: {
        minPrice: 0,
        maxPrice: 15,
        sortBy: "subscription_price" as const,
        sortDirection: "asc" as const,
      },
    },
  ];

  return (
    <div 
      className={cn(
        "flex gap-2 overflow-x-auto pb-1 scrollbar-hide",
        "snap-x snap-mandatory",
        "-mx-1 px-1" // Allow buttons to breathe at edges
      )}
      style={{ 
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      {presets.map((preset) => {
        const Icon = preset.icon;
        
        return (
          <Button
            key={preset.name}
            variant="outline"
            size="sm"
            onClick={() => onApplyPreset(preset.filters)}
            className={cn(
              "whitespace-nowrap flex-shrink-0 snap-start",
              "h-9 md:h-10 text-xs md:text-sm px-3 md:px-4",
              "rounded-full border-border",
              "active:scale-95 transition-transform"
            )}
          >
            <Icon className="mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4" />
            {preset.name}
          </Button>
        );
      })}
    </div>
  );
};
