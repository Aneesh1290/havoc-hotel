import React from 'react';
import { ArrowRight, MapPin, Star, Waves, Coffee, Wifi, Mountain, Car, Dumbbell, Tent } from 'lucide-react';

const iconMap = {
  Waves, Coffee, Wifi, Mountain, Car, MapPin, Dumbbell, Tent
};

export default function PropertyCard({ property, onSelect }) {
  const isBanquet = property.propertyType === 'banquet';
  const status = property.status || 'active';
  const isComingSoon = status === 'coming_soon';
  const isDisabled = status === 'disabled';

  // Safe parse amenities if it's a string from db
  let parsedAmenities = property.amenities || [];
  if (typeof parsedAmenities === 'string') {
    try {
      parsedAmenities = JSON.parse(parsedAmenities);
    } catch (e) {
      parsedAmenities = [];
    }
  }

  return (
    <div className="property-card" style={{ position: 'relative', opacity: isDisabled ? 0.75 : 1 }}>
      <div className="card-image-wrapper" style={{ backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {(property.image || property.images?.[0]) ? (
          <img src={property.image || property.images?.[0]} alt={property.name} className="card-image" />
        ) : (
          <div style={{ color: '#9CA3AF', fontSize: '0.9rem', fontWeight: 500 }}>No Image</div>
        )}

        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {isBanquet && (
            <div style={{
              backgroundColor: 'rgba(16, 38, 65, 0.9)',
              backdropFilter: 'blur(4px)',
              color: 'white',
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              🏛️ Banquet & Event Hall
            </div>
          )}

          {isComingSoon && (
            <div style={{
              backgroundColor: '#D97706',
              color: '#FFFFFF',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              boxShadow: '0 2px 8px rgba(217, 119, 6, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}>
              ⏳ Coming Soon
            </div>
          )}

          {isDisabled && (
            <div style={{
              backgroundColor: '#4B5563',
              color: '#FFFFFF',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}>
              🔒 Currently Unavailable
            </div>
          )}
        </div>

        {!isComingSoon && !isDisabled && (
          <button className="card-arrow-btn" aria-label="View property">
            <ArrowRight size={18} />
          </button>
        )}
      </div>
      <div className="card-content">
        <h3 className="card-title">{property.name}</h3>
        <div className="card-location">
          <MapPin size={14} />
          <span>{property.location}</span>
        </div>

        {isBanquet && property.capacity > 0 && (
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 6, 
            backgroundColor: '#FEF3C7', 
            color: '#92400E', 
            padding: '4px 10px', 
            borderRadius: 6, 
            fontSize: '0.8rem', 
            fontWeight: 600,
            marginBottom: 10
          }}>
            Capacity: Up to {property.capacity} Guests
          </div>
        )}
        
        <div className="amenities-grid">
          {parsedAmenities.slice(0, 4).map((amenity, idx) => {
            const Icon = iconMap[amenity.icon] || Star;
            return (
              <div key={idx} className="amenity-item" title={amenity.name}>
                <Icon size={18} strokeWidth={1.5} />
                <span>{amenity.name}</span>
              </div>
            );
          })}
        </div>
        
        {isComingSoon ? (
          <button 
            className="book-btn" 
            disabled 
            style={{ 
              backgroundColor: '#F3F4F6', 
              color: '#92400E', 
              borderColor: '#FDE68A', 
              cursor: 'not-allowed', 
              fontWeight: 700 
            }}
          >
            ⏳ Coming Soon — Reservations Opening Soon
          </button>
        ) : isDisabled ? (
          <button 
            className="book-btn" 
            disabled 
            style={{ 
              backgroundColor: '#F3F4F6', 
              color: '#9CA3AF', 
              cursor: 'not-allowed' 
            }}
          >
            Currently Unavailable
          </button>
        ) : (
          <button className="book-btn" onClick={() => onSelect(property)}>
            {isBanquet ? 'Reserve / Inquire' : 'Select & Book'} <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
