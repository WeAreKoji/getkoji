import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ExportOptions {
  profile: boolean;
  photos: boolean;
  interests: boolean;
  matches: boolean;
  messages: boolean;
  subscriptions: boolean;
  transactions: boolean;
}

export const DataExport = ({ userId }: { userId: string }) => {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [options, setOptions] = useState<ExportOptions>({
    profile: true,
    photos: true,
    interests: true,
    matches: true,
    messages: false,
    subscriptions: true,
    transactions: true,
  });

  const toggleOption = (key: keyof ExportOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const exportData = async () => {
    setExporting(true);
    setProgress(0);

    try {
      const exportData: any = {
        exportedAt: new Date().toISOString(),
        userId,
        data: {},
      };

      let currentProgress = 0;
      const totalSteps = Object.values(options).filter(Boolean).length;
      const stepIncrement = 100 / totalSteps;

      // Profile data
      if (options.profile) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();
        exportData.data.profile = profile;
        currentProgress += stepIncrement;
        setProgress(currentProgress);
      }

      // Photos
      if (options.photos) {
        const { data: photos } = await supabase
          .from("profile_photos")
          .select("*")
          .eq("user_id", userId);
        exportData.data.photos = photos;
        currentProgress += stepIncrement;
        setProgress(currentProgress);
      }

      // Interests
      if (options.interests) {
        const { data: interests } = await supabase
          .from("user_interests")
          .select("*, interests(*)")
          .eq("user_id", userId);
        exportData.data.interests = interests;
        currentProgress += stepIncrement;
        setProgress(currentProgress);
      }

      // Matches
      if (options.matches) {
        const { data: matches } = await supabase
          .from("matches")
          .select("*")
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
        exportData.data.matches = matches;
        currentProgress += stepIncrement;
        setProgress(currentProgress);
      }

      // Messages
      if (options.messages) {
        const { data: messages } = await supabase
          .from("messages")
          .select("*")
          .eq("sender_id", userId);
        exportData.data.messages = messages;
        currentProgress += stepIncrement;
        setProgress(currentProgress);
      }

      // Subscriptions
      if (options.subscriptions) {
        const { data: subscriptions } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("subscriber_id", userId);
        exportData.data.subscriptions = subscriptions;
        currentProgress += stepIncrement;
        setProgress(currentProgress);
      }

      // Transactions
      if (options.transactions) {
        const { data: transactions } = await supabase
          .from("payment_transactions")
          .select("*")
          .eq("user_id", userId);
        exportData.data.transactions = transactions;
        currentProgress += stepIncrement;
        setProgress(currentProgress);
      }

      // Download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `koji-data-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setProgress(100);
      toast.success("Data exported successfully");
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    } finally {
      setTimeout(() => {
        setExporting(false);
        setProgress(0);
      }, 1000);
    }
  };

  const hasSelectedOptions = Object.values(options).some(Boolean);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export Your Data
        </CardTitle>
        <CardDescription>
          Download a copy of your data in JSON format
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This export includes your personal data as stored in our database. It may take a few moments to compile.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Label className="text-base font-semibold">Select data to export:</Label>
          
          <div className="space-y-2 ml-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="export-profile"
                checked={options.profile}
                onCheckedChange={() => toggleOption("profile")}
              />
              <Label htmlFor="export-profile" className="cursor-pointer font-normal">
                Profile information (bio, settings, preferences)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="export-photos"
                checked={options.photos}
                onCheckedChange={() => toggleOption("photos")}
              />
              <Label htmlFor="export-photos" className="cursor-pointer font-normal">
                Photos and media URLs
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="export-interests"
                checked={options.interests}
                onCheckedChange={() => toggleOption("interests")}
              />
              <Label htmlFor="export-interests" className="cursor-pointer font-normal">
                Selected interests
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="export-matches"
                checked={options.matches}
                onCheckedChange={() => toggleOption("matches")}
              />
              <Label htmlFor="export-matches" className="cursor-pointer font-normal">
                Match history
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="export-messages"
                checked={options.messages}
                onCheckedChange={() => toggleOption("messages")}
              />
              <Label htmlFor="export-messages" className="cursor-pointer font-normal">
                Sent messages
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="export-subscriptions"
                checked={options.subscriptions}
                onCheckedChange={() => toggleOption("subscriptions")}
              />
              <Label htmlFor="export-subscriptions" className="cursor-pointer font-normal">
                Subscription history
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="export-transactions"
                checked={options.transactions}
                onCheckedChange={() => toggleOption("transactions")}
              />
              <Label htmlFor="export-transactions" className="cursor-pointer font-normal">
                Payment transactions
              </Label>
            </div>
          </div>
        </div>

        {exporting && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">
              Exporting data... {Math.round(progress)}%
            </p>
          </div>
        )}

        <Button
          onClick={exportData}
          disabled={exporting || !hasSelectedOptions}
          className="w-full"
        >
          {exporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
