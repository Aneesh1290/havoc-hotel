import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useHotels } from '../context/HotelContext';

export default function Header() {
  const { offersEnabled } = useHotels();
  const guestProfile = JSON.parse(localStorage.getItem('guestProfile'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <header className="header" style={{ backgroundColor: 'white', borderBottom: '1px solid #E5E7EB', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
        <img src="/logo_dark.png" alt="Sabharwal Hospitality" className="brand-logo" style={{ objectFit: 'contain', imageRendering: '-webkit-optimize-contrast' }} />
      </Link>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <nav className="nav-links" style={{ display: 'flex', gap: 24, fontSize: '1rem', fontWeight: 500, alignItems: 'center' }}>
          <Link to="/" style={{ color: '#4B5563', textDecoration: 'none', transition: 'color 0.2s' }}>Home</Link>
          <Link to="/hotels" style={{ color: '#4B5563', textDecoration: 'none', transition: 'color 0.2s' }}>Our Hotels</Link>
          {offersEnabled && <Link to="/offers" style={{ color: '#4B5563', textDecoration: 'none', transition: 'color 0.2s' }}>Offers & Packages</Link>}
          <Link to="/contact" style={{ color: '#4B5563', textDecoration: 'none', transition: 'color 0.2s' }}>Contact Us</Link>
        </nav>

        {guestProfile ? (
          <Link to="/guest" style={{ 
            display: 'flex', alignItems: 'center', gap: 10,
            textDecoration: 'none', transition: 'transform 0.2s', padding: '4px 12px 4px 4px',
            backgroundColor: '#F3F4F6', borderRadius: 24
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.backgroundColor = '#E5E7EB'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.backgroundColor = '#F3F4F6'; }}
          title="Go to Dashboard"
          >
            <div style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: '50%', 
              backgroundColor: 'var(--primary)', color: 'white', 
              fontWeight: 600, fontSize: '0.9rem'
            }}>
              {guestProfile.name.charAt(0).toUpperCase()}
            </div>
            <span className="profile-name" style={{ color: '#111827', fontWeight: 600, fontSize: '0.95rem' }}>
              {guestProfile.name.split(' ')[0]}
            </span>
          </Link>
        ) : (
          <Link to="/guest" style={{ color: 'var(--primary)', textDecoration: 'none', transition: 'color 0.2s', padding: '6px 16px', backgroundColor: '#F3F4F6', borderRadius: 20 }}>Login</Link>
        )}

        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ color: 'var(--primary)', marginLeft: 8 }}>
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-menu solid" style={{ display: 'flex' }}>
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
          <Link to="/hotels" onClick={() => setMobileMenuOpen(false)}>Our Hotels</Link>
          {offersEnabled && <Link to="/offers" onClick={() => setMobileMenuOpen(false)}>Offers & Packages</Link>}
          <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>Contact Us</Link>
        </div>
      )}
    </header>
  );
}
