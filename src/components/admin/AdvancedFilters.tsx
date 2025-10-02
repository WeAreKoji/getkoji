import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

export interface FilterOption {
  id: string;
  label: string;
  type: "select" | "date" | "dateRange";
  options?: { value: string; label: string }[];
}

export interface ActiveFilter {
  id: string;
  value: string | Date | { from: Date; to: Date };
  label: string;
}

interface AdvancedFiltersProps {
  filters: FilterOption[];
  activeFilters: ActiveFilter[];
  onFilterChange: (filters: ActiveFilter[]) => void;
}

export const AdvancedFilters = ({
  filters,
  activeFilters,
  onFilterChange,
}: AdvancedFiltersProps) => {
  const [open, setOpen] = useState(false);

  const handleFilterAdd = (filterId: string, value: any) => {
    const filter = filters.find((f) => f.id === filterId);
    if (!filter) return;

    const existing = activeFilters.find((f) => f.id === filterId);
    
    if (existing) {
      // Update existing filter
      const updated = activeFilters.map((f) =>
        f.id === filterId ? { ...f, value } : f
      );
      onFilterChange(updated);
    } else {
      // Add new filter
      onFilterChange([
        ...activeFilters,
        {
          id: filterId,
          value,
          label: filter.label,
        },
      ]);
    }
  };

  const handleFilterRemove = (filterId: string) => {
    onFilterChange(activeFilters.filter((f) => f.id !== filterId));
  };

  const handleClearAll = () => {
    onFilterChange([]);
  };

  const getFilterValueDisplay = (filter: ActiveFilter): string => {
    if (filter.value instanceof Date) {
      return format(filter.value, "MMM dd, yyyy");
    }
    if (typeof filter.value === "object" && "from" in filter.value) {
      return `${format(filter.value.from, "MMM dd")} - ${format(filter.value.to, "MMM dd")}`;
    }
    return String(filter.value);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Add Filter
              {activeFilters.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <h4 className="font-semibold">Filters</h4>
              
              {filters.map((filter) => {
                const activeFilter = activeFilters.find((f) => f.id === filter.id);
                
                return (
                  <div key={filter.id} className="space-y-2">
                    <Label>{filter.label}</Label>
                    
                    {filter.type === "select" && filter.options && (
                      <Select
                        value={activeFilter?.value as string}
                        onValueChange={(value) => handleFilterAdd(filter.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${filter.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {filter.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    
                    {filter.type === "date" && (
                      <Calendar
                        mode="single"
                        selected={activeFilter?.value as Date}
                        onSelect={(date) => date && handleFilterAdd(filter.id, date)}
                        className="rounded-md border"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {activeFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
          >
            Clear All
          </Button>
        )}
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <Badge
              key={filter.id}
              variant="secondary"
              className="pl-3 pr-1 py-1"
            >
              <span className="text-xs">
                {filter.label}: {getFilterValueDisplay(filter)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 ml-1"
                onClick={() => handleFilterRemove(filter.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
