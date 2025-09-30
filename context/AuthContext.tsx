import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_URL } from '../constants/api';
import api from '../services/api';

// --- INTERFACES ATUALIZADAS ---

// Nova interface para representar um veículo
interface Vehicle {
  id: number;
  placa: string;
  marca: string;
  modelo: string;
  cor: string;
}

// Interface do Token JWT
interface DecodedToken {
  sub: string;
  id: string;
  role: 'ADMIN' | 'USER';
  exp: number;
}

// Interface User atualizada para corresponder ao DTO do back-end
interface User {
  id: string;
  login: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  phone: string;
  unit: string;
  tower: string;
  vehicles: Vehicle[]; // <-- AGORA É UMA LISTA DE OBJETOS 'Vehicle'
  avatar: string;
}

interface AuthContextData {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);
const TOKEN_KEY = 'my-jwt';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // O resto da lógica (useEffect, signIn, signOut) permanece o mesmo
  useEffect(() => {
    const loadUserFromToken = async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (token) {
          const decodedToken: DecodedToken = jwtDecode(token);
          const userData = await api.get(`/users/${decodedToken.id}`);
          setUser(userData);
        }
      } catch (e) {
        console.error('Failed to load user session:', e);
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserFromToken();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: email, password: password }),
      });

      if (!response.ok) throw new Error('E-mail ou senha inválidos');
      const { token } = await response.json();
      if (!token) throw new Error('Token não recebido do servidor');
      
      await SecureStore.setItemAsync(TOKEN_KEY, token);

      const decodedToken: DecodedToken = jwtDecode(token);
      const userData = await api.get(`/users/${decodedToken.id}`);
      setUser(userData);
      
      router.replace('/(app)/(tabs)/dashboard');

    } catch (error) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      let errorMessage = 'Ocorreu um erro desconhecido.';
      if (error instanceof Error) errorMessage = error.message;
      console.error('Login failed:', error);
      alert(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signOut = async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (e) {
      console.error('Failed to delete token:', e);
    } finally {
      setUser(null);
      router.replace('/login');
    }
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