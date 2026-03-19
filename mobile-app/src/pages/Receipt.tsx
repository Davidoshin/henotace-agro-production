import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { apiGet, getAppBaseUrl } from "@/lib/api";
import { ArrowLeft, Printer } from "lucide-react";

// Generate 6-character receipt ID from sale number
const generateReceiptId = (saleNumber: string): string => {
  if (saleNumber.length >= 6) {
    const matches = saleNumber.match(/[A-Z0-9]+$/i);
    if (matches && matches[0].length >= 6) {
      return matches[0].slice(-6).toUpperCase();
    }
  }
  let hash = 0;
  for (let i = 0; i < saleNumber.length; i++) {
    const char = saleNumber.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).slice(0, 6).toUpperCase().padStart(6, '0');
};

export default function ReceiptPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Get business info from localStorage
  const businessName = localStorage.getItem('business_name') || "HENOTACE BUSINESS";
  const businessSlug = localStorage.getItem('business_slug');
  const storeUrl = businessSlug ? `${getAppBaseUrl()}/store/${businessSlug}` : null;

  useEffect(() => {
    (async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await apiGet(`business/sales/${id}/`);
        setSale(data.sale || data);
      } catch (e) {
        setSale(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const doPrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-muted-foreground">Sale not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/business/sales')}>
            Back to Sales
          </Button>
        </div>
      </div>
    );
  }

  const saleDate = new Date(sale.created_at);
  const receiptId = generateReceiptId(sale.sale_number || sale.id?.toString() || '');
  const staffName = sale.staff?.name || sale.staff?.employee_id || 'Staff';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 sm:p-6 max-w-md">
        {/* Header - hidden in print */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Button variant="ghost" size="sm" onClick={() => navigate('/business/sales')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={doPrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>

        {/* Receipt Card - styled like thermal receipt */}
        <div className="bg-white rounded-lg shadow-lg p-6 print:shadow-none font-mono text-sm">
          {/* Header */}
          <div className="text-center border-b border-dashed border-gray-400 pb-4 mb-4">
            <p className="text-xs text-gray-500">
              {saleDate.toLocaleDateString()} {saleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <h2 className="text-lg font-bold mt-1">Sales Receipt #{receiptId}</h2>
            <p className="text-xs text-gray-500">Branch: {sale.branch?.name || 'Main'}</p>
            {sale.branch?.address && (
              <p className="text-xs text-gray-500">{sale.branch.address}</p>
            )}
            {sale.branch?.phone && (
              <p className="text-xs text-gray-500">Tel: {sale.branch.phone}</p>
            )}
          </div>

          {/* Business Info */}
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold uppercase">{businessName}</h1>
            <p className="text-sm">Cashier: {staffName}</p>
            {sale.customer && (
              <p className="text-sm">Customer: {sale.customer.name}</p>
            )}
          </div>

          {/* Items Table */}
          <div className="border-t border-b border-dashed border-gray-400 py-3 mb-3">
            <div className="grid grid-cols-12 gap-1 text-xs font-bold mb-2">
              <div className="col-span-5">Item</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-3 text-right">Ext</div>
            </div>
            <div className="border-t border-gray-300 mb-2"></div>
            {sale.items?.map((item: any, idx: number) => (
              <div key={item.id || idx} className="mb-2">
                <p className="text-xs truncate">{item.product?.name || item.name}</p>
                <div className="grid grid-cols-12 gap-1 text-xs text-gray-600">
                  <div className="col-span-5">{item.product?.sku || (idx + 1).toString().padStart(3, '0')}</div>
                  <div className="col-span-2 text-center">{item.quantity}</div>
                  <div className="col-span-2 text-right">₦{parseFloat(item.unit_price || 0).toFixed(0)}</div>
                  <div className="col-span-3 text-right">₦{parseFloat(item.total_price || 0).toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="text-right space-y-1 mb-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>₦{parseFloat(sale.total_amount || 0).toFixed(2)}</span>
            </div>
            {parseFloat(sale.discount_amount || 0) > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount:</span>
                <span>-₦{parseFloat(sale.discount_amount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Local Sales Tax:</span>
              <span>₦{parseFloat(sale.tax_amount || 0).toFixed(2)}</span>
            </div>
            <div className="border-t-2 border-black pt-2 mt-2">
              <div className="flex justify-between text-lg font-bold">
                <span>TOTAL:</span>
                <span>₦{parseFloat(sale.final_amount || sale.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Payment:</span>
              <span className="uppercase">{sale.payment_method}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-dashed border-gray-400 pt-4 text-center">
            <p className="font-bold mb-3">Thanks for shopping with us!</p>
            {storeUrl && (
              <div className="flex items-center justify-center gap-3">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(storeUrl)}`} 
                  alt="Store QR Code"
                  className="w-20 h-20"
                />
                <p className="text-xs font-bold">Shop with us<br/>online!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
