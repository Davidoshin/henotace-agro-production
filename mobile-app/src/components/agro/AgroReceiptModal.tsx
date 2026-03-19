import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiGet } from "@/lib/api";
import { Check, Download, Loader2, Printer, Receipt, X } from "lucide-react";

/* ─── helpers ─── */
const fmt = (v: number) =>
  `₦${(v || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface ReceiptData {
  receipt_no: string;
  business_name: string;
  business_phone: string;
  business_email: string;
  business_address: string;
  sale_id: number;
  buyer_name: string;
  buyer_phone: string;
  produce_name: string;
  farm_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_amount: number;
  amount_paid: number;
  balance: number;
  payment_method: string;
  payment_status: string;
  sale_date: string | null;
  created_at: string | null;
  notes: string;
}

interface AgroReceiptModalProps {
  /** The sale ID to fetch receipt for */
  saleId: number | null;
  /** Whether the modal is open */
  open: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Optional: show the "Transaction Complete" success header */
  showSuccess?: boolean;
}

export default function AgroReceiptModal({ saleId, open, onClose, showSuccess = false }: AgroReceiptModalProps) {
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const receiptRef = useRef<HTMLDivElement>(null);

  // Fetch receipt when dialog opens with a valid saleId
  useEffect(() => {
    if (!open || !saleId) return;
    let cancelled = false;
    setReceipt(null);
    setError("");
    setLoading(true);
    apiGet(`agro/sales/${saleId}/receipt/`)
      .then((res) => {
        if (cancelled) return;
        const payload = res?.receipt || (res?.receipt_no ? res : null);
        if (!payload) {
          setError("Receipt data is missing in API response.");
          setReceipt(null);
          return;
        }
        setReceipt(payload);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message || "Could not load receipt.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, saleId]);

  // Reset state when dialog closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
      setReceipt(null);
      setError("");
    }
  };

  const handlePrint = () => {
    if (!receiptRef.current) return;
    const content = receiptRef.current.innerHTML;
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) return;
    win.document.write(`
      <html><head><title>Receipt #${receipt?.receipt_no || ""}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; max-width: 380px; margin: 0 auto; color: #1a1a1a; }
        .receipt-header { text-align: center; margin-bottom: 16px; }
        .receipt-header h2 { margin: 0 0 4px; font-size: 18px; }
        .receipt-header p { margin: 2px 0; font-size: 12px; color: #666; }
        .divider { border-top: 1px dashed #ccc; margin: 12px 0; }
        .line { display: flex; justify-content: space-between; font-size: 13px; margin: 4px 0; }
        .line .label { color: #666; }
        .line .value { font-weight: 600; }
        .total-line { font-size: 16px; font-weight: 700; border-top: 2px solid #333; padding-top: 8px; margin-top: 8px; }
        .success { text-align: center; color: #16a34a; font-weight: 600; font-size: 14px; margin-bottom: 12px; }
        .receipt-no { text-align: center; font-size: 11px; color: #999; margin-top: 16px; }
        @media print { body { padding: 10px; } }
      </style></head><body>${content}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  const handleDownload = () => {
    if (!receiptRef.current || !receipt) return;
    const content = receiptRef.current.innerText;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Receipt-${receipt.receipt_no}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const paymentMethodLabel: Record<string, string> = {
    cash: "Cash", bank_transfer: "Bank Transfer", mobile: "Mobile Money", credit: "Credit", pos: "POS",
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {showSuccess ? "Transaction Complete" : "Sale Receipt"}
          </DialogTitle>
          {showSuccess && (
            <p className="text-sm text-muted-foreground">Sale completed successfully</p>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : error || !receipt ? (
          <div className="text-center py-8">
            <X className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{error || "Could not load receipt."}</p>
            <Button variant="ghost" size="sm" className="mt-3" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <>
            {showSuccess && (
              <div className="flex flex-col items-center py-3">
                <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                  <Check className="h-7 w-7 text-emerald-600" />
                </div>
                <p className="text-lg font-bold text-foreground">Payment Successful!</p>
                <p className="text-xs text-muted-foreground mt-1">Receipt #{receipt.receipt_no}</p>
              </div>
            )}

            {/* Receipt content for printing */}
            <div ref={receiptRef} className="space-y-0">
              <div className="receipt-header text-center mb-3">
                <h2 className="text-lg font-bold">{receipt.business_name}</h2>
                {receipt.business_address && <p className="text-xs text-muted-foreground">{receipt.business_address}</p>}
                {receipt.business_phone && <p className="text-xs text-muted-foreground">{receipt.business_phone}</p>}
              </div>

              <div className="border-t border-dashed border-gray-300 my-3" />

              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Buyer</span>
                  <span className="font-medium">{receipt.buyer_name}</span>
                </div>
                {receipt.buyer_phone && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Phone</span>
                    <span>{receipt.buyer_phone}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Produce</span>
                  <span>{receipt.produce_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quantity</span>
                  <span>{receipt.quantity} {receipt.unit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Unit Price</span>
                  <span>{fmt(receipt.unit_price)}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-300 my-3" />

              <div className="space-y-1.5">
                <div className="flex justify-between text-sm font-bold text-base">
                  <span>Total Amount</span>
                  <span>{fmt(receipt.total_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="text-emerald-600 font-semibold">{fmt(receipt.amount_paid)}</span>
                </div>
                {receipt.balance > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Balance</span>
                    <span className="text-red-600 font-semibold">{fmt(receipt.balance)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment</span>
                  <span>{paymentMethodLabel[receipt.payment_method] || receipt.payment_method}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span>{receipt.sale_date ? new Date(receipt.sale_date).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" }) : "—"}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-300 my-3" />
              <p className="text-center text-[11px] text-muted-foreground">Receipt #{receipt.receipt_no}</p>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3 pt-3">
              <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Printer className="h-4 w-4 mr-2" /> Print Receipt
              </Button>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" /> Download
              </Button>
            </div>

            <Button variant="ghost" className="w-full mt-1" onClick={onClose}>
              Close
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Small receipt icon button for table rows */
export function ReceiptButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600" onClick={onClick} title="View Receipt">
      <Receipt className="h-4 w-4" />
    </Button>
  );
}
