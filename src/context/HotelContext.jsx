import React, { createContext, useState, useContext, useEffect } from 'react';
import { format, isSameDay, isAfter, isBefore, addDays, parseISO } from 'date-fns';

export const HotelContext = createContext();

const API_URL = '/api';

export const HotelProvider = ({ children }) => {
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [taxRate, setTaxRate] = useState(() => {
    const saved = localStorage.getItem('hotelTaxRate');
    return saved !== null ? parseFloat(saved) : 18;
  });

  const updateTaxRate = async (newRate) => {
    setTaxRate(newRate);
    localStorage.setItem('hotelTaxRate', newRate);
    try {
      await fetch(`${API_URL}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'taxRate', value: newRate })
      });
    } catch (err) {
      console.error("Failed to sync taxRate:", err);
    }
  };

  const [offersEnabled, setOffersEnabled] = useState(() => {
    const saved = localStorage.getItem('offersEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleOffers = async () => {
    const newState = !offersEnabled;
    setOffersEnabled(newState);
    localStorage.setItem('offersEnabled', JSON.stringify(newState));
    try {
      await fetch(`${API_URL}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'offersEnabled', value: newState })
      });
    } catch (err) {
      console.error("Failed to sync offersEnabled:", err);
    }
  };

  // Guest Booking Policies
  const [bookingPolicies, setBookingPolicies] = useState(() => {
    const saved = localStorage.getItem('guestBookingPolicies');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      guestCanCancel: true,
      guestCanReschedule: true,
      cancellationNoticeHours: 24,
      rescheduleNoticeHours: 24
    };
  });

  const updateBookingPolicies = async (updatedFields) => {
    const newPolicies = { ...bookingPolicies, ...updatedFields };
    setBookingPolicies(newPolicies);
    localStorage.setItem('guestBookingPolicies', JSON.stringify(newPolicies));
    try {
      await Promise.all(
        Object.entries(updatedFields).map(([key, value]) =>
          fetch(`${API_URL}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value })
          })
        )
      );
    } catch (err) {
      console.error("Failed to sync booking policies:", err);
    }
  };

  const [offers, setOffers] = useState([]);

  const addOffer = async (newOffer) => {
    setOffers(prev => [newOffer, ...prev]);
    localStorage.setItem('hotelOffers', JSON.stringify([newOffer, ...offers]));
    try {
      await fetch(`${API_URL}/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOffer)
      });
    } catch (err) {
      console.error("Failed to save offer:", err);
    }
  };

  const removeOffer = async (id) => {
    setOffers(prev => prev.filter(o => o.id !== id));
    localStorage.setItem('hotelOffers', JSON.stringify(offers.filter(o => o.id !== id)));
    try {
      await fetch(`${API_URL}/offers/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error("Failed to delete offer:", err);
    }
  };

  const [inventoryAlerts, setInventoryAlerts] = useState([
    { item: 'Towels (Large)', category: 'Housekeeping', stock: 12, status: 'Low Stock', color: '#EF4444', bg: '#FEF2F2' },
    { item: 'Toiletries Kit', category: 'Amenities', stock: 8, status: 'Low Stock', color: '#EF4444', bg: '#FEF2F2' },
    { item: 'Bottled Water (1L)', category: 'F&B', stock: 120, status: 'Normal', color: '#10B981', bg: '#ECFDF5' },
  ]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [propsRes, bookingsRes, roomsRes, offersRes, settingsRes] = await Promise.all([
          fetch(`${API_URL}/properties`),
          fetch(`${API_URL}/bookings`),
          fetch(`${API_URL}/rooms`),
          fetch(`${API_URL}/offers`),
          fetch(`${API_URL}/settings`)
        ]);
        const propsData = await propsRes.json();
        const bookingsData = await bookingsRes.json();
        const roomsData = await roomsRes.json();
        const offersData = await offersRes.json();
        const settingsData = await settingsRes.json();
        
        setProperties(propsData);
        setBookings(bookingsData);
        setRooms(roomsData);

        if (Array.isArray(offersData)) {
          setOffers(offersData);
          localStorage.setItem('hotelOffers', JSON.stringify(offersData));
        }

        if (settingsData) {
          if (settingsData.offersEnabled !== undefined) {
            setOffersEnabled(settingsData.offersEnabled);
            localStorage.setItem('offersEnabled', JSON.stringify(settingsData.offersEnabled));
          }
          if (settingsData.taxRate !== undefined) {
            setTaxRate(parseFloat(settingsData.taxRate));
            localStorage.setItem('hotelTaxRate', settingsData.taxRate);
          }
          const loadedPolicies = {
            guestCanCancel: settingsData.guestCanCancel !== undefined ? (settingsData.guestCanCancel === true || settingsData.guestCanCancel === 'true') : true,
            guestCanReschedule: settingsData.guestCanReschedule !== undefined ? (settingsData.guestCanReschedule === true || settingsData.guestCanReschedule === 'true') : true,
            cancellationNoticeHours: settingsData.cancellationNoticeHours !== undefined ? Number(settingsData.cancellationNoticeHours) : 24,
            rescheduleNoticeHours: settingsData.rescheduleNoticeHours !== undefined ? Number(settingsData.rescheduleNoticeHours) : 24
          };
          setBookingPolicies(loadedPolicies);
          localStorage.setItem('guestBookingPolicies', JSON.stringify(loadedPolicies));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addProperty = async (property) => {
    const id = property.id || Date.now().toString();
    const newProp = { ...property, id };
    
    // Optimistic update
    setProperties(prev => [...prev, newProp]);
    
    try {
      await fetch(`${API_URL}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProp)
      });
    } catch (error) {
      console.error("Failed to add property", error);
    }
  };

  const removeProperty = async (id) => {
    setProperties(prev => prev.filter(p => p.id !== id));
    try {
      await fetch(`${API_URL}/properties/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error("Failed to delete property", error);
    }
  };

  const updateProperty = async (id, updatedData) => {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, ...updatedData } : p));
    try {
      await fetch(`${API_URL}/properties/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
    } catch (error) {
      console.error("Failed to update property", error);
    }
  };

  const addBooking = async (booking) => {
    // Optimistic update with a temp ID
    const tempId = Date.now();
    setBookings(prev => [{ ...booking, id: tempId }, ...prev]);
    
    try {
      const res = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking)
      });
      const data = await res.json();
      
      // Update with real ID from DB
      setBookings(prev => prev.map(b => b.id === tempId ? { ...b, id: data.id } : b));
    } catch (error) {
      console.error("Failed to add booking", error);
    }
  };

  const updateBooking = async (id, updatedData) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updatedData } : b));
    try {
      await fetch(`${API_URL}/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
    } catch (error) {
      console.error("Failed to update booking", error);
    }
  };

  const updateBookingStatus = async (id, status) => {
    await updateBooking(id, { status });
  };

  const removeBooking = async (id) => {
    setBookings(prev => prev.filter(b => b.id !== id));
    try {
      await fetch(`${API_URL}/bookings/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error("Failed to delete booking", error);
    }
  };

  const addRoomType = async (room) => {
    const id = room.id || `room-${Date.now()}`;
    const newRoom = { ...room, id };
    
    setRooms(prev => [...prev, newRoom]);
    
    try {
      await fetch(`${API_URL}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRoom)
      });
    } catch (error) {
      console.error("Failed to add room type", error);
    }
  };

  const removeRoomType = async (id) => {
    setRooms(prev => prev.filter(r => r.id !== id));
    try {
      await fetch(`${API_URL}/rooms/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error("Failed to delete room type", error);
    }
  };

  const updateRoomType = async (id, updatedData) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, ...updatedData } : r));
    try {
      await fetch(`${API_URL}/rooms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
    } catch (error) {
      console.error("Failed to update room type", error);
    }
  };

  return (
    <HotelContext.Provider value={{ 
      properties, addProperty, removeProperty, updateProperty,
      bookings, addBooking, updateBooking, updateBookingStatus, removeBooking,
      rooms, addRoomType, removeRoomType, updateRoomType,
      inventoryAlerts, setInventoryAlerts,
      taxRate, updateTaxRate,
      offersEnabled, toggleOffers, offers, addOffer, removeOffer,
      bookingPolicies, updateBookingPolicies,
      loading
    }}>
      {children}
    </HotelContext.Provider>
  );
};

export const useHotels = () => useContext(HotelContext);
