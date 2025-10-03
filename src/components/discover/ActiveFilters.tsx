import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, SlidersHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ActiveFiltersProps {
  ageRange: [number, number];
  distance: number;
  interestedIn: string[];
  interestedInGender: string[];
  showCreatorsOnly: boolean;
  showVerifiedOnly: boolean;
}

export const ActiveFilters = ({
  ageRange,
  distance,
  interestedIn,
  interestedInGender,
  showCreatorsOnly,
  showVerifiedOnly,
}: ActiveFiltersProps) => {
  const navigate = useNavigate();
  
  const formatIntent = (intent: string) => {
    return intent.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatGender = (gender: string) => {
    return gender.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const activeFiltersCount = 
    (ageRange[0] !== 18 || ageRange[1] !== 99 ? 1 : 0) +
    (distance !== 50 ? 1 : 0) +
    (interestedIn.length < 3 ? 1 : 0) +
    (interestedInGender.length < 2 ? 1 : 0) +
    (showCreatorsOnly ? 1 : 0) +
    (showVerifiedOnly ? 1 : 0);

  return (
    <div className="bg-card border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {activeFiltersCount > 0 ? 'Active Filters' : 'Showing: Everyone'}
          </span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/discovery-settings')}
          className="text-xs h-8"
        >
          Edit
        </Button>
      </div>
      
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {/* Age Range */}
          {(ageRange[0] !== 18 || ageRange[1] !== 99) && (
            <Badge variant="outline" className="text-xs px-2 py-1">
              Age: {ageRange[0]}-{ageRange[1]}
            </Badge>
          )}
          
          {/* Distance */}
          {distance !== 50 && (
            <Badge variant="outline" className="text-xs px-2 py-1">
              Within {distance}km
            </Badge>
          )}
          
          {/* Intent Filters */}
          {interestedIn.length < 3 && interestedIn.map((intent) => (
            <Badge key={intent} variant="outline" className="text-xs px-2 py-1">
              {formatIntent(intent)}
            </Badge>
          ))}
          
          {/* Gender Filters */}
          {interestedInGender.length < 2 && interestedInGender.map((gender) => (
            <Badge key={gender} variant="outline" className="text-xs px-2 py-1">
              {formatGender(gender)}
            </Badge>
          ))}
          
          {/* Creator Filter */}
          {showCreatorsOnly && (
            <Badge variant="outline" className="text-xs px-2 py-1">
              Creators Only
            </Badge>
          )}
          
          {/* Verified Filter */}
          {showVerifiedOnly && (
            <Badge variant="outline" className="text-xs px-2 py-1">
              Verified Only
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};