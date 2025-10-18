import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { invoiceAPI } from '@/services/api';

interface InvoiceFormData {
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  contactPerson: string;
  invoiceDate: string;
  billingToCompanyName: string;
  billingToCompanyAddress: string;
  billingToCompanyPhone: string;
  billingToCompanyEmail: string;
  invoiceServiceType: string;
  totalUsed: number;
  unitPrice: number;
  totalAmount: number;
  totalNetAmount: number;
  accountNumber: number;
  bankName: string;
  branchName: string;
}

const InvoiceForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const [form, setForm] = useState<InvoiceFormData>({
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    contactPerson: '',
    invoiceDate: '',
    billingToCompanyName: '',
    billingToCompanyAddress: '',
    billingToCompanyPhone: '',
    billingToCompanyEmail: '',
    invoiceServiceType: '',
    totalUsed: 0,
    unitPrice: 0,
    totalAmount: 0,
    totalNetAmount: 0,
    accountNumber: 0,
    bankName: '',
    branchName: '',
  });
  const [clientEmail, setClientEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const update = (key: keyof InvoiceFormData, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (!clientEmail) throw new Error('Client email is required');
      // Validate all required fields
      for (const [key, value] of Object.entries(form)) {
        if (typeof value === 'string' && value.trim() === '') {
          throw new Error(`Field '${key}' is required.`);
        }
        if (typeof value === 'number' && (value === null || isNaN(value))) {
          throw new Error(`Field '${key}' is required and must be a valid number.`);
        }
      }
      await invoiceAPI.sendInvoice(form, clientEmail);
      toast({ title: 'Invoice sent successfully' });
      onSuccess?.();
      setForm({
        companyAddress: '',
        companyPhone: '',
        companyEmail: '',
        contactPerson: '',
        invoiceDate: '',
        billingToCompanyName: '',
        billingToCompanyAddress: '',
        billingToCompanyPhone: '',
        billingToCompanyEmail: '',
        invoiceServiceType: '',
        totalUsed: 0,
        unitPrice: 0,
        totalAmount: 0,
        totalNetAmount: 0,
        accountNumber: 0,
        bankName: '',
        branchName: '',
      });
      setClientEmail('');
    } catch (err: any) {
      toast({ title: 'Failed to send invoice', description: err?.message || 'Please check fields', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto px-4">
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Invoice Date</Label>
              <Input type="date" value={form.invoiceDate || ''} onChange={(e) => update('invoiceDate', e.target.value)} />
            </div>
            <div />
          </div>

          <div>
            <Label>Service Type</Label>
            <Input value={form.invoiceServiceType || ''} onChange={(e) => update('invoiceServiceType', e.target.value)} />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Company Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Company Address</Label>
                <Input value={form.companyAddress || ''} onChange={(e) => update('companyAddress', e.target.value)} />
              </div>
              <div>
                <Label>Company Phone</Label>
                <Input value={form.companyPhone || ''} onChange={(e) => update('companyPhone', e.target.value)} />
              </div>
              <div>
                <Label>Company Email</Label>
                <Input value={form.companyEmail || ''} onChange={(e) => update('companyEmail', e.target.value)} />
              </div>
              <div>
                <Label>Contact Person</Label>
                <Input value={form.contactPerson || ''} onChange={(e) => update('contactPerson', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Billing Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Company Name</Label>
                <Input value={form.billingToCompanyName || ''} onChange={(e) => update('billingToCompanyName', e.target.value)} />
              </div>
              <div>
                <Label>Company Address</Label>
                <Input value={form.billingToCompanyAddress || ''} onChange={(e) => update('billingToCompanyAddress', e.target.value)} />
              </div>
              <div>
                <Label>Company Phone</Label>
                <Input value={form.billingToCompanyPhone || ''} onChange={(e) => update('billingToCompanyPhone', e.target.value)} />
              </div>
              <div>
                <Label>Company Email</Label>
                <Input value={form.billingToCompanyEmail || ''} onChange={(e) => update('billingToCompanyEmail', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Service Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantity Used</Label>
                  <Input
                    type="number"
                    value={form.totalUsed ?? ''}
                    onChange={(e) => update('totalUsed', e.target.value === '' ? undefined : Number(e.target.value))}
                    placeholder="Enter quantity used"
                  />
                </div>
                <div>
                  <Label>Unit Price</Label>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">N$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.unitPrice ?? ''}
                      onChange={(e) => update('unitPrice', e.target.value === '' ? undefined : Number(e.target.value))}
                      placeholder="Enter unit price"
                    />
                  </div>
                </div>
                <div>
                  <Label>Total Amount</Label>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">N$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.totalAmount ?? ''}
                      onChange={(e) => update('totalAmount', e.target.value === '' ? undefined : Number(e.target.value))}
                      placeholder="Enter amount"
                    />
                  </div>
                </div>
                <div>
                  <Label>Net Amount</Label>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">N$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.totalNetAmount ?? ''}
                      onChange={(e) => update('totalNetAmount', e.target.value === '' ? undefined : Number(e.target.value))}
                      placeholder="Enter net amount"
                    />
                  </div>
                </div>
              </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Bank Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Account Number</Label>
                <Input value={form.accountNumber ?? ''} onChange={(e) => update('accountNumber', e.target.value === '' ? undefined : Number(e.target.value))} />
              </div>
              <div>
                <Label>Bank Name</Label>
                <Input value={form.bankName || ''} onChange={(e) => update('bankName', e.target.value)} />
              </div>
              <div>
                <Label>Branch Name</Label>
                <Input value={form.branchName || ''} onChange={(e) => update('branchName', e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <Label>Client Email</Label>
            <Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} required />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Sending...' : 'Send Invoice'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;


