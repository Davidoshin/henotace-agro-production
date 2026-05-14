import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
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
  const storeUrl = businessSlug ? `/store/${businessSlug}` : null;

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
        <div style={{
          backgroundColor: '#ffffff',
          border: '3px solid #000000',
          borderRadius: '0px',
          padding: '16px',
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          maxWidth: '80mm',
          margin: '0 auto'
        }} className="print:shadow-none">
          {/* Date/Time */}
          <div style={{ textAlign: 'center', marginBottom: '8px', fontSize: '11px', fontWeight: 700 }}>
            {saleDate.toLocaleDateString()} {saleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>

          {/* Receipt Title */}
          <div style={{ textAlign: 'center', marginBottom: '4px', fontSize: '12px', fontWeight: 700 }}>
            Sales Receipt #{receiptId}
          </div>

          {/* Business Name */}
          <div style={{ textAlign: 'center', marginBottom: '12px', borderBottom: '2px dashed #000000', paddingBottom: '8px' }}>
            <h1 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, textTransform: 'uppercase' }}>{businessName}</h1>
            {sale.branch?.address && (
              <p style={{ margin: '0 0 3px 0', fontSize: '10px', fontWeight: 600 }}>{sale.branch.address}</p>
            )}
            {sale.branch?.phone && (
              <p style={{ margin: '0 0 3px 0', fontSize: '10px', fontWeight: 600 }}>Tel: {sale.branch.phone}</p>
            )}
            <p style={{ margin: '0 0 3px 0', fontSize: '10px', fontWeight: 600 }}>Cashier: {staffName}</p>
            {sale.customer && (
              <p style={{ margin: '0', fontSize: '10px', fontWeight: 600 }}>Customer: {sale.customer.name}</p>
            )}
          </div>

          {/* Items Header and Table */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '8px', borderBottom: '2px solid #000000', paddingBottom: '6px' }}>
              <div style={{ textAlign: 'left', fontSize: '11px', fontWeight: 700 }}>Item</div>
              <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700 }}>Qty</div>
              <div style={{ textAlign: 'right', fontSize: '11px', fontWeight: 700 }}>Price</div>
              <div style={{ textAlign: 'right', fontSize: '11px', fontWeight: 700 }}>Ext</div>
            </div>

            {sale.items?.map((item: any, idx: number) => (
              <div key={item.id || idx} style={{ marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #e0e0e0' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '10px', fontWeight: 600 }}>{item.product?.name || item.name}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontSize: '10px', fontWeight: 600 }}>
                  <div style={{ textAlign: 'left' }}>{item.product?.sku || (idx + 1).toString().padStart(3, '0')}</div>
                  <div style={{ textAlign: 'center' }}>{item.quantity}</div>
                  <div style={{ textAlign: 'right' }}>₦{parseFloat(item.unit_price || 0).toFixed(0)}</div>
                  <div style={{ textAlign: 'right' }}>₦{parseFloat(item.total_price || 0).toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ borderBottom: '2px dashed #000000', marginBottom: '12px' }}></div>

          {/* Totals */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>
              <span>Subtotal</span>
              <span>₦{parseFloat(sale.total_amount || 0).toFixed(2)}</span>
            </div>
            {parseFloat(sale.discount_amount || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, marginBottom: '4px', color: '#059669' }}>
                <span>Discount</span>
                <span>-₦{parseFloat(sale.discount_amount).toFixed(2)}</span>
              </div>
            )}
            {parseFloat(sale.tax_amount || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>
                <span>VAT (7.5%)</span>
                <span>₦{parseFloat(sale.tax_amount || 0).toFixed(2)}</span>
              </div>
            )}
            <div style={{ borderTop: '2px solid #000000', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700 }}>
              <span>TOTAL</span>
              <span>₦{parseFloat(sale.final_amount || sale.total_amount || 0).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, marginTop: '4px' }}>
              <span>Payment</span>
              <span style={{ textTransform: 'uppercase' }}>{sale.payment_method}</span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderBottom: '2px dashed #000000', marginBottom: '12px' }}></div>

          {/* Thank You Message */}
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <p style={{ margin: '0', fontSize: '12px', fontWeight: 700 }}>Thanks for doing business with us!</p>
          </div>

          {/* QR Code and Footer */}
          {storeUrl && (
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(storeUrl)}`} 
                alt="Store QR Code"
                style={{ maxWidth: '80px', height: '80px', marginBottom: '8px' }}
              />
              <p style={{ margin: '0', fontSize: '10px', fontWeight: 700 }}>Shop with us online!</p>
            </div>
          )}

          {/* Final Divider */}
          <div style={{ borderTop: '2px solid #000000', paddingTop: '8px', textAlign: 'center' }}>
            <p style={{ margin: '0', fontSize: '9px', fontWeight: 700 }}>powered by henotace business</p>
          </div>
        </div>
      </div>
    </div>
  );
}
