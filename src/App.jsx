import { Toaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import Home from '@/pages/Home';
import MenuCategory from '@/pages/MenuCategory';
import Cart from '@/pages/Cart';
import Admin from '@/pages/Admin';
import AdminPin from '@/pages/AdminPin';
import { seedDemoData } from '@/lib/apiClient';
import { useEffect, useState } from 'react';

// Protezione route admin - controlla se autenticato
function AdminRoute() {
  const isAuth = localStorage.getItem('admin_auth') === 'true';
  return isAuth ? <Admin /> : <Navigate to="/admin-pin" replace />;
}

const AuthenticatedApp = () => {
  // STATO APERTO/CHIUSO - salvato in localStorage
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('pizzeria_isOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleOpen = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    localStorage.setItem('pizzeria_isOpen', JSON.stringify(newState));
  };

  useEffect(() => {
    seedDemoData();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/menu/:category" element={<MenuCategory />} />
      <Route path="/carrello" element={<Cart />} />
      <Route path="/admin" element={<AdminRoute />} />
      <Route path="/admin-pin" element={<AdminPin />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
