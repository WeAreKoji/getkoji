import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const ONBOARDING_MODAL_KEY = "koji_onboarding_modal_shown";

export const useOnboardingModal = (userId: string | null) => {
  const [shouldShow, setShouldShow] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    if (!userId) return;

    checkShouldShowModal();
  }, [userId]);

  const checkShouldShowModal = async () => {
    if (!userId) return;

    // Check localStorage first
    const hasShown = localStorage.getItem(`${ONBOARDING_MODAL_KEY}_${userId}`);
    if (hasShown) {
      setShouldShow(false);
      return;
    }

    // Check if user has completed onboarding (has interests, photos, bio)
    const { data: profile } = await supabase
      .from("profiles")
      .select("bio, id")
      .eq("id", userId)
      .single();

    if (!profile) {
      setShouldShow(false);
      return;
    }

    // Check if user has photos
    const { data: photos } = await supabase
      .from("profile_photos")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    // Check if user has interests
    const { data: interests } = await supabase
      .from("user_interests")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    // Show modal if user has completed basic profile setup
    const hasCompletedSetup = 
      profile.bio && 
      photos && photos.length > 0 && 
      interests && interests.length > 0;

    if (hasCompletedSetup) {
      // Get or create referral code
      await fetchOrCreateReferralCode();
      setShouldShow(true);
    }
  };

  const fetchOrCreateReferralCode = async () => {
    if (!userId) return;

    try {
      // Get existing code
      let { data: codeData } = await supabase
        .from("referral_codes")
        .select("code")
        .eq("user_id", userId)
        .eq("referral_type", "creator")
        .maybeSingle();

      if (!codeData) {
        // Create new code
        const { data: profileData } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", userId)
          .single();

        const { data: newCode } = await supabase.rpc("generate_referral_code", {
          user_username: profileData?.username || null,
        });

        if (newCode) {
          await supabase.from("referral_codes").insert({
            user_id: userId,
            code: `CREATOR-${newCode}`,
            referral_type: "creator",
          });

          setReferralCode(`CREATOR-${newCode}`);
        }
      } else {
        setReferralCode(codeData.code);
      }
    } catch (error) {
      console.error("Error fetching referral code:", error);
    }
  };

  const markAsShown = () => {
    if (userId) {
      localStorage.setItem(`${ONBOARDING_MODAL_KEY}_${userId}`, "true");
    }
    setShouldShow(false);
  };

  const getReferralLink = () => {
    return `${window.location.origin}/creator/apply?ref=${referralCode}`;
  };

  return {
    shouldShow,
    markAsShown,
    referralCode,
    referralLink: getReferralLink(),
  };
};