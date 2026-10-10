import React from 'react';
import { Link } from 'react-router-dom';
import { Tag } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

import { useHotels } from '../context/HotelContext';

export default function Offers() {
  const { offers, offersEnabled } = useHotels();
  return (
    <div style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div className="container" style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', padding: '60px 40px', flex: 1 }}>
        <h1 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', color: '#111827', marginBottom: 16 }}>Special Offers</h1>
        <p style={{ fontSize: '1.1rem', color: '#6B7280', marginBottom: 40 }}>Exclusive deals and packages curated just for you.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, textAlign: 'left' }}>
          {!offersEnabled ? (
            <div style={{ padding: 40, textAlign: 'center', backgroundColor: 'white', borderRadius: 16, color: '#6B7280' }}>
              Currently, there are no special offers or packages available. Please check back later!
            </div>
          ) : offers.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', backgroundColor: 'white', borderRadius: 16, color: '#6B7280' }}>
              No offers have been added yet.
            </div>
          ) : (
            offers.map((offer) => (
              <div key={offer.id} style={{ backgroundColor: 'white', borderRadius: 16, padding: 32, display: 'flex', gap: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.05)', alignItems: 'center' }}>
                <div style={{ width: 80, height: 80, backgroundColor: offer.bg || '#FEF3C7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Tag size={32} color={offer.color || "#D97706"} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', marginBottom: 8, color: '#111827' }}>{offer.title}</h3>
                  <p style={{ color: '#4B5563', marginBottom: 16 }}>{offer.description}</p>
                  <div style={{ display: 'inline-block', backgroundColor: '#F3F4F6', padding: '6px 12px', borderRadius: 6, fontWeight: 600, letterSpacing: 2 }}>CODE: {offer.code}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
