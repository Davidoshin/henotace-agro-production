import { forwardRef } from "react";

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface BusinessInfo {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
  bank_name?: string;
  account_number?: string;
  account_name?: string;
}

interface InvoiceData {
  invoice_number: string;
  client_name: string;
  client_email?: string;
  client_address?: string;
  description?: string;
  items?: InvoiceItem[];
  amount: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount: number;
  paid_amount?: number;
  status: string;
  due_date?: string;
  created_at?: string;
  paid_date?: string;
  notes?: string;
  terms?: string;
}

interface InvoiceReceiptProps {
  invoice: InvoiceData;
  business: BusinessInfo;
}

export const InvoiceReceipt = forwardRef<HTMLDivElement, InvoiceReceiptProps>(
  ({ invoice, business }, ref) => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-NG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    };

    const formatDate = (dateStr?: string) => {
      if (!dateStr) return '';
      return new Date(dateStr).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    };

    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case 'paid':
          return { bg: '#d1fae5', color: '#065f46' };
        case 'overdue':
          return { bg: '#fee2e2', color: '#991b1b' };
        case 'draft':
          return { bg: '#e5e7eb', color: '#374151' };
        default:
          return { bg: '#fef3c7', color: '#92400e' };
      }
    };

    const statusStyle = getStatusColor(invoice.status);
    const balanceDue = invoice.total_amount - (invoice.paid_amount || 0);
    const fallbackLogo = '/faviconlightmode.png';

    return (
      <div
        ref={ref}
        id="invoice-receipt"
        style={{
          fontFamily: 'Arial, sans-serif',
          maxWidth: '800px',
          margin: '0 auto',
          padding: '40px',
          backgroundColor: '#ffffff',
          color: '#333333',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          {/* Business Info */}
          <div style={{ flex: 1 }}>
            {/* Logo */}
            <img
              src={business.logo || fallbackLogo}
              alt={business.name || 'Business'}
              style={{
                maxWidth: '150px',
                maxHeight: '60px',
                marginBottom: '15px',
                objectFit: 'contain',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = fallbackLogo;
              }}
            />
            {business.name && (
              <h2 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
                {business.name}
              </h2>
            )}
            {business.address && (
              <p style={{ margin: '0 0 3px 0', fontSize: '12px', color: '#6b7280' }}>
                {business.address}
              </p>
            )}
            {business.email && (
              <p style={{ margin: '0 0 3px 0', fontSize: '12px', color: '#6b7280' }}>
                {business.email}
              </p>
            )}
            {business.phone && (
              <p style={{ margin: '0', fontSize: '12px', color: '#6b7280' }}>
                {business.phone}
              </p>
            )}
          </div>

          {/* Invoice Title */}
          <div style={{ textAlign: 'right' }}>
            <h1 style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
              INVOICE
            </h1>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
              # {invoice.invoice_number}
            </p>
            <div style={{ marginTop: '15px' }}>
              <p style={{ margin: '3px 0', fontSize: '12px', color: '#6b7280' }}>
                <strong>Balance Due</strong>
              </p>
              <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
                NGN{formatCurrency(balanceDue)}
              </p>
            </div>
          </div>
        </div>

        {/* Bill To & Invoice Details */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          {/* Bill To */}
          <div>
            <p style={{ margin: '0 0 5px 0', fontSize: '11px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>
              Bill To
            </p>
            <p style={{ margin: '0 0 3px 0', fontSize: '14px', fontWeight: 'bold', color: '#111827' }}>
              {invoice.client_name}
            </p>
            {invoice.client_address && (
              <p style={{ margin: '0 0 3px 0', fontSize: '12px', color: '#6b7280' }}>
                {invoice.client_address}
              </p>
            )}
            {invoice.client_email && (
              <p style={{ margin: '0', fontSize: '12px', color: '#6b7280' }}>
                {invoice.client_email}
              </p>
            )}
          </div>

          {/* Invoice Details */}
          <div style={{ textAlign: 'right' }}>
            <table style={{ marginLeft: 'auto', fontSize: '12px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '3px 15px 3px 0', color: '#6b7280' }}>Invoice Date:</td>
                  <td style={{ fontWeight: '500' }}>{formatDate(invoice.created_at)}</td>
                </tr>
                {invoice.terms && (
                  <tr>
                    <td style={{ padding: '3px 15px 3px 0', color: '#6b7280' }}>Terms:</td>
                    <td style={{ fontWeight: '500' }}>{invoice.terms}</td>
                  </tr>
                )}
                <tr>
                  <td style={{ padding: '3px 15px 3px 0', color: '#6b7280' }}>Due Date:</td>
                  <td style={{ fontWeight: '500' }}>{formatDate(invoice.due_date) || 'Due on Receipt'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#2563eb' }}>
              <th style={{ padding: '12px', textAlign: 'left', color: '#ffffff', fontSize: '12px', fontWeight: '600' }}>
                #
              </th>
              <th style={{ padding: '12px', textAlign: 'left', color: '#ffffff', fontSize: '12px', fontWeight: '600' }}>
                Item & Description
              </th>
              <th style={{ padding: '12px', textAlign: 'center', color: '#ffffff', fontSize: '12px', fontWeight: '600' }}>
                Qty
              </th>
              <th style={{ padding: '12px', textAlign: 'right', color: '#ffffff', fontSize: '12px', fontWeight: '600' }}>
                Rate
              </th>
              <th style={{ padding: '12px', textAlign: 'right', color: '#ffffff', fontSize: '12px', fontWeight: '600' }}>
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.items && invoice.items.length > 0 ? (
              invoice.items.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px', fontSize: '12px' }}>{index + 1}</td>
                  <td style={{ padding: '12px', fontSize: '12px' }}>{item.description}</td>
                  <td style={{ padding: '12px', textAlign: 'center', fontSize: '12px' }}>{item.quantity}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '12px' }}>₦{formatCurrency(item.rate)}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '12px' }}>₦{formatCurrency(item.amount)}</td>
                </tr>
              ))
            ) : (
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px', fontSize: '12px' }}>1</td>
                <td style={{ padding: '12px', fontSize: '12px' }}>{invoice.description || 'Service'}</td>
                <td style={{ padding: '12px', textAlign: 'center', fontSize: '12px' }}>1</td>
                <td style={{ padding: '12px', textAlign: 'right', fontSize: '12px' }}>₦{formatCurrency(invoice.amount)}</td>
                <td style={{ padding: '12px', textAlign: 'right', fontSize: '12px' }}>₦{formatCurrency(invoice.amount)}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
          <table style={{ width: '280px', fontSize: '13px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '8px 0', color: '#6b7280' }}>Sub Total</td>
                <td style={{ padding: '8px 0', textAlign: 'right' }}>₦{formatCurrency(invoice.amount || 0)}</td>
              </tr>
              {Number(invoice.tax_amount) > 0 && (
                <tr>
                  <td style={{ padding: '8px 0', color: '#6b7280' }}>VAT (7.5%)</td>
                  <td style={{ padding: '8px 0', textAlign: 'right' }}>₦{formatCurrency(Number(invoice.tax_amount))}</td>
                </tr>
              )}
              {Number(invoice.discount_amount) > 0 && (
                <tr>
                  <td style={{ padding: '8px 0', color: '#6b7280' }}>Discount</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', color: '#059669' }}>
                    -₦{formatCurrency(Number(invoice.discount_amount))}
                  </td>
                </tr>
              )}
              <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px 0', fontWeight: 'bold' }}>Total</td>
                <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 'bold', fontSize: '16px' }}>
                  NGN{formatCurrency(invoice.total_amount)}
                </td>
              </tr>
              {(invoice.paid_amount || 0) > 0 && (
                <tr>
                  <td style={{ padding: '8px 0', color: '#059669' }}>Amount Paid</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', color: '#059669' }}>
                    -₦{formatCurrency(invoice.paid_amount || 0)}
                  </td>
                </tr>
              )}
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>Balance Due</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '16px' }}>
                  NGN{formatCurrency(balanceDue)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Status Badge */}
        <div style={{ marginBottom: '20px' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: '20px',
              backgroundColor: statusStyle.bg,
              color: statusStyle.color,
              fontSize: '12px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
            }}
          >
            {invoice.status}
          </span>
        </div>

        {/* Notes Section - Always show */}
        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 'bold', color: '#374151' }}>
            Notes
          </p>
          
          {/* Bank Payment Details */}
          {(business.bank_name || business.account_number || business.account_name) && (
            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#e0f2fe', borderRadius: '6px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: '#0369a1' }}>
                Bank Transfer Payment Details:
              </p>
              {business.bank_name && (
                <p style={{ margin: '0 0 3px 0', fontSize: '12px', color: '#075985' }}>
                  <strong>Bank:</strong> {business.bank_name}
                </p>
              )}
              {business.account_name && (
                <p style={{ margin: '0 0 3px 0', fontSize: '12px', color: '#075985' }}>
                  <strong>Account Name:</strong> {business.account_name}
                </p>
              )}
              {business.account_number && (
                <p style={{ margin: '0', fontSize: '12px', color: '#075985' }}>
                  <strong>Account Number:</strong> {business.account_number}
                </p>
              )}
            </div>
          )}
          
          {invoice.notes && (
            <p style={{ margin: '0 0 15px 0', fontSize: '12px', color: '#6b7280', whiteSpace: 'pre-wrap' }}>
              {invoice.notes}
            </p>
          )}
          
          <p style={{ margin: '0', fontSize: '11px', color: '#9ca3af' }}>
            Thank you for choosing us. We value your trust and business.
          </p>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
          <p style={{ margin: '0', fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>
            Powered by <strong>henotaceai</strong>
          </p>
        </div>
      </div>
    );
  }
);

InvoiceReceipt.displayName = 'InvoiceReceipt';

export default InvoiceReceipt;
