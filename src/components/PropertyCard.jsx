import React from 'react';
import { ArrowRight, MapPin, Star, Waves, Coffee, Wifi, Mountain, Car, Dumbbell, Tent } from 'lucide-react';

const iconMap = {
  Waves, Coffee, Wifi, Mountain, Car, MapPin, Dumbbell, Tent
};

export default function PropertyCard({ property, onSelect }) {
  const isBanquet = property.propertyType === 'banquet';

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
    <div className="property-card" style={{ position: 'relative' }}>
      <div className="card-image-wrapper" style={{ backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {(property.image || property.images?.[0]) ? (
          <img src={property.image || property.images?.[0]} alt={property.name} className="card-image" />
        ) : (
          <div style={{ color: '#9CA3AF', fontSize: '0.9rem', fontWeight: 500 }}>No Image</div>
        )}

        {isBanquet && (
          <div style={{
            position: 'absolute',
            top: 12,
            left: 12,
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

        <button className="card-arrow-btn" aria-label="View property">
          <ArrowRight size={18} />
        </button>
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
        
        <button className="book-btn" onClick={() => onSelect(property)}>
          {isBanquet ? 'Reserve / Inquire' : 'Select & Book'} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
