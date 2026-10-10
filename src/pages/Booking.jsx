import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useHotels } from '../context/HotelContext';
import { Calendar as CalendarIcon, Users, ArrowLeft, CheckCircle, X, Plus, Minus } from 'lucide-react';
import { format, parseISO, differenceInDays, areIntervalsOverlapping, isSameDay } from 'date-fns';
import Footer from '../components/Footer';

export default function Booking() {
  const { propertyId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { properties, rooms, bookings, addBooking, taxRate } = useHotels();

  const property = properties.find(p => p.id === propertyId);
  const propertyRooms = rooms.filter(r => r.propertyId === propertyId);

  // Initialize state from router state or defaults
  const [checkIn, setCheckIn] = useState(location.state?.checkIn ? parseISO(location.state.checkIn) : new Date());
  const [checkOut, setCheckOut] = useState(location.state?.checkOut ? parseISO(location.state.checkOut) : new Date(Date.now() + 86400000));
  const [guests, setGuests] = useState(location.state?.guests || { adults: 2, children: 0, rooms: 1 });

  // Temporary state for the search bar inputs
  const [inputCheckIn, setInputCheckIn] = useState(checkIn);
  const [inputCheckOut, setInputCheckOut] = useState(checkOut);
  const [inputGuests, setInputGuests] = useState(guests);

  const handleUpdateSearch = () => {
    setCheckIn(inputCheckIn);
    setCheckOut(inputCheckOut);
    setGuests(inputGuests);
  };

  const applySuggestion = (requiredRooms) => {
    const newGuests = { ...guests, rooms: requiredRooms };
    setGuests(newGuests);
    setInputGuests(newGuests);
  };

  const [selectedRooms, setSelectedRooms] = useState({});
  const totalSelectedCount = Object.values(selectedRooms).reduce((a, b) => a + b, 0);
  
  // Final form state
  const [showFinalForm, setShowFinalForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', description: '' });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!property) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Property not found. <Link to="/">Go back</Link></div>;
  }

  const nights = differenceInDays(checkOut, checkIn) || 1;
  const subtotal = propertyRooms.reduce((sum, r) => sum + (selectedRooms[r.id] || 0) * r.pricePerNight * nights, 0);
  const taxes = subtotal * (taxRate / 100);
  const totalPrice = subtotal + taxes;

  const totalSelectedCapacity = propertyRooms.reduce((sum, r) => sum + (selectedRooms[r.id] || 0) * r.capacity, 0);
  const canContinue = totalSelectedCount > 0 && 
                      totalSelectedCount === parseInt(guests.rooms) && 
                      totalSelectedCapacity >= parseInt(guests.adults);

  const handleContinue = () => {
    if (totalSelectedCount === 0) return alert("Please select at least one room.");
    if (totalSelectedCount !== parseInt(guests.rooms)) return alert(`Please select exactly ${guests.rooms} room${guests.rooms > 1 ? 's' : ''} to match your search.`);
    if (totalSelectedCapacity < parseInt(guests.adults)) {
      return alert(`Your selected rooms can only accommodate ${totalSelectedCapacity} guests, but you have ${guests.adults} guests in your search.`);
    }

    setShowFinalForm(true);
  };

  const handleConfirmBooking = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    Object.entries(selectedRooms).forEach(([roomId, count]) => {
      if (count > 0) {
        const room = propertyRooms.find(r => r.id === roomId);
        addBooking({
          name: formData.name,
          hotelId: property.id,
          hotelName: property.name,
          checkIn: checkIn.toISOString(),
          checkOut: checkOut.toISOString(),
          amount: room.pricePerNight * nights * count * (1 + taxRate / 100),
          status: 'Confirmed',
          rooms: count,
          roomId: room.id
        });
      }
    });

    alert("Booking confirmed successfully! You can view it in the Admin Dashboard.");
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header className="header" style={{ backgroundColor: 'white', borderBottom: '1px solid #E5E7EB' }}>
        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#4B5563', fontWeight: 500 }}>
            <ArrowLeft size={20} /> <span className="hide-on-mobile">Back</span>
          </button>
          <h1 className="booking-header-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1.2 }}>
            {property.name}
            <span className="hide-on-mobile"> - Reservation</span>
          </h1>
        </div>
        <div className="header-right" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo_dark.png" alt="Sabharwal Hospitality" className="brand-logo" />
        </div>
      </header>

      <main className="booking-main-layout" style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32 }}>
        
        {/* Left Column: Search & Rooms */}
        <div>
          {/* Top Search Bar */}
          <div className="booking-search-form" style={{ backgroundColor: 'white', padding: 24, borderRadius: 16, border: '1px solid #E5E7EB', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 16, alignItems: 'end', marginBottom: 40, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>Check-in</label>
              <div style={{ display: 'flex', alignItems: 'center', height: 48, padding: '0 16px', border: '1px solid #D1D5DB', borderRadius: 8, backgroundColor: '#F9FAFB' }}>
                <input type="date" value={format(inputCheckIn, 'yyyy-MM-dd')} onChange={e => e.target.value && setInputCheckIn(parseISO(e.target.value))} style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem', color: '#111827', backgroundColor: 'transparent', fontFamily: 'inherit' }} />
              </div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>Check-out</label>
              <div style={{ display: 'flex', alignItems: 'center', height: 48, padding: '0 16px', border: '1px solid #D1D5DB', borderRadius: 8, backgroundColor: '#F9FAFB' }}>
                <input type="date" value={format(inputCheckOut, 'yyyy-MM-dd')} onChange={e => e.target.value && setInputCheckOut(parseISO(e.target.value))} style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem', color: '#111827', backgroundColor: 'transparent', fontFamily: 'inherit' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>Rooms</label>
              <div style={{ display: 'flex', alignItems: 'center', height: 48, padding: '0 12px', border: '1px solid #D1D5DB', borderRadius: 8, backgroundColor: '#F9FAFB' }}>
                <input type="number" min="1" value={inputGuests.rooms} onChange={e => setInputGuests({...inputGuests, rooms: parseInt(e.target.value)||1})} style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem', color: '#111827', backgroundColor: 'transparent', fontFamily: 'inherit' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>Adults</label>
              <div style={{ display: 'flex', alignItems: 'center', height: 48, padding: '0 12px', border: '1px solid #D1D5DB', borderRadius: 8, backgroundColor: '#F9FAFB' }}>
                <input type="number" min="1" value={inputGuests.adults} onChange={e => setInputGuests({...inputGuests, adults: parseInt(e.target.value)||1})} style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem', color: '#111827', backgroundColor: 'transparent', fontFamily: 'inherit' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>Children</label>
              <div style={{ display: 'flex', alignItems: 'center', height: 48, padding: '0 12px', border: '1px solid #D1D5DB', borderRadius: 8, backgroundColor: '#F9FAFB' }}>
                <input type="number" min="0" value={inputGuests.children} onChange={e => setInputGuests({...inputGuests, children: parseInt(e.target.value)||0})} style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem', color: '#111827', backgroundColor: 'transparent', fontFamily: 'inherit' }} />
              </div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <button onClick={handleUpdateSearch} style={{ width: '100%', backgroundColor: '#0A192F', color: 'white', height: 48, borderRadius: 8, border: 'none', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', transition: 'background-color 0.2s' }}>
                Update
              </button>
            </div>
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: 24, fontFamily: 'Playfair Display, serif' }}>Select rooms</h2>

          {/* Rooms List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {propertyRooms.length > 0 ? propertyRooms.map(room => {
              // Calculate overlapping bookings for this specific room type
              const overlappingBookings = bookings.filter(b => {
                if (b.roomId !== room.id && b.hotelId !== room.propertyId) return false;
                // If legacy booking without roomId, we can't definitively subtract it, 
                // but if it has roomId, we strictly check overlap
                if (b.roomId && b.roomId !== room.id) return false;
                
                const bCheckIn = parseISO(b.checkIn);
                const bCheckOut = parseISO(b.checkOut);
                
                return areIntervalsOverlapping(
                  { start: bCheckIn, end: bCheckOut },
                  { start: checkIn, end: checkOut },
                  { inclusive: false } // Check-out on Check-in day doesn't overlap
                ) && !isSameDay(bCheckOut, checkIn);
              });
              
              const bookedUnits = overlappingBookings.reduce((sum, b) => sum + (b.rooms || 1), 0);
              const availableUnits = Math.max(0, (room.totalUnits || 0) - bookedUnits);
              
              const qty = selectedRooms[room.id] || 0;
              const isSelected = qty > 0;
              const isSoldOut = availableUnits === 0;
              
              return (
                <div key={room.id} className="booking-room-card" style={{ display: 'flex', border: isSelected ? '1px solid var(--primary)' : '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', backgroundColor: 'white', transition: 'all 0.2s', boxShadow: isSelected ? '0 0 0 2px var(--primary)' : 'none', opacity: isSoldOut ? 0.6 : 1 }}>
                  {/* Room Image */}
                  <div className="booking-room-image" style={{ width: 220, backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', overflow: 'hidden' }}>
                    {room.images && room.images.length > 0 ? (
                      <img src={`http://localhost:3000${room.images[0]}`} alt={room.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <img src="/images/property_1.jpg" alt={room.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                  
                  {/* Room Details */}
                  <div className="booking-room-content" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: 16 }}>
                      {guests.rooms < Math.ceil(guests.adults / room.capacity) && (
                        <div style={{ backgroundColor: '#FFFBEB', padding: '8px 12px', borderRadius: 8, marginBottom: 16, border: '1px solid #FDE68A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: '#92400E', fontWeight: 500 }}>
                            Need {Math.ceil(guests.adults / room.capacity)} rooms for {guests.adults} guests
                          </span>
                          {availableUnits >= Math.ceil(guests.adults / room.capacity) && (
                            <button
                              onClick={() => applySuggestion(Math.ceil(guests.adults / room.capacity))}
                              style={{ padding: '6px 12px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', border: 'none', backgroundColor: '#F59E0B', color: 'white', fontSize: '0.75rem' }}
                            >
                              Update Search
                            </button>
                          )}
                        </div>
                      )}
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111827', margin: '0 0 8px 0', fontFamily: 'Playfair Display, serif' }}>{room.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4B5563', fontSize: '0.9rem' }}>
                        <Users size={16} /> {room.capacity} Guests max
                        <span style={{ margin: '0 8px', color: '#D1D5DB' }}>|</span>
                        <span style={{ color: isSoldOut ? '#EF4444' : (availableUnits <= 2 ? '#F59E0B' : '#10B981'), fontWeight: 600 }}>
                          {isSoldOut ? 'Sold Out' : `${availableUnits} room${availableUnits > 1 ? 's' : ''} left`}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10B981' }}>₹{room.pricePerNight.toLocaleString()}</div>
                        <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>per night</div>
                      </div>
                      
                      {isSoldOut ? (
                        <button disabled style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid #E5E7EB', backgroundColor: '#F3F4F6', color: '#9CA3AF', fontWeight: 600, cursor: 'not-allowed' }}>
                          Sold Out
                        </button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #D1D5DB', borderRadius: 8, overflow: 'hidden' }}>
                          <button 
                            disabled={qty === 0}
                            onClick={() => setSelectedRooms(prev => ({ ...prev, [room.id]: Math.max(0, qty - 1) }))}
                            style={{ padding: '10px 16px', background: qty === 0 ? '#F3F4F6' : 'white', border: 'none', borderRight: '1px solid #D1D5DB', cursor: qty === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <Minus size={16} color={qty === 0 ? '#9CA3AF' : '#111827'} />
                          </button>
                          <div style={{ padding: '0 20px', fontWeight: 600, fontSize: '1.1rem', minWidth: 20, textAlign: 'center' }}>{qty}</div>
                          <button 
                            disabled={qty >= availableUnits || totalSelectedCount >= guests.rooms}
                            onClick={() => setSelectedRooms(prev => ({ ...prev, [room.id]: Math.min(availableUnits, qty + 1) }))}
                            style={{ padding: '10px 16px', background: (qty >= availableUnits || totalSelectedCount >= guests.rooms) ? '#F3F4F6' : 'white', border: 'none', borderLeft: '1px solid #D1D5DB', cursor: (qty >= availableUnits || totalSelectedCount >= guests.rooms) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <Plus size={16} color={(qty >= availableUnits || totalSelectedCount >= guests.rooms) ? '#9CA3AF' : '#111827'} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div style={{ padding: 40, textAlign: 'center', backgroundColor: 'white', borderRadius: 12, border: '1px solid #E5E7EB' }}>
                <p style={{ color: '#6B7280' }}>No rooms have been added to this property yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Sidebar */}
        <div>
          <div style={{ position: 'sticky', top: 40, backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: 16, padding: 32, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: 24 }}>Your reservation</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, fontSize: '0.95rem', color: '#4B5563' }}>
              <div><strong>Check-in:</strong> {format(checkIn, 'E, MMM d, yyyy')}</div>
              <div><strong>Check-out:</strong> {format(checkOut, 'E, MMM d, yyyy')}</div>
            </div>
            
            <hr style={{ border: 'none', borderTop: '1px solid #D1D5DB', marginBottom: 24 }} />
            
            <div style={{ fontSize: '0.95rem', color: '#4B5563', marginBottom: 24, display: 'flex', justifyContent: 'space-between' }}>
              <span>{guests.rooms} Room{guests.rooms > 1 ? 's' : ''}</span>
              <span>{guests.adults} Adult{guests.adults > 1 ? 's' : ''}</span>
              <span>{nights} Night{nights > 1 ? 's' : ''}</span>
            </div>
            
            <hr style={{ border: 'none', borderTop: '1px solid #D1D5DB', marginBottom: 24 }} />
            
            <div style={{ marginBottom: 24 }}>
              {totalSelectedCount > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {Object.entries(selectedRooms).filter(([_, qty]) => qty > 0).map(([roomId, qty]) => {
                    const room = propertyRooms.find(r => r.id === roomId);
                    return (
                      <div key={roomId} style={{ backgroundColor: 'rgba(255,255,255,0.5)', padding: 12, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontWeight: 600, color: '#111827', fontSize: '1rem' }}>{room.name}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#4B5563' }}>
                          <span>{qty} room{qty > 1 ? 's' : ''} × ₹{room.pricePerNight.toLocaleString()}</span>
                          <span style={{ fontWeight: 500, color: '#111827' }}>₹{(room.pricePerNight * qty).toLocaleString()} / night</span>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#4B5563', marginTop: 8, borderTop: '1px dashed #D1D5DB', paddingTop: 12 }}>
                    <span>Stay duration</span>
                    <span style={{ fontWeight: 500, color: '#111827' }}>{nights} night{nights > 1 ? 's' : ''}</span>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#6B7280', fontStyle: 'italic' }}>Please select rooms</div>
              )}
            </div>
            
            <hr style={{ border: 'none', borderTop: '1px solid #D1D5DB', marginBottom: 24 }} />
            
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#4B5563', marginBottom: 8 }}>Add promo code</label>
              <div style={{ display: 'flex', gap: 12 }}>
                <input type="text" placeholder="Enter code" style={{ flex: 1, padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 4 }} />
                <button style={{ backgroundColor: '#9CA3AF', color: 'white', border: 'none', borderRadius: 4, padding: '0 16px', fontWeight: 600 }}>Apply</button>
              </div>
            </div>
            
            <hr style={{ border: 'none', borderTop: '1px solid #D1D5DB', marginBottom: 24 }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4B5563', fontSize: '0.95rem' }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 500, color: '#111827' }}>₹{subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4B5563', fontSize: '0.95rem' }}>
                <span>Taxes & Fees ({taxRate}%)</span>
                <span style={{ fontWeight: 500, color: '#111827' }}>₹{taxes.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, paddingTop: 16, borderTop: '1px solid #E5E7EB' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>Total</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>₹{totalPrice.toLocaleString()}</span>
            </div>
            
            <button 
              onClick={handleContinue}
              disabled={!canContinue}
              style={{ 
                width: '100%', 
                padding: 16, 
                borderRadius: 8, 
                border: 'none', 
                backgroundColor: canContinue ? 'var(--primary)' : '#9CA3AF', 
                color: 'white', 
                fontWeight: 600, 
                fontSize: '1.05rem',
                cursor: canContinue ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.2s'
              }}
            >
              Continue
            </button>
          </div>
        </div>

      </main>

      {/* Final Guest Details Modal */}
      {showFinalForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(17, 24, 39, 0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: 500, borderRadius: 16, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'Playfair Display, serif' }}>Guest Details</h2>
              <button onClick={() => setShowFinalForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleConfirmBooking} style={{ padding: 32 }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>Full Name *</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: 8 }} placeholder="John Doe" />
              </div>
              
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>Email Address *</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: 8 }} placeholder="john@example.com" />
              </div>
              
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>Phone Number</label>
                <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: 8 }} placeholder="+91 98765 43210" />
              </div>
              
              <div style={{ marginBottom: 32 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>Special Requests</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: 8, minHeight: 80, resize: 'vertical' }} placeholder="Any special requirements..." />
              </div>

              <button type="submit" style={{ width: '100%', padding: 16, borderRadius: 8, backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <CheckCircle size={20} /> Confirm Booking — ₹{totalPrice.toLocaleString()}
              </button>
            </form>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
