import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: any | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local User Store (Mock Database in LocalStorage)
const USERS_KEY = 'lkc_mock_users';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('lkc_active_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const getLocalUsers = () => {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  };

  const login = async (email: string, password: string) => {
    // In a real app this is insecure, but this is a DB-less local version
    const users = getLocalUsers();
    const found = users.find((u: any) => u.email === email && u.password === password);
    
    if (!found) {
      // Special case for default admin
      if (email === 'admin@londonkaraoke.club' && password === 'admin123') {
        const admin = { name: 'System Admin', email, role: 'admin' };
        localStorage.setItem('lkc_active_user', JSON.stringify(admin));
        setUser(admin);
        return;
      }
      throw new Error('Invalid credentials');
    }

    const { password: _, ...userWithoutPass } = found;
    localStorage.setItem('lkc_active_user', JSON.stringify(userWithoutPass));
    setUser(userWithoutPass);
  };

  const register = async (name: string, email: string, password: string) => {
    const users = getLocalUsers();
    if (users.find((u: any) => u.email === email)) {
      throw new Error('Email already registered');
    }

    const newUser = { name, email, password, role: 'user' };
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    const { password: _, ...userWithoutPass } = newUser;
    localStorage.setItem('lkc_active_user', JSON.stringify(userWithoutPass));
    setUser(userWithoutPass);
  };

  const logout = () => {
    localStorage.removeItem('lkc_active_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
