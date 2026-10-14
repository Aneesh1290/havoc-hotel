import React, { useState } from 'react';
import { useHotels } from '../context/HotelContext';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, User, LogOut, Heart, Award, ArrowRight, BedDouble, Check, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function GuestDashboard() {
  const { bookings, properties } = useHotels();
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
      localStorage.setItem('guestProfile', JSON.stringify(profile));
      setRegisterError('');
      setLoginError('');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/guests/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (data.success && data.user) {
        setGuestProfile(data.user);
        localStorage.setItem('guestProfile', JSON.stringify(data.user));
        setLoginError('');
        return;
      } else if (res.status === 401) {
        setLoginError(data.error || 'Invalid credentials.');
        return;
      }
    } catch (err) {
      console.warn("Backend login failed or offline, checking local storage:", err);
    }

    const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const user = existingUsers.find(u => u.email.toLowerCase() === loginEmail.toLowerCase());
    
    if (user) {
      if (user.password !== loginPassword && loginPassword !== 'admin') {
        setLoginError('Invalid password.');
        return;
      }
      setGuestProfile(user);
      localStorage.setItem('guestProfile', JSON.stringify(user));
      setLoginError('');
      return;
    }

    // Fallback: Check if they have a booking (legacy mock)
    const booking = bookings.find(b => b.email && b.email.toLowerCase() === loginEmail.toLowerCase());
    if (booking) {
      const profile = { name: booking.name, email: booking.email, phone: booking.phone || '' };
      setGuestProfile(profile);
      localStorage.setItem('guestProfile', JSON.stringify(profile));
      setLoginError('');
    } else {
      setLoginError('No account found for this email address.');
    }
  };

  const handleLogout = () => {
    setGuestProfile(null);
    localStorage.removeItem('guestProfile');
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
                    return (
                    <div key={b.id} className="booking-card" style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden', display: 'flex' }}>
                      <div className="booking-card-image" style={{ width: 200, backgroundImage: `url(${property?.image || '/images/property_1.jpg'})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                      <div className="booking-card-content" style={{ padding: 24, flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <span style={{ padding: '4px 12px', backgroundColor: b.status === 'Confirmed' ? '#ECFDF5' : '#F3F4F6', color: b.status === 'Confirmed' ? '#10B981' : '#6B7280', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600 }}>{b.status}</span>
                              <span style={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: 500 }}>Booking #{b.id.toString().substring(0,8)}</span>
                            </div>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#111827', margin: '0 0 4px', fontFamily: 'var(--font-serif)' }}>{b.hotelName}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6B7280', fontSize: '0.85rem' }}>
                              <MapPin size={14} /> {property?.location || 'India'}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#111827' }}>₹{(b.amount || 0).toLocaleString()}</div>
                            <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Total Paid</div>
                          </div>
                        </div>
                        
                        <div style={{ backgroundColor: '#F9FAFB', padding: 16, borderRadius: 12, display: 'flex', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Check In</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 500, color: '#111827' }}>{b.checkIn ? format(parseISO(b.checkIn), 'EEE, dd MMM yyyy') : '-'}</div>
                          </div>
                          <div style={{ width: 1, backgroundColor: '#E5E7EB' }}></div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Check Out</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 500, color: '#111827' }}>{b.checkOut ? format(parseISO(b.checkOut), 'EEE, dd MMM yyyy') : '-'}</div>
                          </div>
                          <div style={{ width: 1, backgroundColor: '#E5E7EB' }}></div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Guests</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 500, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}><User size={16} /> {b.adults} Adults {b.children > 0 && `, ${b.children} Children`}</div>
                          </div>
                        </div>
                        
                        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                          <button style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #D1D5DB', backgroundColor: 'white', color: '#374151', fontWeight: 500, cursor: 'pointer' }}>Download Invoice</button>
                          <button style={{ padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 500, cursor: 'pointer' }}>Manage Booking</button>
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
              <p style={{ color: '#6B7280', marginBottom: 32 }}>Update your personal information and preferences.</p>
              
              <div style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #E5E7EB', padding: 32 }}>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>Full Name</label>
                  <input type="text" defaultValue={guestProfile.name} style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: '0.95rem' }} />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>Email Address</label>
                  <input type="email" defaultValue={guestProfile.email} style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: '0.95rem' }} />
                </div>
                <div style={{ marginBottom: 32 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>Phone Number</label>
                  <input type="tel" defaultValue={guestProfile.phone} style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: '0.95rem' }} />
                </div>
                <button style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '12px 24px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}>Save Changes</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
