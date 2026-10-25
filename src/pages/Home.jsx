import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Calendar as CalendarIcon, Users, Search, Headphones, 
  ArrowRight, ShieldCheck, CalendarCheck, Star, 
  Wifi, Coffee, Car, Waves, Dumbbell, Mountain, Tent,
  ChevronDown, ChevronLeft, ChevronRight, Plus, Minus, X, Phone, Mail, Menu
} from 'lucide-react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, isBefore, startOfDay
} from 'date-fns';
import { useHotels } from '../context/HotelContext';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import PropertyCard from '../components/PropertyCard';



export default function Home() {
  const { properties, rooms, addBooking, offersEnabled } = useHotels();
  const navigate = useNavigate();

  const [selectedHotel, setSelectedHotel] = useState(null);
  const [activePopover, setActivePopover] = useState(null); 
  const [guestProfile, setGuestProfile] = useState(() => {
    const saved = localStorage.getItem('guestProfile');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  
  const [guests, setGuests] = useState({ adults: 2, children: 0, rooms: 1 });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const popoverRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hotelId = params.get('hotel');
    if (hotelId) {
      const hotel = properties.find(p => p.id === hotelId);
      if (hotel) setSelectedHotel(hotel);
    }
  }, [properties]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setActivePopover(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectHotel = (property) => {
    setSelectedHotel(property);
    window.history.pushState({}, '', `?hotel=${property.id}`);
  };

  const handleCardSelect = (property) => {
    if (property.status === 'coming_soon') {
      alert(`${property.name} is coming soon! Online reservations will open shortly.`);
      return;
    }
    if (property.status === 'disabled') {
      alert(`${property.name} is currently unavailable for bookings.`);
      return;
    }
    navigate(`/book/${property.id}`, { 
      state: { 
        checkIn: checkIn ? checkIn.toISOString() : null, 
        checkOut: checkOut ? checkOut.toISOString() : null, 
        guests 
      } 
    });
  };

  const logoClicks = useRef(0);
  const clickTimeout = useRef(null);

  const handleLogoClick = () => {
    logoClicks.current += 1;
    if (logoClicks.current >= 3) {
      logoClicks.current = 0;
      if (clickTimeout.current) clearTimeout(clickTimeout.current);
      navigate('/admin');
    } else {
      if (clickTimeout.current) clearTimeout(clickTimeout.current);
      clickTimeout.current = setTimeout(() => {
        if (logoClicks.current < 3) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        logoClicks.current = 0;
      }, 400);
    }
  };

  const handleSearch = () => {
    if (!selectedHotel) {
      alert("Please select a hotel first.");
      setActivePopover('hotel');
      return;
    }
    if (!checkIn || !checkOut) {
      alert("Please select check-in and check-out dates.");
      setActivePopover('checkIn');
      return;
    }
    navigate(`/book/${selectedHotel.id}`, { 
      state: { 
        checkIn: checkIn.toISOString(), 
        checkOut: checkOut.toISOString(), 
        guests 
      } 
    });
  };

  const togglePopover = (name, e) => {
    e.stopPropagation();
    setActivePopover(activePopover === name ? null : name);
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  
  const onDateClick = (day) => {
    if (isBefore(day, startOfDay(new Date()))) return; 
    
    if (activePopover === 'checkIn') {
      setCheckIn(day);
      if (checkOut && isBefore(checkOut, day)) {
        setCheckOut(null);
      }
      setActivePopover('checkOut');
    } else if (activePopover === 'checkOut') {
      if (checkIn && isBefore(day, checkIn)) {
        setCheckIn(day);
        setCheckOut(null);
      } else {
        setCheckOut(day);
        setActivePopover(null);
      }
    }
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const today = startOfDay(new Date());

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        const isPast = isBefore(day, today);
        const isSelected = (checkIn && isSameDay(day, checkIn)) || (checkOut && isSameDay(day, checkOut));
        const isInRange = checkIn && checkOut && day > checkIn && day < checkOut;
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <div
            className={`calendar-day ${!isCurrentMonth ? "empty" : ""} ${isSelected ? "selected" : ""} ${isInRange ? "in-range" : ""} ${isPast ? "disabled" : ""}`}
            key={day}
            onClick={() => { if (!isPast && isCurrentMonth) onDateClick(cloneDay) }}
          >
            {isCurrentMonth ? formattedDate : ""}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<React.Fragment key={day}>{days}</React.Fragment>);
      days = [];
    }
    return <div className="calendar-grid">{rows}</div>;
  };

  const updateGuest = (type, operation) => {
    setGuests(prev => {
      const current = prev[type];
      const next = operation === 'add' ? current + 1 : current - 1;
      if (type === 'adults' && next < 1) return prev;
      if (type === 'children' && next < 0) return prev;
      if (type === 'rooms' && next < 1) return prev;
      return { ...prev, [type]: next };
    });
  };

  return (
    <div>
      <section className="hero-section">
        <div className="hero-overlay"></div>
        
        <header className="header container">
          <div className="header-left">
            <div className="brand" onClick={handleLogoClick} style={{cursor: 'pointer', display: 'flex', alignItems: 'center'}}>
              <img src="/logo.png" alt="Sabharwal Hospitality" className="brand-logo" />
            </div>
          </div>
          <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <nav className="nav-links" style={{ display: 'flex', gap: 32, fontSize: '1.05rem', fontWeight: 500, alignItems: 'center' }}>
              <Link to="/" style={{ color: 'white', textDecoration: 'none', transition: 'opacity 0.2s' }}>Home</Link>
              <Link to="/hotels" style={{ color: 'white', textDecoration: 'none', transition: 'opacity 0.2s' }}>Our Hotels</Link>
              {offersEnabled && <Link to="/offers" style={{ color: 'white', textDecoration: 'none', transition: 'opacity 0.2s' }}>Offers & Packages</Link>}
              <Link to="/contact" style={{ color: 'white', textDecoration: 'none', transition: 'opacity 0.2s' }}>Contact Us</Link>
            </nav>
            {guestProfile ? (
              <Link to="/guest" style={{ 
                display: 'flex', alignItems: 'center', gap: 10,
                textDecoration: 'none', transition: 'transform 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
              title="Go to Dashboard"
              >
                <div style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 40, height: 40, borderRadius: '50%', 
                  backgroundColor: 'white', color: 'var(--primary)', 
                  fontWeight: 600, fontSize: '1.1rem', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)' 
                }}>
                  {guestProfile.name.charAt(0).toUpperCase()}
                </div>
                <span className="profile-name" style={{ color: 'white', fontWeight: 600, fontSize: '1.05rem', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  {guestProfile.name.split(' ')[0]}
                </span>
              </Link>
            ) : (
              <Link to="/guest" style={{ color: 'white', textDecoration: 'none', transition: 'opacity 0.2s', padding: '4px 10px', fontSize: '0.9rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 }}>Login</Link>
            )}
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ color: 'white', marginLeft: 8 }}>
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </header>

        {mobileMenuOpen && (
          <div className="mobile-menu" style={{ display: 'flex' }}>
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link to="/hotels" onClick={() => setMobileMenuOpen(false)}>Our Hotels</Link>
            {offersEnabled && <Link to="/offers" onClick={() => setMobileMenuOpen(false)}>Offers & Packages</Link>}
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>Contact Us</Link>
          </div>
        )}

        <div className="hero-content container">
          <div className="eyebrow">Stay • Explore • Experience</div>
          <h1 className="hero-heading">Your Stay, Our Hospitality</h1>
          <p className="hero-subtitle">Choose from our handpicked properties and book your perfect stay.</p>
        </div>

        <div className="booking-bar-wrapper">
          <div className="booking-bar" ref={popoverRef}>
            
            <div className="booking-field popover-container" onClick={(e) => togglePopover('hotel', e)}>
              <MapPin className="field-icon" size={24} strokeWidth={1.5} />
              <div className="field-text">
                <span className="field-label">Location / Hotel</span>
                <span className="field-value">{selectedHotel ? selectedHotel.name : "Select a hotel"}</span>
              </div>
              
              {activePopover === 'hotel' && (
                <>
                  <div className="popover-overlay" onClick={(e) => { e.stopPropagation(); setActivePopover(null); }}></div>
                  <div className="popover" onClick={e => e.stopPropagation()}>
                    <h4 style={{ marginBottom: 12 }}>Destinations</h4>
                    {properties.map(p => (
                      <div 
                        key={p.id} 
                        className={`hotel-option ${selectedHotel?.id === p.id ? 'selected' : ''}`}
                        onClick={() => {
                          handleSelectHotel(p);
                          setActivePopover(null);
                        }}
                      >
                        {p.name}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <div className="field-divider"></div>
            
            <div className="booking-field popover-container" onClick={(e) => togglePopover('checkIn', e)}>
              <CalendarIcon className="field-icon" size={24} strokeWidth={1.5} />
              <div className="field-text">
                <span className="field-label">Check In</span>
                <span className="field-value" style={{ color: checkIn ? 'var(--primary)' : '' }}>
                  {checkIn ? format(checkIn, 'MMM d, yyyy') : 'Select date'}
                </span>
              </div>

              {activePopover === 'checkIn' && (
                <>
                  <div className="popover-overlay" onClick={(e) => { e.stopPropagation(); setActivePopover(null); }}></div>
                  <div className="popover" onClick={e => e.stopPropagation()}>
                    <div className="calendar-header">
                      <div className="calendar-nav" onClick={prevMonth}><ChevronLeft size={20} /></div>
                      <span>{format(currentMonth, 'MMMM yyyy')}</span>
                      <div className="calendar-nav" onClick={nextMonth}><ChevronRight size={20} /></div>
                    </div>
                    <div className="calendar-grid">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                        <div key={d} className="calendar-day-name">{d}</div>
                      ))}
                    </div>
                    {renderCells()}
                  </div>
                </>
              )}
            </div>
            
            <div className="field-divider"></div>
            
            <div className="booking-field popover-container" onClick={(e) => togglePopover('checkOut', e)}>
              <CalendarIcon className="field-icon" size={24} strokeWidth={1.5} />
              <div className="field-text">
                <span className="field-label">Check Out</span>
                <span className="field-value" style={{ color: checkOut ? 'var(--primary)' : '' }}>
                  {checkOut ? format(checkOut, 'MMM d, yyyy') : 'Select date'}
                </span>
              </div>
              
              {activePopover === 'checkOut' && (
                <>
                  <div className="popover-overlay" onClick={(e) => { e.stopPropagation(); setActivePopover(null); }}></div>
                  <div className="popover" onClick={e => e.stopPropagation()}>
                    <div className="calendar-header">
                      <div className="calendar-nav" onClick={prevMonth}><ChevronLeft size={20} /></div>
                      <span>{format(currentMonth, 'MMMM yyyy')}</span>
                      <div className="calendar-nav" onClick={nextMonth}><ChevronRight size={20} /></div>
                    </div>
                    <div className="calendar-grid">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                        <div key={d} className="calendar-day-name">{d}</div>
                      ))}
                    </div>
                    {renderCells()}
                  </div>
                </>
              )}
            </div>
            
            <div className="field-divider"></div>
            
            <div className="booking-field popover-container" onClick={(e) => togglePopover('guests', e)}>
              <Users className="field-icon" size={24} strokeWidth={1.5} />
              <div className="guests-field">
                <div className="field-text">
                  <span className="field-label">Guests</span>
                  <span className="field-value" style={{ color: (guests.adults > 2 || guests.children > 0 || guests.rooms > 1) ? 'var(--primary)' : '' }}>
                    {guests.adults + guests.children} Guests, {guests.rooms} Room{guests.rooms > 1 ? 's' : ''}
                  </span>
                </div>
                <ChevronDown size={16} className="field-icon" />
              </div>
              
              {activePopover === 'guests' && (
                <>
                  <div className="popover-overlay" onClick={(e) => { e.stopPropagation(); setActivePopover(null); }}></div>
                  <div className="popover" onClick={e => e.stopPropagation()}>
                    <div className="guest-row">
                      <div className="guest-info">
                        <h4>Adults</h4>
                        <p>Ages 13 or above</p>
                      </div>
                      <div className="guest-controls">
                        <button className="guest-btn" disabled={guests.adults <= 1} onClick={() => updateGuest('adults', 'sub')}><Minus size={16} /></button>
                        <span className="guest-count">{guests.adults}</span>
                        <button className="guest-btn" onClick={() => updateGuest('adults', 'add')}><Plus size={16} /></button>
                      </div>
                    </div>
                    <div className="guest-row">
                      <div className="guest-info">
                        <h4>Children</h4>
                        <p>Ages 0 - 12</p>
                      </div>
                      <div className="guest-controls">
                        <button className="guest-btn" disabled={guests.children <= 0} onClick={() => updateGuest('children', 'sub')}><Minus size={16} /></button>
                        <span className="guest-count">{guests.children}</span>
                        <button className="guest-btn" onClick={() => updateGuest('children', 'add')}><Plus size={16} /></button>
                      </div>
                    </div>
                    <div className="guest-row">
                      <div className="guest-info">
                        <h4>Rooms</h4>
                        <p>Number of rooms</p>
                      </div>
                      <div className="guest-controls">
                        <button className="guest-btn" disabled={guests.rooms <= 1} onClick={() => updateGuest('rooms', 'sub')}><Minus size={16} /></button>
                        <span className="guest-count">{guests.rooms}</span>
                        <button className="guest-btn" onClick={() => updateGuest('rooms', 'add')}><Plus size={16} /></button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button className="search-btn" onClick={handleSearch}>
              <Search size={20} />
              Book Now
            </button>
            
          </div>
        </div>
      </section>

      <main className="main-content">
        <div className="section-header">
          <div className="section-header-left">
            <h2 className="section-title">Our Properties</h2>
            <p className="section-subtitle">
              Each of our hotels offers a unique experience — choose the one that feels right for your journey.
            </p>
          </div>
          <div className="section-helper">
            Select a hotel to continue<br/>with your booking
            <svg className="helper-arrow" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>

        <div className="properties-grid">
          {properties.map((property) => (
            <PropertyCard 
              key={property.id} 
              property={property} 
              onSelect={handleCardSelect} 
            />
          ))}
        </div>

        <div className="trust-strip">
          <div className="trust-item">
            <ShieldCheck className="trust-icon" size={32} strokeWidth={1.5} />
            <div className="trust-text">
              <h4>Best Rate Guarantee</h4>
              <p>Get the best prices, always.</p>
            </div>
          </div>
          
          <div className="trust-divider"></div>
          
          <div className="trust-item">
            <Headphones className="trust-icon" size={32} strokeWidth={1.5} />
            <div className="trust-text">
              <h4>24/7 Support</h4>
              <p>We're here whenever you need us.</p>
            </div>
          </div>
          
          <div className="trust-divider"></div>
          
          <div className="trust-item">
            <CalendarCheck className="trust-icon" size={32} strokeWidth={1.5} />
            <div className="trust-text">
              <h4>Flexible Booking</h4>
              <p>Easy changes and cancellations.</p>
            </div>
          </div>
          
          <div className="trust-divider"></div>
          
          <div className="trust-item">
            <Star className="trust-icon" size={32} strokeWidth={1.5} />
            <div className="trust-text">
              <h4>Verified Properties</h4>
              <p>Trusted and quality-assured stays.</p>
            </div>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
