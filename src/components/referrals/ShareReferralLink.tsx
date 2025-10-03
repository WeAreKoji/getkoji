import { Button } from "@/components/ui/button";
import { Share2, Mail, MessageCircle } from "lucide-react";
import { shareContent, canShare } from "@/lib/share";
import { useToast } from "@/hooks/use-toast";

interface ShareReferralLinkProps {
  url: string;
  title: string;
  text?: string;
}

export const ShareReferralLink = ({ url, title, text }: ShareReferralLinkProps) => {
  const { toast } = useToast();
  const showNativeShare = canShare();

  const handleShare = async () => {
    try {
      await shareContent({
        title,
        text: text || `Check out ${title}`,
        url,
        dialogTitle: "Share Referral Link",
      });
    } catch (error) {
      toast({
        title: "Copied to clipboard",
        description: "Referral link copied to clipboard",
      });
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${text || title}\n\n${url}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const handleSMSShare = () => {
    const body = encodeURIComponent(`${text || title} ${url}`);
    window.open(`sms:?body=${body}`, "_blank");
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {showNativeShare && (
        <Button onClick={handleShare} variant="outline" size="sm" className="gap-2">
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      )}
      <Button onClick={handleEmailShare} variant="outline" size="sm" className="gap-2">
        <Mail className="w-4 h-4" />
        Email
      </Button>
      <Button onClick={handleSMSShare} variant="outline" size="sm" className="gap-2">
        <MessageCircle className="w-4 h-4" />
        SMS
      </Button>
    </div>
  );
};
