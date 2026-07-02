import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Props {
  status: string;
  nextPaymentDueDate: Date | string | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function PaymentStatusBanner({ status, nextPaymentDueDate }: Props) {
  if (status !== "active") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
        <ShieldAlert className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm">
          <strong>Access Suspended:</strong> Your account has been deactivated.
          Please contact the super administrator to restore access.
        </p>
      </div>
    );
  }

  if (!nextPaymentDueDate) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
        <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm">
          <strong>Account Active</strong> — no payment due date on record.
        </p>
      </div>
    );
  }

  const daysRemaining = Math.ceil(
    (new Date(nextPaymentDueDate).getTime() - Date.now()) / DAY_MS
  );

  if (daysRemaining < 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm">
          <strong>Payment Overdue:</strong> Your payment was due on{" "}
          {formatDate(nextPaymentDueDate)} ({Math.abs(daysRemaining)} day
          {Math.abs(daysRemaining) === 1 ? "" : "s"} ago). Please make payment
          immediately to avoid your account being deactivated.
        </p>
      </div>
    );
  }

  if (daysRemaining <= 7) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm">
          <strong>Payment Due Soon:</strong> {daysRemaining === 0
            ? "Your payment is due today"
            : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left until your payment is due`}{" "}
          ({formatDate(nextPaymentDueDate)}). Please renew to avoid service
          interruption.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
      <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
      <p className="text-sm">
        <strong>Account Active</strong> — next payment due{" "}
        {formatDate(nextPaymentDueDate)}.
      </p>
    </div>
  );
}
