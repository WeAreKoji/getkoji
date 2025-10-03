import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { VerificationStatusBanner } from "@/components/creator/VerificationStatusBanner";

interface FailedTransfer {
  id: string;
  amount: number;
  currency: string;
  error_message: string;
  retry_count: number;
  created_at: string;
}

interface PayoutInfo {
  connected: boolean;
  isTestMode?: boolean;
  balance?: {
    available: number;
    pending: number;
    currency: string;
  };
  nextPayout?: {
    amount: number;
    arrivalDate: string;
    status: string;
  };
  payoutSchedule?: {
    interval: string;
    delayDays: number;
  };
  dashboardUrl?: string;
}

interface DashboardAlertsProps {
  userId: string;
  payoutInfo: PayoutInfo | null;
  failedTransfers: FailedTransfer[];
}

export const DashboardAlerts = ({ userId, payoutInfo, failedTransfers }: DashboardAlertsProps) => {
  return (
    <div className="space-y-4">
      <VerificationStatusBanner userId={userId} />

      {/* Test Mode Banner */}
      {payoutInfo?.isTestMode && (
        <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
          <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <AlertTitle className="text-orange-600 dark:text-orange-400">Test Mode Active</AlertTitle>
          <AlertDescription className="text-orange-600 dark:text-orange-400">
            You're using Stripe in test mode. Transactions won't process real payments.
          </AlertDescription>
        </Alert>
      )}

      {/* Failed Transfers Alert */}
      {failedTransfers.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Transfer Issues Detected</AlertTitle>
          <AlertDescription>
            {failedTransfers.length} transfer{failedTransfers.length > 1 ? 's' : ''} failed. 
            Total amount pending: ${failedTransfers.reduce((sum, t) => sum + Number(t.amount), 0).toFixed(2)}.
            {' '}Please ensure your Stripe Connect account is properly set up in Payout Settings below.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
