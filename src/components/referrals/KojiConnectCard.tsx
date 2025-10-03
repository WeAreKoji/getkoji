import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface KojiConnectCardProps {
  activeReferrals: number;
  totalCommission: number;
  pendingCommission: number;
}

export const KojiConnectCard = ({ 
  activeReferrals, 
  totalCommission, 
  pendingCommission 
}: KojiConnectCardProps) => {
  return (
    <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold mb-1">Koji Connect</h3>
          <p className="text-sm text-muted-foreground">
            Earn 7.5% on creator referrals for 9 months
          </p>
        </div>
        <DollarSign className="w-8 h-8 text-primary" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3 text-green-500" />
            <span className="text-xs text-muted-foreground">Active</span>
          </div>
          <p className="text-lg font-bold">{activeReferrals}</p>
        </div>

        <div>
          <div className="flex items-center gap-1 mb-1">
            <DollarSign className="w-3 h-3 text-blue-500" />
            <span className="text-xs text-muted-foreground">Earned</span>
          </div>
          <p className="text-lg font-bold">${totalCommission.toFixed(2)}</p>
        </div>

        <div>
          <div className="flex items-center gap-1 mb-1">
            <Clock className="w-3 h-3 text-orange-500" />
            <span className="text-xs text-muted-foreground">Pending</span>
          </div>
          <p className="text-lg font-bold">${pendingCommission.toFixed(2)}</p>
        </div>
      </div>

      <Link to="/referrals">
        <Button variant="outline" className="w-full">
          View Creator Referrals
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Link>
    </Card>
  );
};
