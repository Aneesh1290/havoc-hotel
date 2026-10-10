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

  const updateTaxRate = (newRate) => {
    setTaxRate(newRate);
    localStorage.setItem('hotelTaxRate', newRate);
  };

  const [offersEnabled, setOffersEnabled] = useState(() => {
    const saved = localStorage.getItem('offersEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleOffers = () => {
    setOffersEnabled(prev => {
      const newState = !prev;
      localStorage.setItem('offersEnabled', JSON.stringify(newState));
      return newState;
    });
  };

  const [offers, setOffers] = useState(() => {
    const saved = localStorage.getItem('hotelOffers');
    if (saved) return JSON.parse(saved);
    return [
      { id: 1, title: 'Winter Getaway 20% Off', description: 'Book any stay for 3 or more nights this winter and enjoy a flat 20% discount on your entire booking.', code: 'WINTER20', color: '#D97706', bg: '#FEF3C7' },
      { id: 2, title: 'Early Bird Special', description: 'Plan ahead! Book 30 days in advance and receive a complimentary room upgrade and breakfast.', code: 'EARLYBIRD', color: '#059669', bg: '#ECFDF5' }
    ];
  });

  const saveOffers = (newOffers) => {
    setOffers(newOffers);
    localStorage.setItem('hotelOffers', JSON.stringify(newOffers));
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
        const [propsRes, bookingsRes, roomsRes] = await Promise.all([
          fetch(`${API_URL}/properties`),
          fetch(`${API_URL}/bookings`),
          fetch(`${API_URL}/rooms`)
        ]);
        const propsData = await propsRes.json();
        const bookingsData = await bookingsRes.json();
        const roomsData = await roomsRes.json();
        
        setProperties(propsData);
        setBookings(bookingsData);
        setRooms(roomsData);
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

  const updateBookingStatus = (id, status) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    // Implementation for DB update can be added here
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
      bookings, addBooking, updateBookingStatus, removeBooking,
      rooms, addRoomType, removeRoomType, updateRoomType,
      inventoryAlerts, setInventoryAlerts,
      taxRate, updateTaxRate,
      offersEnabled, toggleOffers, offers, saveOffers,
      loading
    }}>
      {children}
    </HotelContext.Provider>
  );
};

export const useHotels = () => useContext(HotelContext);
