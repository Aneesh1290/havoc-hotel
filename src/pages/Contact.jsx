import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Send } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Contact() {
  return (
    <div style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div className="page-container" style={{ maxWidth: 1000 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', color: '#111827' }}>Contact Us</h1>
        </div>
        
        <div className="contact-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', marginBottom: 16 }}>Registered Corporate Office</h3>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, color: '#4B5563', marginBottom: 14 }}>
                <MapPin size={20} style={{ flexShrink: 0, marginTop: 2 }} color="var(--primary)" />
                <span>
                  <strong>Sabharwal Hospitality Pvt. Ltd.</strong><br/>
                  123 Hospitality Avenue, Nariman Point,<br/>
                  Mumbai, Maharashtra - 400021, India
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#4B5563', marginBottom: 14 }}>
                <Phone size={20} color="var(--primary)" />
                <span>+91 98765 43210 (24x7 Guest Desk)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#4B5563', marginBottom: 14 }}>
                <Mail size={20} color="var(--primary)" />
                <span>reservations@sabharwal.com</span>
              </div>
              <div style={{ backgroundColor: '#F9FAFB', padding: '16px', borderRadius: 10, border: '1px solid #E5E7EB', marginTop: 12 }}>
                <div style={{ fontSize: '0.85rem', color: '#111827', fontWeight: 600, marginBottom: 4 }}>Operating Hours:</div>
                <div style={{ fontSize: '0.82rem', color: '#6B7280' }}>Front Desk & Reservations: 24 Hours / 7 Days a week</div>
                <div style={{ fontSize: '0.82rem', color: '#6B7280', marginTop: 4 }}>Corporate & Billing Support: Mon - Sat (9:30 AM - 6:30 PM IST)</div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#111827', marginBottom: 12 }}>Official Social Channels</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.9rem' }}>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>📸 Instagram: @sabharwal_hospitality</a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>👥 Facebook: facebook.com/sabharwalhospitality</a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>💼 LinkedIn: linkedin.com/company/sabharwal-hospitality</a>
              </div>
            </div>
          </div>
          
          <div style={{ backgroundColor: 'white', borderRadius: 16, padding: 32, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', marginBottom: 24 }}>Send us a message</h3>
            <form onSubmit={e => { e.preventDefault(); alert('Message sent!'); }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>Name</label>
                  <input type="text" placeholder="Your name" style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #D1D5DB' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>Email</label>
                  <input type="email" placeholder="Your email" style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #D1D5DB' }} required />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>Subject</label>
                <input type="text" placeholder="How can we help?" style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #D1D5DB' }} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>Message</label>
                <textarea placeholder="Write your message here..." style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #D1D5DB', minHeight: 120, fontFamily: 'inherit' }} required></textarea>
              </div>
              <button type="submit" style={{ alignSelf: 'flex-start', padding: '12px 24px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Send size={16} /> Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
