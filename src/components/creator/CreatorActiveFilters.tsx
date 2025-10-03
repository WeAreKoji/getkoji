import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { CreatorFilterState } from "./CreatorFilters";

interface CreatorActiveFiltersProps {
  filters: CreatorFilterState;
  onRemoveFilter: (key: keyof CreatorFilterState) => void;
  onClearAll: () => void;
}

export const CreatorActiveFilters = ({
  filters,
  onRemoveFilter,
  onClearAll,
}: CreatorActiveFiltersProps) => {
  const activeFilters: { key: keyof CreatorFilterState; label: string }[] = [];

  if (filters.search) {
    activeFilters.push({ key: "search", label: `Search: "${filters.search}"` });
  }
  if (filters.gender) {
    const genderLabel = filters.gender.replace("_", " ");
    activeFilters.push({ key: "gender", label: `Gender: ${genderLabel}` });
  }
  if (filters.location) {
    activeFilters.push({ key: "location", label: `Location: "${filters.location}"` });
  }
  if (filters.minAge !== 18 || filters.maxAge !== 99) {
    activeFilters.push({ key: "minAge", label: `Age: ${filters.minAge}-${filters.maxAge}` });
  }
  if (filters.minPrice !== 0 || filters.maxPrice !== 100) {
    activeFilters.push({ key: "minPrice", label: `Price: $${filters.minPrice}-$${filters.maxPrice}` });
  }
  if (filters.verifiedOnly) {
    activeFilters.push({ key: "verifiedOnly", label: "Verified Only" });
  }

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Active filters:</span>
      {activeFilters.map(({ key, label }) => (
        <Badge
          key={key}
          variant="secondary"
          className="cursor-pointer hover:bg-secondary/80 transition-colors"
          onClick={() => onRemoveFilter(key)}
        >
          {label}
          <X className="ml-1 h-3 w-3" />
        </Badge>
      ))}
      <Badge
        variant="outline"
        className="cursor-pointer hover:bg-accent transition-colors"
        onClick={onClearAll}
      >
        Clear All
        <X className="ml-1 h-3 w-3" />
      </Badge>
    </div>
  );
};
