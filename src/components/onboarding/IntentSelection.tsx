import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Heart, Users, Star } from "lucide-react";

type UserIntent = "make_friends" | "open_to_dating" | "support_creators";

interface IntentSelectionProps {
  onNext: (intent: UserIntent) => void;
}

const IntentSelection = ({ onNext }: IntentSelectionProps) => {
  const [selectedIntent, setSelectedIntent] = useState<UserIntent | null>(null);

  const intents = [
    {
      value: "open_to_dating" as UserIntent,
      icon: Heart,
      title: "Dating",
      description: "Find meaningful connections and relationships",
    },
    {
      value: "make_friends" as UserIntent,
      icon: Users,
      title: "Networking",
      description: "Build professional relationships and expand your network",
    },
    {
      value: "support_creators" as UserIntent,
      icon: Star,
      title: "Content",
      description: "Follow creators and access exclusive content",
    },
  ];

  const handleContinue = () => {
    if (selectedIntent) {
      onNext(selectedIntent);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">What brings you to Koji?</h2>
        <p className="text-muted-foreground">
          Choose your primary intent. You can change this later.
        </p>
      </div>

      <RadioGroup
        value={selectedIntent || ""}
        onValueChange={(value) => setSelectedIntent(value as UserIntent)}
      >
        <div className="space-y-4">
          {intents.map((intent) => {
            const Icon = intent.icon;
            const isSelected = selectedIntent === intent.value;

            return (
              <div
                key={intent.value}
                className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setSelectedIntent(intent.value)}
              >
                <div className="flex items-start space-x-4">
                  <RadioGroupItem
                    value={intent.value}
                    id={intent.value}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={intent.value}
                      className="flex items-center space-x-3 cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="text-lg font-semibold">
                          {intent.title}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {intent.description}
                        </div>
                      </div>
                    </Label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </RadioGroup>

      <Button
        onClick={handleContinue}
        disabled={!selectedIntent}
        size="lg"
        className="w-full"
      >
        Continue
      </Button>
    </div>
  );
};

export default IntentSelection;
