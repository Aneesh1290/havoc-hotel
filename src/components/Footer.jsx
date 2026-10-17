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
              <li style={{ color: '#9CA3AF', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 10 }}><MapPin size={16} /> 123 Hospitality Ave, Mumbai, India</li>
              <li style={{ color: '#9CA3AF', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 10 }}><Phone size={16} /> +91 98765 43210</li>
              <li style={{ color: '#9CA3AF', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 10 }}><Mail size={16} /> reservations@sabharwal.com</li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: 0 }}>&copy; {new Date().getFullYear()} Sabharwal Hospitality. All rights reserved.</p>
          
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Link to="/privacy" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '0.85rem' }}>Privacy Policy</Link>
            <span style={{ color: '#4B5563' }}>|</span>
            <Link to="/terms" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '0.85rem' }}>Terms of Service</Link>
            <span style={{ color: '#4B5563' }}>|</span>
            <Link to="/cancellation" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '0.85rem' }}>Cancellation & Refund</Link>
          </div>

          <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: 0, textAlign: 'center' }}>
            Developed by <a href="https://whynotdev.in" target="_blank" rel="noopener noreferrer" style={{ color: '#F3F4F6', textDecoration: 'none', fontWeight: 500 }}>WhyNotDev</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
