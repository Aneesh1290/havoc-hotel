/**
 * Shared / Frontend Order Reconciliation Types & Helper
 */

export interface OrderReconciliationItem {
  merchantTxnNo: string;
  reconciled: boolean;
  isPaid: boolean;
  status: string;
  reservationId?: number | string;
  paymentLinkId?: string;
  amount?: number;
  message?: string;
}

export async function reconcilePendingHoldClient(
  merchantTxnNo?: string
): Promise<{ success: boolean; results?: OrderReconciliationItem[]; error?: string }> {
  try {
    const res = await fetch('/api/payment/icici/reconcile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txn_id: merchantTxnNo })
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err?.message || 'Reconciliation request failed' };
  }
}
