// Location: context/AuthContext.tsx (UPDATED)

import React, { createContext, useContext, useState, useEffect } from 'react';
import { router } from 'expo-router';

// Define the full user object type
interface User {
  email: string;
  name: string;
  userType: 'admin' | 'resident';
  // New details for the profile screen
  phone: string;
  unit: string;
  tower: string;
  role: string;
  vehicles: string[];
  avatar: string;
}

interface AuthContextData {
  signIn: (email: string) => void;
  signOut: () => void;
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

// Update mock users with more details
const MOCK_USERS: { [key: string]: User } = {
  'sindico@demo.com': { 
    email: 'sindico@demo.com', 
    name: 'Maria Silva', 
    userType: 'admin',
    phone: '(11) 99999-1234',
    unit: 'Apt 302',
    tower: 'Torre A',
    role: 'Síndico',
    vehicles: ['ABC-1234', 'XYZ-5678'],
    avatar: 'MS'
  },
  'maria@demo.com': { 
    email: 'maria@demo.com', 
    name: 'Maria Silva', 
    userType: 'resident',
    phone: '(11) 99999-1234',
    unit: 'Apt 302',
    tower: 'Torre A',
    role: 'Morador',
    vehicles: ['ABC-1234', 'XYZ-5678'],
    avatar: 'MS'
  },
  'joao@demo.com': { 
    email: 'joao@demo.com', 
    name: 'João Santos', 
    userType: 'resident',
    phone: '(11) 97777-4321',
    unit: 'Apt 105',
    tower: 'Torre A',
    role: 'Morador',
    vehicles: ['DEF-9876'],
    avatar: 'JS'
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(null);
    setIsLoading(false);
  }, []);

  const signIn = (email: string) => {
    const foundUser = MOCK_USERS[email.toLowerCase()];
    if (foundUser) {
      setUser(foundUser);
      router.replace('/(app)/(tabs)/dashboard');
    } else {
      alert('Usuário não encontrado.');
    }
  };

  const signOut = () => {
    setUser(null);
    router.replace('/(auth)/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}