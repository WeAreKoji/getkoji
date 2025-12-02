import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import BottomNav from "@/components/navigation/BottomNav";
import { CreatorShowcaseCard } from "@/components/creator/CreatorShowcaseCard";
import { CreatorFilters, CreatorFilterState } from "@/components/creator/CreatorFilters";
import { CreatorActiveFilters } from "@/components/creator/CreatorActiveFilters";
import { CreatorQuickFilters } from "@/components/creator/CreatorQuickFilters";
import { CreatorSavedPresets } from "@/components/creator/CreatorSavedPresets";
import { PullToRefresh } from "@/components/mobile/PullToRefresh";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Creator {
  id: string;
  user_id: string;
  subscription_price: number;
  subscriber_count: number;
  id_verified?: boolean;
  display_name: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  city?: string;
  age?: number;
  created_at: string;
  welcome_video_url?: string;
  cover_image_url?: string;
  tagline?: string;
  showcase_bio?: string;
}

const CreatorCardSkeleton = () => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return (
      <div className="rounded-lg border bg-card p-3 flex gap-3">
        <Skeleton className="w-24 h-24 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2 py-0.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <div className="pt-16 pb-6 px-6 space-y-4">
        <Skeleton className="h-6 w-32 ml-28" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="pt-4 border-t flex items-center justify-between">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
    </div>
  );
};

