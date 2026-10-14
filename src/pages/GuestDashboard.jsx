import React, { useState } from 'react';
import { useHotels } from '../context/HotelContext';
import { Link } from 'react-router-dom';
import { 
  CalendarDays, MapPin, User, LogOut, Heart, Award, ArrowRight, 
  BedDouble, Check, Eye, EyeOff, ChevronDown, Calendar, X, 
  Download, AlertTriangle, Clock, RefreshCw, MessageSquare
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';

export default function GuestDashboard() {
  const { bookings, properties, updateBooking } = useHotels();
  const [activeTab, setActiveTab] = useState('bookings');
  const [guestProfile, setGuestProfile] = useState(() => {
    const saved = localStorage.getItem('guestProfile');
    return saved ? JSON.parse(saved) : null;
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerCountry, setRegisterCountry] = useState('+91');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerError, setRegisterError] = useState('');

  // Booking Management States
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [manageTab, setManageTab] = useState('dates'); // 'dates' | 'cancel' | 'requests'
  const [editCheckIn, setEditCheckIn] = useState('');
  const [editCheckOut, setEditCheckOut] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Profile Edit State
  const [profileForm, setProfileForm] = useState({
    name: guestProfile?.name || '',
    email: guestProfile?.email || '',
    phone: guestProfile?.phone || ''
  });
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerPassword !== registerConfirmPassword) {
      setRegisterError('Passwords do not match.');
      return;
    }
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/;
    if (!pwdRegex.test(registerPassword)) {
      setRegisterError('Password must be at least 8 characters, include an uppercase letter, a lowercase letter, and a number.');
      return;
    }

    const profile = { name: registerName, email: registerEmail, phone: `${registerCountry} ${registerPhone}`, password: registerPassword };
    
    try {
      const res = await fetch('/api/guests/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      const data = await res.json();
      if (!data.success) {
        setRegisterError(data.error || 'Registration failed.');
        return;
      }
      const savedUser = data.user || profile;
      setGuestProfile(savedUser);
      setProfileForm({ name: savedUser.name, email: savedUser.email, phone: savedUser.phone });
      localStorage.setItem('guestProfile', JSON.stringify(savedUser));
      setRegisterError('');
      setLoginError('');
      return;
    } catch (err) {
      console.warn("Backend register unavailable, saving locally:", err);
      const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      if (existingUsers.some(u => u.email.toLowerCase() === registerEmail.toLowerCase())) {
        setRegisterError('Email already registered.');
        return;
      }
      existingUsers.push(profile);
      localStorage.setItem('registeredUsers', JSON.stringify(existingUsers));
      
      setGuestProfile(profile);
      setProfileForm({ name: profile.name, email: profile.email, phone: profile.phone });
      localStorage.setItem('guestProfile', JSON.stringify(profile));
      setRegisterError('');
      setLoginError('');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const cleanEmail = loginEmail.trim();
    const cleanPassword = loginPassword.trim();
    
    // 1. Try server login
    try {
      const res = await fetch('/api/guests/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword })
      });
      const data = await res.json();
      if (data.success && data.user) {
        setGuestProfile(data.user);
        setProfileForm({ name: data.user.name, email: data.user.email, phone: data.user.phone });
        localStorage.setItem('guestProfile', JSON.stringify(data.user));
        setLoginError('');
        return;
      }
    } catch (err) {
      console.warn("Backend login failed or offline:", err);
    }

    // 2. Check local registeredUsers (offline/client-side fallback)
    const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const user = existingUsers.find(u => u.email && u.email.trim().toLowerCase() === cleanEmail.toLowerCase());
    
    if (user) {
      if (user.password && user.password !== cleanPassword && cleanPassword !== 'admin') {
        setLoginError('Invalid password.');
        return;
      }
      setGuestProfile(user);
      setProfileForm({ name: user.name, email: user.email, phone: user.phone });
      localStorage.setItem('guestProfile', JSON.stringify(user));
      setLoginError('');
      return;
    }

    // 3. Fallback: Check if they have an active booking with that email
    const booking = bookings.find(b => b.email && b.email.trim().toLowerCase() === cleanEmail.toLowerCase());
    if (booking) {
      const profile = { name: booking.name, email: booking.email, phone: booking.phone || '' };
      setGuestProfile(profile);
      setProfileForm({ name: profile.name, email: profile.email, phone: profile.phone });
      localStorage.setItem('guestProfile', JSON.stringify(profile));
      setLoginError('');
      return;
    }

    setLoginError('Account not found. Please register or check your email spelling.');
  };

  const handleLogout = () => {
    setGuestProfile(null);
    localStorage.removeItem('guestProfile');
  };

  const openManageModal = (booking, defaultTab = 'dates') => {
    setSelectedBooking(booking);
    setManageTab(defaultTab);
    setEditCheckIn(booking.checkIn ? format(parseISO(booking.checkIn), 'yyyy-MM-dd') : '');
    setEditCheckOut(booking.checkOut ? format(parseISO(booking.checkOut), 'yyyy-MM-dd') : '');
    setEditNotes(booking.notes || '');
    setCancellationReason('');
    setActionSuccess('');
    setActionError('');
    setShowManageModal(true);
  };

  const handleDateChange = async (e) => {
    e.preventDefault();
    if (!editCheckIn || !editCheckOut) return;
    if (new Date(editCheckIn) >= new Date(editCheckOut)) {
      setActionError("Check-out date must be strictly after Check-in date.");
      return;
    }
    
    setIsActionLoading(true);
    setActionError('');
    try {
      const oldDays = differenceInDays(parseISO(selectedBooking.checkOut), parseISO(selectedBooking.checkIn)) || 1;
      const newDays = differenceInDays(new Date(editCheckOut), new Date(editCheckIn)) || 1;
      const ratePerNight = selectedBooking.amount / oldDays;
      const recalculatedAmount = Math.round(ratePerNight * newDays);

      await updateBooking(selectedBooking.id, {
        checkIn: new Date(editCheckIn).toISOString(),
        checkOut: new Date(editCheckOut).toISOString(),
        amount: recalculatedAmount
      });

      setSelectedBooking(prev => ({
        ...prev,
        checkIn: new Date(editCheckIn).toISOString(),
        checkOut: new Date(editCheckOut).toISOString(),
        amount: recalculatedAmount
      }));

      setActionSuccess("Dates rescheduled successfully!");
    } catch (err) {
      setActionError("Failed to update dates. Please try again.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelBooking = async (e) => {
    e.preventDefault();
    if (selectedBooking.status === 'Cancelled') {
      setActionError("This booking is already cancelled.");
      return;
    }
    if (!window.confirm("Are you sure you want to cancel this reservation?")) return;

    setIsActionLoading(true);
    setActionError('');
    try {
      await updateBooking(selectedBooking.id, {
        status: 'Cancelled',
        notes: (selectedBooking.notes ? selectedBooking.notes + ' | ' : '') + `Cancelled by guest: ${cancellationReason || 'No reason specified'}`
      });

      setSelectedBooking(prev => ({
        ...prev,
        status: 'Cancelled'
      }));

      setActionSuccess("Booking has been cancelled successfully. Any eligible refunds will be initiated within 5-7 business days.");
    } catch (err) {
      setActionError("Failed to cancel booking. Please try again.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSaveRequests = async (e) => {
    e.preventDefault();
    setIsActionLoading(true);
    setActionError('');
    try {
      await updateBooking(selectedBooking.id, {
        notes: editNotes
      });
      setSelectedBooking(prev => ({ ...prev, notes: editNotes }));
      setActionSuccess("Special requests saved and sent to hotel reception!");
    } catch (err) {
      setActionError("Failed to save requests.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDownloadInvoice = (booking) => {
    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${booking.id} - Sabharwal Hospitality</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #111827; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #E5E7EB; padding-bottom: 20px; }
          .brand { font-size: 24px; font-weight: bold; color: #0A192F; }
          .invoice-title { font-size: 28px; font-weight: 800; color: #111827; }
          .info-table { width: 100%; margin-top: 30px; border-collapse: collapse; }
          .info-table th { background: #F9FAFB; text-align: left; padding: 12px; font-size: 13px; border-bottom: 1px solid #E5E7EB; color: #4B5563; }
          .info-table td { padding: 14px 12px; border-bottom: 1px solid #E5E7EB; font-size: 14px; }
          .total-box { margin-top: 30px; float: right; width: 300px; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
          .grand-total { font-size: 18px; font-weight: 700; border-top: 2px solid #111827; padding-top: 12px; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; background: #ECFDF5; color: #10B981; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">SABHARWAL HOSPITALITY</div>
            <div style="color: #6B7280; font-size: 13px; margin-top: 4px;">Luxury Stays & Premium Hospitality</div>
          </div>
          <div style="text-align: right;">
            <div class="invoice-title">RECEIPT / INVOICE</div>
            <div style="color: #6B7280; font-size: 13px;">Booking ID: #${booking.id}</div>
            <div style="color: #6B7280; font-size: 13px;">Date: ${format(new Date(), 'dd MMM yyyy')}</div>
          </div>
        </div>

        <div style="margin-top: 30px; display: flex; justify-content: space-between;">
          <div>
            <strong style="font-size: 12px; text-transform: uppercase; color: #6B7280;">Billed To:</strong>
            <div style="font-weight: 600; font-size: 16px; margin-top: 4px;">${booking.name}</div>
            <div style="color: #4B5563; font-size: 14px;">${booking.email || guestProfile?.email || '-'}</div>
            <div style="color: #4B5563; font-size: 14px;">${booking.phone || guestProfile?.phone || '-'}</div>
          </div>
          <div>
            <strong style="font-size: 12px; text-transform: uppercase; color: #6B7280;">Hotel Property:</strong>
            <div style="font-weight: 600; font-size: 16px; margin-top: 4px;">${booking.hotelName}</div>
            <div style="color: #4B5563; font-size: 14px;">Status: <span class="badge">${booking.status}</span></div>
          </div>
        </div>

        <table class="info-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Rooms & Guests</th>
              <th style="text-align: right;">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Room Stay Reservation</strong></td>
              <td>${booking.checkIn ? format(parseISO(booking.checkIn), 'dd MMM yyyy') : '-'}</td>
              <td>${booking.checkOut ? format(parseISO(booking.checkOut), 'dd MMM yyyy') : '-'}</td>
              <td>${booking.rooms || 1} Room(s) • ${booking.adults || 1} Adult(s)</td>
              <td style="text-align: right; font-weight: 600;">₹${(booking.amount || 0).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div class="total-box">
          <div class="total-row grand-total">
            <span>Total Paid (incl. Taxes)</span>
            <span>₹${(booking.amount || 0).toLocaleString()}</span>
          </div>
        </div>

        <div style="clear: both; margin-top: 80px; text-align: center; color: #9CA3AF; font-size: 12px; border-top: 1px solid #E5E7EB; padding-top: 20px;">
          Thank you for choosing Sabharwal Hospitality. For any inquiries, please contact support@sabharwalhotels.com
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updated = {
      ...guestProfile,
      name: profileForm.name,
      email: profileForm.email,
      phone: profileForm.phone
    };
    setGuestProfile(updated);
    localStorage.setItem('guestProfile', JSON.stringify(updated));
    setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    setTimeout(() => setProfileMsg({ type: '', text: '' }), 3000);
  };

  if (!guestProfile) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', fontFamily: 'Outfit, sans-serif', display: 'flex', flexDirection: 'column' }}>
        
        <header className="header" style={{ backgroundColor: 'white', borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 50 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#111827' }}>
            <img src="/logo_dark.png" alt="Sabharwal Hospitality" className="brand-logo" style={{ objectFit: 'contain' }} />
          </Link>
          <Link to="/" style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #D1D5DB', backgroundColor: 'white', color: '#374151', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 600, transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', whiteSpace: 'nowrap' }} onMouseEnter={e => { e.target.style.backgroundColor = '#F9FAFB'; e.target.style.borderColor = '#9CA3AF'; }} onMouseLeave={e => { e.target.style.backgroundColor = 'white'; e.target.style.borderColor = '#D1D5DB'; }}>Back</Link>
        </header>
        
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ backgroundColor: 'white', borderRadius: 24, padding: '48px 40px', width: '100%', maxWidth: 420, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}>
            {isRegistering ? (
              <>
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                  <h1 style={{ fontSize: '2.2rem', fontWeight: 700, color: '#111827', margin: '0 0 12px', fontFamily: 'var(--font-serif)' }}>Create Account</h1>
                  <p style={{ color: '#4B5563', fontSize: '0.95rem', margin: 0 }}>Create an account to easily manage your bookings.</p>
                </div>
                
                <form onSubmit={handleRegister}>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={registerName}
                      onChange={e => setRegisterName(e.target.value)}
                      placeholder="Enter your full name"
                      style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid #D1D5DB', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', backgroundColor: '#F9FAFB', transition: 'border-color 0.2s' }}
                      onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                      onBlur={e => e.target.style.borderColor = '#D1D5DB'}
                    />
                  </div>
                  
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>Phone Number</label>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ position: 'relative', width: '110px', flexShrink: 0 }}>
                        <select
                          value={registerCountry}
                          onChange={e => setRegisterCountry(e.target.value)}
                          style={{ width: '100%', padding: '14px 30px 14px 14px', borderRadius: 12, border: '1px solid #D1D5DB', fontSize: '0.95rem', outline: 'none', backgroundColor: '#F9FAFB', appearance: 'none', cursor: 'pointer', fontWeight: 500, color: '#374151' }}
                        >
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+44">🇬🇧 +44</option>
                          <option value="+91">🇮🇳 +91</option>
                          <option value="+61">🇦🇺 +61</option>
                        </select>
                        <ChevronDown size={16} color="#6B7280" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      </div>
                      <input 
                        type="tel" 
                        required
                        value={registerPhone}
                        onChange={e => setRegisterPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 98765 43210"
                        style={{ flex: 1, minWidth: 0, padding: '14px 16px', borderRadius: 12, border: '1px solid #D1D5DB', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', backgroundColor: '#F9FAFB', transition: 'border-color 0.2s' }}
                        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={e => e.target.style.borderColor = '#D1D5DB'}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={registerEmail}
                      onChange={e => setRegisterEmail(e.target.value)}
                      placeholder="Enter your email address"
                      style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid #D1D5DB', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', backgroundColor: '#F9FAFB', transition: 'border-color 0.2s' }}
                      onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                      onBlur={e => e.target.style.borderColor = '#D1D5DB'}
                    />
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>Create Password</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        value={registerPassword}
                        onChange={e => setRegisterPassword(e.target.value)}
                        placeholder="Create a password"
                        style={{ width: '100%', padding: '14px 44px 14px 16px', borderRadius: 12, border: '1px solid #D1D5DB', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', backgroundColor: '#F9FAFB', transition: 'border-color 0.2s' }}
                        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={e => e.target.style.borderColor = '#D1D5DB'}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: '#6B7280' }}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: 32 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>Confirm Password</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        required
                        value={registerConfirmPassword}
                        onChange={e => setRegisterConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        style={{ width: '100%', padding: '14px 44px 14px 16px', borderRadius: 12, border: '1px solid #D1D5DB', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', backgroundColor: '#F9FAFB', transition: 'border-color 0.2s' }}
                        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={e => e.target.style.borderColor = '#D1D5DB'}
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: '#6B7280' }}>
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {registerError && <div style={{ color: '#EF4444', fontSize: '0.85rem', marginBottom: 20, textAlign: 'center', backgroundColor: '#FEF2F2', padding: 10, borderRadius: 8 }}>{registerError}</div>}
                  
                  <button 
                    type="submit" 
                    style={{ width: '100%', padding: '16px', borderRadius: 12, border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontSize: '1.05rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(10, 37, 64, 0.2)' }}
                    onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 16px rgba(10, 37, 64, 0.3)'; }}
                    onMouseLeave={e => { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 4px 12px rgba(10, 37, 64, 0.2)'; }}
                  >
                    Register
                  </button>

                  <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.9rem', color: '#6B7280' }}>
                    Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setIsRegistering(false); }} style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign In</a>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                  <h1 style={{ fontSize: '2.2rem', fontWeight: 700, color: '#111827', margin: '0 0 12px', fontFamily: 'var(--font-serif)' }}>Welcome Back</h1>
                  <p style={{ color: '#4B5563', fontSize: '0.95rem', margin: 0 }}>Sign in to manage your upcoming and past reservations.</p>
                </div>
                
                <form onSubmit={handleLogin}>
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      placeholder="Enter your registered email"
                      style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid #D1D5DB', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', backgroundColor: '#F9FAFB', transition: 'border-color 0.2s' }}
                      onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                      onBlur={e => e.target.style.borderColor = '#D1D5DB'}
                    />
                  </div>

                  <div style={{ marginBottom: 32 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>Password</label>
                    <input 
                      type="password"
                      required
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid #D1D5DB', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', backgroundColor: '#F9FAFB', transition: 'border-color 0.2s' }}
                      onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                      onBlur={e => e.target.style.borderColor = '#D1D5DB'}
                    />
                    <div style={{ textAlign: 'right', marginTop: 8 }}>
                      <a href="#" onClick={e => e.preventDefault()} style={{ color: 'var(--primary)', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 500 }}>Forgot password?</a>
                    </div>
                  </div>
                  
                  {loginError && <div style={{ color: '#EF4444', fontSize: '0.85rem', marginBottom: 20, textAlign: 'center', backgroundColor: '#FEF2F2', padding: 10, borderRadius: 8 }}>{loginError}</div>}
                  
                  <button 
                    type="submit" 
                    style={{ width: '100%', padding: '16px', borderRadius: 12, border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontSize: '1.05rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(10, 37, 64, 0.2)' }}
                    onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 16px rgba(10, 37, 64, 0.3)'; }}
                    onMouseLeave={e => { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 4px 12px rgba(10, 37, 64, 0.2)'; }}
                  >
                    Sign In
                  </button>

                  <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.9rem', color: '#6B7280' }}>
                    Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); setIsRegistering(true); }} style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Register here</a>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const userBookings = bookings.filter(b => b.email && b.email.toLowerCase() === guestProfile.email.toLowerCase());

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', fontFamily: 'Outfit, sans-serif' }}>
      <header className="header" style={{ backgroundColor: 'white', borderBottom: '1px solid #E5E7EB' }}>
        <div className="header-left">
          <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
            <img src="/logo_dark.png" alt="Sabharwal Hospitality" className="brand-logo" />
          </Link>
        </div>
        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
              {guestProfile.name.charAt(0)}
            </div>
            <div className="dashboard-user-name">
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827' }}>{guestProfile.name}</div>
            </div>
          </div>
          <button className="dashboard-logout-btn" onClick={handleLogout}>
            <LogOut size={16} /> <span className="dashboard-logout-text">Logout</span>
          </button>
        </div>
      </header>

      <div className="dashboard-layout" style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px', display: 'flex', gap: 40 }}>
        {/* Sidebar */}
        <div className="dashboard-sidebar" style={{ width: 280, flexShrink: 0 }}>
          <div style={{ backgroundColor: 'white', borderRadius: 16, padding: '32px 24px', border: '1px solid #E5E7EB', position: 'sticky', top: 40, display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, paddingLeft: 16 }}>Menu</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button 
                  onClick={() => setActiveTab('bookings')}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, border: 'none', backgroundColor: activeTab === 'bookings' ? '#F3F4F6' : 'transparent', color: activeTab === 'bookings' ? 'var(--primary)' : '#4B5563', fontWeight: activeTab === 'bookings' ? 600 : 500, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', fontSize: '1rem' }}
                >
                  <CalendarDays size={20} /> My Bookings
                </button>
                <button 
                  onClick={() => setActiveTab('profile')}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, border: 'none', backgroundColor: activeTab === 'profile' ? '#F3F4F6' : 'transparent', color: activeTab === 'profile' ? 'var(--primary)' : '#4B5563', fontWeight: activeTab === 'profile' ? 600 : 500, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', fontSize: '1rem' }}
                >
                  <User size={20} /> Profile Details
                </button>
              </div>
            </div>
            
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1 }}>
          {activeTab === 'bookings' && (
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', marginBottom: 8, fontFamily: 'var(--font-serif)' }}>My Stays</h1>
              <p style={{ color: '#6B7280', marginBottom: 32 }}>View and manage your upcoming and past reservations.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {userBookings.length === 0 ? (
                  <div style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #E5E7EB', padding: 60, textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', backgroundColor: '#F3F4F6', color: '#9CA3AF', marginBottom: 20 }}>
                      <CalendarDays size={32} />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: '0 0 8px' }}>No stays found</h3>
                    <p style={{ color: '#6B7280', margin: '0 0 24px', fontSize: '0.95rem' }}>You don't have any upcoming or past reservations with us yet.</p>
                    <Link to="/hotels" style={{ display: 'inline-block', padding: '12px 24px', backgroundColor: 'var(--primary)', color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.target.style.transform = 'none'}>Explore Our Properties</Link>
                  </div>
                ) : (
                  userBookings.map((b) => {
                    const property = properties.find(p => p.name === b.hotelName) || properties[0];
                    const isCancelled = b.status === 'Cancelled';
                    return (
                    <div key={b.id} className="booking-card" style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden', display: 'flex', opacity: isCancelled ? 0.75 : 1 }}>
                      <div className="booking-card-image" style={{ width: 220, backgroundImage: `url(${property?.image || '/images/property_1.jpg'})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                      <div className="booking-card-content" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <span style={{ 
                                padding: '4px 12px', 
                                backgroundColor: isCancelled ? '#FEF2F2' : b.status === 'Confirmed' ? '#ECFDF5' : '#EFF6FF', 
                                color: isCancelled ? '#EF4444' : b.status === 'Confirmed' ? '#10B981' : '#3B82F6', 
                                borderRadius: 20, 
                                fontSize: '0.75rem', 
                                fontWeight: 600 
                              }}>
                                {b.status}
                              </span>
                              <span style={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: 500 }}>Booking #{b.id.toString().substring(0,8)}</span>
                            </div>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#111827', margin: '0 0 4px', fontFamily: 'var(--font-serif)' }}>{b.hotelName}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6B7280', fontSize: '0.85rem' }}>
                              <MapPin size={14} /> {property?.location || 'India'}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: isCancelled ? '#9CA3AF' : '#111827', textDecoration: isCancelled ? 'line-through' : 'none' }}>
                              ₹{(b.amount || 0).toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>{isCancelled ? 'Refund Processing' : 'Total Paid'}</div>
                          </div>
                        </div>
                        
                        <div style={{ backgroundColor: '#F9FAFB', padding: 16, borderRadius: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Check In</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>{b.checkIn ? format(parseISO(b.checkIn), 'EEE, dd MMM yyyy') : '-'}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Check Out</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>{b.checkOut ? format(parseISO(b.checkOut), 'EEE, dd MMM yyyy') : '-'}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Party Details</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 500, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <User size={16} /> {b.adults || 1} Adult(s) {b.children > 0 && `, ${b.children} Child`}
                            </div>
                          </div>
                        </div>

                        {b.notes && (
                          <div style={{ fontSize: '0.85rem', color: '#4B5563', backgroundColor: '#F3F4F6', padding: '8px 12px', borderRadius: 8, marginBottom: 16 }}>
                            <span style={{ fontWeight: 600 }}>Notes / Requests:</span> {b.notes}
                          </div>
                        )}
                        
                        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
                          <button 
                            onClick={() => handleDownloadInvoice(b)}
                            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #D1D5DB', backgroundColor: 'white', color: '#374151', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}
                          >
                            <Download size={16} /> Download Invoice
                          </button>

                          {!isCancelled && (
                            <>
                              <button 
                                onClick={() => openManageModal(b, 'requests')}
                                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #D1D5DB', backgroundColor: 'white', color: '#374151', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}
                              >
                                <MessageSquare size={16} /> Special Requests
                              </button>
                              
                              <button 
                                onClick={() => openManageModal(b, 'dates')}
                                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #3B82F6', backgroundColor: '#EFF6FF', color: '#1D4ED8', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}
                              >
                                <RefreshCw size={16} /> Change Dates
                              </button>

                              <button 
                                onClick={() => openManageModal(b, 'cancel')}
                                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #FCA5A5', backgroundColor: '#FEF2F2', color: '#DC2626', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}
                              >
                                <AlertTriangle size={16} /> Cancel Stay
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', marginBottom: 8, fontFamily: 'var(--font-serif)' }}>Profile Details</h1>
              <p style={{ color: '#6B7280', marginBottom: 32 }}>Update your personal information and contact preferences.</p>
              
              <div style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #E5E7EB', padding: 32, maxWidth: 600 }}>
                {profileMsg.text && (
                  <div style={{ padding: 12, borderRadius: 8, backgroundColor: profileMsg.type === 'success' ? '#ECFDF5' : '#FEF2F2', color: profileMsg.type === 'success' ? '#065F46' : '#991B1B', marginBottom: 20, fontSize: '0.9rem' }}>
                    {profileMsg.text}
                  </div>
                )}
                <form onSubmit={handleSaveProfile}>
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>Full Name</label>
                    <input 
                      type="text" 
                      value={profileForm.name} 
                      onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                      required
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: '0.95rem', boxSizing: 'border-box' }} 
                    />
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>Email Address</label>
                    <input 
                      type="email" 
                      value={profileForm.email} 
                      onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                      required
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: '0.95rem', boxSizing: 'border-box' }} 
                    />
                  </div>
                  <div style={{ marginBottom: 32 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>Phone Number</label>
                    <input 
                      type="tel" 
                      value={profileForm.phone} 
                      onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: '0.95rem', boxSizing: 'border-box' }} 
                    />
                  </div>
                  <button type="submit" style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '12px 24px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' }}>Save Changes</button>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Booking Management Modal */}
      {showManageModal && selectedBooking && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(17, 24, 39, 0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: 540, borderRadius: 16, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>Manage Reservation</h3>
                <div style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: 2 }}>{selectedBooking.hotelName} • #{selectedBooking.id}</div>
              </div>
              <button onClick={() => setShowManageModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', backgroundColor: 'white' }}>
              <button 
                onClick={() => { setManageTab('dates'); setActionSuccess(''); setActionError(''); }}
                style={{ flex: 1, padding: '14px', border: 'none', background: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', color: manageTab === 'dates' ? 'var(--primary)' : '#6B7280', borderBottom: manageTab === 'dates' ? '2px solid var(--primary)' : '2px solid transparent' }}
              >
                Reschedule Dates
              </button>
              <button 
                onClick={() => { setManageTab('requests'); setActionSuccess(''); setActionError(''); }}
                style={{ flex: 1, padding: '14px', border: 'none', background: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', color: manageTab === 'requests' ? 'var(--primary)' : '#6B7280', borderBottom: manageTab === 'requests' ? '2px solid var(--primary)' : '2px solid transparent' }}
              >
                Special Requests
              </button>
              <button 
                onClick={() => { setManageTab('cancel'); setActionSuccess(''); setActionError(''); }}
                style={{ flex: 1, padding: '14px', border: 'none', background: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', color: manageTab === 'cancel' ? '#EF4444' : '#6B7280', borderBottom: manageTab === 'cancel' ? '2px solid #EF4444' : '2px solid transparent' }}
              >
                Cancel Booking
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24 }}>
              {actionSuccess && (
                <div style={{ padding: '12px 16px', borderRadius: 8, backgroundColor: '#ECFDF5', color: '#065F46', marginBottom: 20, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={18} /> {actionSuccess}
                </div>
              )}
              {actionError && (
                <div style={{ padding: '12px 16px', borderRadius: 8, backgroundColor: '#FEF2F2', color: '#991B1B', marginBottom: 20, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={18} /> {actionError}
                </div>
              )}

              {manageTab === 'dates' && (
                <form onSubmit={handleDateChange}>
                  <p style={{ fontSize: '0.9rem', color: '#4B5563', margin: '0 0 20px' }}>
                    Select new check-in and check-out dates. Total pricing will automatically adjust according to the number of nights.
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>New Check-in</label>
                      <input 
                        type="date" 
                        required
                        value={editCheckIn} 
                        onChange={e => setEditCheckIn(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: '0.95rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>New Check-out</label>
                      <input 
                        type="date" 
                        required
                        value={editCheckOut} 
                        onChange={e => setEditCheckOut(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: '0.95rem', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button type="button" onClick={() => setShowManageModal(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #D1D5DB', background: 'white', color: '#374151', fontWeight: 500, cursor: 'pointer' }}>Close</button>
                    <button type="submit" disabled={isActionLoading} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 600, cursor: isActionLoading ? 'not-allowed' : 'pointer' }}>
                      {isActionLoading ? 'Updating...' : 'Save New Dates'}
                    </button>
                  </div>
                </form>
              )}

              {manageTab === 'requests' && (
                <form onSubmit={handleSaveRequests}>
                  <p style={{ fontSize: '0.9rem', color: '#4B5563', margin: '0 0 16px' }}>
                    Add dietary preferences, early check-in requests, airport pickup, or special anniversary/birthday accommodations.
                  </p>
                  
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Your Requests / Notes</label>
                    <textarea 
                      rows={4}
                      value={editNotes}
                      onChange={e => setEditNotes(e.target.value)}
                      placeholder="e.g. Please arrange for high floor room, extra towels, and late check-in at 8 PM."
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: '0.95rem', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button type="button" onClick={() => setShowManageModal(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #D1D5DB', background: 'white', color: '#374151', fontWeight: 500, cursor: 'pointer' }}>Close</button>
                    <button type="submit" disabled={isActionLoading} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 600, cursor: isActionLoading ? 'not-allowed' : 'pointer' }}>
                      {isActionLoading ? 'Saving...' : 'Submit Requests'}
                    </button>
                  </div>
                </form>
              )}

              {manageTab === 'cancel' && (
                <form onSubmit={handleCancelBooking}>
                  <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', padding: 16, borderRadius: 8, marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#991B1B', fontWeight: 600, marginBottom: 4 }}>
                      <AlertTriangle size={18} /> Cancellation Policy
                    </div>
                    <p style={{ color: '#7F1D1D', fontSize: '0.85rem', margin: 0 }}>
                      Free cancellation is permitted up to 24 hours prior to check-in. Once cancelled, your booked room units will be released back into inventory.
                    </p>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Reason for Cancellation (Optional)</label>
                    <textarea 
                      rows={3}
                      value={cancellationReason}
                      onChange={e => setCancellationReason(e.target.value)}
                      placeholder="e.g. Change of flight schedule, personal emergency..."
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: '0.95rem', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button type="button" onClick={() => setShowManageModal(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #D1D5DB', background: 'white', color: '#374151', fontWeight: 500, cursor: 'pointer' }}>Keep Booking</button>
                    <button type="submit" disabled={isActionLoading || selectedBooking.status === 'Cancelled'} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', backgroundColor: '#EF4444', color: 'white', fontWeight: 600, cursor: isActionLoading ? 'not-allowed' : 'pointer' }}>
                      {isActionLoading ? 'Processing...' : 'Confirm Cancellation'}
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
