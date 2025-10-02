import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

interface BatchActionsProps<T> {
  items: T[];
  selectedItems: Set<string>;
  onSelectAll: (selected: boolean) => void;
  onSelectionChange: (id: string, selected: boolean) => void;
  onBatchApprove?: (ids: string[]) => Promise<void>;
  onBatchReject?: (ids: string[]) => Promise<void>;
  getItemId: (item: T) => string;
}

export function BatchActions<T>({
  items,
  selectedItems,
  onSelectAll,
  onSelectionChange,
  onBatchApprove,
  onBatchReject,
  getItemId,
}: BatchActionsProps<T>) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const allSelected = items.length > 0 && selectedItems.size === items.length;
  const someSelected = selectedItems.size > 0 && !allSelected;
  const selectedCount = selectedItems.size;

  const handleBatchApprove = async () => {
    if (!onBatchApprove) return;
    
    setLoading(true);
    try {
      await onBatchApprove(Array.from(selectedItems));
      toast({
        title: "Success",
        description: `${selectedCount} items approved`,
      });
      selectedItems.clear();
      onSelectAll(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBatchReject = async () => {
    if (!onBatchReject) return;
    
    setLoading(true);
    try {
      await onBatchReject(Array.from(selectedItems));
      toast({
        title: "Success",
        description: `${selectedCount} items rejected`,
      });
      selectedItems.clear();
      onSelectAll(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border">
        <Checkbox
          checked={allSelected}
          onCheckedChange={onSelectAll}
          className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
          aria-label="Select all"
        />
        
        <span className="text-sm text-muted-foreground">
          {selectedCount > 0 ? (
            <strong>{selectedCount} selected</strong>
          ) : (
            "Select items for batch actions"
          )}
        </span>

        {selectedCount > 0 && (
          <div className="ml-auto flex gap-2">
            {onBatchApprove && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowApproveDialog(true)}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Approve ({selectedCount})
              </Button>
            )}
            
            {onBatchReject && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowRejectDialog(true)}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <X className="w-4 h-4 mr-2" />
                )}
                Reject ({selectedCount})
              </Button>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showApproveDialog}
        onOpenChange={setShowApproveDialog}
        title="Approve Selected Items"
        description={`Are you sure you want to approve ${selectedCount} items? This action cannot be undone.`}
        confirmLabel="Approve All"
        onConfirm={handleBatchApprove}
        loading={loading}
      />

      <ConfirmDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        title="Reject Selected Items"
        description={`Are you sure you want to reject ${selectedCount} items? This action cannot be undone.`}
        confirmLabel="Reject All"
        onConfirm={handleBatchReject}
        variant="destructive"
        loading={loading}
      />
    </>
  );
}
