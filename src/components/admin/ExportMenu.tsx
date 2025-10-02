import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { ExportColumn, generateCSV, exportWithSummary } from "@/lib/export-utils";

interface ExportMenuProps<T> {
  data: T[];
  columns: ExportColumn<T>[];
  summaryColumns?: (keyof T)[];
  filename?: string;
  disabled?: boolean;
}

export function ExportMenu<T>({
  data,
  columns,
  summaryColumns,
  filename,
  disabled = false,
}: ExportMenuProps<T>) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleExportCSV = async () => {
    setLoading(true);
    try {
      generateCSV(data, columns, filename);
      toast({
        title: "Export Complete",
        description: "Data exported to CSV successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportWithSummary = async () => {
    if (!summaryColumns || summaryColumns.length === 0) {
      toast({
        title: "No Summary Available",
        description: "No numeric columns specified for summary",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      exportWithSummary(data, columns, summaryColumns, filename);
      toast({
        title: "Export Complete",
        description: "Data with summary statistics exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = disabled || loading || data.length === 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isDisabled}>
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleExportCSV} disabled={loading}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        
        {summaryColumns && summaryColumns.length > 0 && (
          <DropdownMenuItem onClick={handleExportWithSummary} disabled={loading}>
            <FileText className="w-4 h-4 mr-2" />
            Export with Summary
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          {data.length} records
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
