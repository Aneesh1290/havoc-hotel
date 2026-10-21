import React, { useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useHotels } from '../context/HotelContext';
import { RotateCcw, Clock, AlertTriangle, CheckCircle, CreditCard } from 'lucide-react';

export default function CancellationPolicy() {
  const { bookingPolicies } = useHotels();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const cancelNotice = bookingPolicies?.cancellationNoticeHours ?? 24;
  const rescheduleNotice = bookingPolicies?.rescheduleNoticeHours ?? 24;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F9FAFB' }}>
      <Header />
      
      {/* Banner */}
      <section style={{ backgroundColor: '#0A192F', color: 'white', padding: '60px 20px 50px', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', color: '#FCD34D', fontSize: '0.85rem', fontWeight: 600, marginBottom: 16 }}>
            <RotateCcw size={16} /> Guest Policy
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0 0 12px', fontFamily: 'var(--font-serif)' }}>Cancellation & Refund Policy</h1>
          <p style={{ color: '#9CA3AF', fontSize: '1rem', margin: 0 }}>
            Clear, transparent guidelines on reservation cancellations, date modifications, and refund timelines.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '50px 20px', flex: 1, color: '#374151', lineHeight: 1.7, fontSize: '0.98rem' }}>
        <div style={{ backgroundColor: 'white', borderRadius: 16, padding: '40px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          
          {/* Highlight Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 36 }}>
            <div style={{ backgroundColor: '#ECFDF5', padding: 24, borderRadius: 14, border: '1px solid #A7F3D0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#065F46', fontWeight: 700, marginBottom: 6 }}>
                <Clock size={20} /> Free Cancellation Window
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#065F46', marginBottom: 6 }}>
                Up to {cancelNotice} Hours
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#047857' }}>
                Cancel free of charge through your Guest Portal up to {cancelNotice} hours prior to scheduled check-in.
              </p>
            </div>

            <div style={{ backgroundColor: '#EFF6FF', padding: 24, borderRadius: 14, border: '1px solid #BFDBFE' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#1E40AF', fontWeight: 700, marginBottom: 6 }}>
                <CreditCard size={20} /> Refund Processing
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1E40AF', marginBottom: 6 }}>
                5 - 7 Working Days
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#1D4ED8' }}>
                Approved refunds are credited back to the original source bank account or card automatically.
              </p>
            </div>
          </div>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.35rem', color: '#111827', fontWeight: 700, marginBottom: 12 }}>
              1. Self-Service Online Cancellations
            </h2>
            <p>
              Guests can cancel active bookings directly from their <strong>Guest Dashboard &gt; My Stays</strong> by clicking the "Cancel Stay" button.
            </p>
            <ul style={{ paddingLeft: 24, marginTop: 8 }}>
              <li><strong>Within Free Cancellation Window (≥ {cancelNotice}h before check-in):</strong> Full 100% refund of room tariff and applicable taxes.</li>
              <li><strong>Late Cancellations (&lt; {cancelNotice}h before check-in):</strong> Subject to a retention fee equivalent to the 1st night's room charge plus taxes. Remaining balance, if any, will be refunded.</li>
              <li><strong>Same-Day Bookings:</strong> Bookings made on the day of arrival are non-refundable unless permitted by the hotel front desk management.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.35rem', color: '#111827', fontWeight: 700, marginBottom: 12 }}>
              2. Rescheduling & Changing Dates
            </h2>
            <p>
              We understand plans can change. You can modify your arrival or departure dates through the Guest Portal at least <strong>{rescheduleNotice} hours</strong> prior to check-in:
            </p>
            <ul style={{ paddingLeft: 24, marginTop: 8 }}>
              <li>Date changes are subject to room availability for the requested new dates.</li>
              <li>If the new dates reflect a higher seasonal rate or additional nights, the price difference will be charged. If the new duration is shorter, any eligible difference will be refunded according to the cancellation policy.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.35rem', color: '#111827', fontWeight: 700, marginBottom: 12 }}>
              3. No-Show Policy
            </h2>
            <p>
              If a guest fails to check-in on the scheduled arrival date without prior written or online cancellation, the booking is classified as a <strong>No-Show</strong>. The entire reservation amount will be forfeited, and any held room units will be released back into inventory for other patrons.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.35rem', color: '#111827', fontWeight: 700, marginBottom: 12 }}>
              4. Peak Season & Non-Refundable Rates
            </h2>
            <p>
              Certain promotional rates, festival dates (e.g., New Year's Eve, Diwali, Christmas), or corporate package offers may be explicitly designated as <strong>Non-Refundable</strong> at the time of booking. For such reservations, modifications or cancellations are not eligible for monetary refunds.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.35rem', color: '#111827', fontWeight: 700, marginBottom: 12 }}>
              5. Refund Inquiries
            </h2>
            <p>
              If you have cancelled a reservation and your refund has not reflected after 7 business days, please email our finance desk at <strong>support@hotelsabharwal.com</strong> with your Booking ID and payment receipt.
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
