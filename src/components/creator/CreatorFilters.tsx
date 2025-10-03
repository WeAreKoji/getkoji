import { useState } from "react";
import { SearchInput } from "@/components/shared/SearchInput";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Filter, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export interface CreatorFilterState {
  search: string;
  gender: string | null;
  location: string;
  minAge: number;
  maxAge: number;
  minPrice: number;
  maxPrice: number;
  verifiedOnly: boolean;
  sortBy: "created_at" | "subscriber_count" | "subscription_price";
  sortDirection: "asc" | "desc";
}

interface CreatorFiltersProps {
  filters: CreatorFilterState;
  onFiltersChange: (filters: CreatorFilterState) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
}

export const CreatorFilters = ({
  filters,
  onFiltersChange,
  onClearFilters,
  activeFilterCount,
}: CreatorFiltersProps) => {
  const [open, setOpen] = useState(false);

  const updateFilter = <K extends keyof CreatorFilterState>(
    key: K,
    value: CreatorFilterState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <Label>Search Creators</Label>
        <SearchInput
          value={filters.search}
          onChange={(value) => updateFilter("search", value)}
          placeholder="Search by name, username..."
          debounceMs={300}
        />
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label>Location</Label>
        <SearchInput
          value={filters.location}
          onChange={(value) => updateFilter("location", value)}
          placeholder="City or region..."
          debounceMs={300}
        />
      </div>

      {/* Gender */}
      <div className="space-y-2">
        <Label>Gender</Label>
        <Select
          value={filters.gender || "all"}
          onValueChange={(value) => updateFilter("gender", value === "all" ? null : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All genders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All genders</SelectItem>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="non_binary">Non-binary</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Age Range */}
      <div className="space-y-2">
        <Label>Age Range: {filters.minAge} - {filters.maxAge}</Label>
        <Slider
          min={18}
          max={99}
          step={1}
          value={[filters.minAge, filters.maxAge]}
          onValueChange={([min, max]) => {
            updateFilter("minAge", min);
            updateFilter("maxAge", max);
          }}
          className="w-full"
        />
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <Label>
          Subscription Price: ${filters.minPrice} - ${filters.maxPrice}
        </Label>
        <Slider
          min={0}
          max={100}
          step={5}
          value={[filters.minPrice, filters.maxPrice]}
          onValueChange={([min, max]) => {
            updateFilter("minPrice", min);
            updateFilter("maxPrice", max);
          }}
          className="w-full"
        />
      </div>

      {/* Verified Only */}
      <div className="flex items-center justify-between">
        <Label htmlFor="verified-only">Verified Creators Only</Label>
        <Switch
          id="verified-only"
          checked={filters.verifiedOnly}
          onCheckedChange={(checked) => updateFilter("verifiedOnly", checked)}
        />
      </div>

      {/* Sort By */}
      <div className="space-y-2">
        <Label>Sort By</Label>
        <Select
          value={`${filters.sortBy}-${filters.sortDirection}`}
          onValueChange={(value) => {
            const [sortBy, sortDirection] = value.split("-") as [
              CreatorFilterState["sortBy"],
              CreatorFilterState["sortDirection"]
            ];
            updateFilter("sortBy", sortBy);
            updateFilter("sortDirection", sortDirection);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at-desc">Newest First</SelectItem>
            <SelectItem value="created_at-asc">Oldest First</SelectItem>
            <SelectItem value="subscriber_count-desc">Most Popular</SelectItem>
            <SelectItem value="subscriber_count-asc">Least Popular</SelectItem>
            <SelectItem value="subscription_price-asc">Price: Low to High</SelectItem>
            <SelectItem value="subscription_price-desc">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      {activeFilterCount > 0 && (
        <Button
          variant="outline"
          onClick={onClearFilters}
          className="w-full"
        >
          <X className="mr-2 h-4 w-4" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Filters */}
      <div className="hidden lg:block">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </h3>
          </div>
          <FilterContent />
        </div>
      </div>

      {/* Mobile Filters */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="outline" className="w-full">
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filter Creators</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <FilterContent />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
