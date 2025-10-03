import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, Download } from "lucide-react";
import { DateRangeSelector } from "@/components/creator/DateRangeSelector";
import { DateRange } from "react-day-picker";

interface DashboardHeaderProps {
  isMobile: boolean;
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onExport: () => void;
}

export const DashboardHeader = ({ 
  isMobile, 
  dateRange, 
  onDateRangeChange, 
  onExport 
}: DashboardHeaderProps) => {
  return (
    <>
      {/* Title Bar */}
      <div className={`sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10 ${isMobile ? 'px-3 py-2.5' : 'px-4 py-3'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/discover" aria-label="Back to discover">
              <ArrowLeft className={isMobile ? "w-5 h-5 text-foreground hover:text-primary transition-colors" : "w-6 h-6 text-foreground hover:text-primary transition-colors"} />
            </Link>
            <h1 className={isMobile ? "text-base font-bold" : "text-xl font-bold"}>Creator Dashboard</h1>
          </div>
          <BarChart3 className={isMobile ? "w-5 h-5 text-primary" : "w-6 h-6 text-primary"} />
        </div>
      </div>

      {/* Date Range and Export Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <DateRangeSelector 
          dateRange={dateRange}
          onDateRangeChange={onDateRangeChange}
        />
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="w-4 h-4 mr-2" />
          Export Analytics
        </Button>
      </div>
    </>
  );
};
