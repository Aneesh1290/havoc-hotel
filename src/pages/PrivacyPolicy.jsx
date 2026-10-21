import React, { useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Shield, Lock, FileText, CheckCircle2 } from 'lucide-react';

export default function PrivacyPolicy() {
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
            <Shield size={16} /> Legal & Compliance
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0 0 12px', fontFamily: 'var(--font-serif)' }}>Privacy Policy</h1>
          <p style={{ color: '#9CA3AF', fontSize: '1rem', margin: 0 }}>
            Last Updated: October 2026 • Compliant with Digital Personal Data Protection (DPDP) Act & IT Act 2000
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '50px 20px', flex: 1, color: '#374151', lineHeight: 1.7, fontSize: '0.98rem' }}>
        
        <div style={{ backgroundColor: 'white', borderRadius: 16, padding: '40px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          
          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: '1.4rem', color: '#111827', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText size={20} color="var(--primary)" /> 1. Overview & Commitment
            </h2>
            <p>
              Welcome to <strong>Sabharwal Hospitality</strong> ("we", "our", or "us"). We honor the trust you place in us when sharing your personal information for hotel bookings, room reservations, and stay experiences. This Privacy Policy details how we collect, use, store, and safeguard your personal information when using our portal or staying at our partner properties.
            </p>
          </section>

          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: '1.4rem', color: '#111827', fontWeight: 700, marginBottom: 12 }}>
              2. Information We Collect
            </h2>
            <p>To provide seamless hospitality services and comply with statutory hotel register regulations, we collect:</p>
            <ul style={{ paddingLeft: 24, marginTop: 8 }}>
              <li><strong>Contact & Identification Details:</strong> Full name, verified email address, phone number, and residential city/country.</li>
              <li><strong>Reservation Records:</strong> Check-in and check-out dates, selected room categories, occupancy (adults and children), special dining or anniversary requests.</li>
              <li><strong>Statutory Police Verification Data:</strong> Government-issued photo identification (Aadhaar, Passport, Driving License, or Voter ID) collected either upon check-in or booking verification as mandated by local hospitality authorities.</li>
              <li><strong>Transaction Data:</strong> Payment status, transaction reference numbers, and invoices. <em>Note: We do not store raw credit/debit card numbers or CVVs on our servers.</em></li>
            </ul>
          </section>

          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: '1.4rem', color: '#111827', fontWeight: 700, marginBottom: 12 }}>
              3. Purpose of Processing Your Data
            </h2>
            <p>We process your personal information strictly for legitimate business and legal purposes:</p>
            <ul style={{ paddingLeft: 24, marginTop: 8 }}>
              <li>Confirming room reservations, sending invoice PDFs, and updating stay statuses.</li>
              <li>Enabling self-service management (changing dates, requesting refunds, submitting concierge requests).</li>
              <li>Mandatory compliance with local tourism and law enforcement reporting (e.g., Guest Registration Form / Form C for foreign tourists).</li>
              <li>Sending opt-in seasonal discounts and exclusive member loyalty perks (which you may unsubscribe from anytime).</li>
            </ul>
          </section>

          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: '1.4rem', color: '#111827', fontWeight: 700, marginBottom: 12 }}>
              4. Data Sharing & Third Parties
            </h2>
            <p>
              <strong>We do not sell, rent, or trade your personal data to third-party advertisers.</strong> Your information is only shared under these strict circumstances:
            </p>
            <ul style={{ paddingLeft: 24, marginTop: 8 }}>
              <li><strong>Property Front Office & Reception:</strong> Direct hotel staff receive your reservation details to prepare your suite and attend to special requests.</li>
              <li><strong>Regulatory & Legal Authorities:</strong> Where disclosure is required by law, court order, or police directive for guest identification and safety verification.</li>
              <li><strong>Certified Technology Partners:</strong> Secure cloud infrastructure providers operating under strict confidentiality and encryption standards.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: '1.4rem', color: '#111827', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Lock size={20} color="var(--primary)" /> 5. Data Security & Storage
            </h2>
            <p>
              We implement industry-standard technical safeguards including SSL/TLS encrypted transmissions, bcrypt password hashing, access-controlled databases, and restricted employee access to protect your personal information against unauthorized access, alteration, or disclosure.
            </p>
          </section>

          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: '1.4rem', color: '#111827', fontWeight: 700, marginBottom: 12 }}>
              6. Your Rights as a Guest
            </h2>
            <p>Under the Digital Personal Data Protection Act, you have the right to:</p>
            <ul style={{ paddingLeft: 24, marginTop: 8 }}>
              <li><strong>Access & Review:</strong> Review your stored reservation records and profile details via the Guest Dashboard.</li>
              <li><strong>Rectification:</strong> Correct inaccurate or outdated phone numbers and profile preferences.</li>
              <li><strong>Erasure:</strong> Request deletion of your guest profile account once all active reservation and statutory tax retention periods have expired.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', color: '#111827', fontWeight: 700, marginBottom: 12 }}>
              7. Grievance Officer & Contact Details
            </h2>
            <p>For any privacy inquiries, data deletion requests, or grievances, please contact our designated Privacy Office:</p>
            <div style={{ backgroundColor: '#F9FAFB', padding: 20, borderRadius: 12, border: '1px solid #E5E7EB', marginTop: 12 }}>
              <p style={{ margin: '0 0 6px', fontWeight: 600, color: '#111827' }}>Hotel Sabharwal Hospitality Privacy & Grievance Cell</p>
              <p style={{ margin: '0 0 4px', fontSize: '0.9rem', color: '#4B5563' }}>Email: support@hotelsabharwal.com</p>
              <p style={{ margin: '0 0 4px', fontSize: '0.9rem', color: '#4B5563' }}>Helpline: +91 95355 45654</p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#4B5563' }}>Address: Bus station, Shantinagar Bus Stand KH Double Road 90 Kengal Hanumanthaiah Road Sudhama Nagar, Double Rd, opposite Shanthinagar, Bengaluru, Karnataka 560027</p>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
