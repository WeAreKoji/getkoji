import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, Calendar } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

export interface SubscriberFilters {
  search: string;
  status: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy: string;
  sortDirection: "asc" | "desc";
}

interface AdvancedSubscriberFiltersProps {
  filters: SubscriberFilters;
  onFiltersChange: (filters: SubscriberFilters) => void;
  totalCount: number;
  filteredCount: number;
}

export const AdvancedSubscriberFilters = ({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
}: AdvancedSubscriberFiltersProps) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const hasActiveFilters =
    filters.search ||
    filters.status !== "all" ||
    filters.dateFrom ||
    filters.dateTo;

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      status: "all",
      dateFrom: undefined,
      dateTo: undefined,
      sortBy: "started_at",
      sortDirection: "desc",
    });
  };

  const removeFilter = (key: keyof SubscriberFilters) => {
    onFiltersChange({
      ...filters,
      [key]: key === "status" ? "all" : key === "sortBy" ? "started_at" : key === "sortDirection" ? "desc" : undefined,
    });
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>

        <Select
          value={filters.status}
          onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="past_due">Past Due</SelectItem>
          </SelectContent>
        </Select>

        <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Calendar className="w-4 h-4" />
              Date Range
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarComponent
              mode="range"
              selected={{
                from: filters.dateFrom,
                to: filters.dateTo,
              }}
              onSelect={(range) => {
                onFiltersChange({
                  ...filters,
                  dateFrom: range?.from,
                  dateTo: range?.to,
                });
                if (range?.from && range?.to) {
                  setShowDatePicker(false);
                }
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        <Select
          value={filters.sortBy}
          onValueChange={(value) => onFiltersChange({ ...filters, sortBy: value })}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="started_at">Join Date</SelectItem>
            <SelectItem value="display_name">Name</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={() =>
            onFiltersChange({
              ...filters,
              sortDirection: filters.sortDirection === "asc" ? "desc" : "asc",
            })
          }
        >
          {filters.sortDirection === "asc" ? "↑" : "↓"}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters} className="gap-2">
            <X className="w-4 h-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.search}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => removeFilter("search")}
              />
            </Badge>
          )}

          {filters.status !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Status: {filters.status}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => removeFilter("status")}
              />
            </Badge>
          )}

          {filters.dateFrom && (
            <Badge variant="secondary" className="gap-1">
              From: {format(filters.dateFrom, "MMM dd, yyyy")}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => removeFilter("dateFrom")}
              />
            </Badge>
          )}

          {filters.dateTo && (
            <Badge variant="secondary" className="gap-1">
              To: {format(filters.dateTo, "MMM dd, yyyy")}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => removeFilter("dateTo")}
              />
            </Badge>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="w-4 h-4" />
        <span>
          Showing {filteredCount} of {totalCount} subscribers
        </span>
      </div>
    </div>
  );
};
