import React, { useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Scale, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function TermsConditions() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F9FAFB' }}>
      <Header />
      
      {/* Banner */}
      <section style={{ backgroundColor: '#0A192F', color: 'white', padding: '60px 20px 50px', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', color: '#FCD34D', fontSize: '0.85rem', fontWeight: 600, marginBottom: 16 }}>
            <Scale size={16} /> Guest Agreement
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0 0 12px', fontFamily: 'var(--font-serif)' }}>Terms & Conditions</h1>
          <p style={{ color: '#9CA3AF', fontSize: '1rem', margin: 0 }}>
            Governing Room Reservations, Check-in Requirements, Guest Conduct & Property Policies
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '50px 20px', flex: 1, color: '#374151', lineHeight: 1.7, fontSize: '0.98rem' }}>
        <div style={{ backgroundColor: 'white', borderRadius: 16, padding: '40px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          
          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: '1.4rem', color: '#111827', fontWeight: 700, marginBottom: 12 }}>
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing our website, creating a guest account, or confirming a reservation with <strong>Sabharwal Hospitality</strong>, you agree to be legally bound by these Terms & Conditions. If you do not agree to any part of these terms, you must not proceed with reservation bookings.
            </p>
          </section>

          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: '1.4rem', color: '#111827', fontWeight: 700, marginBottom: 12 }}>
              2. Mandatory Government Identification Policy
            </h2>
            <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', padding: 20, borderRadius: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#1E40AF', marginBottom: 6 }}>
                <CheckCircle2 size={18} /> Statutory Law Requirement (Section 40, Foreigners Act & State Hotel Regulations)
              </div>
              <p style={{ margin: 0, fontSize: '0.92rem', color: '#1E3A8A' }}>
                All adult guests (18 years and above) must present an original, valid government-issued photo ID at check-in. PAN Cards are not accepted as valid proof of address.
              </p>
            </div>
            <ul style={{ paddingLeft: 24, marginTop: 8 }}>
              <li><strong>Indian Nationals:</strong> Aadhaar Card, Passport, Driving License, or Voter ID.</li>
              <li><strong>Foreign Nationals & NRIs:</strong> Valid Passport and active Indian Visa / OCI card. Completion of Police Form C is mandatory upon check-in.</li>
              <li><strong>Refusal of Check-in:</strong> Inability to produce valid ID allows the property to refuse check-in without refund liability under local statutory obligations.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: '1.4rem', color: '#111827', fontWeight: 700, marginBottom: 12 }}>
              3. Check-In & Check-Out Timings
            </h2>
            <ul style={{ paddingLeft: 24, marginTop: 8 }}>
              <li>Standard Check-in time is <strong>2:00 PM</strong> and Check-out time is <strong>11:00 AM</strong>.</li>
              <li>Early check-in and late check-out are subject to room availability and may attract additional hourly charges unless pre-confirmed in writing or through VIP Loyalty privileges.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: '1.4rem', color: '#111827', fontWeight: 700, marginBottom: 12 }}>
              4. Occupancy, Guest Conduct & Damage Liability
            </h2>
            <ul style={{ paddingLeft: 24, marginTop: 8 }}>
              <li><strong>Maximum Occupancy:</strong> The number of occupants must strictly match the guest count selected during reservation. Unregistered visitors are not permitted in guest rooms past 10:00 PM.</li>
              <li><strong>Property Damage:</strong> The booking guest accepts full financial responsibility for any physical breakage, stained furnishings, equipment damage, or smoking violations within non-smoking rooms during their stay.</li>
              <li><strong>Prohibited Activities:</strong> Possession of hazardous substances, illegal narcotics, or behavior causing disturbance to other patrons will result in immediate eviction without refund.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: '1.4rem', color: '#111827', fontWeight: 700, marginBottom: 12 }}>
              5. Pricing, Taxes & Payment
            </h2>
            <ul style={{ paddingLeft: 24, marginTop: 8 }}>
              <li>All displayed rates are subject to applicable Goods and Services Tax (GST) and statutory hotel cess as prescribed by the Government of India.</li>
              <li>Any extra services availed during the stay (in-room dining, spa, chauffeur transfers, laundry) must be settled in full prior to checkout.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: '1.4rem', color: '#111827', fontWeight: 700, marginBottom: 12 }}>
              6. Limitation of Liability & Force Majeure
            </h2>
            <p>
              To the maximum extent permitted by law, Sabharwal Hospitality shall not be held liable for failure or delays in fulfilling hotel stays resulting from events beyond reasonable control (<strong>Force Majeure</strong>), including earthquakes, floods, extreme weather, strikes, government mandates, pandemics, or disruptions of public utility services.
            </p>
            <p style={{ marginTop: 8 }}>
              Our aggregate monetary liability for any dispute or claim arising from a booking shall in all circumstances be strictly capped at the total booking amount actually paid by the guest for that reservation.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', color: '#111827', fontWeight: 700, marginBottom: 12 }}>
              7. Governing Law & Jurisdiction
            </h2>
            <p>
              These Terms & Conditions are governed by and construed in accordance with the laws of India. Any legal dispute or proceeding arising out of or related to these terms shall be subject to the exclusive jurisdiction of the competent courts in Mumbai, India.
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
