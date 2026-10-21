import React from 'react';
import { ArrowRight, MapPin, Star, Waves, Coffee, Wifi, Mountain, Car, Dumbbell, Tent } from 'lucide-react';

const iconMap = {
  Waves, Coffee, Wifi, Mountain, Car, MapPin, Dumbbell, Tent
};

export default function PropertyCard({ property, onSelect }) {
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
    <div className="property-card">
      <div className="card-image-wrapper" style={{ backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {(property.image || property.images?.[0]) ? (
          <img src={property.image || property.images?.[0]} alt={property.name} className="card-image" />
        ) : (
          <div style={{ color: '#9CA3AF', fontSize: '0.9rem', fontWeight: 500 }}>No Image</div>
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
          Select & Book <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
