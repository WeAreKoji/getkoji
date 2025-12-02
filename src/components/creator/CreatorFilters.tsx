import { useState, useEffect } from "react";
import { SearchInput } from "@/components/shared/SearchInput";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Filter, X, Users } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export interface CreatorFilterState {
  search: string;
  gender: string | null;
  location: string;
  minAge: number;
  maxAge: number;
  minPrice: number;
  maxPrice: number;
  minSubscribers: number;
  verifiedOnly: boolean;
  interests: string[];
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
  const [interests, setInterests] = useState<{ id: string; name: string; category: string }[]>([]);
  const [interestsOpen, setInterestsOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    loadInterests();
  }, []);

  const loadInterests = async () => {
    const { data } = await supabase
      .from("interests")
      .select("*")
      .order("category")
      .order("name");
    
    if (data) setInterests(data);
  };

  const updateFilter = <K extends keyof CreatorFilterState>(
    key: K,
    value: CreatorFilterState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleInterest = (interestId: string) => {
    const newInterests = filters.interests.includes(interestId)
      ? filters.interests.filter(id => id !== interestId)
      : [...filters.interests, interestId];
    updateFilter("interests", newInterests);
  };

  // Group interests by category
  const groupedInterests = interests.reduce((acc, interest) => {
    if (!acc[interest.category]) acc[interest.category] = [];
    acc[interest.category].push(interest);
    return acc;
  }, {} as Record<string, typeof interests>);

  const handleApplyFilters = () => {
    setOpen(false);
  };

  const FilterContent = ({ showApplyButton = false }: { showApplyButton?: boolean }) => (
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
          <SelectTrigger className="h-12">
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
      <div className="space-y-3">
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
      <div className="space-y-3">
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

      {/* Minimum Subscribers */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Min. Subscribers: {filters.minSubscribers}
        </Label>
        <Slider
          min={0}
          max={1000}
          step={50}
          value={[filters.minSubscribers]}
          onValueChange={([value]) => updateFilter("minSubscribers", value)}
          className="w-full"
        />
      </div>

      {/* Interests Filter */}
      <Collapsible open={interestsOpen} onOpenChange={setInterestsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between h-12">
            <span>
              Interests {filters.interests.length > 0 && `(${filters.interests.length})`}
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${interestsOpen ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-4">
          {Object.entries(groupedInterests).map(([category, categoryInterests]) => (
            <div key={category} className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">{category}</p>
              <div className="flex flex-wrap gap-2">
                {categoryInterests.map((interest) => (
                  <Badge
                    key={interest.id}
                    variant={filters.interests.includes(interest.id) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/80 py-1.5 px-3"
                    onClick={() => toggleInterest(interest.id)}
                  >
                    {interest.name}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Verified Only */}
      <div className="flex items-center justify-between py-2">
        <Label htmlFor="verified-only" className="text-base">Verified Creators Only</Label>
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
          <SelectTrigger className="h-12">
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
          className="w-full h-12"
        >
          <X className="mr-2 h-4 w-4" />
          Clear All Filters
        </Button>
      )}

      {/* Apply Button for mobile bottom sheet */}
      {showApplyButton && (
        <Button
          onClick={handleApplyFilters}
          className="w-full h-12 font-semibold"
        >
          Apply Filters
          {activeFilterCount > 0 && ` (${activeFilterCount})`}
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

      {/* Mobile Filters - Bottom Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="outline" size="sm" className="h-9 px-3 flex-shrink-0">
            <Filter className="mr-1.5 h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="bottom" 
          className="h-[85vh] rounded-t-[20px] px-0"
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-2 pb-4">
            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
          </div>
          
          <SheetHeader className="px-6 pb-4 border-b">
            <SheetTitle className="text-xl">Filter Creators</SheetTitle>
          </SheetHeader>
          
          <div className="overflow-y-auto flex-1 px-6 py-6" style={{ maxHeight: 'calc(85vh - 140px)' }}>
            <FilterContent showApplyButton />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
