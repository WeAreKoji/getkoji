import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import AgeVerification from "@/components/onboarding/AgeVerification";
import IntentSelection from "@/components/onboarding/IntentSelection";
import InterestSelection from "@/components/onboarding/InterestSelection";
import ProfileSetup from "@/components/onboarding/ProfileSetup";
import { useToast } from "@/hooks/use-toast";

type OnboardingStep = "age" | "intent" | "interests" | "profile";
type UserIntent = "make_friends" | "open_to_dating" | "support_creators";

interface OnboardingData {
  isOver18: boolean;
  intent: UserIntent | null;
  selectedInterests: string[];
  displayName: string;
  age: number;
  city: string;
  bio: string;
  avatarUrl: string;
}

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("age");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    isOver18: false,
    intent: null,
    selectedInterests: [],
    displayName: "",
    age: 18,
    city: "",
    bio: "",
    avatarUrl: "",
  });

  useEffect(() => {
    checkExistingProfile();
  }, []);

  const checkExistingProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      navigate("/discover");
    }
  };

  const stepOrder: OnboardingStep[] = ["age", "intent", "interests", "profile"];
  const currentStepIndex = stepOrder.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / stepOrder.length) * 100;

  const handleNext = (stepData: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...stepData }));
    
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < stepOrder.length) {
      setCurrentStep(stepOrder[nextIndex]);
    }
  };

  const handleComplete = async (finalData: Partial<OnboardingData>) => {
    setLoading(true);
    const completeData = { ...data, ...finalData };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert profile
      const { error: profileError } = await supabase
        .from("profiles")
        .insert([{
          id: user.id,
          email: user.email!,
          display_name: completeData.displayName,
          age: completeData.age,
          city: completeData.city,
          bio: completeData.bio,
          avatar_url: completeData.avatarUrl,
          intent: completeData.intent!,
        }]);

      if (profileError) throw profileError;

      // Insert user interests
      const interestInserts = completeData.selectedInterests.map((interestId) => ({
        user_id: user.id,
        interest_id: interestId,
      }));

      const { error: interestsError } = await supabase
        .from("user_interests")
        .insert(interestInserts);

      if (interestsError) throw interestsError;

      toast({
        title: "Welcome to Koji! 🎉",
        description: "Your profile is ready. Start discovering!",
      });

      navigate("/discover");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="w-full bg-card border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-4">Complete Your Profile</h1>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Step {currentStepIndex + 1} of {stepOrder.length}
          </p>
        </div>
      </div>

      <div className="flex-1 container max-w-2xl mx-auto px-4 py-8">
        {currentStep === "age" && (
          <AgeVerification
            onNext={(isOver18) => handleNext({ isOver18 })}
          />
        )}

        {currentStep === "intent" && (
          <IntentSelection
            onNext={(intent) => handleNext({ intent })}
          />
        )}

        {currentStep === "interests" && (
          <InterestSelection
            selectedInterests={data.selectedInterests}
            onNext={(selectedInterests) => handleNext({ selectedInterests })}
          />
        )}

        {currentStep === "profile" && (
          <ProfileSetup
            data={{
              displayName: data.displayName,
              age: data.age,
              city: data.city,
              bio: data.bio,
              avatarUrl: data.avatarUrl,
            }}
            onComplete={handleComplete}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

export default Onboarding;
