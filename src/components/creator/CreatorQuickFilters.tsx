import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, BadgeCheck, DollarSign } from "lucide-react";
import { CreatorFilterState } from "./CreatorFilters";

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
    <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {presets.map((preset) => {
        const Icon = preset.icon;
        
        return (
          <Button
            key={preset.name}
            variant="outline"
            size="sm"
            onClick={() => onApplyPreset(preset.filters)}
            className="whitespace-nowrap flex-shrink-0 h-7 sm:h-9 text-[10px] sm:text-sm px-2 sm:px-3"
          >
            <Icon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            {preset.name}
          </Button>
        );
      })}
    </div>
  );
};
