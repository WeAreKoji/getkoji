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
  showVerifiedOnly
}: ActiveFiltersProps) => {
  const navigate = useNavigate();
  const formatIntent = (intent: string) => {
    return intent.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };
  const formatGender = (gender: string) => {
    return gender.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };
  const activeFiltersCount = (ageRange[0] !== 18 || ageRange[1] !== 99 ? 1 : 0) + (distance !== 50 ? 1 : 0) + (interestedIn.length < 3 ? 1 : 0) + (interestedInGender.length < 2 ? 1 : 0) + (showCreatorsOnly ? 1 : 0) + (showVerifiedOnly ? 1 : 0);
  
  return (
    <div className="flex items-center gap-2 flex-wrap p-4 bg-card border-b border-border">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/discovery-settings')}
        className="gap-2"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
      </Button>
      
      {(ageRange[0] !== 18 || ageRange[1] !== 99) && (
        <Badge variant="secondary">
          Age: {ageRange[0]}-{ageRange[1]}
        </Badge>
      )}
      
      {distance !== 50 && (
        <Badge variant="secondary">
          Distance: {distance}km
        </Badge>
      )}
      
      {interestedInGender.length < 2 && (
        <Badge variant="secondary">
          {formatGender(interestedInGender[0])}
        </Badge>
      )}
      
      {showCreatorsOnly && (
        <Badge variant="secondary">
          Creators Only
        </Badge>
      )}
      
      {showVerifiedOnly && (
        <Badge variant="secondary">
          Verified Only
        </Badge>
      )}
    </div>
  );
};