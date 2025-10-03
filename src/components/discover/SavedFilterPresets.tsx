import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { BookmarkPlus, Bookmark, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

interface FilterPreset {
  id: string;
  name: string;
  filters: any;
  createdAt: Date;
}

interface SavedFilterPresetsProps {
  currentFilters: any;
  onLoadPreset: (filters: any) => void;
}

export const SavedFilterPresets = ({
  currentFilters,
  onLoadPreset,
}: SavedFilterPresetsProps) => {
  const [presets, setPresets] = useState<FilterPreset[]>(() => {
    const saved = localStorage.getItem("discovery_presets");
    return saved ? JSON.parse(saved) : [];
  });
  const [open, setOpen] = useState(false);
  const [presetName, setPresetName] = useState("");

  const savePreset = () => {
    if (!presetName.trim()) {
      toast.error("Please enter a name for this preset");
      return;
    }

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      filters: currentFilters,
      createdAt: new Date(),
    };

    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem("discovery_presets", JSON.stringify(updated));

    toast.success("Filter preset saved");
    setPresetName("");
    setOpen(false);
  };

  const deletePreset = (id: string) => {
    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    localStorage.setItem("discovery_presets", JSON.stringify(updated));
    toast.success("Preset deleted");
  };

  const loadPreset = (preset: FilterPreset) => {
    onLoadPreset(preset.filters);
    toast.success(`Loaded preset: ${preset.name}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Saved Presets</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <BookmarkPlus className="w-4 h-4 mr-2" />
              Save Current
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Filter Preset</DialogTitle>
              <DialogDescription>
                Save your current discovery filters as a preset for quick access
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="preset-name">Preset Name</Label>
                <Input
                  id="preset-name"
                  placeholder="e.g., Verified Creators Nearby"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  maxLength={50}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={savePreset}>
                <Check className="w-4 h-4 mr-2" />
                Save Preset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {presets.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="py-6 text-center">
            <Bookmark className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No saved presets yet. Save your current filters to quickly apply them later.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {presets.map((preset) => (
            <Card key={preset.id} className="hover:bg-accent/50 transition-colors">
              <CardContent className="py-3 flex items-center justify-between">
                <Button
                  variant="ghost"
                  className="flex-1 justify-start h-auto py-2 px-3"
                  onClick={() => loadPreset(preset)}
                >
                  <Bookmark className="w-4 h-4 mr-2 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-medium">{preset.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Saved {new Date(preset.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deletePreset(preset.id)}
                  className="flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
