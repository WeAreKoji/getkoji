import { ReactNode } from "react";
import { BottomSheet } from "./BottomSheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/native";

export interface ActionSheetAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive";
  disabled?: boolean;
}

interface ActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  actions: ActionSheetAction[];
  cancelLabel?: string;
}

export const ActionSheet = ({
  open,
  onOpenChange,
  title,
  description,
  actions,
  cancelLabel = "Cancel",
}: ActionSheetProps) => {
  const handleActionClick = (action: ActionSheetAction) => {
    if (action.disabled) return;
    
    haptics.selection();
    action.onClick();
    onOpenChange(false);
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
    >
      <div className="flex flex-col gap-2 py-2">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant === "destructive" ? "destructive" : "outline"}
            className={cn(
              "w-full justify-start h-14 text-base",
              action.variant === "destructive" && "text-destructive"
            )}
            onClick={() => handleActionClick(action)}
            disabled={action.disabled}
          >
            {action.icon && <span className="mr-3">{action.icon}</span>}
            {action.label}
          </Button>
        ))}
        
        <Button
          variant="secondary"
          className="w-full h-14 text-base mt-2"
          onClick={() => {
            haptics.selection();
            onOpenChange(false);
          }}
        >
          {cancelLabel}
        </Button>
      </div>
    </BottomSheet>
  );
};
