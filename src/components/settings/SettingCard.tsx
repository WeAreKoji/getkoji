import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface SettingCardProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  to: string;
  badge?: string | number;
}

export const SettingCard = ({ icon, title, subtitle, to, badge }: SettingCardProps) => {
  return (
    <Link to={to}>
      <Card className="p-4 hover:bg-accent/5 transition-all hover:shadow-md cursor-pointer group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{title}</h3>
                {badge && (
                  <Badge variant="secondary" className="text-xs">
                    {badge}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
        </div>
      </Card>
    </Link>
  );
};
