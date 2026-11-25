/**
 * ICICI Payment Gateway Types & Status Inquiry Client (TypeScript / Frontend / Shared)
 */

export interface IciciPaymentStatusResult {
  success: boolean;
  isPaid: boolean;
  txnID: string | null;
  amount: number | null;
  responseCode: string;
  description: string;
  paymentMode?: string;
  raw?: any;
}

export interface ReconcileResult {
  merchantTxnNo: string;
  reconciled: boolean;
  isPaid: boolean;
  status: string;
  reservationId?: number | string;
  paymentLinkId?: string;
  amount?: number;
  message?: string;
}

/**
 * Check ICICI Payment Status via server endpoint or direct inquiry
 */
export async function checkIciciPaymentStatus(
  merchantTxnNo: string,
  originalTxnNo?: string
): Promise<IciciPaymentStatusResult> {
  try {
    const url = `/api/payment/icici/status/${encodeURIComponent(merchantTxnNo)}${
      originalTxnNo ? `?originalTxnNo=${encodeURIComponent(originalTxnNo)}` : ''
    }`;
    const res = await fetch(url);
    const data = await res.json();
    return {
      success: data.success ?? true,
      isPaid: data.isPaid ?? false,
      txnID: data.txnID || null,
      amount: data.amount ? Number(data.amount) : null,
      responseCode: data.responseCode || '',
      description: data.description || '',
      paymentMode: data.paymentMode || 'Online',
      raw: data.raw || data
    };
  } catch (err: any) {
    return {
      success: false,
      isPaid: false,
      txnID: null,
      amount: null,
      responseCode: 'CLIENT_FETCH_ERROR',
      description: err?.message || 'Failed to check status',
      raw: null
    };
  }
}

/**
 * Call S2S Reconcile endpoint
 */
export async function triggerReconciliation(
  txnId?: string
): Promise<{ success: boolean; results?: ReconcileResult[]; error?: string }> {
  try {
    const res = await fetch('/api/payment/icici/reconcile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txn_id: txnId })
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err?.message || 'Reconciliation failed' };
  }
}
