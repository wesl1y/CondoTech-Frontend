// app/(app)/(tabs)/manage-reservations/utils/helpers.ts
import { API_URL } from '@/constants/api';
import * as SecureStore from 'expo-secure-store';
import { COLORS } from '../../styles/common-area/styles';
import { TipoReserva } from '../types/types';

// Lista de nomes de ícones disponíveis (para Picker)
export const iconesDisponiveisNomes = [
  "Salão de Festas",
  "Churrasqueira",
  "Piscina",
  "Admin"
];

// Função para renderizar ícone com props padrão
export const renderIcon = (iconName: string) => {
  // eslint-disable-next-line global-require
  const { Home, Waves, Flame, Grid3X3 } = require('lucide-react-native');

  const size = 24;
  const color = COLORS.primary;
  const React = require('react');

  switch (iconName) {
    case 'Salão de Festas':
      return React.createElement(Home, { size, color });
    case 'Churrasqueira':
      return React.createElement(Flame, { size, color });
    case 'Piscina':
      return React.createElement(Waves, { size, color });
    default:
      return React.createElement(Grid3X3, { size, color });
  }
};

// ✅ CORRIGIDO: Tipos de reserva conforme aceitos pelo backend
export const tiposDeReserva: TipoReserva[] = ['HORA', 'MANHA', 'TARDE', 'NOITE', 'DIA_TODO'];

// ✅ CORRIGIDO: Formata tipo de reserva para exibição
export const formatarTipoReserva = (tipo: TipoReserva): string => {
  const tipos: Record<TipoReserva, string> = {
    'HORA': 'Por Hora',
    'MANHA': 'Período da Manhã',
    'TARDE': 'Período da Tarde',
    'NOITE': 'Período da Noite',
    'DIA_TODO': 'Dia Inteiro'
  };
  return tipos[tipo] || tipo;
};

// Carrega imagem como base64
export const loadImageAsBase64 = async (imageUrl: string): Promise<string | null> => {
  try {
    const token = await SecureStore.getItemAsync('my-jwt');
    
    if (!token) {
      console.warn('⚠️ Token não encontrado para carregar imagem');
      return null;
    }

    let fullUrl = imageUrl;
    if (!imageUrl.startsWith('http')) {
      fullUrl = `${API_URL}${imageUrl}`;
    }
    
    console.log('📸 Carregando imagem:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
      }
    });
    
    if (!response.ok) {
      console.error(`❌ Erro HTTP ${response.status} ao carregar ${fullUrl}`);
      return null;
    }
    
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = (error) => {
        console.error('❌ Erro no FileReader:', error);
        reject(error);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('❌ Erro ao carregar imagem:', error);
    return null;
  }
};

// Helper para obter fonte de imagem
export const getImageSource = (foto: any): { uri: string } | null => {
  if (foto.urlBase64) {
    return { uri: foto.urlBase64 };
  }
  if (foto.url) {
    return { uri: foto.url };
  }
  return null;
};