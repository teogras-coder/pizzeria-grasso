import { Toaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import Home from '@/pages/Home';
import MenuCategory from '@/pages/MenuCategory';
import Cart from '@/pages/Cart';
import Admin from '@/pages/Admin';
import { seedDemoData } from '@/lib/apiClient';
import { useEffect } from 'react';

const AuthenticatedApp = () => {
  useEffect(() => {
    seedDemoData();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/menu/:category" element={<MenuCategory />} />
      <Route path="/carrello" element={<Cart />} />
      <Route path="/admin" element={<Admin />} />
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
