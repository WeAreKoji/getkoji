import { format } from "date-fns";

/**
 * Export utilities for generating CSV and PDF files
 */

export interface ExportColumn<T> {
  header: string;
  accessor: keyof T | ((item: T) => string | number);
  format?: (value: any) => string;
}

/**
 * Convert data to CSV format
 */
export function generateCSV<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename?: string
): void {
  if (data.length === 0) {
    throw new Error("No data to export");
  }

  // Create header row
  const headers = columns.map((col) => col.header);
  const csvRows = [headers];

  // Create data rows
  data.forEach((item) => {
    const row = columns.map((col) => {
      let value: any;
      
      if (typeof col.accessor === "function") {
        value = col.accessor(item);
      } else {
        value = item[col.accessor];
      }

      // Apply custom formatting if provided
      if (col.format) {
        value = col.format(value);
      }

      // Handle different value types
      if (value === null || value === undefined) {
        return "";
      }
      
      if (value instanceof Date) {
        return format(value, "yyyy-MM-dd HH:mm:ss");
      }

      // Escape commas and quotes in strings
      const stringValue = String(value);
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }

      return stringValue;
    });
    
    csvRows.push(row);
  });

  // Convert to CSV string
  const csvContent = csvRows.map((row) => row.join(",")).join("\n");

  // Download file
  downloadFile(
    csvContent,
    filename || `export-${format(new Date(), "yyyy-MM-dd-HHmmss")}.csv`,
    "text/csv"
  );
}

/**
 * Generate summary statistics for numeric columns
 */
export function generateSummaryStats<T>(
  data: T[],
  numericColumns: (keyof T)[]
): Record<string, { sum: number; avg: number; min: number; max: number }> {
  const stats: Record<string, any> = {};

  numericColumns.forEach((col) => {
    const values = data
      .map((item) => Number(item[col]))
      .filter((val) => !isNaN(val));

    if (values.length === 0) return;

    stats[String(col)] = {
      sum: values.reduce((sum, val) => sum + val, 0),
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  });

  return stats;
}

/**
 * Export data with summary statistics
 */
export function exportWithSummary<T>(
  data: T[],
  columns: ExportColumn<T>[],
  summaryColumns: (keyof T)[],
  filename?: string
): void {
  // Generate main data CSV
  const headers = columns.map((col) => col.header);
  const csvRows = [headers];

  data.forEach((item) => {
    const row = columns.map((col) => {
      let value: any;
      
      if (typeof col.accessor === "function") {
        value = col.accessor(item);
      } else {
        value = item[col.accessor];
      }

      if (col.format) {
        value = col.format(value);
      }

      return value === null || value === undefined ? "" : String(value);
    });
    
    csvRows.push(row);
  });

  // Add summary statistics
  const stats = generateSummaryStats(data, summaryColumns);
  
  csvRows.push([]);
  csvRows.push(["Summary Statistics"]);
  csvRows.push([]);

  Object.entries(stats).forEach(([column, stat]) => {
    csvRows.push([column, "Sum", stat.sum.toFixed(2)]);
    csvRows.push([column, "Average", stat.avg.toFixed(2)]);
    csvRows.push([column, "Minimum", stat.min.toFixed(2)]);
    csvRows.push([column, "Maximum", stat.max.toFixed(2)]);
    csvRows.push([]);
  });

  const csvContent = csvRows.map((row) => row.join(",")).join("\n");
  
  downloadFile(
    csvContent,
    filename || `export-summary-${format(new Date(), "yyyy-MM-dd-HHmmss")}.csv`,
    "text/csv"
  );
}

/**
 * Helper function to trigger file download
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format currency values
 */
export function formatCurrency(value: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value);
}

/**
 * Format percentage values
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format date values
 */
export function formatDate(date: Date | string, formatStr: string = "MMM dd, yyyy"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, formatStr);
}
