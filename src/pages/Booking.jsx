import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useHotels } from '../context/HotelContext';
import { Calendar as CalendarIcon, Users, ArrowLeft, CheckCircle, X, Plus, Minus, Lock, User, Eye, EyeOff, AlertCircle, Clock, Wind, Flame, Sparkles, CreditCard, ShieldCheck, Tag, Info, Building } from 'lucide-react';
import { format, parseISO, differenceInDays, areIntervalsOverlapping, isSameDay } from 'date-fns';
import Footer from '../components/Footer';
import BanquetBooking from '../components/BanquetBooking';

export default function Booking() {
  const { propertyId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { properties, rooms, bookings, addBooking, taxRate, paymentSettings } = useHotels();

  const property = properties.find(p => p.id === propertyId);
  const propertyRooms = rooms.filter(r => r.propertyId === propertyId);

  const enableOnline = paymentSettings?.enableOnlinePayment ?? true;
  const enablePayAtDesk = paymentSettings?.enablePayAtDesk ?? true;

  // Quick filters for Stay Duration and Cooling Type
  const [durationFilter, setDurationFilter] = useState('all'); // 'all' | '24h' | '12h'
  const [acFilter, setAcFilter] = useState('all'); // 'all' | 'ac' | 'non-ac'

  // Filtered rooms based on user selection
  const filteredPropertyRooms = propertyRooms.filter(room => {
    const nameLower = (room.name || '').toLowerCase();

    // Duration check
    if (durationFilter === '12h') {
      const is12h = nameLower.includes('12 hr') || nameLower.includes('12-hr') || nameLower.includes('12hr') || nameLower.includes('12 hours') || nameLower.includes('12hrs') || nameLower.includes('12 hrs');
      if (!is12h) return false;
    } else if (durationFilter === '24h') {
      const is12h = nameLower.includes('12 hr') || nameLower.includes('12-hr') || nameLower.includes('12hr') || nameLower.includes('12 hours') || nameLower.includes('12hrs') || nameLower.includes('12 hrs');
      if (is12h) return false;
    }

    // Cooling check (AC vs Non-AC)
    const isNonAc = nameLower.includes('non-ac') || nameLower.includes('non ac') || nameLower.includes('non a/c') || nameLower.includes('non-a/c');
    const isAc = (nameLower.includes('ac') || nameLower.includes('a/c')) && !isNonAc;

    if (acFilter === 'ac') {
      if (!isAc) return false;
    } else if (acFilter === 'non-ac') {
      if (!isNonAc) return false;
    }

    return true;
  });

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
  
  // Auth & Guest Account requirement states
  const [guestProfile, setGuestProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('guestProfile');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('register'); // 'register' | 'login'
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authShowPassword, setAuthShowPassword] = useState(false);

  // Registration Form
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    phone: '',
    country: '+91',
    password: '',
    confirmPassword: ''
  });

  // Login Form
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  // Checkout View State: 'select_rooms' | 'checkout'
  const [checkoutStep, setCheckoutStep] = useState('select_rooms');
  const [paymentMethod, setPaymentMethod] = useState(() => (enableOnline ? 'online' : 'pay_at_desk'));
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');

  // Keep paymentMethod aligned if admin disables current option
  useEffect(() => {
    if (!enableOnline && paymentMethod === 'online' && enablePayAtDesk) {
      setPaymentMethod('pay_at_desk');
    } else if (!enablePayAtDesk && paymentMethod === 'pay_at_desk' && enableOnline) {
      setPaymentMethod('online');
    }
  }, [enableOnline, enablePayAtDesk, paymentMethod]);

  // Final confirmation state
  const [confirmedBookingData, setConfirmedBookingData] = useState(null);
  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem('guestProfile');
      if (saved) {
        const profile = JSON.parse(saved);
        return {
          name: profile.name || '',
          phone: profile.phone || '',
          email: profile.email || '',
          description: ''
        };
      }
    } catch (e) {}
    return { name: '', phone: '', email: '', description: '' };
  });

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    const code = couponCode.trim().toUpperCase();
    if (code === 'SABHARWAL10' || code === 'WELCOME10') {
      setCouponApplied(true);
      setCouponDiscount(0.10);
      setCouponMessage('Coupon applied! 10% discount added.');
    } else if (code === 'FESTIVE15') {
      setCouponApplied(true);
      setCouponDiscount(0.15);
      setCouponMessage('Festive offer applied! 15% discount added.');
    } else {
      setCouponApplied(false);
      setCouponDiscount(0);
      setCouponMessage('Invalid coupon code. Try WELCOME10');
    }
  };

  const handleRegisterFromBooking = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (regForm.password !== regForm.confirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }
    if (regForm.password.length < 4) {
      setAuthError("Password must be at least 4 characters.");
      return;
    }

    setAuthLoading(true);
    const profile = {
      name: regForm.name.trim(),
      email: regForm.email.trim(),
      phone: `${regForm.country} ${regForm.phone.trim()}`,
      password: regForm.password
    };

    try {
      const res = await fetch('/api/guests/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      const data = await res.json();
      if (!data.success) {
        setAuthError(data.error || 'Registration failed.');
        setAuthLoading(false);
        return;
      }
      const savedUser = data.user || profile;
      setGuestProfile(savedUser);
      localStorage.setItem('guestProfile', JSON.stringify(savedUser));
      setFormData(prev => ({
        ...prev,
        name: savedUser.name,
        email: savedUser.email,
        phone: savedUser.phone || ''
      }));
      setShowAuthModal(false);
      setCheckoutStep('checkout');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      // Offline fallback
      const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      if (existingUsers.some(u => u.email.toLowerCase() === regForm.email.toLowerCase())) {
        setAuthError('Email already registered. Please log in.');
        setAuthLoading(false);
        return;
      }
      existingUsers.push(profile);
      localStorage.setItem('registeredUsers', JSON.stringify(existingUsers));
      setGuestProfile(profile);
      localStorage.setItem('guestProfile', JSON.stringify(profile));
      setFormData(prev => ({
        ...prev,
        name: profile.name,
        email: profile.email,
        phone: profile.phone || ''
      }));
      setShowAuthModal(false);
      setCheckoutStep('checkout');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLoginFromBooking = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    const cleanEmail = loginForm.email.trim();
    const cleanPassword = loginForm.password.trim();

    try {
      const res = await fetch('/api/guests/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword })
      });
      const data = await res.json();
      if (data.success && data.user) {
        setGuestProfile(data.user);
        localStorage.setItem('guestProfile', JSON.stringify(data.user));
        setFormData(prev => ({
          ...prev,
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone || ''
        }));
        setShowAuthModal(false);
        setCheckoutStep('checkout');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setAuthLoading(false);
        return;
      } else {
        setAuthError(data.error || 'Invalid credentials.');
        setAuthLoading(false);
        return;
      }
    } catch (err) {
      // Local fallback
      const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const user = existingUsers.find(u => u.email && u.email.trim().toLowerCase() === cleanEmail.toLowerCase());
      if (user && (user.password === cleanPassword || cleanPassword === 'admin')) {
        setGuestProfile(user);
        localStorage.setItem('guestProfile', JSON.stringify(user));
        setFormData(prev => ({
          ...prev,
          name: user.name,
          email: user.email,
          phone: user.phone || ''
        }));
        setShowAuthModal(false);
        setCheckoutStep('checkout');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setAuthLoading(false);
        return;
      }
      setAuthError('Account not found. Please create an account or verify your details.');
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    try {
      const saved = localStorage.getItem('guestProfile');
      if (saved) {
        const profile = JSON.parse(saved);
        setFormData(prev => ({
          ...prev,
          name: prev.name || profile.name || '',
          phone: prev.phone || profile.phone || '',
          email: prev.email || profile.email || ''
        }));
      }
    } catch (e) {}
  }, []);

  if (!property) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Property not found. <Link to="/">Go back</Link></div>;
  }

  // If the selected property is a Banquet / Event Hall, render dedicated banquet reservation flow
  if (property.propertyType === 'banquet') {
    return <BanquetBooking property={property} />;
  }

  const nights = differenceInDays(checkOut, checkIn) || 1;
  const subtotal = propertyRooms.reduce((sum, r) => sum + (selectedRooms[r.id] || 0) * r.pricePerNight * nights, 0);
  const discountAmount = Math.round(subtotal * couponDiscount);
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const taxes = Math.round(discountedSubtotal * (taxRate / 100));
  const totalPrice = discountedSubtotal + taxes;

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

    // Require Guest Account before proceeding to finalize booking
    const activeProfile = guestProfile || (() => {
      try {
        const s = localStorage.getItem('guestProfile');
        return s ? JSON.parse(s) : null;
      } catch (e) {
        return null;
      }
    })();

    if (!activeProfile) {
      setAuthMode('register');
      setAuthError('');
      setShowAuthModal(true);
      return;
    }

    // Transition smoothly to full dedicated checkout page
    setCheckoutStep('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmBooking = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    const summaryRooms = [];
    Object.entries(selectedRooms).forEach(([roomId, count]) => {
      if (count > 0) {
        const room = propertyRooms.find(r => r.id === roomId);
        summaryRooms.push({ name: room.name, count, price: room.pricePerNight, image: room.images?.[0] });
        addBooking({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || '',
          hotelId: property.id,
          hotelName: property.name,
          checkIn: checkIn.toISOString(),
          checkOut: checkOut.toISOString(),
          amount: Math.round(room.pricePerNight * nights * count * (1 + taxRate / 100) * (1 - couponDiscount)),
          status: paymentMethod === 'online' ? 'Confirmed' : 'Confirmed (Pay at Desk)',
          paymentMethod: paymentMethod === 'online' ? 'Online Gateway' : 'Pay at Desk',
          rooms: count,
          roomId: room.id,
          adults: parseInt(guests.adults) || 1,
          children: parseInt(guests.children) || 0,
          notes: formData.description || ''
        });
      }
    });

    setConfirmedBookingData({
      bookingId: 'SBH-' + Math.floor(100000 + Math.random() * 900000),
      guestName: formData.name,
      guestEmail: formData.email,
      hotelName: property.name,
      hotelLocation: property.location,
      checkIn,
      checkOut,
      nights,
      rooms: summaryRooms,
      totalAmount: totalPrice,
      paymentMethod
    });
  };

  if (checkoutStep === 'checkout') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F7F4EE', color: '#102641', fontFamily: "'Outfit', sans-serif" }}>
        {/* Top Header matching website theme */}
        <header style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div className="checkout-header-container" style={{ maxWidth: 1240, margin: '0 auto', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            
            {/* Left: Brand & Hotel */}
            <div className="checkout-header-left" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src="/logo_dark.png" alt="Sabharwal Hospitality" style={{ height: 38, width: 'auto', objectFit: 'contain', display: 'block' }} />
              <div style={{ width: 1, height: 26, backgroundColor: '#E5E7EB' }} className="hide-on-mobile" />
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#102641', fontFamily: "'Playfair Display', serif", lineHeight: 1.25, margin: 0 }}>
                  {property.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: 2 }} className="hide-on-mobile">
                  A Unit of Sabharwal Hospitality Group
                </div>
              </div>
            </div>

            {/* Center: Title */}
            <div style={{ textAlign: 'center' }} className="hide-on-mobile">
              <span style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.25em', color: '#102641', textTransform: 'uppercase' }}>
                CHECKOUT
              </span>
            </div>

            {/* Right: Back to Rooms */}
            <div className="checkout-header-right" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setCheckoutStep('select_rooms')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  color: '#4B5563',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  transition: 'color 0.2s',
                  padding: '6px 0'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#102641'}
                onMouseLeave={e => e.currentTarget.style.color = '#4B5563'}
              >
                <ArrowLeft size={16} /> Back to Rooms
              </button>
            </div>

          </div>
        </header>

        {/* 2-Column Theme Layout */}
        <main style={{ maxWidth: 1240, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          <div className="checkout-main-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) 440px', gap: 36, alignItems: 'start', padding: '40px 24px 80px', boxSizing: 'border-box' }}>
            
            {/* Left Column: Guest Details & Payment Selection */}
            <div style={{ minWidth: 0, width: '100%' }}>
              <form id="checkoutForm" onSubmit={handleConfirmBooking}>
                
                {/* 1. Your Details Card */}
                <div className="checkout-card" style={{ backgroundColor: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: '32px', marginBottom: 28, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid #F3F4F6', paddingBottom: 14 }}>
                    <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#102641', margin: 0, fontFamily: "'Playfair Display', serif" }}>
                      Your Details
                    </h2>
                    {localStorage.getItem('guestProfile') && (
                      <span style={{ fontSize: '0.8rem', color: '#059669', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, backgroundColor: '#ECFDF5', padding: '4px 10px', borderRadius: 20 }}>
                        <CheckCircle size={14} /> Auto-filled
                      </span>
                    )}
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                      FULL NAME *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. John Doe"
                      style={{
                        width: '100%',
                        padding: '13px 16px',
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #D1D5DB',
                        borderRadius: 10,
                        color: '#111827',
                        fontSize: '0.95rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                        fontFamily: "'Outfit', sans-serif"
                      }}
                      onFocus={e => e.target.style.borderColor = '#102641'}
                      onBlur={e => e.target.style.borderColor = '#D1D5DB'}
                    />
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                      EMAIL ADDRESS *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. john@example.com"
                      style={{
                        width: '100%',
                        padding: '13px 16px',
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #D1D5DB',
                        borderRadius: 10,
                        color: '#111827',
                        fontSize: '0.95rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                        fontFamily: "'Outfit', sans-serif"
                      }}
                      onFocus={e => e.target.style.borderColor = '#102641'}
                      onBlur={e => e.target.style.borderColor = '#D1D5DB'}
                    />
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                      PHONE NUMBER *
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 12 }}>
                      <select
                        style={{
                          backgroundColor: '#F9FAFB',
                          border: '1px solid #D1D5DB',
                          borderRadius: 10,
                          color: '#111827',
                          padding: '13px 12px',
                          fontSize: '0.9rem',
                          outline: 'none',
                          cursor: 'pointer',
                          fontFamily: "'Outfit', sans-serif"
                        }}
                      >
                        <option value="+91">IN +91</option>
                        <option value="+1">US +1</option>
                        <option value="+44">UK +44</option>
                        <option value="+971">UAE +971</option>
                      </select>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g. 98765 43210"
                        style={{
                          width: '100%',
                          padding: '13px 16px',
                          backgroundColor: '#F9FAFB',
                          border: '1px solid #D1D5DB',
                          borderRadius: 10,
                          color: '#111827',
                          fontSize: '0.95rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                          fontFamily: "'Outfit', sans-serif"
                        }}
                        onFocus={e => e.target.style.borderColor = '#102641'}
                        onBlur={e => e.target.style.borderColor = '#D1D5DB'}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                      SPECIAL REQUESTS (OPTIONAL)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Any specific requests, floor preference, or estimated arrival time..."
                      style={{
                        width: '100%',
                        padding: '13px 16px',
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #D1D5DB',
                        borderRadius: 10,
                        color: '#111827',
                        fontSize: '0.95rem',
                        outline: 'none',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                        fontFamily: "'Outfit', sans-serif"
                      }}
                      onFocus={e => e.target.style.borderColor = '#102641'}
                      onBlur={e => e.target.style.borderColor = '#D1D5DB'}
                    />
                  </div>
                </div>

                {/* 2. Payment Selection Card */}
                <div className="checkout-card" style={{ backgroundColor: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: '32px', marginBottom: 28, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', boxSizing: 'border-box' }}>
                  <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#102641', margin: '0 0 20px 0', fontFamily: "'Playfair Display', serif" }}>
                    Payment Option
                  </h2>

                  {/* Option 1: Pay Online */}
                  {enableOnline && (
                    <div
                      onClick={() => setPaymentMethod('online')}
                      style={{
                        border: paymentMethod === 'online' ? '2px solid #102641' : '1px solid #E5E7EB',
                        backgroundColor: paymentMethod === 'online' ? '#F0F4F8' : '#FFFFFF',
                        borderRadius: 12,
                        padding: '18px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        cursor: 'pointer',
                        marginBottom: enablePayAtDesk ? 16 : 24,
                        transition: 'all 0.2s'
                      }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'online'}
                        onChange={() => setPaymentMethod('online')}
                        style={{ width: 18, height: 18, accentColor: '#102641', cursor: 'pointer' }}
                      />
                      <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: paymentMethod === 'online' ? '#102641' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CreditCard size={20} color={paymentMethod === 'online' ? '#FFFFFF' : '#4B5563'} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#102641' }}>
                          Pay Online (Cards, UPI, Netbanking)
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#6B7280', marginTop: 2 }}>
                          Pay securely via ICICI & Razorpay Payment Gateway
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Option 2: Pay at Desk */}
                  {enablePayAtDesk && (
                    <div
                      onClick={() => setPaymentMethod('pay_at_desk')}
                      style={{
                        border: paymentMethod === 'pay_at_desk' ? '2px solid #102641' : '1px solid #E5E7EB',
                        backgroundColor: paymentMethod === 'pay_at_desk' ? '#F0F4F8' : '#FFFFFF',
                        borderRadius: 12,
                        padding: '18px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        cursor: 'pointer',
                        marginBottom: 24,
                        transition: 'all 0.2s'
                      }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'pay_at_desk'}
                        onChange={() => setPaymentMethod('pay_at_desk')}
                        style={{ width: 18, height: 18, accentColor: '#102641', cursor: 'pointer' }}
                      />
                      <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: paymentMethod === 'pay_at_desk' ? '#102641' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Building size={20} color={paymentMethod === 'pay_at_desk' ? '#FFFFFF' : '#4B5563'} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#102641' }}>
                          Pay at Desk
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#6B7280', marginTop: 2 }}>
                          Book now and pay with cash/card when you arrive
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Legal Checkbox */}
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: '0.85rem', color: '#4B5563', cursor: 'pointer', userSelect: 'none' }}>
                    <input type="checkbox" required style={{ width: 18, height: 18, marginTop: 2, accentColor: '#102641', cursor: 'pointer' }} />
                    <span>
                      I agree to the <a href="/terms" target="_blank" rel="noreferrer" style={{ color: '#1E40AF', fontWeight: 600, textDecoration: 'underline' }}>Terms & Conditions</a> and <a href="/cancellation" target="_blank" rel="noreferrer" style={{ color: '#1E40AF', fontWeight: 600, textDecoration: 'underline' }}>Refund & Cancellation Policy</a>
                    </span>
                  </label>
                </div>
              </form>
            </div>

            {/* Right Column: Order Summary Card */}
            <div style={{ minWidth: 0, width: '100%' }}>
              <div className="checkout-card checkout-sticky-summary" style={{ backgroundColor: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: '28px', position: 'sticky', top: 90, boxShadow: '0 4px 14px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#102641', margin: '0 0 20px 0', fontFamily: "'Playfair Display', serif" }}>
                  Order Summary
                </h2>

                {/* Selected Rooms List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24, borderBottom: '1px solid #E5E7EB', paddingBottom: 20 }}>
                  {Object.entries(selectedRooms).map(([roomId, count]) => {
                    if (count <= 0) return null;
                    const room = propertyRooms.find(r => r.id === roomId);
                    if (!room) return null;
                    const itemTotal = room.pricePerNight * count * nights;
                    return (
                      <div key={roomId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#102641', lineHeight: 1.3 }}>
                            {room.name} {count > 1 ? `(${count} Rooms)` : ''}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#6B7280', marginTop: 4 }}>
                            {format(checkIn, 'MMM dd')} - {format(checkOut, 'MMM dd')} ({nights} Night{nights > 1 ? 's' : ''})
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#0369A1', marginTop: 2, fontWeight: 500 }}>
                            Slot: 24-hr check-in guaranteed
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#102641', whiteSpace: 'nowrap', paddingTop: 2 }}>
                          ₹{itemTotal.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Coupon Code Block */}
                <div style={{ backgroundColor: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0', padding: '16px', marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', fontWeight: 800, color: '#102641', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                    <Tag size={15} color="#102641" /> HAVE A COUPON CODE?
                  </div>
                  <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      placeholder="ENTER COUPON CODE"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                      style={{
                        flex: 1,
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: 8,
                        color: '#102641',
                        padding: '10px 14px',
                        fontSize: '0.85rem',
                        textTransform: 'uppercase',
                        outline: 'none',
                        fontFamily: "'Outfit', sans-serif"
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        backgroundColor: '#102641',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 8,
                        padding: '0 20px',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      Apply
                    </button>
                  </form>
                  {couponMessage && (
                    <div style={{ fontSize: '0.75rem', marginTop: 8, fontWeight: 500, color: couponApplied ? '#059669' : '#DC2626' }}>
                      {couponMessage}
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, fontSize: '0.92rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280' }}>
                    <span>Subtotal</span>
                    <span style={{ color: '#102641', fontWeight: 600 }}>₹{subtotal.toLocaleString()}</span>
                  </div>

                  {couponDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                      <span>Discount ({couponDiscount * 100}%)</span>
                      <span style={{ fontWeight: 600 }}>-₹{discountAmount.toLocaleString()}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280' }}>
                    <span>Booking Fee</span>
                    <span style={{ color: '#059669', fontWeight: 600 }}>Free</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280' }}>
                    <span>GST ({taxRate}%)</span>
                    <span style={{ color: '#102641', fontWeight: 600 }}>₹{taxes.toLocaleString()}</span>
                  </div>

                  <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#102641', fontFamily: "'Playfair Display', serif" }}>Total</span>
                    <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#102641' }}>₹{totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                {/* Confirm & Submit Button */}
                <button
                  type="submit"
                  form="checkoutForm"
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: 10,
                    border: 'none',
                    backgroundColor: '#102641',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    marginBottom: 20,
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(16, 38, 65, 0.25)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1A365D'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#102641'}
                >
                  <Lock size={18} /> Confirm Reservation — ₹{totalPrice.toLocaleString()}
                </button>

                {/* Payment Methods Badges Footer */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, fontWeight: 600 }}>
                    Supported Payment Methods
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 4, color: '#1A1F71' }}>VISA</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 4, color: '#EB001B' }}>Mastercard</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 4, color: '#097939' }}>RuPay</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 4, color: '#5F259F' }}>UPI</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </main>

        {/* Confirmation Modal */}
        {confirmedBookingData && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', width: '100%', maxWidth: 520, borderRadius: 20, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
              
              <div style={{ backgroundColor: '#102641', color: 'white', padding: '32px 24px', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 16px rgba(16, 185, 129, 0.3)' }}>
                  <CheckCircle size={36} color="white" />
                </div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 6px', color: '#FFFFFF', fontFamily: "'Playfair Display', serif" }}>Reservation Confirmed</h2>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#94A3B8' }}>
                  Confirmation sent to <strong style={{ color: '#FFFFFF' }}>{confirmedBookingData.guestEmail}</strong>
                </p>
              </div>

              <div style={{ padding: 28 }}>
                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 12, marginBottom: 12 }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 600 }}>Booking ID</span>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#102641', marginTop: 2 }}>{confirmedBookingData.bookingId}</div>
                    </div>
                    <span style={{ backgroundColor: '#ECFDF5', color: '#059669', fontSize: '0.8rem', fontWeight: 700, padding: '4px 10px', borderRadius: 20, border: '1px solid #A7F3D0' }}>
                      {confirmedBookingData.paymentMethod === 'online' ? 'Online Paid' : 'Pay at Desk'}
                    </span>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, color: '#102641', fontSize: '1.05rem', marginBottom: 2, fontFamily: "'Playfair Display', serif" }}>{confirmedBookingData.hotelName}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748B' }}>{confirmedBookingData.hotelLocation}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, borderTop: '1px solid #E2E8F0', paddingTop: 12, marginBottom: 12 }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500, display: 'block' }}>Check-in</span>
                      <strong style={{ fontSize: '0.9rem', color: '#1E293B' }}>{format(confirmedBookingData.checkIn, 'EEE, dd MMM yyyy')}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500, display: 'block' }}>Check-out</span>
                      <strong style={{ fontSize: '0.9rem', color: '#1E293B' }}>{format(confirmedBookingData.checkOut, 'EEE, dd MMM yyyy')}</strong>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', color: '#64748B' }}>
                      Total ({confirmedBookingData.nights} Night{confirmedBookingData.nights > 1 ? 's' : ''}, Taxes incl.)
                    </span>
                    <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#102641' }}>
                      ₹{confirmedBookingData.totalAmount.toLocaleString()}
                    </span>
                  </div>
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
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(16, 38, 65, 0.25)'
                    }}
                  >
                    Go to Guest Panel →
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/')}
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
                    Home
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'white', borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#4B5563', fontWeight: 500, fontSize: '0.95rem' }}>
              <ArrowLeft size={18} /> <span className="hide-on-mobile">Back</span>
            </button>
            <div style={{ width: 1, height: 24, backgroundColor: '#E5E7EB' }} className="hide-on-mobile" />
            <h1 className="booking-header-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1.2 }}>
              {property.name}
              <span className="hide-on-mobile" style={{ color: '#6B7280', fontWeight: 500, fontSize: '1.05rem' }}> — Room Reservation</span>
            </h1>
          </div>
          <div className="header-right" style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/logo_dark.png" alt="Sabharwal Hospitality" style={{ height: 48, width: 'auto', objectFit: 'contain' }} />
          </div>
        </div>
      </header>

      <main className="booking-main-layout" style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 60px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: 32, alignItems: 'start' }}>
        
        {/* Left Column: Search & Rooms */}
        <div style={{ minWidth: 0 }}>
          {/* Top Search Bar */}
          <div className="booking-search-form" style={{ backgroundColor: 'white', padding: 24, borderRadius: 16, border: '1px solid #E5E7EB', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 16, alignItems: 'end', marginBottom: 28, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
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

          {/* Filter Bar: Stay Duration & AC / Non-AC */}
          <div style={{ backgroundColor: 'white', padding: '16px 20px', borderRadius: 16, border: '1px solid #E5E7EB', marginBottom: 28, boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
              
              {/* Duration filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                  <Clock size={14} color="#0A192F" /> Stay Duration:
                </span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setDurationFilter('all')}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 20,
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      border: durationFilter === 'all' ? '1.5px solid #0A192F' : '1px solid #D1D5DB',
                      backgroundColor: durationFilter === 'all' ? '#0A192F' : '#F9FAFB',
                      color: durationFilter === 'all' ? '#FFFFFF' : '#374151',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    All Stays
                  </button>
                  <button
                    type="button"
                    onClick={() => setDurationFilter('24h')}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 20,
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      border: durationFilter === '24h' ? '1.5px solid #0A192F' : '1px solid #D1D5DB',
                      backgroundColor: durationFilter === '24h' ? '#0A192F' : '#F9FAFB',
                      color: durationFilter === '24h' ? '#FFFFFF' : '#374151',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    24 Hours Stay
                  </button>
                  <button
                    type="button"
                    onClick={() => setDurationFilter('12h')}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 20,
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      border: durationFilter === '12h' ? '1.5px solid #0A192F' : '1px solid #D1D5DB',
                      backgroundColor: durationFilter === '12h' ? '#0A192F' : '#F9FAFB',
                      color: durationFilter === '12h' ? '#FFFFFF' : '#374151',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    12 Hours Stay
                  </button>
                </div>
              </div>

              {/* Vertical divider */}
              <div style={{ width: 1, height: 28, backgroundColor: '#E5E7EB', display: 'none' }} className="filter-divider" />

              {/* AC / Non-AC filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                  <Wind size={14} color="#0A192F" /> Room Type:
                </span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setAcFilter('all')}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 20,
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      border: acFilter === 'all' ? '1.5px solid #0A192F' : '1px solid #D1D5DB',
                      backgroundColor: acFilter === 'all' ? '#0A192F' : '#F9FAFB',
                      color: acFilter === 'all' ? '#FFFFFF' : '#374151',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    All Types
                  </button>
                  <button
                    type="button"
                    onClick={() => setAcFilter('ac')}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 20,
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      border: acFilter === 'ac' ? '1.5px solid #0A192F' : '1px solid #D1D5DB',
                      backgroundColor: acFilter === 'ac' ? '#0A192F' : '#F9FAFB',
                      color: acFilter === 'ac' ? '#FFFFFF' : '#374151',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    AC Rooms
                  </button>
                  <button
                    type="button"
                    onClick={() => setAcFilter('non-ac')}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 20,
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      border: acFilter === 'non-ac' ? '1.5px solid #0A192F' : '1px solid #D1D5DB',
                      backgroundColor: acFilter === 'non-ac' ? '#0A192F' : '#F9FAFB',
                      color: acFilter === 'non-ac' ? '#FFFFFF' : '#374151',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Non-AC Rooms
                  </button>
                </div>
              </div>

            </div>

            {/* Active filter summary & quick reset */}
            {(durationFilter !== 'all' || acFilter !== 'all') && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#4B5563' }}>
                  Showing <strong style={{ color: '#111827' }}>{filteredPropertyRooms.length}</strong> matching {filteredPropertyRooms.length === 1 ? 'room' : 'rooms'}
                </span>
                <button
                  type="button"
                  onClick={() => { setDurationFilter('all'); setAcFilter('all'); }}
                  style={{ background: 'none', border: 'none', color: '#EF4444', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', padding: '2px 6px' }}
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0, fontFamily: 'Playfair Display, serif' }}>Select rooms</h2>
            <span style={{ fontSize: '0.9rem', color: '#6B7280', fontWeight: 500 }}>
              {filteredPropertyRooms.length} {filteredPropertyRooms.length === 1 ? 'option' : 'options'} available
            </span>
          </div>

          {/* Rooms List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {filteredPropertyRooms.length > 0 ? filteredPropertyRooms.map(room => {
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
                  {room.images && room.images.length > 0 && (
                    <div className="booking-room-image" style={{ width: 220, backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', overflow: 'hidden' }}>
                      <img src={`${room.images[0]}`} alt={room.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  
                  {/* Room Details */}
                  <div className="booking-room-content" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: 16 }}>
                      {guests.rooms < Math.ceil(guests.adults / room.capacity) && (
                        <div className="booking-suggestion-banner" style={{ backgroundColor: '#FFFBEB', padding: '8px 12px', borderRadius: 8, marginBottom: 16, border: '1px solid #FDE68A', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                          <span style={{ fontSize: '0.8rem', color: '#92400E', fontWeight: 500 }}>
                            Need {Math.ceil(guests.adults / room.capacity)} rooms for {guests.adults} guests
                          </span>
                          {availableUnits >= Math.ceil(guests.adults / room.capacity) && (
                            <button
                              onClick={() => applySuggestion(Math.ceil(guests.adults / room.capacity))}
                              style={{ padding: '6px 12px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', border: 'none', backgroundColor: '#F59E0B', color: 'white', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                            >
                              Update Search
                            </button>
                          )}
                        </div>
                      )}
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#111827', margin: '0 0 8px 0', fontFamily: 'var(--font-sans)', fontVariantNumeric: 'lining-nums proportional-nums' }}>{room.name}</h3>
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
              <div style={{ padding: 48, textAlign: 'center', backgroundColor: 'white', borderRadius: 16, border: '1px solid #E5E7EB', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                {propertyRooms.length > 0 ? (
                  <div>
                    <p style={{ color: '#111827', fontWeight: 600, fontSize: '1.05rem', marginBottom: 8 }}>No rooms match your filter criteria</p>
                    <p style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: 20 }}>
                      Try selecting "All Stays" or "All Types" to see all available options.
                    </p>
                    <button
                      type="button"
                      onClick={() => { setDurationFilter('all'); setAcFilter('all'); }}
                      style={{ padding: '10px 20px', borderRadius: 8, backgroundColor: '#0A192F', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                    >
                      Show All Rooms
                    </button>
                  </div>
                ) : (
                  <p style={{ color: '#6B7280' }}>No rooms have been added to this property yet.</p>
                )}
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
                transition: 'background-color 0.2s',
                marginBottom: 16
              }}
            >
              Continue to Guest Details
            </button>

            {/* Accepted Card Brands Display */}
            <div style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: 14 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>
                Accepted Payment Methods
              </span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', backgroundColor: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: 4, color: '#1A1F71' }}>VISA</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', backgroundColor: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: 4, color: '#EB001B' }}>Mastercard</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', backgroundColor: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: 4, color: '#097939' }}>RuPay</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', backgroundColor: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: 4, color: '#006FCF' }}>Amex</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', backgroundColor: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: 4, color: '#5F259F' }}>UPI</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', backgroundColor: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: 4, color: '#0A2540' }}>NetBanking</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#6B7280', lineHeight: 1.4 }}>
                Instant confirmation delivered directly to your email and phone upon booking.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Required Guest Account / Sign-In Modal */}
      {showAuthModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(17, 24, 39, 0.75)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: 480, borderRadius: 20, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'fadeIn 0.2s ease-out' }}>
            
            {/* Header */}
            <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: '#F9FAFB' }}>
              <div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, backgroundColor: '#EFF6FF', color: '#1D4ED8', fontSize: '0.75rem', fontWeight: 700, marginBottom: 8 }}>
                  <Lock size={12} /> Step 1 of 2: Guest Verification
                </span>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#111827', margin: 0, fontFamily: 'Playfair Display, serif' }}>
                  {authMode === 'register' ? 'Create Guest Account' : 'Log In to Continue'}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6B7280' }}>
                  An account is required to manage dates, cancellations, and view your booking receipt.
                </p>
              </div>
              <button onClick={() => setShowAuthModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 4 }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ padding: '24px 28px' }}>
              {authError && (
                <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: '#FEF2F2', color: '#991B1B', marginBottom: 18, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #FCA5A5' }}>
                  <AlertCircle size={16} /> {authError}
                </div>
              )}

              {/* Registration Form */}
              {authMode === 'register' ? (
                <form onSubmit={handleRegisterFromBooking}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>Full Name *</label>
                    <input 
                      type="text" 
                      required
                      value={regForm.name}
                      onChange={e => setRegForm({...regForm, name: e.target.value})}
                      placeholder="e.g. Rahul Sharma"
                      style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #D1D5DB', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>Phone Number *</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select
                        value={regForm.country}
                        onChange={e => setRegForm({...regForm, country: e.target.value})}
                        style={{ padding: '11px 10px', borderRadius: 10, border: '1px solid #D1D5DB', fontSize: '0.9rem', outline: 'none', backgroundColor: '#F9FAFB' }}
                      >
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+971">🇦🇪 +971</option>
                      </select>
                      <input 
                        type="tel" 
                        required
                        value={regForm.phone}
                        onChange={e => setRegForm({...regForm, phone: e.target.value.replace(/\D/g, '')})}
                        placeholder="98765 43210"
                        style={{ flex: 1, minWidth: 0, padding: '11px 14px', borderRadius: 10, border: '1px solid #D1D5DB', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>Email Address *</label>
                    <input 
                      type="email" 
                      required
                      value={regForm.email}
                      onChange={e => setRegForm({...regForm, email: e.target.value})}
                      placeholder="rahul@example.com"
                      style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #D1D5DB', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6, fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>Create Password *</label>
                      <input 
                        type={authShowPassword ? "text" : "password"} 
                        required
                        value={regForm.password}
                        onChange={e => setRegForm({...regForm, password: e.target.value})}
                        placeholder="••••••••"
                        style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #D1D5DB', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6, fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>Confirm Password *</label>
                      <input 
                        type={authShowPassword ? "text" : "password"} 
                        required
                        value={regForm.confirmPassword}
                        onChange={e => setRegForm({...regForm, confirmPassword: e.target.value})}
                        placeholder="••••••••"
                        style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #D1D5DB', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#4B5563', cursor: 'pointer' }}>
                      <input type="checkbox" checked={authShowPassword} onChange={e => setAuthShowPassword(e.target.checked)} />
                      Show Password
                    </label>
                  </div>

                  {/* Mandatory Terms & Privacy Checkbox */}
                  <div style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '12px 14px', marginBottom: 20 }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.82rem', color: '#374151', cursor: 'pointer', lineHeight: 1.4 }}>
                      <input 
                        type="checkbox" 
                        required 
                        style={{ marginTop: 2, cursor: 'pointer', accentColor: 'var(--primary)' }} 
                      />
                      <span>
                        I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB', textDecoration: 'underline' }}>Terms & Conditions</a>, <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB', textDecoration: 'underline' }}>Privacy Policy</a>, and understand government photo ID is mandatory at check-in.
                      </span>
                    </label>
                  </div>

                  <button 
                    type="submit" 
                    disabled={authLoading}
                    style={{ width: '100%', padding: '14px', borderRadius: 10, backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontWeight: 600, fontSize: '1rem', cursor: authLoading ? 'not-allowed' : 'pointer' }}
                  >
                    {authLoading ? 'Creating Account...' : 'Continue to Finalize Reservation →'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: 16, fontSize: '0.85rem', color: '#6B7280' }}>
                    Already have an account?{' '}
                    <button type="button" onClick={() => { setAuthMode('login'); setAuthError(''); }} style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                      Log in here
                    </button>
                  </div>
                </form>
              ) : (
                /* Login Form */
                <form onSubmit={handleLoginFromBooking}>
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>Email Address *</label>
                    <input 
                      type="email" 
                      required
                      value={loginForm.email}
                      onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                      placeholder="your.email@example.com"
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #D1D5DB', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>Password *</label>
                      <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Default: "admin" or your password</span>
                    </div>
                    <input 
                      type={authShowPassword ? "text" : "password"} 
                      required
                      value={loginForm.password}
                      onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                      placeholder="••••••••"
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #D1D5DB', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#4B5563', cursor: 'pointer' }}>
                      <input type="checkbox" checked={authShowPassword} onChange={e => setAuthShowPassword(e.target.checked)} />
                      Show Password
                    </label>
                  </div>

                  <button 
                    type="submit" 
                    disabled={authLoading}
                    style={{ width: '100%', padding: '14px', borderRadius: 10, backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontWeight: 600, fontSize: '1rem', cursor: authLoading ? 'not-allowed' : 'pointer' }}
                  >
                    {authLoading ? 'Signing In...' : 'Log In & Continue Booking →'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: 16, fontSize: '0.85rem', color: '#6B7280' }}>
                    New guest?{' '}
                    <button type="button" onClick={() => { setAuthMode('register'); setAuthError(''); }} style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                      Create account
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      )}



      {/* Luxury Booking Confirmation Modal */}
      {confirmedBookingData && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: 520, borderRadius: 20, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', animation: 'scaleUp 0.25s ease-out' }}>
            
            {/* Top Success Banner */}
            <div style={{ backgroundColor: '#0A192F', color: 'white', padding: '32px 24px', textAlign: 'center', position: 'relative' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 16px rgba(16, 185, 129, 0.3)' }}>
                <CheckCircle size={36} color="white" />
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 6px', fontFamily: 'Playfair Display, serif', letterSpacing: '0.02em' }}>Reservation Confirmed</h2>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#94A3B8' }}>
                Confirmation sent to <strong style={{ color: '#F1F5F9' }}>{confirmedBookingData.guestEmail}</strong>
              </p>
            </div>

            {/* Summary Details */}
            <div style={{ padding: 28 }}>
              <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 12, marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 600, letterSpacing: '0.05em' }}>Booking Reference</span>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{confirmedBookingData.bookingId}</div>
                  </div>
                  <span style={{ backgroundColor: '#ECFDF5', color: '#059669', fontSize: '0.8rem', fontWeight: 700, padding: '4px 10px', borderRadius: 20, border: '1px solid #A7F3D0' }}>
                    Guaranteed
                  </span>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '1.05rem', marginBottom: 2 }}>{confirmedBookingData.hotelName}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748B' }}>{confirmedBookingData.hotelLocation}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, borderTop: '1px solid #E2E8F0', paddingTop: 12, marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500, display: 'block' }}>Check-in</span>
                    <strong style={{ fontSize: '0.9rem', color: '#1E293B' }}>{format(confirmedBookingData.checkIn, 'EEE, dd MMM yyyy')}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500, display: 'block' }}>Check-out</span>
                    <strong style={{ fontSize: '0.9rem', color: '#1E293B' }}>{format(confirmedBookingData.checkOut, 'EEE, dd MMM yyyy')}</strong>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 500 }}>
                    Total ({confirmedBookingData.nights} Night{confirmedBookingData.nights > 1 ? 's' : ''}, Taxes incl.)
                  </span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0A192F' }}>
                    ₹{confirmedBookingData.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => navigate('/guest')}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: 10,
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(10, 25, 47, 0.25)',
                    transition: 'all 0.2s'
                  }}
                >
                  Go to Guest Panel →
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/')}
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
                  Home
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
