import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";
import { logError } from "@/lib/error-logger";

interface Interest {
  id: string;
  name: string;
  category: string;
}

interface InterestSelectionProps {
  selectedInterests: string[];
  onNext: (selectedInterests: string[]) => void;
}

const InterestSelection = ({ selectedInterests: initialSelected, onNext }: InterestSelectionProps) => {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [filteredInterests, setFilteredInterests] = useState<Interest[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(initialSelected);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterests();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = interests.filter((interest) =>
        interest.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredInterests(filtered);
    } else {
      setFilteredInterests(interests);
    }
  }, [searchQuery, interests]);

  const fetchInterests = async () => {
    try {
      const { data, error } = await supabase
        .from("interests")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      setInterests(data || []);
      setFilteredInterests(data || []);
    } catch (error) {
      logError(error, 'InterestSelection.fetchInterests');
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interestId: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interestId)
        ? prev.filter((id) => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleContinue = () => {
    if (selectedInterests.length >= 5) {
      onNext(selectedInterests);
    }
  };

  const groupedInterests = filteredInterests.reduce((acc, interest) => {
    if (!acc[interest.category]) {
      acc[interest.category] = [];
    }
    acc[interest.category].push(interest);
    return acc;
  }, {} as Record<string, Interest[]>);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Choose Your Interests</h2>
        <p className="text-muted-foreground">
          Select at least 5 interests to help us find your perfect matches
        </p>
        <div className="text-sm font-medium">
          {selectedInterests.length} selected
          {selectedInterests.length < 5 && (
            <span className="text-muted-foreground">
              {" "}
              (minimum 5 required)
            </span>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          placeholder="Search interests..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="text-center py-8">Loading interests...</div>
      ) : (
        <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
          {Object.entries(groupedInterests).map(([category, categoryInterests]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                {category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {categoryInterests.map((interest) => {
                  const isSelected = selectedInterests.includes(interest.id);
                  return (
                    <Badge
                      key={interest.id}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105"
                      onClick={() => toggleInterest(interest.id)}
                    >
                      {interest.name}
                    </Badge>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        onClick={handleContinue}
        disabled={selectedInterests.length < 5}
        size="lg"
        className="w-full"
      >
        Continue ({selectedInterests.length}/5+ selected)
      </Button>
    </div>
  );
};

export default InterestSelection;
