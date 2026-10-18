import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';
import { useHotels } from '../context/HotelContext';

export default function Footer() {
  const { offersEnabled } = useHotels();
  return (
    <footer style={{ backgroundColor: '#0A192F', color: 'white', padding: '60px 0 30px', marginTop: 'auto' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 40, maxWidth: 1440, margin: '0 auto', padding: '0 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 40 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <img src="/logo.png" alt="Sabharwal Hospitality" style={{ height: 90, marginBottom: 5, transform: 'translateX(-15px)' }} />
            <p style={{ color: '#9CA3AF', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: 300 }}>
              A legacy of excellence in hospitality since 1965. Experience luxury, comfort, and unmatched service across our handpicked properties.
            </p>
          </div>
          
          <div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: 20, fontFamily: 'var(--font-serif)' }}>Quick Links</h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 0, margin: 0, listStyle: 'none' }}>
              <li><Link to="/" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }}>Home</Link></li>
              <li><Link to="/hotels" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }}>Our Hotels</Link></li>
              <li><Link to="/contact" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }}>Contact Us</Link></li>
              <li><Link to="/guest" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }}>Login</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: 20, fontFamily: 'var(--font-serif)' }}>Contact Information</h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 0, margin: 0, listStyle: 'none' }}>
              <li style={{ color: '#9CA3AF', fontSize: '0.9rem', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <MapPin size={18} style={{ flexShrink: 0, marginTop: 2, color: '#38BDF8' }} />
                <span>
                  <strong>Sabharwal Hospitality Pvt. Ltd.</strong><br/>
                  123 Hospitality Avenue, Nariman Point,<br/>
                  Mumbai, Maharashtra - 400021, India
                </span>
              </li>
              <li style={{ color: '#9CA3AF', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Phone size={16} style={{ color: '#38BDF8' }} />
                <a href="tel:+919876543210" style={{ color: '#9CA3AF', textDecoration: 'none' }}>+91 98765 43210</a>
              </li>
              <li style={{ color: '#9CA3AF', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Mail size={16} style={{ color: '#38BDF8' }} />
                <a href="mailto:reservations@sabharwal.com" style={{ color: '#9CA3AF', textDecoration: 'none' }}>reservations@sabharwal.com</a>
              </li>
            </ul>

            <div style={{ marginTop: 20 }}>
              <h5 style={{ fontSize: '0.85rem', color: '#E5E7EB', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Connect With Us</h5>
              <div style={{ display: 'flex', gap: 14 }}>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{ color: '#9CA3AF', textDecoration: 'none', transition: 'color 0.2s', fontSize: '0.85rem' }}>Instagram</a>
                <span style={{ color: '#4B5563' }}>•</span>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" style={{ color: '#9CA3AF', textDecoration: 'none', transition: 'color 0.2s', fontSize: '0.85rem' }}>Facebook</a>
                <span style={{ color: '#4B5563' }}>•</span>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" style={{ color: '#9CA3AF', textDecoration: 'none', transition: 'color 0.2s', fontSize: '0.85rem' }}>LinkedIn</a>
                <span style={{ color: '#4B5563' }}>•</span>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X" style={{ color: '#9CA3AF', textDecoration: 'none', transition: 'color 0.2s', fontSize: '0.85rem' }}>Twitter (X)</a>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Gateways, Card Brands & Security Badges for ICICI Compliance */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24, paddingBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
                Accepted Payment Methods
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 10px', backgroundColor: '#FFFFFF', color: '#1A1F71', borderRadius: 4, fontWeight: 700, fontSize: '0.8rem', border: '1px solid #D1D5DB' }}>VISA</span>
                <span style={{ padding: '4px 10px', backgroundColor: '#FFFFFF', color: '#EB001B', borderRadius: 4, fontWeight: 700, fontSize: '0.8rem', border: '1px solid #D1D5DB' }}>Mastercard</span>
                <span style={{ padding: '4px 10px', backgroundColor: '#FFFFFF', color: '#097939', borderRadius: 4, fontWeight: 700, fontSize: '0.8rem', border: '1px solid #D1D5DB' }}>RuPay</span>
                <span style={{ padding: '4px 10px', backgroundColor: '#FFFFFF', color: '#006FCF', borderRadius: 4, fontWeight: 700, fontSize: '0.8rem', border: '1px solid #D1D5DB' }}>American Express</span>
                <span style={{ padding: '4px 10px', backgroundColor: '#FFFFFF', color: '#5F259F', borderRadius: 4, fontWeight: 700, fontSize: '0.8rem', border: '1px solid #D1D5DB' }}>UPI / QR</span>
                <span style={{ padding: '4px 10px', backgroundColor: '#FFFFFF', color: '#0A2540', borderRadius: 4, fontWeight: 600, fontSize: '0.8rem', border: '1px solid #D1D5DB' }}>Net Banking</span>
              </div>
            </div>
          </div>
          <p style={{ margin: '14px 0 0', fontSize: '0.75rem', color: '#6B7280' }}>
            * Service Fulfillment Notice: We offer hotel lodging, room reservations, and hospitality stays. No physical product delivery or courier shipping is involved; booking confirmations and tax invoices are delivered instantly via Email and SMS upon successful payment authorization.
          </p>
        </div>
        
        <div className="footer-bottom" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: 0 }}>&copy; {new Date().getFullYear()} Sabharwal Hospitality Pvt. Ltd. All rights reserved.</p>
          
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/privacy" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '0.85rem' }}>Privacy Policy</Link>
            <span style={{ color: '#4B5563' }}>|</span>
            <Link to="/terms" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '0.85rem' }}>Terms & Conditions</Link>
            <span style={{ color: '#4B5563' }}>|</span>
            <Link to="/cancellation" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '0.85rem' }}>Refund & Cancellation Policy</Link>
          </div>

          <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: 0, textAlign: 'center' }}>
            Developed by <a href="https://whynotdev.in" target="_blank" rel="noopener noreferrer" style={{ color: '#F3F4F6', textDecoration: 'none', fontWeight: 500 }}>WhyNotDev</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
