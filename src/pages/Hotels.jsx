import React, { useState } from 'react';
import { useHotels } from '../context/HotelContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PropertyCard from '../components/PropertyCard';

export default function Hotels() {
  const { properties } = useHotels();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'hotel' | 'banquet'

  const filteredProperties = (properties || []).filter(p => {
    if (activeFilter === 'all') return true;
    const type = p.propertyType || 'hotel';
    return type === activeFilter;
  });

  const handleCardSelect = (property) => {
    if (property.status === 'coming_soon') {
      alert(`${property.name} is coming soon! Online reservations will open shortly.`);
      return;
    }
    if (property.status === 'disabled') {
      alert(`${property.name} is currently unavailable for bookings.`);
      return;
    }
    navigate(`/book/${property.id}`);
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div className="page-container">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: '#111827', textAlign: 'center', marginBottom: 16 }}>Our Handpicked Properties</h1>
          <p style={{ color: '#6B7280', fontSize: '1.05rem', textAlign: 'center', maxWidth: 600, margin: '0 auto 24px' }}>
            Choose from luxury hotels & stays or grand banquet & event halls for your special occasions.
          </p>

          {/* Category Filter Tabs */}
          <div style={{ display: 'inline-flex', background: '#FFFFFF', padding: '6px', borderRadius: 50, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', gap: 8 }}>
            {[
              { id: 'all', label: 'All Properties', icon: '✨' },
              { id: 'hotel', label: 'Hotels & Stays', icon: '🏨' },
              { id: 'banquet', label: 'Banquet & Event Halls', icon: '🏛️' }
            ].map(tab => {
              const active = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 22px',
                    borderRadius: 40,
                    border: 'none',
                    backgroundColor: active ? '#102641' : 'transparent',
                    color: active ? '#FFFFFF' : '#4B5563',
                    fontWeight: active ? 700 : 500,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: active ? '0 4px 12px rgba(16, 38, 65, 0.2)' : 'none'
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span style={{
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: 10,
                    backgroundColor: active ? 'rgba(255,255,255,0.2)' : '#F3F4F6',
                    color: active ? '#FFFFFF' : '#6B7280',
                    fontWeight: 600
                  }}>
                    {tab.id === 'all' 
                      ? properties?.length || 0 
                      : (properties?.filter(p => (p.propertyType || 'hotel') === tab.id)?.length || 0)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="hotels-grid">
          {filteredProperties && filteredProperties.length > 0 ? (
            filteredProperties.map((property) => (
              <div key={property.id} className="hotel-card-wrapper">
                <PropertyCard 
                  property={property} 
                  onSelect={handleCardSelect} 
                />
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '60px 20px', color: '#6B7280' }}>
              <p style={{ fontSize: '1.2rem', marginBottom: 12 }}>No properties found in this category.</p>
              <button 
                onClick={() => setActiveFilter('all')}
                style={{ padding: '8px 18px', backgroundColor: '#102641', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
              >
                View All Properties
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
