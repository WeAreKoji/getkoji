import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreatorFilterState } from "./CreatorFilters";
import { Bookmark, Trash2, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface SavedPreset {
  id: string;
  name: string;
  filters: CreatorFilterState;
  createdAt: string;
}

interface CreatorSavedPresetsProps {
  currentFilters: CreatorFilterState;
  onLoadPreset: (filters: CreatorFilterState) => void;
}

export const CreatorSavedPresets = ({
  currentFilters,
  onLoadPreset,
}: CreatorSavedPresetsProps) => {
  const [presets, setPresets] = useState<SavedPreset[]>([]);
  const [presetName, setPresetName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = () => {
    const saved = localStorage.getItem("creator-filter-presets");
    if (saved) {
      setPresets(JSON.parse(saved));
    }
  };

  const savePreset = () => {
    if (!presetName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for this preset",
        variant: "destructive",
      });
      return;
    }

    const newPreset: SavedPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      filters: currentFilters,
      createdAt: new Date().toISOString(),
    };

    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem("creator-filter-presets", JSON.stringify(updated));

    toast({
      title: "Preset saved",
      description: `"${presetName}" has been saved`,
    });

    setPresetName("");
    setDialogOpen(false);
  };

  const deletePreset = (id: string) => {
    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    localStorage.setItem("creator-filter-presets", JSON.stringify(updated));

    toast({
      title: "Preset deleted",
      description: "Filter preset has been removed",
    });
  };

  return (
    <Card className="p-3 md:p-4 space-y-2 md:space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-xs md:text-sm">Saved Searches</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 text-xs">
              <Bookmark className="mr-1.5 h-3.5 w-3.5" />
              Save
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Filter Preset</DialogTitle>
              <DialogDescription>
                Give this filter combination a name so you can easily use it again later.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="preset-name">Preset Name</Label>
                <Input
                  id="preset-name"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="e.g., My Favorite Creators"
                  onKeyDown={(e) => e.key === "Enter" && savePreset()}
                />
              </div>
              <Button onClick={savePreset} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Save Preset
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {presets.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2 md:py-4">
          No saved searches yet. Save your current filters to quickly apply them later.
        </p>
      ) : (
        <div className="space-y-1.5 md:space-y-2">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="flex items-center justify-between p-1.5 md:p-2 rounded-lg border hover:bg-accent/50 transition-colors"
            >
              <button
                onClick={() => onLoadPreset(preset.filters)}
                className="flex-1 text-left text-xs md:text-sm font-medium hover:text-primary transition-colors"
              >
                {preset.name}
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 md:h-8 md:w-8"
                onClick={() => deletePreset(preset.id)}
              >
                <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
