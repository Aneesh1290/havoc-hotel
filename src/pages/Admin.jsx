import React, { useState, useEffect } from 'react';
import { useHotels } from '../context/HotelContext';
import { Link } from 'react-router-dom';
import { 
  Mountain, LayoutDashboard, CalendarDays, Building2, BedDouble, 
  Archive, Users, CreditCard, FileText, Tag, Image as ImageIcon, 
  Settings, Search, Bell, Plus, Headset, CalendarCheck, Wallet, 
  PieChart, Users as UsersIcon, ArrowRight, MapPin, Edit2, Trash2, Check, X, MoreVertical,
  Clock, CheckCircle, Mail, Send, Copy
} from 'lucide-react';
import { format, isSameDay, isAfter, isBefore, parseISO, startOfDay } from 'date-fns';

export default function Admin() {
  const { properties, bookings, inventoryAlerts, addProperty, removeProperty, updateProperty, rooms, addRoomType, removeRoomType, updateRoomType, removeBooking } = useHotels();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('adminToken'));
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        setIsLoggedIn(true);
      } else {
        setLoginError(data.error || 'Login failed');
      }
    } catch (err) {
      setLoginError('Error connecting to server');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsLoggedIn(false);
  };
  
  const [adminProfile, setAdminProfile] = useState(() => {
    const saved = localStorage.getItem('adminProfileData');
    return saved ? JSON.parse(saved) : {
      name: 'Aneesh P',
      role: 'Administrator',
      image: 'https://i.pravatar.cc/150?img=11',
      firstName: 'Aneesh'
    };
  });
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileForm, setProfileForm] = useState(adminProfile);

  const saveProfile = () => {
    const firstName = profileForm.name.split(' ')[0];
    const newProfile = { ...profileForm, firstName };
    setAdminProfile(newProfile);
    localStorage.setItem('adminProfileData', JSON.stringify(newProfile));
    setShowProfileEdit(false);
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const data = new FormData();
    data.append('image', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: data });
      const result = await res.json();
      if (result.success) {
        setProfileForm(prev => ({ ...prev, image: `${result.url}` }));
      }
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload image.");
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ backgroundColor: 'white', padding: 40, borderRadius: 16, width: '100%', maxWidth: 400, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <img src="/logo_dark.png" alt="Sabharwal Hospitality" style={{ height: 60, marginBottom: 16 }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>Admin Login</h2>
          </div>
          
          {loginError && (
            <div style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '12px 16px', borderRadius: 8, fontSize: '0.875rem', marginBottom: 20 }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>Username</label>
              <input 
                type="text" 
                value={loginForm.username}
                onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>Password</label>
              <input 
                type="password" 
                value={loginForm.password}
                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                required
              />
            </div>
            <button type="submit" style={{ backgroundColor: '#0A192F', color: 'white', padding: 14, borderRadius: 8, border: 'none', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', marginTop: 8 }}>
              Sign In
            </button>
          </form>
          
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Link to="/" style={{ color: '#6B7280', fontSize: '0.875rem', textDecoration: 'none' }}>&larr; Back to Website</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#F8F9FA', fontFamily: 'var(--font-sans)', overflow: 'hidden' }}>
      
      {/* Sidebar */}
      <aside style={{ width: 280, backgroundColor: '#0A192F', color: 'white', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/logo.png" alt="Sabharwal Hospitality" style={{ height: 80 }} />
          </div>
        </div>
        
        <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<Users size={20} />} label="Registered Guests" active={activeTab === 'guests'} onClick={() => setActiveTab('guests')} />
          <NavItem icon={<CalendarDays size={20} />} label="Bookings" active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} />
          <NavItem icon={<Building2 size={20} />} label="Properties" active={activeTab === 'properties'} onClick={() => setActiveTab('properties')} />
          <NavItem icon={<BedDouble size={20} />} label="Rooms" active={activeTab === 'rooms'} onClick={() => setActiveTab('rooms')} />
          <NavItem icon={<CreditCard size={20} />} label="Payments" active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} />
          <NavItem icon={<FileText size={20} />} label="Reports" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
          <NavItem icon={<Tag size={20} />} label="Offers & Packages" active={activeTab === 'offers'} onClick={() => setActiveTab('offers')} />
          <NavItem icon={<Settings size={20} />} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>


      </aside>

      {/* Main Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 40px', backgroundColor: '#F8F9FA' }}>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#E5E7EB', padding: '8px 16px', borderRadius: 8, width: 400 }}>
            <Search size={18} color="#6B7280" />
            <input 
              type="text" 
              placeholder="Search bookings, guests, rooms..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', marginLeft: 12, width: '100%', fontSize: '0.9rem' }}
            />
            <div style={{ backgroundColor: 'white', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', color: '#6B7280' }}>/</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Link to="/" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}>Go to Booking Site &rarr;</Link>
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <Bell size={22} color="#4B5563" />
              <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, backgroundColor: '#EF4444', borderRadius: '50%', border: '2px solid #F8F9FA' }}></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '4px 8px', borderRadius: 8, transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3F4F6'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => { setProfileForm(adminProfile); setShowProfileEdit(true); }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundImage: `url(${adminProfile.image})`, backgroundSize: 'cover' }}></div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>{adminProfile.name}</span>
                <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>{adminProfile.role}</span>
              </div>
            </div>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', padding: '8px 12px', borderRadius: 6 }}>
              Logout
            </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <div style={{ padding: '0 40px 40px' }}>
          {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} properties={properties} bookings={bookings} inventoryAlerts={inventoryAlerts} rooms={rooms} adminProfile={adminProfile} />}
          {activeTab === 'guests' && <GuestsView />}
          {activeTab === 'properties' && <PropertiesView properties={properties} addProperty={addProperty} removeProperty={removeProperty} updateProperty={updateProperty} rooms={rooms} />}
          {activeTab === 'bookings' && <BookingsView bookings={bookings} removeBooking={removeBooking} searchQuery={searchQuery} />}
          {activeTab === 'rooms' && <RoomsView properties={properties} rooms={rooms} addRoomType={addRoomType} removeRoomType={removeRoomType} updateRoomType={updateRoomType} />}
          {activeTab === 'payments' && <PaymentsView bookings={bookings} />}
          {activeTab === 'reports' && <ReportsView bookings={bookings} properties={properties} />}
          {activeTab === 'offers' && <OffersView />}
          {activeTab === 'settings' && <SettingsView />}
        </div>
      </main>

      {showProfileEdit && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: 32, borderRadius: 16, width: '100%', maxWidth: 400, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#111827' }}>Edit Profile</h3>
              <button onClick={() => setShowProfileEdit(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={20} color="#6B7280" /></button>
            </div>
            
            <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundImage: `url(${profileForm.image})`, backgroundSize: 'cover', marginBottom: 12, border: '1px solid #E5E7EB' }}></div>
              <input type="file" accept="image/*" id="profile-upload" style={{ display: 'none' }} onChange={handleProfileImageUpload} />
              <div style={{ display: 'flex', gap: 16 }}>
                <label htmlFor="profile-upload" style={{ fontSize: '0.85rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}>Change Photo</label>
                <button 
                  onClick={() => setProfileForm(prev => ({ ...prev, image: `https://ui-avatars.com/api/?name=${encodeURIComponent(prev.name || 'Admin')}&background=E5E7EB&color=111827` }))}
                  style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500, padding: 0 }}
                >
                  Remove Photo
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 500 }}>Name</label>
              <input type="text" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB' }} />
            </div>
            
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 500 }}>Role</label>
              <input type="text" value={profileForm.role} onChange={e => setProfileForm({...profileForm, role: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setShowProfileEdit(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #D1D5DB', backgroundColor: 'white', color: '#4B5563', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveProfile} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', backgroundColor: '#0A192F', color: 'white', fontWeight: 500, cursor: 'pointer' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Views
// -------------------------------------------------------------

function DashboardView({ setActiveTab, properties, bookings, inventoryAlerts, rooms, adminProfile }) {
  const [today, setToday] = useState(startOfDay(new Date()));

  // Calculate actual total capacity based strictly on active properties and their room types
  const activePropIds = new Set((properties || []).map(p => p.id));
  const validRooms = Array.isArray(rooms) ? rooms.filter(r => activePropIds.has(r.propertyId)) : [];
  const totalRooms = validRooms.length > 0
    ? validRooms.reduce((sum, r) => sum + (Number(r.totalUnits) || 0), 0) 
    : properties.reduce((sum, p) => sum + (Number(p.roomsAvailable) || 0), 0);
  
  const activeBookingsToday = bookings.filter(b => {
    const checkIn = parseISO(b.checkIn);
    const checkOut = parseISO(b.checkOut);
    return (isBefore(checkIn, today) || isSameDay(checkIn, today)) && isAfter(checkOut, today);
  });

  const totalBookings = activeBookingsToday.length;
  const totalRevenue = activeBookingsToday.reduce((sum, b) => sum + (b.amount || 0), 0);
  
  const occupiedRooms = activeBookingsToday.reduce((sum, b) => sum + (b.rooms || 1), 0);
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  
  const uniqueCustomers = new Set(activeBookingsToday.map(b => b.name)).size;

  const recentBookingsList = [...bookings].reverse().slice(0, 5).map(b => ({
    name: b.name,
    hotel: b.hotelName,
    dates: `${format(parseISO(b.checkIn), 'dd MMM')} - ${format(parseISO(b.checkOut), 'dd MMM')}`,
    amount: `₹${(b.amount || 0).toLocaleString()}`,
    status: b.status,
    statusColor: b.status === 'Confirmed' ? '#10B981' : b.status === 'Checked In' ? '#3B82F6' : '#F59E0B',
    statusBg: b.status === 'Confirmed' ? '#ECFDF5' : b.status === 'Checked In' ? '#EFF6FF' : '#FEF3C7',
  }));

  const roomStatus = [
    { label: 'Occupied', count: occupiedRooms, color: '#10B981' },
    { label: 'Available', count: totalRooms - occupiedRooms, color: '#3B82F6' },
  ];

  const conicGradient = totalRooms > 0 
    ? `conic-gradient(#10B981 0% ${occupancyRate}%, #3B82F6 ${occupancyRate}% 100%)`
    : `conic-gradient(#D1D5DB 0% 100%)`;

  const arrivalsList = bookings.filter(b => isSameDay(parseISO(b.checkIn), today)).map(b => ({
    name: b.name, hotel: b.hotelName, rooms: b.rooms, time: '2:00 PM'
  }));

  const departuresList = bookings.filter(b => isSameDay(parseISO(b.checkOut), today)).map(b => ({
    name: b.name, hotel: b.hotelName, rooms: b.rooms, time: '11:00 AM'
  }));

  const quickActions = [
    { label: 'New Booking', icon: <Plus size={16} color="#3B82F6" />, bg: '#EFF6FF' },
    { label: 'Manage Inventory', icon: <Archive size={16} color="#F59E0B" />, bg: '#FEF3C7' },
    { label: 'Add / Edit Room', icon: <BedDouble size={16} color="#3B82F6" />, bg: '#EFF6FF' },
    { label: 'Create Offer', icon: <Tag size={16} color="#10B981" />, bg: '#ECFDF5' },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: 2, color: '#6B7280', textTransform: 'uppercase', marginBottom: 8 }}>Welcome Back</div>
          <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: '#111827', margin: 0, lineHeight: 1.2 }}>{getGreeting()}, {adminProfile?.firstName || 'Aneesh'}</h1>
          <p style={{ color: '#6B7280', fontSize: '1.05rem', margin: '8px 0 0' }}>Here's what's happening across your hotels today.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', position: 'relative', padding: 8, borderRadius: 12, transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3F4F6'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            onClick={() => {
              try { document.getElementById('dash-date-picker').showPicker(); } catch(e) {}
            }}
          >
            <div style={{ padding: 12, backgroundColor: 'white', borderRadius: 12, border: '1px solid #E5E7EB', display: 'flex' }}>
              <CalendarCheck size={20} color="#111827" />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>{format(today, 'EEEE, d MMM yyyy')}</div>
              <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Click to select a different date.</div>
            </div>
            <input 
              id="dash-date-picker"
              type="date" 
              value={format(today, 'yyyy-MM-dd')}
              onChange={(e) => {
                if (e.target.value) setToday(startOfDay(parseISO(e.target.value)));
              }}
              style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
        {properties.slice(0, 4).map((p, i) => {
          const pBookings = activeBookingsToday.filter(b => b.hotelId === p.id);
          const pOccRooms = pBookings.reduce((sum, b) => sum + (b.rooms || 1), 0);
          
          // Calculate property capacity dynamically from rooms
          const pRooms = Array.isArray(rooms) ? rooms.filter(r => r.propertyId === p.id) : [];
          const pTotalCapacity = Array.isArray(rooms)
            ? pRooms.reduce((sum, r) => sum + (Number(r.totalUnits) || 0), 0) 
            : (Number(p.roomsAvailable) || 0);

          const pOccRate = pTotalCapacity > 0 ? Math.round((pOccRooms / pTotalCapacity) * 100) : 0;
          const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
          const col = colors[i % 4];

          return (
            <div key={p.id} style={{ flex: 1, backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ height: 140, backgroundImage: `url(${p.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
              <div style={{ padding: '20px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem', color: '#111827', fontWeight: 600 }}>{p.name}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6B7280', fontSize: '0.8rem' }}>
                      <MapPin size={12} /> {p.location}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>{pOccRate}%</div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Occupancy</div>
                  </div>
                </div>
                <div style={{ width: '100%', height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${pOccRate}%`, height: '100%', backgroundColor: col, borderRadius: 3 }}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
        <MetricCard icon={<CalendarCheck size={24} color="#3B82F6" />} bg="#EFF6FF" title="Total Bookings" value={totalBookings} />
        <MetricCard icon={<Wallet size={24} color="#10B981" />} bg="#ECFDF5" title="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} />
        <MetricCard icon={<PieChart size={24} color="#F59E0B" />} bg="#FEF3C7" title="Occupancy Rate" value={`${occupancyRate}%`} />
        <MetricCard icon={<UsersIcon size={24} color="#3B82F6" />} bg="#EFF6FF" title="New Customers" value={uniqueCustomers} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
        <DashboardCard title="Recent Bookings" action="View All" onAction={() => setActiveTab('bookings')}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ color: '#6B7280', borderBottom: '1px solid #F3F4F6' }}>
                <th style={{ textAlign: 'left', padding: '12px 0', fontWeight: 500 }}>Guest Name</th>
                <th style={{ textAlign: 'left', padding: '12px 0', fontWeight: 500 }}>Hotel</th>
                <th style={{ textAlign: 'left', padding: '12px 0', fontWeight: 500 }}>Dates</th>
                <th style={{ textAlign: 'left', padding: '12px 0', fontWeight: 500 }}>Amount</th>
                <th style={{ textAlign: 'left', padding: '12px 0', fontWeight: 500 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookingsList.map((b, i) => (
                <tr key={i} style={{ borderBottom: i === recentBookingsList.length -1 ? 'none' : '1px solid #F3F4F6' }}>
                  <td style={{ padding: '16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: '#4B5563' }}>
                      {b.name.charAt(0)}
                    </div>
                    <span style={{ fontWeight: 500, color: '#111827' }}>{b.name}</span>
                  </td>
                  <td style={{ padding: '16px 0', color: '#4B5563' }}>{b.hotel}</td>
                  <td style={{ padding: '16px 0', color: '#4B5563' }}>{b.dates}</td>
                  <td style={{ padding: '16px 0', fontWeight: 500, color: '#111827' }}>{b.amount}</td>
                  <td style={{ padding: '16px 0' }}>
                    <span style={{ padding: '6px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, color: b.statusColor, backgroundColor: b.statusBg }}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
              {recentBookingsList.length === 0 && <tr><td colSpan="5" style={{padding: 20, textAlign: 'center', color: '#6B7280'}}>No bookings found.</td></tr>}
            </tbody>
          </table>
        </DashboardCard>

        <DashboardCard title="Room Status" action="View All" onAction={() => setActiveTab('rooms')}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0' }}>
            <div style={{ position: 'relative', width: 160, height: 160, borderRadius: '50%', background: conicGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <div style={{ width: 120, height: 120, backgroundColor: 'white', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 700, color: '#111827' }}>{totalRooms}</span>
                <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Total Rooms</span>
              </div>
            </div>
            <div style={{ width: '100%' }}>
              {roomStatus.map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: s.color }}></div>
                    <span style={{ fontSize: '0.9rem', color: '#4B5563' }}>{s.label}</span>
                  </div>
                  <span style={{ fontSize: '1rem', fontWeight: 600, color: '#111827' }}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </DashboardCard>


      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>


        <DashboardCard title="Today's Arrivals" action="View All" onAction={() => setActiveTab('bookings')}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ color: '#6B7280', borderBottom: '1px solid #F3F4F6' }}>
                <th style={{ textAlign: 'left', padding: '12px 0', fontWeight: 500 }}>Guest</th>
                <th style={{ textAlign: 'left', padding: '12px 0', fontWeight: 500 }}>Hotel</th>
                <th style={{ textAlign: 'left', padding: '12px 0', fontWeight: 500 }}>Rooms</th>
              </tr>
            </thead>
            <tbody>
              {arrivalsList.map((a, i) => (
                <tr key={i} style={{ borderBottom: i === arrivalsList.length -1 ? 'none' : '1px solid #F3F4F6' }}>
                  <td style={{ padding: '16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 500, color: '#111827' }}>{a.name}</span>
                  </td>
                  <td style={{ padding: '16px 0', color: '#4B5563' }}>{a.hotel}</td>
                  <td style={{ padding: '16px 0', color: '#111827', fontWeight: 500 }}>{a.rooms}</td>
                </tr>
              ))}
              {arrivalsList.length === 0 && <tr><td colSpan="3" style={{padding: 20, textAlign: 'center', color: '#6B7280'}}>No arrivals today.</td></tr>}
            </tbody>
          </table>
        </DashboardCard>

        <DashboardCard title="Upcoming Departures" action="View All" onAction={() => setActiveTab('bookings')}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ color: '#6B7280', borderBottom: '1px solid #F3F4F6' }}>
                <th style={{ textAlign: 'left', padding: '12px 0', fontWeight: 500 }}>Guest</th>
                <th style={{ textAlign: 'left', padding: '12px 0', fontWeight: 500 }}>Hotel</th>
              </tr>
            </thead>
            <tbody>
              {departuresList.map((d, i) => (
                <tr key={i} style={{ borderBottom: i === departuresList.length -1 ? 'none' : '1px solid #F3F4F6' }}>
                  <td style={{ padding: '16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 500, color: '#111827' }}>{d.name}</span>
                  </td>
                  <td style={{ padding: '16px 0', color: '#4B5563' }}>{d.hotel}</td>
                </tr>
              ))}
              {departuresList.length === 0 && <tr><td colSpan="2" style={{padding: 20, textAlign: 'center', color: '#6B7280'}}>No departures today.</td></tr>}
            </tbody>
          </table>
        </DashboardCard>
      </div>
    </>
  );
}

function GuestsView() {
  const [guests, setGuests] = React.useState([]);

  React.useEffect(() => {
    const fetchGuests = async () => {
      try {
        const res = await fetch('/api/guests');
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setGuests(data);
          return;
        }
      } catch (err) {
        console.error("Failed to fetch guests from API:", err);
      }
      const saved = localStorage.getItem('registeredUsers');
      if (saved) {
        setGuests(JSON.parse(saved));
      }
    };
    fetchGuests();
  }, []);

  const handleDeleteGuest = async (guest) => {
    if (!window.confirm(`Are you sure you want to delete guest account "${guest.name}" (${guest.email})?`)) {
      return;
    }

    try {
      if (guest.id) {
        await fetch(`/api/guests/${guest.id}`, { method: 'DELETE' });
      }
      // Also update local storage if fallback was used
      const saved = localStorage.getItem('registeredUsers');
      if (saved) {
        const parsed = JSON.parse(saved);
        const filtered = parsed.filter(u => u.email !== guest.email && u.id !== guest.id);
        localStorage.setItem('registeredUsers', JSON.stringify(filtered));
      }
      setGuests(prev => prev.filter(g => g.email !== guest.email && (!guest.id || g.id !== guest.id)));
    } catch (err) {
      console.error("Failed to delete guest:", err);
      alert("Failed to delete guest account.");
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>Registered Guests</h2>
        <div style={{ padding: '8px 16px', backgroundColor: '#EFF6FF', color: '#3B82F6', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem' }}>
          Total: {guests.length}
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#4B5563' }}>
              <th style={{ textAlign: 'left', padding: '16px 24px', fontWeight: 600 }}>Name</th>
              <th style={{ textAlign: 'left', padding: '16px 24px', fontWeight: 600 }}>Email Address</th>
              <th style={{ textAlign: 'left', padding: '16px 24px', fontWeight: 600 }}>Phone Number</th>
              <th style={{ textAlign: 'left', padding: '16px 24px', fontWeight: 600 }}>Status</th>
              <th style={{ textAlign: 'right', padding: '16px 24px', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {guests.map((g, i) => (
              <tr key={g.id || i} style={{ borderBottom: i === guests.length - 1 ? 'none' : '1px solid #E5E7EB' }}>
                <td style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: '#3B82F6' }}>
                    {g.name?.charAt(0) || 'G'}
                  </div>
                  <span style={{ fontWeight: 500, color: '#111827' }}>{g.name}</span>
                </td>
                <td style={{ padding: '16px 24px', color: '#4B5563' }}>{g.email}</td>
                <td style={{ padding: '16px 24px', color: '#4B5563' }}>{g.phone || 'N/A'}</td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ padding: '6px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, color: '#10B981', backgroundColor: '#ECFDF5' }}>
                    Active
                  </span>
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <button 
                    onClick={() => handleDeleteGuest(g)}
                    title="Delete guest account"
                    style={{ 
                      color: '#EF4444', 
                      background: 'none', 
                      border: 'none', 
                      padding: 8, 
                      cursor: 'pointer',
                      borderRadius: 6,
                      transition: 'background 0.2s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {guests.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '40px 24px', textAlign: 'center', color: '#6B7280' }}>
                  No guests have registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PropertiesView({ properties, addProperty, removeProperty, updateProperty, rooms }) {
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    id: '', name: '', location: '', image: '', pricePerNight: 0,
    amenities: [{ name: 'Free WiFi', icon: 'Wifi' }]
  });
  const [customAmenity, setCustomAmenity] = useState('');
  const [customAmenitiesList, setCustomAmenitiesList] = useState([]);

  const availableAmenities = [
    { name: 'Free WiFi', icon: 'Wifi' },
    { name: 'Restaurant', icon: 'Coffee' },
    { name: 'Swimming Pool', icon: 'Waves' },
    { name: 'Parking', icon: 'Car' },
    { name: 'Gym', icon: 'Dumbbell' },
    { name: 'Mountain View', icon: 'Mountain' },
    { name: 'Central Location', icon: 'MapPin' },
    { name: 'Adventure', icon: 'Tent' }
  ];

  const allAvailableAmenities = [
    ...availableAmenities,
    ...customAmenitiesList,
    ...formData.amenities.filter(a => 
      !availableAmenities.some(av => av.name === a.name) && 
      !customAmenitiesList.some(ca => ca.name === a.name)
    )
  ];

  const toggleAmenity = (amenity) => {
    setFormData(prev => {
      const exists = prev.amenities.some(a => a.name === amenity.name);
      if (exists) {
        return { ...prev, amenities: prev.amenities.filter(a => a.name !== amenity.name) };
      } else {
        return { ...prev, amenities: [...prev.amenities, amenity] };
      }
    });
  };

  const handleAddCustomAmenity = () => {
    if (customAmenity.trim()) {
      const newAmenity = { name: customAmenity.trim(), icon: 'Star' };
      
      setCustomAmenitiesList(prev => {
        if (!prev.some(a => a.name === newAmenity.name) && !availableAmenities.some(a => a.name === newAmenity.name)) {
          return [...prev, newAmenity];
        }
        return prev;
      });

      setFormData(prev => {
        if (!prev.amenities.some(a => a.name === newAmenity.name)) {
          return { ...prev, amenities: [...prev.amenities, newAmenity] };
        }
        return prev;
      });
      setCustomAmenity('');
    }
  };

  const removeCustomAmenity = (amenity) => {
    setCustomAmenitiesList(prev => prev.filter(a => a.name !== amenity.name));
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a.name !== amenity.name)
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const data = new FormData();
    data.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });
      const result = await res.json();
      if (result.success) {
        // Backend returns URL starting with /uploads/ which is served by Express
        // But our React app runs on Vite proxy or we need full URL.
        // Let's use the full URL to be safe, or assume proxy works.
        setFormData(prev => ({ ...prev, image: `${result.url}` }));
      }
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({ id: '', name: '', location: '', image: '', pricePerNight: 5000, amenities: [{ name: 'Free WiFi', icon: 'Wifi' }] });
    setShowModal(true);
  };

  const handleOpenEdit = (p) => {
    setIsEditing(true);
    setFormData(p);
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.location) return;
    
    if (isEditing) {
      updateProperty(formData.id, formData);
    } else {
      addProperty({ ...formData, roomsAvailable: 0 }); // Legacy fallback
    }
    setShowModal(false);
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 600, color: '#111827', marginBottom: 4 }}>Properties Management</h1>
          <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>Manage your hotel portfolio and details.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '10px 20px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500, fontSize: '0.95rem', border: 'none', cursor: 'pointer' }}
        >
          <Plus size={18} /> Add Property
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#F9FAFB' }}>
            <tr>
              <th style={thStyle}>Property Details</th>
              <th style={thStyle}>Location</th>
              <th style={thStyle}>Room Types</th>
              <th style={thStyle}>Total Inventory</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p, idx) => {
              const propRooms = rooms.filter(r => r.propertyId === p.id);
              const totalInventory = propRooms.reduce((sum, r) => sum + r.totalUnits, 0);

              return (
                <tr key={p.id} style={{ borderBottom: idx === properties.length - 1 ? 'none' : '1px solid #E5E7EB' }}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <img src={p.image} alt={p.name} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.95rem' }}>{p.name}</div>
                        <div style={{ color: '#6B7280', fontSize: '0.8rem', marginTop: 2 }}>ID: #{p.id.substring(0, 6).toUpperCase()}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, color: '#4B5563' }}>{p.location}</td>
                  <td style={{ ...tdStyle, color: '#4B5563' }}>{propRooms.length} Types</td>
                  <td style={{ ...tdStyle, color: '#111827', fontWeight: 600 }}>{totalInventory} Rooms</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <button onClick={() => handleOpenEdit(p)} style={{ color: '#3B82F6', background: 'none', border: 'none', padding: 8, cursor: 'pointer' }}><Edit2 size={16} /></button>
                    <button 
                      onClick={() => { if (window.confirm('Delete this property?')) removeProperty(p.id); }}
                      style={{ color: '#EF4444', background: 'none', border: 'none', padding: 8, cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(17, 24, 39, 0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: 560, borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{isEditing ? 'Edit Property' : 'Add New Property'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 500 }}>Property Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB' }} required />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 500 }}>Location</label>
                <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB' }} required />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 500 }}>Property Image</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {formData.image && (
                    <img src={formData.image} alt="Preview" style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', border: '1px solid #E5E7EB' }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageUpload} 
                      style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px dashed #D1D5DB', backgroundColor: '#F9FAFB', cursor: 'pointer' }} 
                    />
                    {isUploading && <span style={{ fontSize: '0.75rem', color: '#3B82F6', marginTop: 4, display: 'block' }}>Uploading...</span>}
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: 32 }}>
                <label style={{ display: 'block', marginBottom: 12, fontSize: '0.85rem', fontWeight: 500 }}>Amenities</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {allAvailableAmenities.map(amenity => {
                    const isSelected = formData.amenities.some(a => a.name === amenity.name);
                    const isCustom = !availableAmenities.some(av => av.name === amenity.name);
                    return (
                      <button
                        key={amenity.name}
                        type="button"
                        onClick={() => toggleAmenity(amenity)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 20,
                          border: `1px solid ${isSelected ? 'var(--primary)' : '#E5E7EB'}`,
                          backgroundColor: isSelected ? '#EFF6FF' : 'white',
                          color: isSelected ? 'var(--primary)' : '#4B5563',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        {amenity.name}
                        {isCustom && (
                          <span 
                            onClick={(e) => { e.stopPropagation(); removeCustomAmenity(amenity); }}
                            style={{ 
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              backgroundColor: isSelected ? 'rgba(16, 38, 65, 0.1)' : '#F3F4F6',
                              color: isSelected ? 'var(--primary)' : '#9CA3AF',
                              fontSize: '12px',
                              lineHeight: 1
                            }}
                          >
                            ×
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <input
                    type="text"
                    placeholder="Add custom amenity..."
                    value={customAmenity}
                    onChange={(e) => setCustomAmenity(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddCustomAmenity(); } }}
                    style={{ flex: 1, padding: '8px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: '0.9rem' }}
                  />
                  <button 
                    type="button"
                    onClick={handleAddCustomAmenity}
                    style={{ padding: '8px 16px', backgroundColor: '#F3F4F6', color: '#374151', borderRadius: 8, border: '1px solid #D1D5DB', fontWeight: 500, cursor: 'pointer' }}
                  >
                    Add
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #D1D5DB', background: 'white', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', borderRadius: 8, backgroundColor: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer' }}>Save Property</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function BookingsView({ bookings, removeBooking, searchQuery = '' }) {
  const filteredBookings = bookings.filter(b => {
    const q = searchQuery.toLowerCase();
    return b.name.toLowerCase().includes(q) || 
           b.hotelName.toLowerCase().includes(q) || 
           b.id.toString().toLowerCase().includes(q) || 
           b.status.toLowerCase().includes(q);
  });

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 600, color: '#111827', marginBottom: 4 }}>All Bookings</h1>
        <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>View and manage all guest reservations.</p>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#F9FAFB' }}>
            <tr>
              <th style={thStyle}>Booking ID</th>
              <th style={thStyle}>Guest Name</th>
              <th style={thStyle}>Hotel</th>
              <th style={thStyle}>Check In - Check Out</th>
              <th style={thStyle}>Amount</th>
              <th style={thStyle}>Status</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map((b, idx) => (
              <tr key={b.id} style={{ borderBottom: idx === filteredBookings.length - 1 ? 'none' : '1px solid #E5E7EB' }}>
                <td style={{ ...tdStyle, color: '#6B7280', fontSize: '0.85rem' }}>#{b.id.toString().substring(0,8)}</td>
                <td style={{ ...tdStyle, fontWeight: 500, color: '#111827' }}>{b.name}</td>
                <td style={{ ...tdStyle, color: '#4B5563' }}>{b.hotelName}</td>
                <td style={{ ...tdStyle, color: '#4B5563' }}>{format(parseISO(b.checkIn), 'dd MMM yyyy')} - {format(parseISO(b.checkOut), 'dd MMM yyyy')}</td>
                <td style={{ ...tdStyle, fontWeight: 500 }}>₹{(b.amount || 0).toLocaleString()}</td>
                <td style={tdStyle}>
                  <span style={{ padding: '6px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, 
                    color: b.status === 'Confirmed' ? '#10B981' : b.status === 'Checked In' ? '#3B82F6' : '#F59E0B',
                    backgroundColor: b.status === 'Confirmed' ? '#ECFDF5' : b.status === 'Checked In' ? '#EFF6FF' : '#FEF3C7' }}>
                    {b.status}
                  </span>
                </td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  <button 
                    onClick={() => { if (window.confirm('Delete this booking?')) removeBooking(b.id); }}
                    style={{ color: '#EF4444', background: 'none', border: 'none', padding: 8, cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredBookings.length === 0 && <tr><td colSpan="7" style={{padding: 40, textAlign: 'center'}}>No bookings found.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function RoomsView({ properties, rooms, addRoomType, removeRoomType, updateRoomType }) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [roomForm, setRoomForm] = useState({
    id: '', name: '', type: 'Standard', pricePerNight: 0, capacity: 2, totalUnits: 1, images: []
  });

  // Copy inventory states
  const [copyModalData, setCopyModalData] = useState({
    isOpen: false,
    mode: 'single', // 'single' room or 'all' rooms of a property
    sourceRoom: null,
    sourceProperty: null,
    targetPropertyId: ''
  });

  const handleOpenCopySingle = (room) => {
    const srcProp = properties.find(p => p.id === room.propertyId);
    const otherProps = properties.filter(p => p.id !== room.propertyId);
    setCopyModalData({
      isOpen: true,
      mode: 'single',
      sourceRoom: room,
      sourceProperty: srcProp,
      targetPropertyId: otherProps.length > 0 ? otherProps[0].id : ''
    });
  };

  const handleOpenCopyAll = (sourceProperty) => {
    const otherProps = properties.filter(p => p.id !== sourceProperty.id);
    setCopyModalData({
      isOpen: true,
      mode: 'all',
      sourceRoom: null,
      sourceProperty,
      targetPropertyId: otherProps.length > 0 ? otherProps[0].id : ''
    });
  };

  const handleExecuteCopy = async () => {
    if (!copyModalData.targetPropertyId) {
      return alert("Please select a target property.");
    }

    if (copyModalData.mode === 'single' && copyModalData.sourceRoom) {
      const src = copyModalData.sourceRoom;
      const copiedRoom = {
        name: src.name,
        type: src.type,
        pricePerNight: src.pricePerNight,
        capacity: src.capacity,
        totalUnits: src.totalUnits,
        images: src.images || [],
        propertyId: copyModalData.targetPropertyId
      };
      await addRoomType(copiedRoom);
      alert(`Room "${src.name}" successfully copied to selected property!`);
    } else if (copyModalData.mode === 'all' && copyModalData.sourceProperty) {
      const propRooms = rooms.filter(r => r.propertyId === copyModalData.sourceProperty.id);
      if (propRooms.length === 0) {
        return alert("There are no rooms in this property to copy.");
      }
      for (const r of propRooms) {
        const copiedRoom = {
          name: r.name,
          type: r.type,
          pricePerNight: r.pricePerNight,
          capacity: r.capacity,
          totalUnits: r.totalUnits,
          images: r.images || [],
          propertyId: copyModalData.targetPropertyId
        };
        await addRoomType(copiedRoom);
      }
      alert(`All ${propRooms.length} room types copied successfully to target property!`);
    }

    setCopyModalData({ isOpen: false, mode: 'single', sourceRoom: null, sourceProperty: null, targetPropertyId: '' });
  };

  const handleOpenAdd = (propId) => {
    setSelectedPropertyId(propId);
    setRoomForm({ id: '', name: '', type: 'Standard', pricePerNight: 0, capacity: 2, totalUnits: 1, images: [] });
    setIsEditing(false);
    setShowAddModal(true);
  };

  const handleOpenEdit = (room) => {
    setSelectedPropertyId(room.propertyId);
    setRoomForm({ ...room, images: room.images || [] });
    setIsEditing(true);
    setShowAddModal(true);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    setImageUploading(true);
    const newImages = [...(roomForm.images || [])];
    
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);
        
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        const data = await res.json();
        if (data.success) {
          newImages.push(data.url);
        }
      }
      setRoomForm(prev => ({ ...prev, images: newImages }));
    } catch (error) {
      console.error("Failed to upload images", error);
      alert("Failed to upload images");
    } finally {
      setImageUploading(false);
    }
  };

  const removeImage = (index) => {
    const newImages = [...roomForm.images];
    newImages.splice(index, 1);
    setRoomForm(prev => ({ ...prev, images: newImages }));
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!roomForm.name || !selectedPropertyId) return;
    
    const formattedData = {
      ...roomForm,
      propertyId: selectedPropertyId,
      pricePerNight: parseInt(roomForm.pricePerNight) || 0,
      capacity: parseInt(roomForm.capacity) || 1,
      totalUnits: parseInt(roomForm.totalUnits) || 1
    };

    if (isEditing) {
      updateRoomType(roomForm.id, formattedData);
    } else {
      addRoomType(formattedData);
    }
    setShowAddModal(false);
  };

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 600, color: '#111827', marginBottom: 4 }}>Rooms Management</h1>
        <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>Select a property below to manage its specific room types and pricing.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {properties.map(p => {
          const propRooms = rooms.filter(r => r.propertyId === p.id);
          return (
            <div key={p.id} style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <img src={p.image} alt={p.name} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: 0 }}>{p.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: '#6B7280', margin: 0 }}>{p.location} • {propRooms.length} Room Types</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {propRooms.length > 0 && properties.length > 1 && (
                    <button 
                      onClick={() => handleOpenCopyAll(p)}
                      title="Copy all rooms from this property to another hotel"
                      style={{ backgroundColor: 'white', color: '#4B5563', padding: '8px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500, fontSize: '0.85rem', border: '1px solid #D1D5DB', cursor: 'pointer' }}
                    >
                      <Copy size={15} color="#4B5563" /> Copy All to Another Hotel
                    </button>
                  )}
                  <button 
                    onClick={() => handleOpenAdd(p.id)}
                    style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500, fontSize: '0.85rem', border: 'none', cursor: 'pointer' }}
                  >
                    <Plus size={16} /> Add Room Type
                  </button>
                </div>
              </div>
              
              <div style={{ padding: '0' }}>
                {propRooms.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '12px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6B7280', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>Room Name</th>
                        <th style={{ padding: '12px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6B7280', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>Capacity</th>
                        <th style={{ padding: '12px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6B7280', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>Units</th>
                        <th style={{ padding: '12px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6B7280', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>Price / Night</th>
                        <th style={{ padding: '12px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6B7280', fontWeight: 600, borderBottom: '1px solid #E5E7EB', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {propRooms.map((r, idx) => (
                        <tr key={r.id} style={{ borderBottom: idx === propRooms.length - 1 ? 'none' : '1px solid #E5E7EB' }}>
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.95rem' }}>{r.name}</div>
                            <div style={{ color: '#6B7280', fontSize: '0.8rem', marginTop: 2 }}>{r.type}</div>
                          </td>
                          <td style={{ padding: '16px 24px', color: '#4B5563', fontSize: '0.9rem' }}>{r.capacity} Guests</td>
                          <td style={{ padding: '16px 24px', color: '#4B5563', fontSize: '0.9rem', fontWeight: 500 }}>{r.totalUnits}</td>
                          <td style={{ padding: '16px 24px', color: '#10B981', fontSize: '0.95rem', fontWeight: 600 }}>₹{(r.pricePerNight || 0).toLocaleString()}</td>
                          <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                            {properties.length > 1 && (
                              <button 
                                onClick={() => handleOpenCopySingle(r)} 
                                title="Copy this room type to another property" 
                                style={{ color: '#059669', background: 'none', border: 'none', padding: 8, cursor: 'pointer', marginRight: 4 }}
                              >
                                <Copy size={16} />
                              </button>
                            )}
                            <button onClick={() => handleOpenEdit(r)} title="Edit room" style={{ color: '#3B82F6', background: 'none', border: 'none', padding: 8, cursor: 'pointer' }}><Edit2 size={16} /></button>
                            <button 
                              onClick={() => { if (window.confirm('Delete this room type?')) removeRoomType(r.id); }}
                              title="Delete room"
                              style={{ color: '#EF4444', background: 'none', border: 'none', padding: 8, cursor: 'pointer' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#6B7280', fontSize: '0.95rem' }}>
                    No rooms added for this property yet.
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {properties.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#6B7280', backgroundColor: 'white', borderRadius: 16, border: '1px solid #E5E7EB' }}>
            No properties found. Please add a property first.
          </div>
        )}
      </div>

      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(17, 24, 39, 0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: 500, borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{isEditing ? 'Edit Room Type' : 'Add Room to Property'}</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddSubmit} style={{ padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 500 }}>Room Name</label>
                <input type="text" value={roomForm.name} onChange={e => setRoomForm({...roomForm, name: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB' }} placeholder="e.g. Ocean View Suite" required />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 500 }}>Room Category</label>
                <select value={roomForm.type} onChange={e => setRoomForm({...roomForm, type: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB' }}>
                  <option>Standard</option>
                  <option>Deluxe</option>
                  <option>Premium</option>
                  <option>Suite</option>
                  <option>Cottage</option>
                  <option>Villa</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 32 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 500 }}>Price (₹)</label>
                  <input type="number" min="0" value={roomForm.pricePerNight} onChange={e => setRoomForm({...roomForm, pricePerNight: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 500 }}>Capacity</label>
                  <input type="number" min="1" value={roomForm.capacity} onChange={e => setRoomForm({...roomForm, capacity: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 500 }}>Units</label>
                  <input type="number" min="1" value={roomForm.totalUnits} onChange={e => setRoomForm({...roomForm, totalUnits: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB' }} required />
                </div>
              </div>
              <div style={{ marginBottom: 32 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 500 }}>Room Images</label>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                  {roomForm.images && roomForm.images.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                      <img src={`${img}`} alt="Room preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => removeImage(idx)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={12} /></button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="file" multiple accept="image/*" id="room-images" style={{ display: 'none' }} onChange={handleImageUpload} />
                  <label htmlFor="room-images" style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#F9FAFB', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>
                    {imageUploading ? 'Uploading...' : 'Upload Images'}
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #D1D5DB', background: 'white', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', borderRadius: 8, backgroundColor: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer' }}>{isEditing ? 'Update Room' : 'Save Room Type'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Copy Inventory Modal */}
      {copyModalData.isOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(17, 24, 39, 0.6)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: 480, borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                  <Copy size={18} />
                </div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                  {copyModalData.mode === 'all' ? 'Copy All Room Inventory' : 'Copy Room Type'}
                </h2>
              </div>
              <button onClick={() => setCopyModalData(prev => ({ ...prev, isOpen: false }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 24 }}>
              <div style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, border: '1px solid #E5E7EB', marginBottom: 20 }}>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#6B7280', fontWeight: 600, marginBottom: 4 }}>
                  Source {copyModalData.mode === 'all' ? 'Property' : 'Room'}
                </div>
                {copyModalData.mode === 'all' ? (
                  <div style={{ fontWeight: 600, color: '#111827', fontSize: '1rem' }}>
                    {copyModalData.sourceProperty?.name}
                    <span style={{ display: 'block', fontSize: '0.85rem', color: '#059669', fontWeight: 500, marginTop: 2 }}>
                      {rooms.filter(r => r.propertyId === copyModalData.sourceProperty?.id).length} room type(s) will be cloned
                    </span>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 600, color: '#111827', fontSize: '1rem' }}>
                      {copyModalData.sourceRoom?.name} ({copyModalData.sourceRoom?.type})
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: 2 }}>
                      ₹{(copyModalData.sourceRoom?.pricePerNight || 0).toLocaleString()} • {copyModalData.sourceRoom?.totalUnits} units • {copyModalData.sourceRoom?.capacity} guests
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
                  Select Destination Property:
                </label>
                <select 
                  value={copyModalData.targetPropertyId}
                  onChange={e => setCopyModalData(prev => ({ ...prev, targetPropertyId: e.target.value }))}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: '0.95rem', backgroundColor: 'white' }}
                >
                  {properties
                    .filter(p => copyModalData.mode === 'all' 
                      ? p.id !== copyModalData.sourceProperty?.id 
                      : p.id !== copyModalData.sourceRoom?.propertyId
                    )
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.location})
                      </option>
                    ))}
                </select>
                <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#6B7280' }}>
                  This will duplicate the room configuration and total units into the destination hotel inventory.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button 
                  type="button" 
                  onClick={() => setCopyModalData(prev => ({ ...prev, isOpen: false }))} 
                  style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid #D1D5DB', background: 'white', cursor: 'pointer', fontWeight: 500 }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleExecuteCopy}
                  style={{ padding: '10px 22px', borderRadius: 8, backgroundColor: '#059669', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Copy size={16} /> Confirm & Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


function PaymentsView({ bookings }) {
  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 600, color: '#111827', marginBottom: 4 }}>Payments & Transactions</h1>
        <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>Track incoming payments and refund requests.</p>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#F9FAFB' }}>
            <tr>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Guest</th>
              <th style={thStyle}>Amount</th>
              <th style={thStyle}>Method</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b, idx) => (
              <tr key={b.id} style={{ borderBottom: idx === bookings.length - 1 ? 'none' : '1px solid #E5E7EB' }}>
                <td style={{ ...tdStyle, color: '#4B5563' }}>{format(parseISO(b.checkIn), 'dd MMM yyyy, HH:mm')}</td>
                <td style={{ ...tdStyle, fontWeight: 500, color: '#111827' }}>{b.name}</td>
                <td style={{ ...tdStyle, fontWeight: 600 }}>₹{(b.amount || 0).toLocaleString()}</td>
                <td style={{ ...tdStyle, color: '#6B7280' }}>Credit Card (ends 4242)</td>
                <td style={tdStyle}>
                  <span style={{ padding: '6px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, color: '#10B981', backgroundColor: '#ECFDF5' }}>
                    Completed
                  </span>
                </td>
              </tr>
            ))}
            {bookings.length === 0 && <tr><td colSpan="5" style={{padding: 40, textAlign: 'center'}}>No transactions found.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ReportsView({ bookings, properties }) {
  // Calculate revenue per property
  const revenueByProperty = {};
  properties.forEach(p => {
    revenueByProperty[p.name] = 0;
  });
  
  let totalRevenue = 0;
  bookings.forEach(b => {
    if (b.status === 'Confirmed' || b.status === 'Checked In' || b.status === 'Completed') {
      if (revenueByProperty[b.hotelName] !== undefined) {
        revenueByProperty[b.hotelName] += b.amount || 0;
      } else {
        revenueByProperty[b.hotelName] = b.amount || 0;
      }
      totalRevenue += b.amount || 0;
    }
  });

  const propertyData = Object.keys(revenueByProperty).map(name => ({
    name,
    revenue: revenueByProperty[name],
    percentage: totalRevenue > 0 ? (revenueByProperty[name] / totalRevenue) * 100 : 0
  })).sort((a, b) => b.revenue - a.revenue);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 600, color: '#111827', marginBottom: 4 }}>Financial Reports</h1>
          <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>Analyze revenue, occupancy, and growth.</p>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 24 }}>
        
        <div style={{ backgroundColor: 'white', padding: 32, borderRadius: 16, border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#111827', margin: 0 }}>Revenue by Property</h3>
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10B981' }}>₹{totalRevenue.toLocaleString()}</span>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {propertyData.map((prop, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: 8, fontWeight: 500, color: '#4B5563' }}>
                  <span>{prop.name}</span>
                  <span>₹{prop.revenue.toLocaleString()}</span>
                </div>
                <div style={{ width: '100%', height: 12, backgroundColor: '#F3F4F6', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', backgroundColor: 'var(--primary)', width: `${prop.percentage}%`, borderRadius: 6, transition: 'width 1s ease-out' }}></div>
                </div>
              </div>
            ))}
            {propertyData.length === 0 && (
               <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>No properties found</div>
            )}
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: 32, borderRadius: 16, border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#111827', margin: 0 }}>Monthly Occupancy Trends</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6B7280' }}>Based on recent confirmed bookings</p>
          </div>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 12, height: 200, paddingBottom: 16, borderBottom: '1px solid #E5E7EB' }}>
            {/* Simple static bars for demonstration since we only have a few bookings */}
            {[45, 60, 30, 75, 85, 50, 95].map((height, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: '100%', height: `${height}%`, backgroundColor: i === 6 ? 'var(--primary)' : '#E5E7EB', borderRadius: '4px 4px 0 0', transition: 'height 1s ease-out' }}></div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: '0.75rem', color: '#6B7280', fontWeight: 500 }}>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
            <span>Jul</span>
            <span>Aug</span>
            <span>Sep</span>
            <span>Oct</span>
          </div>
        </div>

      </div>
    </>
  );
}

