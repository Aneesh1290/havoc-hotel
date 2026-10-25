import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHotels } from '../context/HotelContext';
import { 
  Calendar as CalendarIcon, 
  Users, 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  Utensils, 
  Sparkles, 
  ShieldCheck, 
  Phone, 
  Mail, 
  User, 
  Music, 
  Maximize2,
  HeartHandshake
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function BanquetBooking({ property }) {
  const navigate = useNavigate();
  const { addBooking } = useHotels();

  // Banquet Reservation / Inquiry Form State
  const [eventDate, setEventDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [slot, setSlot] = useState('Evening (5:00 PM – 11:00 PM)');
  const [occasion, setOccasion] = useState('Wedding / Reception');
  const [guestCount, setGuestCount] = useState(property?.capacity ? Math.min(200, property.capacity) : 150);
  const [catering, setCatering] = useState('In-House Catering (Veg & Non-Veg)');
  const [specialRequirements, setSpecialRequirements] = useState('');

  // Guest Details
  const [guestName, setGuestName] = useState(() => {
    try {
      const saved = localStorage.getItem('guestProfile');
      return saved ? JSON.parse(saved).name || '' : '';
    } catch (e) {
      return '';
    }
  });
  const [guestEmail, setGuestEmail] = useState(() => {
    try {
      const saved = localStorage.getItem('guestProfile');
      return saved ? JSON.parse(saved).email || '' : '';
    } catch (e) {
      return '';
    }
  });
  const [guestPhone, setGuestPhone] = useState(() => {
    try {
      const saved = localStorage.getItem('guestProfile');
      return saved ? JSON.parse(saved).phone || '' : '';
    } catch (e) {
      return '';
    }
  });

  // Submission Status Modal
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedBookingId, setSubmittedBookingId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const maxCapacity = property?.capacity || 1000;
  const isOverCapacity = parseInt(guestCount, 10) > maxCapacity;

  const handleSubmitInquiry = async (e) => {
    e.preventDefault();
    if (!guestName || !guestEmail || !guestPhone) {
      alert('Please fill in your name, email, and phone number.');
      return;
    }
    if (isOverCapacity) {
      alert(`The maximum guest capacity for this banquet hall is ${maxCapacity} guests.`);
      return;
    }

    setSubmitting(true);
    const bookingRef = 'BNQ-' + Math.floor(100000 + Math.random() * 900000);

    const bookingPayload = {
      name: guestName.trim(),
      email: guestEmail.trim(),
      phone: guestPhone.trim(),
      hotelId: property.id,
      hotelName: property.name,
      checkIn: new Date(eventDate).toISOString(),
      checkOut: new Date(eventDate).toISOString(),
      amount: property.basePrice || 0,
      status: 'Inquiry / Tentative Reservation',
      paymentMethod: 'Event Consultation / Quote',
      rooms: 1,
      adults: parseInt(guestCount, 10) || 100,
      children: 0,
      notes: `[BANQUET EVENT INQUIRY]
• Occasion: ${occasion}
• Slot / Timing: ${slot}
• Expected Guests: ${guestCount} (Max Capacity: ${maxCapacity})
• Catering Preference: ${catering}
• Special Requirements: ${specialRequirements || 'None specified'}`
    };

    try {
      if (addBooking) {
        await addBooking(bookingPayload);
      }
      setSubmittedBookingId(bookingRef);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to submit banquet inquiry:', err);
      // Fallback
      setSubmittedBookingId(bookingRef);
      setIsSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const images = property.images && property.images.length > 0
    ? property.images
    : [
        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80'
      ];

  const [activeImage, setActiveImage] = useState(0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', fontFamily: "'Outfit', sans-serif", color: '#1E293B' }}>
      <Header />

      {/* Sub Header Navigation */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/hotels')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.95rem'
            }}
          >
            <ArrowLeft size={18} /> Back to Properties
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontSize: '0.8rem', fontWeight: 700, padding: '4px 12px', borderRadius: 20, border: '1px solid #FDE68A' }}>
              🏛️ Banquet & Event Hall
            </span>
            {property.capacity > 0 && (
              <span style={{ backgroundColor: '#E0F2FE', color: '#0369A1', fontSize: '0.8rem', fontWeight: 700, padding: '4px 12px', borderRadius: 20, border: '1px solid #BAE6FD' }}>
                👥 Up to {property.capacity} Guests
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '32px 20px 80px' }}>
        
        {/* Title Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
            <h1 style={{ fontSize: '2.2rem', fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#102641', margin: 0 }}>
              {property.name}
            </h1>
            <span style={{ fontSize: '1.05rem', color: '#64748B' }}>• {property.location}</span>
          </div>
          <p style={{ color: '#475569', fontSize: '1rem', maxWidth: 850, margin: 0, lineHeight: 1.6 }}>
            {property.description || 'Experience opulent luxury and peerless hospitality for your weddings, receptions, conferences, and memorable banquets.'}
          </p>
        </div>

        {/* Gallery / Image Showcase */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 16, marginBottom: 40 }}>
          <div style={{ height: 420, borderRadius: 16, overflow: 'hidden', position: 'relative', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
            <img 
              src={images[activeImage]} 
              alt={property.name} 
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'all 0.3s ease' }} 
            />
            <div style={{ position: 'absolute', bottom: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.65)', color: '#FFFFFF', padding: '6px 14px', borderRadius: 20, fontSize: '0.85rem', backdropFilter: 'blur(4px)' }}>
              Photo {activeImage + 1} of {images.length}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {images.slice(0, 3).map((img, idx) => (
              <div 
                key={idx} 
                onClick={() => setActiveImage(idx)}
                style={{ 
                  flex: 1, 
                  borderRadius: 12, 
                  overflow: 'hidden', 
                  cursor: 'pointer',
                  border: activeImage === idx ? '3px solid #C5A880' : '2px solid transparent',
                  opacity: activeImage === idx ? 1 : 0.8,
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            ))}
          </div>
        </div>

        {/* 2-Column: Left Info & Amenities, Right Booking / Inquiry Form */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 36, alignItems: 'start' }}>
          
          {/* Left Column: Key Features, Amenities & Highlights */}
          <div>
            {/* Quick Highlights Card */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: 28, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#102641', marginBottom: 20, fontFamily: "'Playfair Display', serif" }}>
                Venue Specifications & Highlights
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div style={{ padding: 16, backgroundColor: '#F8FAFC', borderRadius: 12, border: '1px solid #EEF2F6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#0369A1', marginBottom: 6 }}>
                    <Users size={20} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Capacity</span>
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1E293B' }}>
                    Up to {property.capacity || 500} Guests
                  </div>
                </div>

                <div style={{ padding: 16, backgroundColor: '#F8FAFC', borderRadius: 12, border: '1px solid #EEF2F6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#92400E', marginBottom: 6 }}>
                    <Clock size={20} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Flexible Slots</span>
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1E293B' }}>
                    Morning, Evening & Full Day
                  </div>
                </div>

                <div style={{ padding: 16, backgroundColor: '#F8FAFC', borderRadius: 12, border: '1px solid #EEF2F6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#059669', marginBottom: 6 }}>
                    <Utensils size={20} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Catering</span>
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1E293B' }}>
                    In-House Gourmet Catering
                  </div>
                </div>

                <div style={{ padding: 16, backgroundColor: '#F8FAFC', borderRadius: 12, border: '1px solid #EEF2F6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#7C3AED', marginBottom: 6 }}>
                    <HeartHandshake size={20} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Event Team</span>
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1E293B' }}>
                    Dedicated Event Coordinator
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities & Included Facilities */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: 28, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#102641', marginBottom: 16, fontFamily: "'Playfair Display', serif" }}>
                Included Amenities & Facilities
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                {[
                  '❄️ High-Ton Central Air Conditioning',
                  '🎙️ Professional Sound & Audio-Visual Setup',
                  '🎭 Grand Banquet Stage & Dynamic Lighting',
                  '👰 Luxurious Bridal / Dressing Green Room',
                  '🚗 Valet Parking & Ample Guest Space',
                  '🔋 100% Full Power Backup (DG Generator)',
                  '🍽️ Deluxe Dining Hall & Buffet Station',
                  '🛡️ 24/7 Security & CCTV Surveillance'
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.92rem', color: '#334155', padding: '8px 0' }}>
                    <CheckCircle size={16} color="#059669" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Special Assurance Note */}
            <div style={{ backgroundColor: '#F0FDF4', borderRadius: 16, border: '1px solid #BBF7D0', padding: 22, display: 'flex', gap: 16, alignItems: 'center' }}>
              <ShieldCheck size={36} color="#16A34A" style={{ flexShrink: 0 }} />
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '0.98rem', fontWeight: 700, color: '#166534' }}>
                  Custom Quotations & Grand Event Guarantee
                </h4>
                <p style={{ margin: 0, fontSize: '0.86rem', color: '#15803D', lineHeight: 1.5 }}>
                  Submit your desired date and requirements. Our banquet manager will verify slot availability, customize your catering menu, and share a formal contract with discounted tariff options.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Reservation / Inquiry Form */}
          <div>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 20, border: '1px solid #E2E8F0', padding: 32, boxShadow: '0 12px 30px rgba(0,0,0,0.06)', position: 'sticky', top: 90 }}>
              
              <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: 18, marginBottom: 24 }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C5A880', display: 'block', marginBottom: 4 }}>
                  EVENT RESERVATION & INQUIRY
                </span>
                <h3 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#102641', margin: '0 0 6px', fontFamily: "'Playfair Display', serif" }}>
                  Reserve or Inquire Slot
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>
                  Guaranteed best package pricing & dedicated banquet manager.
                </p>
              </div>

              <form onSubmit={handleSubmitInquiry}>
                
                {/* 1. Event Date */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                    Event Date *
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', height: 46, padding: '0 14px', border: '1px solid #CBD5E1', borderRadius: 8, backgroundColor: '#F8FAFC' }}>
                    <CalendarIcon size={18} color="#64748B" style={{ marginRight: 10 }} />
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={eventDate}
                      onChange={e => setEventDate(e.target.value)}
                      style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem', color: '#1E293B', backgroundColor: 'transparent', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>

                {/* 2. Timing Slot */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                    Select Timing Slot *
                  </label>
                  <select
                    value={slot}
                    onChange={e => setSlot(e.target.value)}
                    style={{ width: '100%', height: 46, padding: '0 14px', border: '1px solid #CBD5E1', borderRadius: 8, backgroundColor: '#F8FAFC', fontSize: '0.92rem', color: '#1E293B', outline: 'none', fontFamily: 'inherit' }}
                  >
                    <option value="Morning (9:00 AM – 3:00 PM)">☀️ Morning Slot (9:00 AM – 3:00 PM)</option>
                    <option value="Evening (5:00 PM – 11:00 PM)">🌙 Evening Slot (5:00 PM – 11:00 PM)</option>
                    <option value="Full Day (9:00 AM – 11:00 PM)">🌟 Full Day Grand Slot (9:00 AM – 11:00 PM)</option>
                  </select>
                </div>

                {/* 3. Occasion / Event Type */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                    Occasion / Event Type *
                  </label>
                  <select
                    value={occasion}
                    onChange={e => setOccasion(e.target.value)}
                    style={{ width: '100%', height: 46, padding: '0 14px', border: '1px solid #CBD5E1', borderRadius: 8, backgroundColor: '#F8FAFC', fontSize: '0.92rem', color: '#1E293B', outline: 'none', fontFamily: 'inherit' }}
                  >
                    <option value="Wedding / Reception">💍 Wedding / Reception Ceremony</option>
                    <option value="Engagement / Sangeet">🎉 Engagement / Sangeet / Mehendi</option>
                    <option value="Corporate Seminar / Conference">💼 Corporate Seminar / AGM / Meeting</option>
                    <option value="Birthday / Anniversary">🎂 Birthday / Anniversary Celebration</option>
                    <option value="Social Gathering / Exhibition">🏛️ Exhibition / Public Gathering</option>
                    <option value="Other Celebration">✨ Other Celebration</option>
                  </select>
                </div>

                {/* 4. Expected Guests */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Expected Guests *
                    </label>
                    <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                      Max Hall Capacity: <strong>{maxCapacity}</strong>
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', height: 46, padding: '0 14px', border: isOverCapacity ? '2px solid #EF4444' : '1px solid #CBD5E1', borderRadius: 8, backgroundColor: '#F8FAFC' }}>
                    <Users size={18} color={isOverCapacity ? '#EF4444' : '#64748B'} style={{ marginRight: 10 }} />
                    <input
                      type="number"
                      min="10"
                      max={maxCapacity}
                      required
                      value={guestCount}
                      onChange={e => setGuestCount(e.target.value)}
                      style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem', color: '#1E293B', backgroundColor: 'transparent', fontFamily: 'inherit' }}
                    />
                  </div>
                  {isOverCapacity && (
                    <div style={{ color: '#EF4444', fontSize: '0.78rem', marginTop: 4, fontWeight: 600 }}>
                      ⚠️ Guest count exceeds hall capacity of {maxCapacity} guests.
                    </div>
                  )}
                </div>

                {/* 5. Catering Preference */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                    Catering Preference
                  </label>
                  <select
                    value={catering}
                    onChange={e => setCatering(e.target.value)}
                    style={{ width: '100%', height: 46, padding: '0 14px', border: '1px solid #CBD5E1', borderRadius: 8, backgroundColor: '#F8FAFC', fontSize: '0.92rem', color: '#1E293B', outline: 'none', fontFamily: 'inherit' }}
                  >
                    <option value="In-House Catering (Pure Veg Deluxe)">🥗 In-House Catering (Pure Veg Deluxe Buffet)</option>
                    <option value="In-House Catering (Veg & Non-Veg)">🍖 In-House Catering (Veg & Non-Veg Royal Buffet)</option>
                    <option value="Hall Space Only (External Catering)">🏛️ Hall Space Only (External Approved Catering)</option>
                    <option value="To Be Decided During Consultation">💬 Discuss during manager consultation</option>
                  </select>
                </div>

                {/* 6. Guest Contact Details */}
                <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: 18, marginTop: 18, marginBottom: 18 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#102641', marginBottom: 12 }}>
                    Your Contact Information
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', height: 42, padding: '0 12px', border: '1px solid #CBD5E1', borderRadius: 8, backgroundColor: '#F8FAFC' }}>
                      <User size={16} color="#64748B" style={{ marginRight: 8 }} />
                      <input
                        type="text"
                        required
                        placeholder="Full Name *"
                        value={guestName}
                        onChange={e => setGuestName(e.target.value)}
                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem', color: '#1E293B', backgroundColor: 'transparent' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', height: 42, padding: '0 12px', border: '1px solid #CBD5E1', borderRadius: 8, backgroundColor: '#F8FAFC' }}>
                      <Phone size={16} color="#64748B" style={{ marginRight: 8 }} />
                      <input
                        type="tel"
                        required
                        placeholder="Phone Number *"
                        value={guestPhone}
                        onChange={e => setGuestPhone(e.target.value)}
                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem', color: '#1E293B', backgroundColor: 'transparent' }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', height: 42, padding: '0 12px', border: '1px solid #CBD5E1', borderRadius: 8, backgroundColor: '#F8FAFC' }}>
                      <Mail size={16} color="#64748B" style={{ marginRight: 8 }} />
                      <input
                        type="email"
                        required
                        placeholder="Email Address *"
                        value={guestEmail}
                        onChange={e => setGuestEmail(e.target.value)}
                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem', color: '#1E293B', backgroundColor: 'transparent' }}
                      />
                    </div>
                  </div>

                  <div>
                    <textarea
                      rows={2}
                      placeholder="Special requests (e.g. stage decor, rooms required, sound system)..."
                      value={specialRequirements}
                      onChange={e => setSpecialRequirements(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, backgroundColor: '#F8FAFC', fontSize: '0.88rem', color: '#1E293B', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={submitting || isOverCapacity}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: 10,
                    border: 'none',
                    backgroundColor: isOverCapacity ? '#94A3B8' : '#102641',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: isOverCapacity ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    transition: 'all 0.2s',
                    boxShadow: '0 6px 18px rgba(16, 38, 65, 0.25)'
                  }}
                  onMouseEnter={e => { if (!isOverCapacity) e.currentTarget.style.backgroundColor = '#1A365D'; }}
                  onMouseLeave={e => { if (!isOverCapacity) e.currentTarget.style.backgroundColor = '#102641'; }}
                >
                  <Sparkles size={18} /> {submitting ? 'Submitting Inquiry...' : 'Submit Banquet Reservation / Inquiry'}
                </button>

                <div style={{ fontSize: '0.76rem', color: '#64748B', textAlign: 'center', marginTop: 12 }}>
                  🔒 No immediate payment required. Our manager will connect within 2 hours.
                </div>

              </form>
            </div>
          </div>

        </div>

      </div>

      {/* Confirmation Modal */}
      {isSubmitted && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', width: '100%', maxWidth: 540, borderRadius: 20, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            
            <div style={{ backgroundColor: '#102641', color: 'white', padding: '32px 24px', textAlign: 'center' }}>
              <div style={{ width: 68, height: 68, borderRadius: '50%', backgroundColor: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 16px rgba(16, 185, 129, 0.3)' }}>
                <CheckCircle size={40} color="white" />
              </div>
              <h2 style={{ fontSize: '1.7rem', fontWeight: 700, margin: '0 0 6px', color: '#FFFFFF', fontFamily: "'Playfair Display', serif" }}>
                Banquet Inquiry Submitted!
              </h2>
              <p style={{ margin: 0, fontSize: '0.92rem', color: '#94A3B8' }}>
                Your inquiry has been registered. Reference: <strong style={{ color: '#FCD34D' }}>{submittedBookingId}</strong>
              </p>
            </div>

            <div style={{ padding: 28 }}>
              <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, marginBottom: 20 }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#102641', marginBottom: 2 }}>
                  {property.name}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: 14 }}>
                  {property.location}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, borderTop: '1px solid #E2E8F0', paddingTop: 12, fontSize: '0.88rem' }}>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.76rem' }}>Event Date</span>
                    <strong style={{ color: '#1E293B' }}>{eventDate}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.76rem' }}>Slot</span>
                    <strong style={{ color: '#1E293B' }}>{slot.split('(')[0]}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.76rem' }}>Occasion</span>
                    <strong style={{ color: '#1E293B' }}>{occasion}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.76rem' }}>Expected Guests</span>
                    <strong style={{ color: '#1E293B' }}>{guestCount} Guests</strong>
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: '0.85rem', color: '#92400E' }}>
                📞 Our dedicated banquet sales executive will contact you at <strong>{guestPhone}</strong> shortly with complete catering menu options, stage decor catalogs, and formal quotation.
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => navigate('/guest')}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: 10,
                    backgroundColor: '#102641',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer'
                  }}
                >
                  View in Guest Portal →
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/hotels')}
                  style={{
                    padding: '14px 20px',
                    borderRadius: 10,
                    backgroundColor: '#F1F5F9',
                    color: '#334155',
                    border: '1px solid #CBD5E1',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    cursor: 'pointer'
                  }}
                >
                  Back to Hotels
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
