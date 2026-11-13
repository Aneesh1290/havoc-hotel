import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CreditCard, CheckCircle2, AlertCircle, Building2, ShieldCheck, ArrowRight, Loader2, Calendar, User, Phone, Mail } from 'lucide-react';

export default function PayLink() {
  const { linkId } = useParams();
  const [linkData, setLinkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    async function fetchLink() {
      try {
        const res = await fetch(`/api/payment-links/${linkId}`);
        const data = await res.json();
        if (data.success && data.link) {
          setLinkData(data.link);
        } else {
          setError(data.error || 'Payment link not found or expired.');
        }
      } catch (err) {
        setError('Failed to load payment details. Please check your internet connection.');
      } finally {
        setLoading(false);
      }
    }
    if (linkId) {
      fetchLink();
    }
  }, [linkId]);

  const handlePay = async () => {
    setPaying(true);
    setPaymentError('');

    try {
      const res = await fetch(`/api/payment-links/${linkId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        setPaymentError(data.error || 'Unable to connect to ICICI Bank payment gateway. Please try again.');
        setPaying(false);
      }
    } catch (err) {
      setPaymentError('Network error connecting to payment gateway.');
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={40} color="#102641" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: '#64748B', fontSize: '1rem', fontWeight: 500 }}>Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error || !linkData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', padding: 20 }}>
        <div style={{ backgroundColor: 'white', borderRadius: 20, padding: 36, maxWidth: 460, width: '100%', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <AlertCircle size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>Payment Link Notice</h2>
          <p style={{ color: '#64748B', fontSize: '0.95rem', margin: '0 0 24px' }}>{error || 'This link may have expired or is invalid.'}</p>
          <Link to="/" style={{ display: 'inline-block', padding: '12px 24px', backgroundColor: '#102641', color: 'white', textDecoration: 'none', borderRadius: 10, fontWeight: 600 }}>
            Go to Sabharwal Homepage
          </Link>
        </div>
      </div>
    );
  }

  const isAlreadyPaid = linkData.status === 'Paid';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', padding: '40px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 540, width: '100%', backgroundColor: 'white', borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.06)', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        
        {/* Header Banner */}
        <div style={{ backgroundColor: '#102641', padding: '32px 28px', color: 'white', textAlign: 'center', position: 'relative' }}>
          <img src="/logo.png" alt="Sabharwal Hospitality" style={{ height: 52, margin: '0 auto 12px', display: 'block' }} />
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.01em' }}>
            {linkData.hotelName || 'Hotel Sabharwal Hospitality'}
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#94A3B8', margin: 0 }}>
            Official Guest Payment Request
          </p>
        </div>

        {/* Content Body */}
        <div style={{ padding: '32px 28px' }}>
          {isAlreadyPaid ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 68, height: 68, borderRadius: '50%', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle2 size={38} />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>Payment Completed</h2>
              <p style={{ color: '#64748B', fontSize: '0.92rem', margin: '0 0 20px' }}>This payment request has already been verified and received.</p>
              
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: 14, padding: '16px 20px', border: '1px solid #E2E8F0', textAlign: 'left', marginBottom: 24, fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#64748B' }}>Amount Paid</span>
                  <span style={{ fontWeight: 700, color: '#059669' }}>₹{Number(linkData.amount).toLocaleString('en-IN')}</span>
                </div>
                {linkData.txnId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: '#64748B' }}>Transaction ID</span>
                    <span style={{ fontWeight: 600, color: '#1E293B', fontFamily: 'monospace' }}>{linkData.txnId}</span>
                  </div>
                )}
                {linkData.paidAt && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Paid On</span>
                    <span style={{ fontWeight: 600, color: '#1E293B' }}>{new Date(linkData.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
              </div>

              <Link to="/" style={{ display: 'inline-block', width: '100%', padding: '14px', backgroundColor: '#102641', color: 'white', textDecoration: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.95rem' }}>
                Return to Homepage
              </Link>
            </div>
          ) : (
            <div>
              {/* Amount Highlight */}
              <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 16, padding: '20px', textAlign: 'center', marginBottom: 24 }}>
                <span style={{ fontSize: '0.85rem', color: '#15803D', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Payable Amount
                </span>
                <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#166534', margin: '4px 0 0' }}>
                  ₹{Number(linkData.amount).toLocaleString('en-IN')}
                </div>
              </div>

              {/* Breakdown Details */}
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: 16, padding: '20px', border: '1px solid #E2E8F0', marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.9rem' }}>
                  <span style={{ color: '#64748B' }}>Guest Name</span>
                  <span style={{ fontWeight: 600, color: '#1E293B' }}>{linkData.customerName}</span>
                </div>
                {linkData.customerEmail && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.9rem' }}>
                    <span style={{ color: '#64748B' }}>Email</span>
                    <span style={{ fontWeight: 500, color: '#1E293B' }}>{linkData.customerEmail}</span>
                  </div>
                )}
                {linkData.customerPhone && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.9rem' }}>
                    <span style={{ color: '#64748B' }}>Phone</span>
                    <span style={{ fontWeight: 500, color: '#1E293B' }}>{linkData.customerPhone}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px dashed #CBD5E1', fontSize: '0.9rem' }}>
                  <span style={{ color: '#64748B' }}>Payment Purpose</span>
                  <span style={{ fontWeight: 600, color: '#1E293B', textAlign: 'right', maxWidth: '65%' }}>
                    {linkData.purpose || 'Hotel Accommodation / Services'}
                  </span>
                </div>
              </div>

              {paymentError && (
                <div style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '12px 16px', borderRadius: 10, fontSize: '0.88rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={18} />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Pay Button */}
              <button
                onClick={handlePay}
                disabled={paying}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: '#D97706',
                  color: 'white',
                  border: 'none',
                  borderRadius: 14,
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  cursor: paying ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)',
                  transition: 'all 0.2s',
                  opacity: paying ? 0.8 : 1
                }}
              >
                {paying ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Connecting to ICICI Bank...</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={20} />
                    <span>Pay ₹{Number(linkData.amount).toLocaleString('en-IN')} via ICICI Bank</span>
                  </>
                )}
              </button>

              {/* Trust Badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 18, color: '#64748B', fontSize: '0.8rem' }}>
                <ShieldCheck size={16} color="#059669" />
                <span>Secured 256-bit encrypted checkout by ICICI Bank Orange PG</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
