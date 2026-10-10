import React from 'react';
import { useHotels } from '../context/HotelContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PropertyCard from '../components/PropertyCard';

export default function Hotels() {
  const { properties } = useHotels();
  const navigate = useNavigate();

  const handleCardSelect = (property) => {
    navigate(`/book/${property.id}`);
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div className="page-container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 60 }}>
          <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: '#111827', textAlign: 'center' }}>Our Handpicked Properties</h1>
        </div>
        <div className="hotels-grid">
          {properties.map((property) => (
            <div key={property.id} className="hotel-card-wrapper">
              <PropertyCard 
                property={property} 
                onSelect={handleCardSelect} 
              />
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
