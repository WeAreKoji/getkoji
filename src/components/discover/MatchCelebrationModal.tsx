import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { haptics } from "@/lib/native";
import { useNavigate } from "react-router-dom";

interface MatchCelebrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchedProfile: {
    display_name: string;
    avatar_url: string | null;
  } | null;
  currentUserAvatar: string | null;
  matchId?: string;
}

export const MatchCelebrationModal = ({
  open,
  onOpenChange,
  matchedProfile,
  currentUserAvatar,
  matchId,
}: MatchCelebrationModalProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      // Success haptic feedback
      haptics.success();
      
      // Create confetti effect
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const colors = ['#a855f7', '#ec4899', '#f43f5e', '#8b5cf6'];

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const frame = () => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) return;

        const particleCount = 3;
        
        // Create confetti particles
        for (let i = 0; i < particleCount; i++) {
          const particle = document.createElement('div');
          particle.className = 'confetti-particle';
          particle.style.cssText = `
            position: fixed;
            width: ${randomInRange(8, 12)}px;
            height: ${randomInRange(8, 12)}px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            left: ${randomInRange(0, 100)}%;
            top: -20px;
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            animation: confetti-fall ${randomInRange(2, 4)}s linear forwards;
          `;
          
          document.body.appendChild(particle);
          
          setTimeout(() => {
            particle.remove();
          }, 4000);
        }

        requestAnimationFrame(frame);
      };

      frame();

      // Add animation keyframes if not already present
      if (!document.getElementById('confetti-styles')) {
        const style = document.createElement('style');
        style.id = 'confetti-styles';
        style.textContent = `
          @keyframes confetti-fall {
            to {
              transform: translateY(100vh) rotate(360deg);
              opacity: 0;
            }
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, [open]);

  if (!matchedProfile) return null;

  const handleSendMessage = () => {
    if (matchId) {
      navigate(`/chat?match=${matchId}`);
    } else {
      navigate('/matches');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md text-center p-8">
        {/* Celebration Header */}
        <div className="mb-6">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-accent animate-pulse" />
          <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
            It's a Match! 🎉
          </h2>
          <p className="text-muted-foreground">
            You and {matchedProfile.display_name} liked each other
          </p>
        </div>

        {/* Avatar Display */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="relative">
            {currentUserAvatar ? (
              <img
                src={currentUserAvatar}
                alt="You"
                className="w-24 h-24 rounded-full object-cover border-4 border-accent shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-4xl border-4 border-accent shadow-lg">
                👤
              </div>
            )}
          </div>

          <Heart className="w-10 h-10 text-accent animate-pulse" />

          <div className="relative">
            {matchedProfile.avatar_url ? (
              <img
                src={matchedProfile.avatar_url}
                alt={matchedProfile.display_name}
                className="w-24 h-24 rounded-full object-cover border-4 border-primary shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl border-4 border-primary shadow-lg">
                👤
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full"
            onClick={handleSendMessage}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Send Message
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Keep Swiping
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Heart = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
  </svg>
);
