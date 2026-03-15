import { redirect } from 'next/navigation';

export default function BillingEnrollmentInvoicesPage() {
  redirect('/dashboard/billing-enrollment/payments/next-invoice');
}
