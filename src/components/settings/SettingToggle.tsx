import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface SettingToggleProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
}

export const SettingToggle = ({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  loading = false,
}: SettingToggleProps) => {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="space-y-1 flex-1">
        <Label htmlFor={id} className="text-base cursor-pointer">
          {label}
        </Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled || loading}
        />
      </div>
    </div>
  );
};
