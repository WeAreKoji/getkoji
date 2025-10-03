import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface TrendIndicatorProps {
  current: number;
  previous: number;
  suffix?: string;
  inverse?: boolean; // true if decrease is good (e.g., churn rate)
}

export const TrendIndicator = ({ current, previous, suffix = "", inverse = false }: TrendIndicatorProps) => {
  if (previous === 0) return null;
  
  const change = ((current - previous) / previous) * 100;
  const isPositive = change > 0;
  const isNeutral = change === 0;
  
  // Determine color based on whether decrease is good or bad
  const colorClass = isNeutral 
    ? "text-muted-foreground"
    : (isPositive && !inverse) || (!isPositive && inverse)
    ? "text-green-600 dark:text-green-400"
    : "text-red-600 dark:text-red-400";
  
  const Icon = isNeutral ? Minus : isPositive ? ArrowUp : ArrowDown;
  
  return (
    <div className={`flex items-center gap-1 text-xs font-medium ${colorClass}`}>
      <Icon className="w-3 h-3" />
      <span>{Math.abs(change).toFixed(1)}%{suffix}</span>
    </div>
  );
};
