import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { HotelProvider } from './context/HotelContext';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Booking from './pages/Booking';
import Hotels from './pages/Hotels';
import Offers from './pages/Offers';
import Contact from './pages/Contact';
import GuestDashboard from './pages/GuestDashboard';

export default function App() {
  return (
    <HotelProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/book/:propertyId" element={<Booking />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/hotels" element={<Hotels />} />
        <Route path="/offers" element={<Offers />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/guest" element={<GuestDashboard />} />
      </Routes>
    </HotelProvider>
  );
}
