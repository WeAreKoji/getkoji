import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, SlidersHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DiscoveryPreferences {
  min_age: number;
  max_age: number;
  max_distance_km: number;
  interested_in: string[];
  show_verified_only: boolean;
  show_creators_only: boolean;
  show_non_creators: boolean;
}

const DiscoverySettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<DiscoveryPreferences>({
    min_age: 18,
    max_age: 99,
    max_distance_km: 50,
    interested_in: ['dating', 'friendship', 'networking'],
    show_verified_only: false,
    show_creators_only: false,
    show_non_creators: true,
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }
    setUserId(user.id);
    loadPreferences(user.id);
  };

  const loadPreferences = async (uid: string) => {
    console.log('Loading discovery preferences for user:', uid);
    const { data, error } = await supabase
      .from('discovery_preferences')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();

    if (error) {
      console.error('Error loading preferences:', error);
    } else if (data) {
      console.log('Loaded preferences:', data);
      setPreferences({
        min_age: data.min_age,
        max_age: data.max_age,
        max_distance_km: data.max_distance_km,
        interested_in: data.interested_in,
        show_verified_only: data.show_verified_only,
        show_creators_only: data.show_creators_only,
        show_non_creators: data.show_non_creators,
      });
    }
    setLoading(false);
  };

  const savePreferences = async () => {
    if (!userId) return;

    setSaving(true);
    console.log('Saving preferences:', preferences);

    const { error } = await supabase
      .from('discovery_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
      });

    if (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Discovery preferences saved",
      });
      console.log('Preferences saved successfully');
    }
    setSaving(false);
  };

  const toggleIntent = (intent: string) => {
    setPreferences(prev => {
      const newIntents = prev.interested_in.includes(intent)
        ? prev.interested_in.filter(i => i !== intent)
        : [...prev.interested_in, intent];
      return { ...prev, interested_in: newIntents };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/discover')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">Discovery Settings</h1>
          </div>
          <Button
            onClick={savePreferences}
            disabled={saving}
            className="min-w-[80px]"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">
        {/* Age Range */}
        <Card>
          <CardHeader>
            <CardTitle>Age Range</CardTitle>
            <CardDescription>
              {preferences.min_age} - {preferences.max_age} years old
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Minimum Age: {preferences.min_age}</Label>
              <Slider
                value={[preferences.min_age]}
                onValueChange={([value]) => setPreferences(prev => ({ ...prev, min_age: value }))}
                min={18}
                max={preferences.max_age - 1}
                step={1}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Maximum Age: {preferences.max_age}</Label>
              <Slider
                value={[preferences.max_age]}
                onValueChange={([value]) => setPreferences(prev => ({ ...prev, max_age: value }))}
                min={preferences.min_age + 1}
                max={99}
                step={1}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Distance */}
        <Card>
          <CardHeader>
            <CardTitle>Distance</CardTitle>
            <CardDescription>
              Show profiles within {preferences.max_distance_km} km
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Slider
              value={[preferences.max_distance_km]}
              onValueChange={([value]) => setPreferences(prev => ({ ...prev, max_distance_km: value }))}
              min={1}
              max={500}
              step={1}
              className="mt-2"
            />
          </CardContent>
        </Card>

        {/* Interested In */}
        <Card>
          <CardHeader>
            <CardTitle>Looking For</CardTitle>
            <CardDescription>
              Show profiles interested in
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dating"
                checked={preferences.interested_in.includes('dating')}
                onCheckedChange={() => toggleIntent('dating')}
              />
              <Label htmlFor="dating" className="cursor-pointer">Dating</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="friendship"
                checked={preferences.interested_in.includes('friendship')}
                onCheckedChange={() => toggleIntent('friendship')}
              />
              <Label htmlFor="friendship" className="cursor-pointer">Friendship</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="networking"
                checked={preferences.interested_in.includes('networking')}
                onCheckedChange={() => toggleIntent('networking')}
              />
              <Label htmlFor="networking" className="cursor-pointer">Networking</Label>
            </div>
          </CardContent>
        </Card>

        {/* Creator Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Creator Preferences</CardTitle>
            <CardDescription>
              Filter by creator status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="creators-only">Show Creators Only</Label>
              <Switch
                id="creators-only"
                checked={preferences.show_creators_only}
                onCheckedChange={(checked) => setPreferences(prev => ({
                  ...prev,
                  show_creators_only: checked,
                  show_non_creators: checked ? false : prev.show_non_creators
                }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="non-creators">Show Non-Creators</Label>
              <Switch
                id="non-creators"
                checked={preferences.show_non_creators}
                onCheckedChange={(checked) => setPreferences(prev => ({
                  ...prev,
                  show_non_creators: checked,
                  show_creators_only: checked ? false : prev.show_creators_only
                }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="verified-only">Verified Creators Only</Label>
              <Switch
                id="verified-only"
                checked={preferences.show_verified_only}
                onCheckedChange={(checked) => setPreferences(prev => ({
                  ...prev,
                  show_verified_only: checked
                }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="bg-muted">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              These settings will be applied the next time you load new profiles in the Discover section.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DiscoverySettings;
