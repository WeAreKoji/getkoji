import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, DollarSign, Users, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Goal {
  type: "subscribers" | "revenue";
  target: number;
  current: number;
  icon: typeof Users;
  label: string;
  suffix: string;
}

interface GoalsTrackingProps {
  currentSubscribers: number;
  currentRevenue: number;
}

export const GoalsTracking = ({ currentSubscribers, currentRevenue }: GoalsTrackingProps) => {
  const [goals, setGoals] = useState<Goal[]>([
    {
      type: "subscribers",
      target: 100,
      current: currentSubscribers,
      icon: Users,
      label: "Subscriber Goal",
      suffix: "subscribers",
    },
    {
      type: "revenue",
      target: 1000,
      current: currentRevenue,
      icon: DollarSign,
      label: "Revenue Goal",
      suffix: "USD",
    },
  ]);

  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [newTarget, setNewTarget] = useState("");

  const updateGoal = (type: "subscribers" | "revenue") => {
    if (!newTarget || isNaN(Number(newTarget))) return;
    
    setGoals(goals.map(goal => 
      goal.type === type 
        ? { ...goal, target: Number(newTarget) }
        : goal
    ));
    setEditingGoal(null);
    setNewTarget("");
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const calculateDaysToGoal = (current: number, target: number, dailyGrowth: number) => {
    if (dailyGrowth <= 0 || current >= target) return null;
    return Math.ceil((target - current) / dailyGrowth);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Target className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Goals & Progress</h3>
      </div>

      <div className="space-y-6">
        {goals.map((goal) => {
          const progress = calculateProgress(goal.current, goal.target);
          const Icon = goal.icon;
          const dailyGrowth = goal.type === "subscribers" ? 2 : 50; // Simplified estimate
          const daysToGoal = calculateDaysToGoal(goal.current, goal.target, dailyGrowth);

          return (
            <div key={goal.type} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{goal.label}</span>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingGoal(goal);
                        setNewTarget(goal.target.toString());
                      }}
                    >
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update {goal.label}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Target {goal.suffix}</Label>
                        <Input
                          type="number"
                          value={newTarget}
                          onChange={(e) => setNewTarget(e.target.value)}
                          placeholder={`Enter target ${goal.suffix}`}
                        />
                      </div>
                      <Button onClick={() => updateGoal(goal.type)} className="w-full">
                        Update Goal
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {goal.current} / {goal.target} {goal.suffix}
                  </span>
                  <span className="font-medium">{progress.toFixed(0)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {daysToGoal && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3" />
                  <span>Estimated {daysToGoal} days to reach goal</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