function OffersView() {
  const { offers, addOffer, removeOffer, offersEnabled, toggleOffers } = useHotels();
  const [showModal, setShowModal] = useState(false);
  const [offerForm, setOfferForm] = useState({ title: '', description: '', code: '', expires: '' });

  const handleAddOffer = (e) => {
    e.preventDefault();
    if (!offerForm.title || !offerForm.code) return;
    
    const newOffer = {
      id: Date.now(),
      title: offerForm.title,
      description: offerForm.description,
      code: offerForm.code.toUpperCase(),
      status: 'Active',
      expires: offerForm.expires || '30 days'
    };
    
    addOffer(newOffer);
    setShowModal(false);
    setOfferForm({ title: '', description: '', code: '', expires: '' });
  };

  const handleRemoveOffer = (id) => {
    if (window.confirm("Are you sure you want to delete this offer?")) {
      removeOffer(id);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 600, color: '#111827', marginBottom: 4 }}>Offers & Packages</h1>
          <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>Create promotional codes and holiday bundles.</p>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <button onClick={toggleOffers} style={{ backgroundColor: offersEnabled ? '#EF4444' : '#10B981', color: 'white', padding: '10px 20px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500, fontSize: '0.95rem', cursor: 'pointer', border: 'none' }}>
            {offersEnabled ? 'Disable Offers Page' : 'Enable Offers Page'}
          </button>
          <button onClick={() => setShowModal(true)} style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '10px 20px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500, fontSize: '0.95rem', cursor: 'pointer', border: 'none' }}>
            <Plus size={18} /> New Campaign
          </button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {offers.map(offer => (
          <div key={offer.id} style={{ backgroundColor: 'white', padding: 24, borderRadius: 16, border: '1px solid #E5E7EB', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ padding: '4px 12px', backgroundColor: '#ECFDF5', color: '#10B981', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600 }}>{offer.status}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: '#6B7280', fontSize: '0.85rem' }}>Expires in {offer.expires}</span>
                <button onClick={() => handleRemoveOffer(offer.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex' }} title="Delete Offer">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <h3 style={{ fontSize: '1.2rem', margin: '0 0 8px' }}>{offer.title}</h3>
            <p style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: 16 }}>{offer.description}</p>
            <div style={{ padding: '12px', backgroundColor: '#F9FAFB', borderRadius: 8, fontFamily: 'monospace', textAlign: 'center', letterSpacing: 2, fontWeight: 600 }}>{offer.code}</div>
          </div>
        ))}
        {offers.length === 0 && (
          <div style={{ padding: 40, backgroundColor: 'white', borderRadius: 16, border: '1px dashed #D1D5DB', textAlign: 'center', gridColumn: '1 / -1' }}>
            <Tag size={48} color="#9CA3AF" style={{ marginBottom: 16 }} />
            <h3 style={{ margin: '0 0 8px' }}>No active offers</h3>
            <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>Create a new campaign to boost your bookings.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(17, 24, 39, 0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: 500, borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Create New Offer</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddOffer} style={{ padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 500 }}>Campaign Title</label>
                <input type="text" value={offerForm.title} onChange={e => setOfferForm({...offerForm, title: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB' }} placeholder="e.g. Winter Getaway 20" required />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 500 }}>Description</label>
                <textarea value={offerForm.description} onChange={e => setOfferForm({...offerForm, description: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', minHeight: 80 }} placeholder="Briefly describe the offer..."></textarea>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 500 }}>Promo Code</label>
                  <input type="text" value={offerForm.code} onChange={e => setOfferForm({...offerForm, code: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', textTransform: 'uppercase' }} placeholder="e.g. WINTER20" required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 500 }}>Expires In</label>
                  <input type="text" value={offerForm.expires} onChange={e => setOfferForm({...offerForm, expires: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB' }} placeholder="e.g. 14 days" required />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #D1D5DB', background: 'white', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', borderRadius: 8, backgroundColor: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer' }}>Publish Offer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function AdminCredentialsForm() {
  const [form, setForm] = useState({
    currentUsername: 'admin',
    currentPassword: '',
    newUsername: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      return setStatus({ type: 'error', message: 'New passwords do not match' });
    }
    if (!form.currentPassword) {
      return setStatus({ type: 'error', message: 'Current password is required' });
    }

    setIsLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await fetch('/api/admin/credentials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      
      if (data.success) {
        setStatus({ type: 'success', message: 'Credentials updated successfully. You will need to use these next time you log in.' });
        setForm({ ...form, currentUsername: form.newUsername || form.currentUsername, currentPassword: '', newUsername: '', newPassword: '', confirmPassword: '' });
      } else {
        setStatus({ type: 'error', message: data.error || 'Failed to update credentials' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to connect to server' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #E5E7EB', padding: 32 }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#111827', marginBottom: 24 }}>Admin Credentials</h3>
      
      {status.message && (
        <div style={{ backgroundColor: status.type === 'error' ? '#FEE2E2' : '#D1FAE5', color: status.type === 'error' ? '#B91C1C' : '#065F46', padding: '12px 16px', borderRadius: 8, fontSize: '0.875rem', marginBottom: 20 }}>
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>Current Username</label>
          <input type="text" value={form.currentUsername} onChange={e => setForm({...form, currentUsername: e.target.value})} required style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB' }} />
        </div>
        
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>Current Password (Required)</label>
          <input type="password" value={form.currentPassword} onChange={e => setForm({...form, currentPassword: e.target.value})} required style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB' }} />
        </div>

        <div style={{ height: 1, backgroundColor: '#E5E7EB', margin: '24px 0' }}></div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>New Username (Optional)</label>
          <input type="text" value={form.newUsername} onChange={e => setForm({...form, newUsername: e.target.value})} placeholder="Leave blank to keep current" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB' }} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>New Password (Optional)</label>
          <input type="password" value={form.newPassword} onChange={e => setForm({...form, newPassword: e.target.value})} placeholder="Leave blank to keep current" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB' }} />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>Confirm New Password</label>
          <input type="password" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} disabled={!form.newPassword} required={!!form.newPassword} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', backgroundColor: !form.newPassword ? '#F3F4F6' : 'white' }} />
        </div>

        <button type="submit" disabled={isLoading} style={{ backgroundColor: '#EF4444', color: 'white', padding: '10px 24px', border: 'none', borderRadius: 8, fontWeight: 500, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}>
          {isLoading ? 'Updating...' : 'Update Credentials'}
        </button>
      </form>
    </div>
  );
}

function SettingsView() {
  const { taxRate, updateTaxRate, bookingPolicies, updateBookingPolicies } = useHotels();
  const [localTaxRate, setLocalTaxRate] = useState(taxRate);
  
  const [localPolicies, setLocalPolicies] = useState({
    guestCanCancel: bookingPolicies?.guestCanCancel ?? true,
    guestCanReschedule: bookingPolicies?.guestCanReschedule ?? true,
    cancellationNoticeHours: bookingPolicies?.cancellationNoticeHours ?? 24,
    rescheduleNoticeHours: bookingPolicies?.rescheduleNoticeHours ?? 24
  });

  const [policySaved, setPolicySaved] = useState(false);

  useEffect(() => {
    if (bookingPolicies) {
      setLocalPolicies({
        guestCanCancel: bookingPolicies.guestCanCancel ?? true,
        guestCanReschedule: bookingPolicies.guestCanReschedule ?? true,
        cancellationNoticeHours: bookingPolicies.cancellationNoticeHours ?? 24,
        rescheduleNoticeHours: bookingPolicies.rescheduleNoticeHours ?? 24
      });
    }
  }, [bookingPolicies]);

  const handleSave = () => {
    updateTaxRate(localTaxRate);
    alert('General settings saved successfully!');
  };

  const handleSavePolicies = async () => {
    await updateBookingPolicies(localPolicies);
    setPolicySaved(true);
    setTimeout(() => setPolicySaved(false), 3000);
  };

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 600, color: '#111827', marginBottom: 4 }}>System Settings</h1>
        <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>Configure global application preferences, taxes, and guest self-service policies.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 32 }}>
        {/* General Settings */}
        <div style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #E5E7EB', padding: 32 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#111827', marginBottom: 24 }}>General Settings</h3>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>Company Name</label>
            <input type="text" defaultValue="Sabharwal Hospitality" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB' }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>Default Currency</label>
            <select style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB' }}>
              <option>INR (₹)</option>
              <option>USD ($)</option>
            </select>
          </div>
          <div style={{ marginBottom: 32 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>Tax & Fee Rate (%)</label>
            <input type="number" step="0.1" value={localTaxRate} onChange={e => setLocalTaxRate(parseFloat(e.target.value) || 0)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB' }} />
          </div>
          <button onClick={handleSave} style={{ backgroundColor: '#0A192F', color: 'white', padding: '10px 24px', border: 'none', borderRadius: 8, fontWeight: 500, cursor: 'pointer' }}>Save General Settings</button>
        </div>

        {/* Guest Booking Policies */}
        <div style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #E5E7EB', padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#111827', margin: 0 }}>Guest Booking Policies</h3>
              <p style={{ color: '#6B7280', fontSize: '0.85rem', marginTop: 4 }}>Control guest permissions for cancelling & rescheduling stays.</p>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
              <Clock size={20} />
            </div>
          </div>

          {policySaved && (
            <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: '#ECFDF5', color: '#065F46', marginBottom: 20, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={16} /> Policies updated and saved successfully!
            </div>
          )}

          {/* Cancellation Control */}
          <div style={{ padding: '16px', borderRadius: 12, backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.95rem' }}>Allow Online Cancellations</span>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#6B7280' }}>Show "Cancel Stay" button to guests in their dashboard</p>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={localPolicies.guestCanCancel}
                  onChange={e => setLocalPolicies(prev => ({ ...prev, guestCanCancel: e.target.checked }))}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: localPolicies.guestCanCancel ? '#10B981' : '#D1D5DB',
                  borderRadius: 24, transition: '.3s'
                }}>
                  <span style={{
                    position: 'absolute', content: '""', height: 18, width: 18, left: 3, bottom: 3,
                    backgroundColor: 'white', borderRadius: '50%', transition: '.3s',
                    transform: localPolicies.guestCanCancel ? 'translateX(20px)' : 'translateX(0)'
                  }} />
                </span>
              </label>
            </div>

            {localPolicies.guestCanCancel && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #E5E7EB' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Prior Cancellation Notice Window (Hours before Check-in)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input 
                    type="number" 
                    min="0"
                    step="1"
                    value={localPolicies.cancellationNoticeHours}
                    onChange={e => setLocalPolicies(prev => ({ ...prev, cancellationNoticeHours: Math.max(0, parseInt(e.target.value) || 0) }))}
                    style={{ width: '110px', padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: '0.95rem' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                    hours before check-in ({Math.floor(localPolicies.cancellationNoticeHours / 24)}d {localPolicies.cancellationNoticeHours % 24}h)
                  </span>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#9CA3AF' }}>
                  Guests can only self-cancel if check-in is at least {localPolicies.cancellationNoticeHours} hours away.
                </p>
              </div>
            )}
          </div>

          {/* Reschedule Control */}
          <div style={{ padding: '16px', borderRadius: 12, backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.95rem' }}>Allow Changing Dates</span>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#6B7280' }}>Show "Change Dates" button to guests in their dashboard</p>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={localPolicies.guestCanReschedule}
                  onChange={e => setLocalPolicies(prev => ({ ...prev, guestCanReschedule: e.target.checked }))}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: localPolicies.guestCanReschedule ? '#10B981' : '#D1D5DB',
                  borderRadius: 24, transition: '.3s'
                }}>
                  <span style={{
                    position: 'absolute', content: '""', height: 18, width: 18, left: 3, bottom: 3,
                    backgroundColor: 'white', borderRadius: '50%', transition: '.3s',
                    transform: localPolicies.guestCanReschedule ? 'translateX(20px)' : 'translateX(0)'
                  }} />
                </span>
              </label>
            </div>

            {localPolicies.guestCanReschedule && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #E5E7EB' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Prior Date Change Notice Window (Hours before Check-in)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input 
                    type="number" 
                    min="0"
                    step="1"
                    value={localPolicies.rescheduleNoticeHours}
                    onChange={e => setLocalPolicies(prev => ({ ...prev, rescheduleNoticeHours: Math.max(0, parseInt(e.target.value) || 0) }))}
                    style={{ width: '110px', padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: '0.95rem' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                    hours before check-in ({Math.floor(localPolicies.rescheduleNoticeHours / 24)}d {localPolicies.rescheduleNoticeHours % 24}h)
                  </span>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#9CA3AF' }}>
                  Guests can only reschedule if check-in is at least {localPolicies.rescheduleNoticeHours} hours away.
                </p>
              </div>
            )}
          </div>

          <button onClick={handleSavePolicies} style={{ backgroundColor: '#2563EB', color: 'white', padding: '10px 24px', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            Save Booking Policies
          </button>
        </div>

        <EmailNotificationSettings />

        <AdminCredentialsForm />
      </div>
    </>
  );
}

function EmailNotificationSettings() {
  const [smtpConfig, setSmtpConfig] = useState({
    smtpUser: '',
    smtpPass: '',
    smtpFromName: 'Hotel Sabharwal Hospitality',
    smtpHost: 'smtp.gmail.com',
    smtpPort: '465'
  });
  const [saved, setSaved] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testStatus, setTestStatus] = useState({ loading: false, msg: '', type: '' });

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data) {
          setSmtpConfig(prev => ({
            smtpUser: data.smtpUser || '',
            smtpPass: data.smtpPass || '',
            smtpFromName: data.smtpFromName || 'Hotel Sabharwal Hospitality',
            smtpHost: data.smtpHost || 'smtp.gmail.com',
            smtpPort: data.smtpPort || '465'
          }));
        }
      })
      .catch(err => console.error("Failed to load email settings:", err));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await Promise.all([
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'smtpUser', value: smtpConfig.smtpUser })
        }),
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'smtpPass', value: smtpConfig.smtpPass })
        }),
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'smtpFromName', value: smtpConfig.smtpFromName })
        }),
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'smtpHost', value: smtpConfig.smtpHost })
        }),
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'smtpPort', value: smtpConfig.smtpPort })
        })
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("Failed to save email settings");
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      return alert("Please enter an email address to send the test confirmation to.");
    }
    setTestStatus({ loading: true, msg: 'Sending test email...', type: 'info' });
    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail })
      });
      const data = await res.json();
      if (data.success) {
        setTestStatus({ loading: false, msg: data.message, type: 'success' });
      } else {
        setTestStatus({ loading: false, msg: data.error || 'Failed to send test email.', type: 'error' });
      }
    } catch (err) {
      setTestStatus({ loading: false, msg: 'Error connecting to email service.', type: 'error' });
    }
  };

  return (
    <div style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #E5E7EB', padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#111827', margin: 0 }}>Guest Booking Email Confirmation</h3>
          <p style={{ color: '#6B7280', fontSize: '0.85rem', marginTop: 4 }}>Automatically dispatch booking confirmations to guests upon reservation.</p>
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
          <Mail size={20} />
        </div>
      </div>

      {saved && (
        <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: '#ECFDF5', color: '#065F46', marginBottom: 20, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={16} /> Email settings saved successfully!
        </div>
      )}

      <form onSubmit={handleSave}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            Sender Display Name
          </label>
          <input 
            type="text" 
            value={smtpConfig.smtpFromName} 
            onChange={e => setSmtpConfig(prev => ({ ...prev, smtpFromName: e.target.value }))}
            placeholder="Hotel Sabharwal Hospitality" 
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB' }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            Gmail / Sender Email Address
          </label>
          <input 
            type="email" 
            value={smtpConfig.smtpUser} 
            onChange={e => setSmtpConfig(prev => ({ ...prev, smtpUser: e.target.value }))}
            placeholder="yourhotel@gmail.com" 
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB' }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            Gmail 16-Character App Password
          </label>
          <input 
            type="password" 
            value={smtpConfig.smtpPass} 
            onChange={e => setSmtpConfig(prev => ({ ...prev, smtpPass: e.target.value }))}
            placeholder="xxxx xxxx xxxx xxxx" 
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB' }}
          />
          <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#6B7280' }}>
            Tip: Generate via Google Account → Security → 2-Step Verification → App Passwords.
          </p>
        </div>

        <button 
          type="submit" 
          style={{ backgroundColor: '#0A192F', color: 'white', padding: '10px 24px', border: 'none', borderRadius: 8, fontWeight: 500, cursor: 'pointer', marginBottom: 24 }}
        >
          Save Email Configuration
        </button>
      </form>

      {/* Test Email Section */}
      <div style={{ paddingTop: 20, borderTop: '1px solid #E5E7EB' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
          Send Test Email
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          <input 
            type="email" 
            value={testEmail} 
            onChange={e => setTestEmail(e.target.value)} 
            placeholder="Enter your email to test" 
            style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: '0.9rem' }}
          />
          <button 
            type="button" 
            onClick={handleSendTestEmail} 
            disabled={testStatus.loading}
            style={{ 
              backgroundColor: '#10B981', 
              color: 'white', 
              padding: '9px 16px', 
              border: 'none', 
              borderRadius: 8, 
              fontWeight: 500, 
              cursor: testStatus.loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Send size={15} /> {testStatus.loading ? 'Sending...' : 'Test Send'}
          </button>
        </div>
        {testStatus.msg && (
          <div style={{ 
            marginTop: 10, 
            padding: '8px 12px', 
            borderRadius: 6, 
            fontSize: '0.82rem',
            backgroundColor: testStatus.type === 'success' ? '#ECFDF5' : testStatus.type === 'error' ? '#FEE2E2' : '#EFF6FF',
            color: testStatus.type === 'success' ? '#065F46' : testStatus.type === 'error' ? '#991B1B' : '#1E40AF'
          }}>
            {testStatus.msg}
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Subcomponents & Styles
// -------------------------------------------------------------

const NavItem = ({ icon, label, active, onClick }) => (
  <div onClick={onClick} style={{ 
    display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 8, 
    cursor: 'pointer', transition: 'all 0.2s',
    backgroundColor: active ? 'rgba(255,255,255,0.1)' : 'transparent',
    color: active ? 'white' : '#9CA3AF',
    fontWeight: active ? 500 : 400
  }}>
    {icon}
    <span style={{ fontSize: '0.95rem' }}>{label}</span>
  </div>
);

const MetricCard = ({ icon, bg, title, value }) => (
  <div style={{ flex: 1, backgroundColor: 'white', padding: 24, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.9rem', color: '#6B7280', fontWeight: 500, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#111827', marginBottom: 4, lineHeight: 1 }}>{value}</div>
      </div>
    </div>
  </div>
);

const DashboardCard = ({ title, action, onAction, children }) => (
  <div style={{ backgroundColor: 'white', borderRadius: 16, padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: 0 }}>{title}</h3>
      {action && (
        <button onClick={onAction} style={{ color: '#3B82F6', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, border: 'none', background: 'none', cursor: 'pointer' }}>
          {action} <ArrowRight size={14} />
        </button>
      )}
    </div>
    <div style={{ flex: 1 }}>
      {children}
    </div>
  </div>
);

const thStyle = { padding: '16px 24px', color: '#6B7280', fontWeight: 500, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle = { padding: '16px 24px', verticalAlign: 'middle' };
