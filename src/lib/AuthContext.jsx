import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // APP LIBERA - nessun login richiesto
    setIsLoadingAuth(false);
    setUser({ name: 'Admin', role: 'admin' });
  }, []);

  const navigateToLogin = () => {};

  return (
    <AuthContext.Provider value={{ 
      isLoadingAuth, 
      isLoadingPublicSettings, 
      authError, 
      user,
      navigateToLogin,
      isAdmin: true 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
