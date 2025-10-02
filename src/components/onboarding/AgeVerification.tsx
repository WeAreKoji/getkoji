import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";

interface AgeVerificationProps {
  onNext: (isOver18: boolean) => void;
}

const AgeVerification = ({ onNext }: AgeVerificationProps) => {
  const [isChecked, setIsChecked] = useState(false);

  const handleContinue = () => {
    if (isChecked) {
      onNext(true);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Shield className="w-10 h-10 text-primary" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Age Verification</h2>
        <p className="text-muted-foreground">
          Koji is for adults only. Please confirm your age to continue.
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="age-verification"
            checked={isChecked}
            onCheckedChange={(checked) => setIsChecked(checked === true)}
          />
          <div className="space-y-1">
            <Label
              htmlFor="age-verification"
              className="text-base font-medium cursor-pointer"
            >
              I am 18 years or older
            </Label>
            <p className="text-sm text-muted-foreground">
              By checking this box, you confirm that you are at least 18 years
              old and agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>

      <Button
        onClick={handleContinue}
        disabled={!isChecked}
        size="lg"
        className="w-full"
      >
        Continue
      </Button>
    </div>
  );
};

export default AgeVerification;