const Creators = () => {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  
  const ITEMS_PER_PAGE = 12;

  // Initialize filters from URL params
  const [filters, setFilters] = useState<CreatorFilterState>(() => ({
    search: searchParams.get("search") || "",
    gender: searchParams.get("gender") || null,
    location: searchParams.get("location") || "",
    minAge: parseInt(searchParams.get("minAge") || "18"),
    maxAge: parseInt(searchParams.get("maxAge") || "99"),
    minPrice: parseInt(searchParams.get("minPrice") || "0"),
    maxPrice: parseInt(searchParams.get("maxPrice") || "100"),
    minSubscribers: parseInt(searchParams.get("minSubscribers") || "0"),
    verifiedOnly: searchParams.get("verifiedOnly") === "true",
    interests: searchParams.get("interests")?.split(",").filter(Boolean) || [],
    sortBy: (searchParams.get("sortBy") as CreatorFilterState["sortBy"]) || "created_at",
    sortDirection: (searchParams.get("sortDirection") as CreatorFilterState["sortDirection"]) || "desc",
  }));

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.gender) params.set("gender", filters.gender);
    if (filters.location) params.set("location", filters.location);
    if (filters.minAge !== 18) params.set("minAge", filters.minAge.toString());
    if (filters.maxAge !== 99) params.set("maxAge", filters.maxAge.toString());
    if (filters.minPrice !== 0) params.set("minPrice", filters.minPrice.toString());
    if (filters.maxPrice !== 100) params.set("maxPrice", filters.maxPrice.toString());
    if (filters.minSubscribers !== 0) params.set("minSubscribers", filters.minSubscribers.toString());
    if (filters.verifiedOnly) params.set("verifiedOnly", "true");
    if (filters.interests.length > 0) params.set("interests", filters.interests.join(","));
    if (filters.sortBy !== "created_at") params.set("sortBy", filters.sortBy);
    if (filters.sortDirection !== "desc") params.set("sortDirection", filters.sortDirection);
    
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [filters]);

  useEffect(() => {
    loadCreators(currentPage);
  }, [currentPage, filters]);

  const loadCreators = useCallback(async (page: number, isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const offset = (page - 1) * ITEMS_PER_PAGE;
      
      const { data, error } = await supabase.rpc('get_creators_with_profiles', {
        p_limit: ITEMS_PER_PAGE,
        p_offset: offset,
        p_search: filters.search || null,
        p_gender: filters.gender,
        p_location: filters.location || null,
        p_min_age: filters.minAge !== 18 ? filters.minAge : null,
        p_max_age: filters.maxAge !== 99 ? filters.maxAge : null,
        p_min_price: filters.minPrice !== 0 ? filters.minPrice : null,
        p_max_price: filters.maxPrice !== 100 ? filters.maxPrice : null,
        p_min_subscribers: filters.minSubscribers !== 0 ? filters.minSubscribers : null,
        p_verified_only: filters.verifiedOnly,
        p_sort_by: filters.sortBy,
        p_sort_direction: filters.sortDirection,
      });

      if (error) throw error;

      // Map RPC results directly to Creator interface
      const creators: Creator[] = (data || []).map((row: any) => ({
        id: row.creator_id,
        user_id: row.user_id,
        subscription_price: row.subscription_price,
        subscriber_count: row.subscriber_count,
        id_verified: row.id_verified,
        welcome_video_url: row.welcome_video_url,
        cover_image_url: row.cover_image_url,
        tagline: row.tagline,
        showcase_bio: row.showcase_bio,
        display_name: row.display_name || 'Creator',
        username: row.username,
        avatar_url: row.avatar_url,
        bio: row.bio,
        city: row.city,
        age: row.age,
        created_at: row.creator_created_at || row.profile_created_at,
      }));

      setCreators(creators);
      
      // Get total count from first row
      if (data && data.length > 0) {
        setTotalCount(data[0].total_count);
      } else {
        setTotalCount(0);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCreators(currentPage, true);
    setRefreshing(false);
  };
  
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handleFiltersChange = (newFilters: CreatorFilterState) => {
    setFilters(newFilters);
  };

  const handleApplyPreset = (preset: Partial<CreatorFilterState>) => {
    setFilters({ ...filters, ...preset });
  };

  const handleLoadPreset = (presetFilters: CreatorFilterState) => {
    setFilters(presetFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      gender: null,
      location: "",
      minAge: 18,
      maxAge: 99,
      minPrice: 0,
      maxPrice: 100,
      minSubscribers: 0,
      verifiedOnly: false,
      interests: [],
      sortBy: "created_at",
      sortDirection: "desc",
    });
  };

  const handleRemoveFilter = (key: keyof CreatorFilterState) => {
    const defaults: CreatorFilterState = {
      search: "",
      gender: null,
      location: "",
      minAge: 18,
      maxAge: 99,
      minPrice: 0,
      maxPrice: 100,
      minSubscribers: 0,
      verifiedOnly: false,
      interests: [],
      sortBy: "created_at",
      sortDirection: "desc",
    };
    
    if (key === "minAge" || key === "maxAge") {
      setFilters({ ...filters, minAge: 18, maxAge: 99 });
    } else if (key === "minPrice" || key === "maxPrice") {
      setFilters({ ...filters, minPrice: 0, maxPrice: 100 });
    } else {
      setFilters({ ...filters, [key]: defaults[key] });
    }
  };

  const activeFilterCount = [
    filters.search,
    filters.gender,
    filters.location,
    filters.minAge !== 18 || filters.maxAge !== 99,
    filters.minPrice !== 0 || filters.maxPrice !== 100,
    filters.minSubscribers !== 0,
    filters.verifiedOnly,
    filters.interests.length > 0,
  ].filter(Boolean).length;

  const renderContent = () => (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <div className="container mx-auto px-3 md:px-4 py-3 md:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-3 md:mb-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl md:text-3xl lg:text-4xl font-bold text-foreground">
              Discover Creators
            </h1>
            <Button
              onClick={() => navigate('/creator/apply')}
              size="sm"
              className="hidden md:flex"
            >
              Become a Creator
            </Button>
          </div>
        </div>

        {/* Filters and Content */}
        <div className="grid lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr] gap-3 md:gap-6">
          {/* Sidebar Filters - hidden on mobile, shown as sheet via CreatorFilters */}
          <aside className="hidden lg:block space-y-3">
            <CreatorSavedPresets
              currentFilters={filters}
              onLoadPreset={handleLoadPreset}
            />
            <CreatorFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
              activeFilterCount={activeFilterCount}
            />
          </aside>

          {/* Main Content */}
          <div className="space-y-2 md:space-y-4">
            {/* Mobile: Quick Filters + Filter button row */}
            <div className="lg:hidden">
              <div className="flex items-center gap-2">
                <div className="flex-1 overflow-hidden">
                  <CreatorQuickFilters onApplyPreset={handleApplyPreset} />
                </div>
                <CreatorFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onClearFilters={handleClearFilters}
                  activeFilterCount={activeFilterCount}
                />
              </div>
            </div>
            
            {/* Desktop: Quick Filters */}
            <div className="hidden lg:block">
              <CreatorQuickFilters onApplyPreset={handleApplyPreset} />
            </div>
            
            {/* Active Filters & Results Count */}
            <div className="space-y-2 md:space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs md:text-sm text-muted-foreground font-medium">
                  {totalCount} {totalCount === 1 ? "creator" : "creators"} found
                </p>
                {/* Desktop refresh button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="hidden md:flex h-8 px-2"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              
              <CreatorActiveFilters
                filters={filters}
                onRemoveFilter={handleRemoveFilter}
                onClearAll={handleClearFilters}
              />
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CreatorCardSkeleton key={i} />
                ))}
              </div>
            ) : creators.length === 0 ? (
              <div className="text-center py-8 md:py-12 border rounded-lg bg-card">
                <p className="text-base md:text-lg text-muted-foreground mb-2">No creators found</p>
                <p className="text-xs md:text-sm text-muted-foreground mb-4">
                  Try adjusting your filters or search terms
                </p>
                {activeFilterCount > 0 && (
                  <Button
                    onClick={handleClearFilters}
                    variant="outline"
                    size="sm"
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-6">
                  {creators.map((creator) => (
                    <CreatorShowcaseCard key={creator.id} creator={creator} />
                  ))}
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6 md:mt-8">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(p => p - 1)}
                      disabled={!canGoPrevious}
                      className="h-10 w-10"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center gap-1 md:gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          // On mobile, show fewer pages
                          if (isMobile) {
                            return page === 1 || 
                                   page === totalPages || 
                                   page === currentPage;
                          }
                          // Desktop: Show first page, last page, current page, and pages around current
                          return page === 1 || 
                                 page === totalPages || 
                                 Math.abs(page - currentPage) <= 1;
                        })
                        .map((page, idx, arr) => {
                          // Add ellipsis between non-consecutive pages
                          const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
                          return (
                            <div key={page} className="flex items-center gap-1 md:gap-2">
                              {showEllipsis && (
                                <span className="text-muted-foreground px-2 text-sm">
                                  ...
                                </span>
                              )}
                              <Button
                                variant={currentPage === page ? "default" : "outline"}
                                size="icon"
                                onClick={() => setCurrentPage(page)}
                                className="h-10 w-10 text-sm"
                              >
                                {page}
                              </Button>
                            </div>
                          );
                        })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={!canGoNext}
                      className="h-10 w-10"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );

  // Wrap with PullToRefresh on mobile
  if (isMobile) {
    return (
      <PullToRefresh onRefresh={handleRefresh}>
        {renderContent()}
      </PullToRefresh>
    );
  }

  return renderContent();
};

export default Creators;
