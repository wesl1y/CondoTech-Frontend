import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, Pressable } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import AreaDetailModal from '@/components/manage-areas/modals/AreaDetailModal';

LocaleConfig.locales['pt-br'] = {
  monthNames: [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro'
  ],
  monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
  dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

// ============= TYPES & ENUMS =============
enum ReservationType {
  HOUR = "HORA",
  MORNING = "MANHA",
  AFTERNOON = "TARDE",
  EVENING = "NOITE",
  FULL_DAY = "DIA_TODO"
}

enum ReservationStatus {
  PENDING = "PENDENTE",
  CONFIRMED = "CONFIRMADA",
  CANCELLED = "CANCELADA",
  FINISHED = "FINALIZADA"
}

interface CommonArea {
  id: number;
  nome: string;
  descricao: string;
  icone: string;
  ativa: boolean;
  valorTaxa: number;
  tiposReservaDisponiveis: ReservationType[];
}

interface Reservation {
  id: number;
  areaComum: CommonArea;
  dataReserva: string;
  tipoReserva: ReservationType;
  horaInicio?: string;
  horaFim?: string;
  status: ReservationStatus;
  morador: {
    id: number;
    nome: string;
    unidade: string;
    torre: string;
  };
}

// Backend type
interface ReservationBackend {
  id: number;
  areaComumId: number;
  areaComumNome: string;
  dataReserva: string;
  tipoReserva: ReservationType;
  horaInicio?: string;
  horaFim?: string;
  status: ReservationStatus;
  moradorId: number;
  moradorNome: string;
  moradorUnidade?: string;
  moradorTorre?: string;
}

// ============= CONSTANTS =============
const THEME = {
  primary: '#3b82f6',
  secondary: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  success: '#10b981',
  disabled: '#94a3b8',
  background: '#f8fafc',
  cardBackground: '#fff',
  border: '#e2e8f0',
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    tertiary: '#64748b',
    disabled: '#94a3b8',
  }
};

const STATUS_COLORS = {
  PENDENTE: '#f59e0b',
  CONFIRMADA: '#10b981',
  CANCELADA: '#ef4444',
  FINALIZADA: '#6b7280',
};

const FIXED_SCHEDULES = {
  MANHA: { inicio: '06:00', fim: '12:00' },
  TARDE: { inicio: '12:01', fim: '18:00' },
  NOITE: { inicio: '18:01', fim: '23:59' },
  DIA_TODO: { inicio: '06:00', fim: '23:59' }
};

const MIN_HOUR = 6; // 06:00
const MAX_HOUR = 23; // 23:00
const MAX_MINUTE = 59; // 23:59

const START_HOURS = Array.from({ length: 17 }, (_, i) => {
  const hour = i + 6;
  return `${hour.toString().padStart(2, '0')}:00`;
});

const DURATIONS = Array.from({ length: 17 }, (_, i) => ({
  label: `${i + 1} hora${i > 0 ? 's' : ''}`,
  value: i + 1
}));

const TYPE_LABELS: Record<ReservationType, string> = {
  HORA: 'Por Hora',
  MANHA: 'Manhã',
  TARDE: 'Tarde',
  NOITE: 'Noite',
  DIA_TODO: 'Dia Todo'
};

// ============= ADAPTERS =============
const adaptReservationFromBackend = (backendReservation: ReservationBackend, areas: CommonArea[]): Reservation => {
  // Extract tower and unit from resident name if they exist
  let unit = backendReservation.moradorUnidade || 'N/A';
  let tower = backendReservation.moradorTorre || 'N/A';
  let residentName = backendReservation.moradorNome;

  // Try to extract tower and unit from name if not separately provided
  const towerMatch = residentName.match(/Torre\s+(\w+)/i);
  const unitMatch = residentName.match(/Unidade\s+(\w+)/i);
  
  if (towerMatch) tower = towerMatch[1];
  if (unitMatch) unit = unitMatch[1];

  // Remove extra information from name
  residentName = residentName.replace(/\s*\([^)]*\)\s*/g, '').trim();

  // Find complete area or create minimal area
  const commonArea = areas.find(a => a.id === backendReservation.areaComumId) || {
    id: backendReservation.areaComumId,
    nome: backendReservation.areaComumNome,
    descricao: '',
    icone: 'home',
    ativa: true,
    valorTaxa: 0,
    tiposReservaDisponiveis: []
  };

  return {
    id: backendReservation.id,
    areaComum: commonArea,
    dataReserva: backendReservation.dataReserva,
    tipoReserva: backendReservation.tipoReserva,
    horaInicio: backendReservation.horaInicio,
    horaFim: backendReservation.horaFim,
    status: backendReservation.status,
    morador: {
      id: backendReservation.moradorId,
      nome: residentName,
      unidade: unit,
      torre: tower
    }
  };
};

// ============= SERVICE LAYER =============
const reservationService = {
  getCommonAreas: async (): Promise<CommonArea[]> => {
    try {
      const areas = await api.get('/reservas/areas');
      if (!Array.isArray(areas)) return [];
      return areas.filter((a: CommonArea) => a?.ativa === true);
    } catch (error) {
      console.error('Error fetching areas:', error);
      throw error;
    }
  },

  getAvailability: async (areaId: number, date: string): Promise<Reservation[]> => {
    try {
      const result = await api.get(`/reservas/areas/${areaId}/disponibilidade?data=${date}`);
      return result || [];
    } catch (error) {
      console.error('Error checking availability:', error);
      return [];
    }
  },

  getMyReservations: async (areas: CommonArea[]): Promise<Reservation[]> => {
    try {
      console.log('📥 Loading my reservations...');
      const result = await api.get('/reservas/minhas/futuras');
      console.log('✅ My reservations (backend):', result);
      
      if (!Array.isArray(result)) return [];
      
      const adapted = result.map((r: ReservationBackend) => adaptReservationFromBackend(r, areas));
      console.log('🔄 Adapted reservations:', adapted);
      
      return adapted;
    } catch (error) {
      console.error('❌ Error fetching my reservations:', error);
      throw error;
    }
  },

  getAllReservations: async (areas: CommonArea[]): Promise<Reservation[]> => {
    try {
      console.log('📥 Loading all reservations...');
      const result = await api.get('/reservas/todas');
      console.log('✅ All reservations (backend):', result);
      
      if (!Array.isArray(result)) return [];
      
      const adapted = result.map((r: ReservationBackend) => adaptReservationFromBackend(r, areas));
      console.log('🔄 All adapted reservations:', adapted);
      
      return adapted;
    } catch (error) {
      console.error('❌ Error fetching all reservations:', error);
      throw error;
    }
  },

  createReservation: async (data: any): Promise<Reservation> => {
    try {
      const result = await api.post('/reservas', data);
      return result;
    } catch (error) {
      console.error('Error creating reservation:', error);
      throw error;
    }
  },

  cancelReservation: async (id: number): Promise<void> => {
    try {
      await api.delete(`/reservas/${id}`);
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      throw error;
    }
  }
};

const canCancel = (reservation: Reservation, userRole: string, userId: string): { canCancel: boolean; reason?: string } => {
  if (reservation.status === 'CANCELADA') {
    return { canCancel: false, reason: 'Reserva já cancelada' };
  }
  
  // Adjust dates to compare only days (without time)
  const reservationDate = new Date(reservation.dataReserva + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to compare only days
  
  const diffHours = (reservationDate.getTime() - today.getTime()) / (1000 * 60 * 60);
  
  console.log('🔍 Checking cancellation:', {
    reservationId: reservation.id,
    reservationDate: reservation.dataReserva,
    diffHours: diffHours,
    userRole: userRole
  });
  
  // Admin can always cancel
  if (userRole === 'ADMIN') {
    if (diffHours <= 48) {
      return { canCancel: true, reason: 'ADMIN_OUT_OF_DEADLINE' };
    }
    return { canCancel: true };
  }
  
  // Regular user can only cancel with MORE than 48 hours in advance
  if (diffHours <= 48) {
    return { canCancel: false, reason: 'Cancelamento só é permitido com mais de 48 horas de antecedência.\nPara mais informações, entre em contato com o seu síndico.' };
  }
  
  return { canCancel: true };
};

const calculateEndTime = (startTime: string, duration: number): string => {
  const [hour, minute] = startTime.split(':').map(Number);
  const endHour = hour + duration;
  return `${endHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

const checkTimeConflict = (newStart: string, newEnd: string, reservations: Reservation[]): boolean => {
  const [nStartH, nStartM] = newStart.split(':').map(Number);
  const [nEndH, nEndM] = newEnd.split(':').map(Number);
  const newStartMin = nStartH * 60 + nStartM;
  const newEndMin = nEndH * 60 + nEndM;

  return reservations.some(r => {
    if (r.status !== 'CONFIRMADA') return false;
    const start = r.horaInicio || FIXED_SCHEDULES[r.tipoReserva as keyof typeof FIXED_SCHEDULES]?.inicio;
    const end = r.horaFim || FIXED_SCHEDULES[r.tipoReserva as keyof typeof FIXED_SCHEDULES]?.fim;
    if (!start || !end) return false;
    const [rStartH, rStartM] = start.split(':').map(Number);
    const [rEndH, rEndM] = end.split(':').map(Number);
    const rStartMin = rStartH * 60 + rStartM;
    const rEndMin = rEndH * 60 + rEndM;
    return !(newEndMin <= rStartMin || newStartMin >= rEndMin);
  });
};

// Check if a specific hour is available as reservation START
const isHourAvailable = (hour: string, reservations: Reservation[]): boolean => {
  const [h, m] = hour.split(':').map(Number);
  const timeMin = h * 60 + m;
  
  // Filter only confirmed reservations
  const confirmedReservations = reservations.filter(r => r.status === 'CONFIRMADA');
  
  return !confirmedReservations.some(r => {
    const start = r.horaInicio || FIXED_SCHEDULES[r.tipoReserva as keyof typeof FIXED_SCHEDULES]?.inicio;
    const end = r.horaFim || FIXED_SCHEDULES[r.tipoReserva as keyof typeof FIXED_SCHEDULES]?.fim;
    
    if (!start || !end) return false;
    
    const [rStartH, rStartM] = start.split(':').map(Number);
    const [rEndH, rEndM] = end.split(':').map(Number);
    const rStartMin = rStartH * 60 + rStartM;
    const rEndMin = rEndH * 60 + rEndM;
    
    // Time is unavailable if it's INSIDE an existing reservation
    return timeMin >= rStartMin && timeMin < rEndMin;
  });
};

// Calculate maximum allowed duration considering operating hours AND next reservations
const calculateMaxDuration = (startTime: string, reservations: Reservation[]): number => {
  const [startHour] = startTime.split(':').map(Number);
  
  // Limit 1: Operating hours (until 23:00)
  const limitBySchedule = MAX_HOUR - startHour;
  
  // Filter only confirmed reservations
  const confirmedReservations = reservations.filter(r => r.status === 'CONFIRMADA');
  
  // If no reservations, limit is only the schedule
  if (confirmedReservations.length === 0) {
    return Math.max(1, limitBySchedule);
  }
  
  // Limit 2: Next reservation
  let limitByReservation = limitBySchedule;
  const startMin = startHour * 60;
  
  for (const r of confirmedReservations) {
    const start = r.horaInicio || FIXED_SCHEDULES[r.tipoReserva as keyof typeof FIXED_SCHEDULES]?.inicio;
    
    if (!start) continue;
    
    const [rStartH, rStartM] = start.split(':').map(Number);
    const rStartMin = rStartH * 60 + rStartM;
    
    // If reservation starts AFTER desired time
    if (rStartMin > startMin) {
      const minutesUntilReservation = rStartMin - startMin;
      const hoursUntilReservation = Math.floor(minutesUntilReservation / 60);
      limitByReservation = Math.min(limitByReservation, hoursUntilReservation);
    }
  }
  
  return Math.max(1, Math.min(limitBySchedule, limitByReservation));
};

// Check if duration is valid
const isDurationValid = (startTime: string, duration: number, reservations: Reservation[]): boolean => {
  const endTime = calculateEndTime(startTime, duration);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  // Check if exceeds maximum time (23:59)
  if (endHour > MAX_HOUR || (endHour === MAX_HOUR && endMin > MAX_MINUTE)) {
    return false;
  }
  
  // Check if doesn't conflict with other reservations
  const confirmedReservations = reservations.filter(r => r.status === 'CONFIRMADA');
  return !checkTimeConflict(startTime, endTime, confirmedReservations);
};

// ============= SHARED COMPONENTS =============

const StatusBadge: React.FC<{ status: ReservationStatus }> = ({ status }) => (
  <View style={[styles.badge, { backgroundColor: STATUS_COLORS[status] }]}>
    <Text style={styles.badgeText}>{status}</Text>
  </View>
);

const AreaCard: React.FC<{
  area: CommonArea;
  selected: boolean;
  onPress: () => void;
  onInfoPress: () => void;
}> = ({ area, selected, onPress, onInfoPress }) => {
  const iconName = getIconName(area.icone);
  return (
    <TouchableOpacity
      style={[styles.areaCard, selected && styles.areaCardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.areaIconContainer}>
        <MaterialCommunityIcons 
          name={iconName as any} 
          size={28} 
          color={selected ? THEME.primary : '#64748b'} 
        />
      </View>
      
      <View style={styles.areaContent}>
        <Text style={styles.areaName} numberOfLines={2} ellipsizeMode="tail">
          {area.nome}
        </Text>

        {/* Always shows value container - now mandatory */}
        <View style={styles.valueContainer}>
          {area.valorTaxa > 0 ? (
            <>
              <MaterialCommunityIcons name="currency-brl" size={12} color={THEME.success} />
              <Text style={styles.areaValue}>{area.valorTaxa.toFixed(2)}</Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="check-circle" size={12} color={THEME.success} />
              <Text style={styles.areaValueFree}>Grátis</Text>
            </>
          )}
        </View>
      </View>

      {/* View details button fixed at bottom */}
      <TouchableOpacity
        style={styles.viewDetailsBtn}
        onPress={(e) => {
          e.stopPropagation();
          onInfoPress();
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.viewDetailsBtnText}>Ver detalhes</Text>
        <MaterialCommunityIcons name="chevron-right" size={14} color={THEME.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const getIconName = (iconName: string): string => {
  const validIcons: Record<string, string> = {
    'Salão de Festas': 'party-popper',
    'Piscina': 'swim',
    'Quadra': 'basketball',
    'Churrasqueira': 'fire',
    'Playground': 'slide',
    'Academia': 'dumbbell',
    'Sauna': 'sauna',
    'Biblioteca': 'book-open',
  };
  return validIcons[iconName] || 'home';
};

const ReservationCard: React.FC<{
  reservation: Reservation;
  onCancel: () => void;
  showResident?: boolean;
  canCancelReservation: boolean;
}> = ({ reservation, onCancel, showResident = false, canCancelReservation }) => {
  if (!reservation || !reservation.areaComum) {
    return null;
  }

  const iconName = getIconName(reservation.areaComum.icone);
  const isCancelled = reservation.status === ReservationStatus.CANCELLED;

  return (
    <View style={[
      styles.reservationCard,
      isCancelled && styles.reservationCardCancelled
    ]}>
      <View style={styles.reservationHeader}>
        <View style={styles.reservationIconContainer}>
          <MaterialCommunityIcons 
            name={iconName as any} 
            size={40} 
            color={isCancelled ? THEME.disabled : THEME.primary} 
          />
        </View>
        <View style={styles.reservationMainInfo}>
          <View style={styles.reservationTopRow}>
            <Text style={[
              styles.reservationArea,
              isCancelled && styles.reservationTextCancelled
            ]}>
              {reservation.areaComum.nome}
            </Text>
            <StatusBadge status={reservation.status} />
          </View>
          
          <View style={styles.reservationDetailsRow}>
            <MaterialCommunityIcons name="calendar" size={16} color={isCancelled ? THEME.disabled : '#666'} />
            <Text style={[
              styles.reservationDetail,
              isCancelled && styles.reservationTextCancelled
            ]}>
              {new Date(reservation.dataReserva).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
            </Text>
          </View>

          <View style={styles.reservationDetailsRow}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={isCancelled ? THEME.disabled : THEME.primary} />
            <Text style={[
              styles.reservationDetail,
              isCancelled && styles.reservationTextCancelled,
              !isCancelled && styles.reservationTimeHighlight
            ]}>
              {reservation.tipoReserva === ReservationType.HOUR
                ? `${reservation.horaInicio} - ${reservation.horaFim}`
                : TYPE_LABELS[reservation.tipoReserva]}
            </Text>
          </View>
        </View>
      </View>

      {showResident && reservation.morador && (
        <View style={styles.residentInfo}>
          <MaterialCommunityIcons name="account" size={18} color={isCancelled ? THEME.disabled : '#666'} />
          <Text style={[
            styles.residentText,
            isCancelled && styles.reservationTextCancelled
          ]}>
            {reservation.morador.nome} - Torre {reservation.morador.torre}, Unidade {reservation.morador.unidade}
          </Text>
        </View>
      )}
      
      <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
        <MaterialCommunityIcons name="close-circle" size={20} color={THEME.error} />
        <Text style={styles.cancelBtnText}>Cancelar Reserva</Text>
      </TouchableOpacity>
    </View>
  );
};

// ============= MAIN COMPONENT =============
export default function ReservationsScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  
  const [activeTab, setActiveTab] = useState('Create');
  const tabs = isAdmin ? ['Create', 'Mine', 'All'] : ['Create', 'Mine'];
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Create Tab
  const [areas, setAreas] = useState<CommonArea[]>([]);
  const [selectedArea, setSelectedArea] = useState<CommonArea | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedType, setSelectedType] = useState<ReservationType | null>(null);
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(1);
  const [availability, setAvailability] = useState<Reservation[]>([]);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(true);
  
  // My Reservations
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [loadingMine, setLoadingMine] = useState(false);
  const [refreshingMine, setRefreshingMine] = useState(false);
  
  // All Reservations
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const [areaDetailModalVisible, setAreaDetailModalVisible] = useState(false);
  const [selectedAreaForDetail, setSelectedAreaForDetail] = useState<CommonArea | null>(null);

  const filteredReservations = useMemo(() => {
    let filtered = [...allReservations];
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }
    return filtered;
  }, [allReservations, filterStatus]);

  // Calculate valid durations based on start time
  const validDurations = useMemo(() => {
    if (!startTime) return DURATIONS;
    
    const maxDuration = calculateMaxDuration(startTime, availability);
    
    return DURATIONS.filter(d => {
      if (d.value > maxDuration) return false;
      return isDurationValid(startTime, d.value, availability);
    });
  }, [startTime, availability]);

  const handleShowAreaDetail = (area: CommonArea) => {
    setSelectedAreaForDetail(area);
    setAreaDetailModalVisible(true);
  };

  // ============= EFFECTS =============
  
  // Update areas when focusing on screen
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Screen focused, reloading areas...');
      loadAreasData();
    }, [])
  );

  const loadAreasData = async () => {
    try {
      setLoadingAreas(true);
      const data = await reservationService.getCommonAreas();
      console.log('✅ Areas loaded:', data);
      setAreas(data);
      if (data.length === 0) {
        Alert.alert('Aviso', 'Nenhuma área comum ativa disponível.', [{ text: 'OK' }]);
      }
    } catch (error: any) {
      console.error('❌ Error loading areas:', error);
      Alert.alert('Erro', error.message || 'Erro ao carregar áreas.', [
        { text: 'Tentar Novamente', onPress: loadAreasData },
        { text: 'Cancelar', style: 'cancel' }
      ]);
    } finally {
      setLoadingAreas(false);
    }
  };

  useEffect(() => {
    const loadTabData = async () => {
      try {
        if (activeTab === 'Mine') {
          setLoadingMine(true);
          const data = await reservationService.getMyReservations(areas);
          setMyReservations(data);
          setLoadingMine(false);
        } else if (activeTab === 'All' && isAdmin) {
          setLoadingAll(true);
          const data = await reservationService.getAllReservations(areas);
          setAllReservations(data);
          setLoadingAll(false);
        }
      } catch (error: any) {
        console.error('❌ Error loading tab data:', error);
        Alert.alert('Erro', 'Não foi possível carregar os dados');
        setLoadingMine(false);
        setLoadingAll(false);
      } finally {
        setRefreshingMine(false);
        setRefreshingAll(false);
      }
    };
    
    // Only load if areas are available
    if (areas.length > 0) {
      loadTabData();
    }
  }, [activeTab, refreshKey, isAdmin, areas]);

  // Reset duration when start time changes
  useEffect(() => {
    if (startTime && validDurations.length > 0) {
      // If current duration is not valid, select first valid one
      if (!validDurations.find(d => d.value === duration)) {
        setDuration(validDurations[0].value);
      }
    }
  }, [startTime, validDurations]);

  // ============= HANDLERS =============
  
  const handleSelectArea = (area: CommonArea) => {
    setSelectedArea(area);
    setSelectedDate('');
    setSelectedType(null);
    setAvailability([]);
  };

  const handleSelectDate = useCallback(async (date: string) => {
    setSelectedDate(date);
    setSelectedType(null);
    setStartTime('');
    setDuration(1);
    if (selectedArea) {
      try {
        const reservations = await reservationService.getAvailability(selectedArea.id, date);
        setAvailability(reservations);
      } catch (error) {
        console.error('Error:', error);
        setAvailability([]);
      }
    }
  }, [selectedArea]);

  const isPeriodAvailable = (type: ReservationType): boolean => {
    const confirmedReservations = availability.filter(r => r.status === 'CONFIRMADA');

    // RULE 1: If "FULL_DAY" is already reserved, NOTHING ELSE (including "FULL_DAY") is available
    const fullDayReserved = confirmedReservations.some(
      r => r.tipoReserva === ReservationType.FULL_DAY
    );
    if (fullDayReserved) {
      return false; // Blocks HOUR, MORNING, AFTERNOON, EVENING and FULL_DAY itself
    }

    // RULE 2: If we're trying to select "FULL_DAY",
    // it's only available if there are NO other reservations (of any type)
    if (type === ReservationType.FULL_DAY) {
      return confirmedReservations.length === 0;
    }

    // RULE 3: If we're trying to select a fixed period (MORNING, AFTERNOON, EVENING),
    // it's unavailable if there's ANY conflict (either HOUR, or the period itself)
    if (
      type === ReservationType.MORNING ||
      type === ReservationType.AFTERNOON ||
      type === ReservationType.EVENING
    ) {
      const { inicio, fim } = FIXED_SCHEDULES[type];
      // The 'checkTimeConflict' function checks if the period (e.g.: 06:00-12:00)
      // conflicts with ANY existing reservation in the 'confirmedReservations' list
      if (checkTimeConflict(inicio, fim, confirmedReservations)) {
        return false; // There's conflict, period is not available
      }
    }

    // RULE 4: If we're trying to select "HOUR"
    // "HOUR" selection is blocked if all fixed periods are already taken
    if (type === ReservationType.HOUR) {
      const morningReserved = checkTimeConflict(
        FIXED_SCHEDULES.MANHA.inicio,
        FIXED_SCHEDULES.MANHA.fim,
        confirmedReservations
      );
      const afternoonReserved = checkTimeConflict(
        FIXED_SCHEDULES.TARDE.inicio,
        FIXED_SCHEDULES.TARDE.fim,
        confirmedReservations
      );
      const eveningReserved = checkTimeConflict(
        FIXED_SCHEDULES.NOITE.inicio,
        FIXED_SCHEDULES.NOITE.fim,
        confirmedReservations
      );
      
      // If all 3 fixed periods are unavailable, there's no space for HOUR
      if (morningReserved && afternoonReserved && eveningReserved) {
        return false;
      }
    }

    // If passed all blocking rules, the period is available
    return true;
  };

  const handleCreateReservation = async () => {
    if (!selectedArea || !selectedDate || !selectedType) {
      Alert.alert('Atenção', 'Preencha todos os campos');
      return;
    }
    if (selectedType === ReservationType.HOUR && !startTime) {
      Alert.alert('Atenção', 'Selecione o horário de início');
      return;
    }
    try {
      setLoadingCreate(true);
      const payload: any = {
        areaComumId: selectedArea.id,
        dataReserva: selectedDate,
        tipoReserva: selectedType,
      };
      if (selectedType === ReservationType.HOUR) {
        payload.horaInicio = startTime;
        payload.horaFim = calculateEndTime(startTime, duration);
        
        // Check if exceeds maximum time
        const [endHour, endMin] = payload.horaFim.split(':').map(Number);
        if (endHour > MAX_HOUR || (endHour === MAX_HOUR && endMin > MAX_MINUTE)) {
          Alert.alert('Horário Inválido', 'A reserva não pode ultrapassar às 23:59');
          setLoadingCreate(false);
          return;
        }
        
        if (checkTimeConflict(payload.horaInicio, payload.horaFim, availability)) {
          Alert.alert('Conflito', 'Este horário já está reservado');
          setLoadingCreate(false);
          return;
        }
      }
      await reservationService.createReservation(payload);
      Alert.alert('Sucesso!', 'Reserva criada com sucesso', [
        {
          text: 'OK',
          onPress: () => {
            setSelectedArea(null);
            setSelectedDate('');
            setSelectedType(null);
            setStartTime('');
            setDuration(1);
            setRefreshKey(prev => prev + 1);
            // Reload areas to update list
            loadAreasData();
          }
        }
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível criar a reserva');
    } finally {
      setLoadingCreate(false);
    }
  };

  const handleCancelMine = async (reservation: Reservation) => {
    const verification = canCancel(reservation, user?.role || 'USER', user?.id || '');
    
    if (!verification.canCancel) {
      Alert.alert('Não é possível cancelar', verification.reason || 'Não foi possível cancelar esta reserva');
      return;
    }
    
    const hasFee = reservation.areaComum.valorTaxa > 0;
    const refundMessage = hasFee 
      ? `\n\nValor pago: R$ ${reservation.areaComum.valorTaxa.toFixed(2)}\nVocê será reembolsado em até 7 dias úteis.` 
      : '';
    
    Alert.alert(
      'Cancelar Reserva', 
      `Tem certeza que deseja cancelar esta reserva?${refundMessage}`, 
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, Cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await reservationService.cancelReservation(reservation.id);
              Alert.alert('Sucesso', hasFee ? 'Reserva cancelada! O reembolso será processado em até 7 dias úteis.' : 'Reserva cancelada com sucesso!');
              setRefreshKey(prev => prev + 1);
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Não foi possível cancelar');
            }
          }
        }
      ]
    );
  };

  const handleCancelAll = async (reservation: Reservation) => {
    const verification = canCancel(reservation, user?.role || 'ADMIN', user?.id || '');
    
    const hasFee = reservation.areaComum.valorTaxa > 0;
    let message = `Cancelar reserva de ${reservation.morador.nome}?`;
    
    if (verification.reason === 'ADMIN_OUT_OF_DEADLINE') {
      message += '\n\nATENÇÃO: Esta reserva está dentro do prazo de 48 horas!';
    }
    
    if (hasFee) {
      message += `\n\nValor: R$ ${reservation.areaComum.valorTaxa.toFixed(2)}\nO morador será reembolsado.`;
    }
    
    Alert.alert('Cancelar Reserva', message, [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim, Cancelar',
        style: 'destructive',
        onPress: async () => {
          try {
            await reservationService.cancelReservation(reservation.id);
            Alert.alert('Sucesso', 'Reserva cancelada');
            setRefreshKey(prev => prev + 1);
          } catch (error: any) {
            Alert.alert('Erro', error.message || 'Não foi possível cancelar');
          }
        }
      }
    ]);
  };

  // ============= RENDER TAB CONTENT =============
  
  const renderCreateTab = () => {
    const today = new Date().toISOString().split('T')[0];
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    const maxDateStr = maxDate.toISOString().split('T')[0];

    if (loadingAreas) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text style={styles.loadingText}>Carregando áreas...</Text>
        </View>
      );
    }

    if (areas.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="alert-circle" size={80} color={THEME.disabled} />
          <Text style={styles.emptyStateTitle}>Sem áreas disponíveis</Text>
          <Text style={styles.emptyStateText}>Nenhuma área comum ativa</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.titleContainer}> 
            <Text style={styles.sectionTitle}>1. Selecione a Área</Text>
            
            <TouchableOpacity 
              style={styles.infoButton}
              onPress={() => {
                Alert.alert(
                  'Informação', 
                  'Para ver todas as informações referentes à área comum, clique em "Ver detalhes" no card da área.'
                );
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons 
                name="information-outline" 
                size={20} 
                color={THEME.primary}
              />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {areas.map(area => (
              <AreaCard
                key={area.id}
                area={area}
                selected={selectedArea?.id === area.id}
                onPress={() => handleSelectArea(area)}
                onInfoPress={() => handleShowAreaDetail(area)}
              />
            ))}
          </ScrollView>
        </View>

        {selectedArea && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Escolha a Data</Text>
            <Calendar
              onDayPress={(day) => handleSelectDate(day.dateString)}
              markedDates={{
                [selectedDate]: { selected: true, selectedColor: THEME.primary }
              }}
              minDate={today}
              maxDate={maxDateStr}
              theme={{
                selectedDayBackgroundColor: THEME.primary,
                todayTextColor: THEME.primary,
                arrowColor: THEME.primary,
              }}
            />
          </View>
        )}

        {selectedArea && selectedDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Selecione o Período</Text>
            <View style={styles.typesGrid}>
              {selectedArea.tiposReservaDisponiveis.map(type => {
                const available = isPeriodAvailable(type);
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeChip,
                      selectedType === type && styles.typeChipSelected,
                      !available && styles.typeChipDisabled
                    ]}
                    onPress={() => available && setSelectedType(type)}
                    disabled={!available}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        selectedType === type && styles.typeChipTextSelected,
                        !available && styles.typeChipTextDisabled
                      ]}
                    >
                      {TYPE_LABELS[type]}
                    </Text>
                    {!available && <Text style={styles.unavailableText}>Indisponível</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {selectedType === ReservationType.HOUR && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Horário e Duração</Text>
            <Text style={styles.label}>Horário de Início</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
              {START_HOURS.map(hour => {
                const available = isHourAvailable(hour, availability);
                return (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      styles.timeChip, 
                      startTime === hour && styles.timeChipSelected,
                      !available && styles.timeChipDisabled
                    ]}
                    onPress={() => available && setStartTime(hour)}
                    disabled={!available}
                  >
                    <Text style={[
                      styles.timeChipText, 
                      startTime === hour && styles.timeChipTextSelected,
                      !available && styles.timeChipTextDisabled
                    ]}>
                      {hour}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            {startTime && (
              <>
                <Text style={styles.label}>Duração</Text>
                {validDurations.length === 0 ? (
                  <Text style={styles.warningText}>Nenhuma duração disponível para este horário</Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                    {validDurations.map(d => (
                      <TouchableOpacity
                        key={d.value}
                        style={[styles.timeChip, duration === d.value && styles.timeChipSelected]}
                        onPress={() => setDuration(d.value)}
                      >
                        <Text style={[styles.timeChipText, duration === d.value && styles.timeChipTextSelected]}>
                          {d.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </>
            )}
          </View>
        )}

        {selectedArea && selectedDate && selectedType && (selectedType !== ReservationType.HOUR || (startTime && validDurations.length > 0)) && (
          <View style={styles.section}>
            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>Resumo da Reserva</Text>

              <View style={styles.summaryItemContainer}>
                <MaterialCommunityIcons name="map-marker-outline" size={18} color={THEME.primary} />
                <Text style={styles.summaryItem}>{selectedArea.nome}</Text>
              </View>

              <View style={styles.summaryItemContainer}>
                <MaterialCommunityIcons name="calendar-today" size={18} color={THEME.primary} />
                <Text style={styles.summaryItem}>
                  {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('pt-BR')}
                </Text>
              </View>

              <View style={styles.summaryItemContainer}>
                <MaterialCommunityIcons name="clock-outline" size={18} color={THEME.primary} />
                <Text style={styles.summaryItem}>
                  {selectedType === ReservationType.HOUR && startTime
                    ? `${startTime} - ${calculateEndTime(startTime, duration)}`
                    : TYPE_LABELS[selectedType]}
                </Text>
              </View>

              {selectedArea.valorTaxa > 0 && (
                <View style={styles.summaryItemContainer}>
                  <MaterialCommunityIcons name="currency-brl" size={18} color={THEME.primary} />
                  <Text style={styles.summaryItem}>R$ {selectedArea.valorTaxa.toFixed(2)}</Text>
                </View>
              )}

              {selectedArea.valorTaxa > 0 && (
                <View style={styles.warningContainer}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={20} color={THEME.warning} />
                  <Text style={styles.warningText}>
                    Cancelamentos só são permitidos com 48 horas de antecedência.{'\n'}Reembolso em até 7 dias úteis.
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={[styles.confirmBtn, loadingCreate && styles.confirmBtnDisabled]}
              onPress={handleCreateReservation}
              disabled={loadingCreate}
            >
              {loadingCreate ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmBtnText}>Confirmar Reserva</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderMineTab = () => {
    if (loadingMine) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text style={styles.loadingText}>Carregando reservas...</Text>
        </View>
      );
    }
    if (myReservations.length === 0) {
      return (
        <ScrollView
          style={styles.tabContent}
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshingMine}
              onRefresh={() => {
                setRefreshingMine(true);
                setRefreshKey(prev => prev + 1);
              }}
              tintColor={THEME.primary}
            />
          }
        >
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <MaterialCommunityIcons name="calendar-blank" size={72} color={THEME.primary} />
            </View>
            <Text style={styles.emptyStateTitle}>Nenhuma reserva</Text>
            <Text style={styles.emptyStateText}>Você ainda não possui reservas futuras.{'\n'}Crie uma nova reserva na aba "Criar"</Text>
          </View>
        </ScrollView>
      );
    }
    return (
      <ScrollView
        style={styles.tabContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshingMine}
            onRefresh={() => {
              setRefreshingMine(true);
              setRefreshKey(prev => prev + 1);
            }}
            tintColor={THEME.primary}
          />
        }
      >
        {myReservations.map(reservation => (
          <ReservationCard
            key={reservation.id}
            reservation={reservation}
            onCancel={() => handleCancelMine(reservation)}
            canCancelReservation={canCancel(reservation, user?.role || 'USER', user?.id || '').canCancel}
          />
        ))}
      </ScrollView>
    );
  };

  const renderAllTab = () => {
    if (loadingAll) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text style={styles.loadingText}>Carregando todas as reservas...</Text>
        </View>
      );
    }
    return (
      <View style={styles.tabContent}>
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['ALL', 'PENDENTE', 'CONFIRMADA', 'CANCELADA'].map(status => (
              <TouchableOpacity
                key={status}
                style={[styles.filterChip, filterStatus === status && styles.filterChipSelected]}
                onPress={() => setFilterStatus(status)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filterStatus === status && styles.filterChipTextSelected
                  ]}
                >
                  {status === 'ALL' ? 'Todas' : status.charAt(0) + status.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 10 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshingAll}
              onRefresh={() => {
                setRefreshingAll(true);
                setRefreshKey(prev => prev + 1);
              }}
              tintColor={THEME.primary}
            />
          }
        >
          {filteredReservations.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <MaterialCommunityIcons name="filter-off" size={72} color={THEME.primary} />
              </View>
              <Text style={styles.emptyStateTitle}>Nenhuma reserva encontrada</Text>
              <Text style={styles.emptyStateText}>
                {filterStatus === 'ALL' 
                  ? 'Não há reservas cadastradas no sistema' 
                  : `Não há reservas com status "${filterStatus}"`}
              </Text>
            </View>
          ) : (
            filteredReservations.map(reservation => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                onCancel={() => handleCancelAll(reservation)}
                showResident
                canCancelReservation={isAdmin}
              />
            ))
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Reservas</Text>
          <Text style={styles.headerSubtitle}>Gerencie reservas de áreas comuns</Text>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={
                  tab === 'Create'
                    ? 'plus-circle'
                    : tab === 'Mine'
                    ? 'calendar-account'
                    : 'calendar-multiple'
                }
                size={20}
                color={activeTab === tab ? THEME.primary : '#666'}
              />
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab === 'Create' ? 'Criar' : tab === 'Mine' ? 'Minhas' : 'Todas'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {activeTab === 'Create' && renderCreateTab()}
      {activeTab === 'Mine' && renderMineTab()}
      {activeTab === 'All' && isAdmin && renderAllTab()}
      
      <AreaDetailModal
        visible={areaDetailModalVisible}
        onClose={() => {
          setAreaDetailModalVisible(false);
          setSelectedAreaForDetail(null);
        }}
        area={selectedAreaForDetail}
        mode="view"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  infoButton: {
    marginTop: 4
  },
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: THEME.text.primary,
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: THEME.text.tertiary,
    fontWeight: '500',
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingTop: 12,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    marginBottom: -1,
  },
  activeTab: {
    backgroundColor: '#eff6ff',
    borderBottomWidth: 3,
    borderBottomColor: THEME.primary,
    marginBottom: -1,
  },
  tabText: {
    color: THEME.text.tertiary,
    fontWeight: '600',
    fontSize: 14,
  },
  activeTabText: {
    color: '#2563eb',
    fontWeight: '700',
  },
  tabContent: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.background,
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: THEME.text.tertiary,
    fontWeight: '500',
  },
  section: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  titleContainer: { 
    flexDirection: 'row',     
    alignItems: 'center',    
    gap: 6,                 
    marginBottom: 12,        
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.text.primary,
    letterSpacing: -0.3,
  },
  areaCard: {
    width: 160,
    height: 160,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginRight: 12,
    borderWidth: 2,
    borderColor: THEME.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  areaCardSelected: {
    borderColor: THEME.primary,
    backgroundColor: '#eff6ff', 
    shadowColor: THEME.primary, 
    shadowOpacity: 0.20,
    shadowRadius: 10,
    elevation: 6,
  },
  areaIconContainer: {
    width: '100%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaContent: {
    flex: 1, 
    padding: 10, 
  },
  areaName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.text.primary,
    textAlign: 'center',
    lineHeight: 17,
    letterSpacing: -0.2,
    height: 34, 
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 16, 
    alignSelf: 'center',
    height: 24, 
    minWidth: 60,
    marginBottom: 2,
  },
  areaValue: {
    fontSize: 11,
    color: THEME.success,
    fontWeight: '800',
  },
  areaValueFree: {
    fontSize: 11,
    color: THEME.success,
    fontWeight: '800',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10, 
    paddingHorizontal: 8,
    gap: 4,
    backgroundColor: '#f8fafc', 
  },
  viewDetailsBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeChip: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: THEME.border,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  typeChipSelected: {
    borderColor: THEME.primary,
    backgroundColor: '#eff6ff',
  },
  typeChipDisabled: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    opacity: 0.6,
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.text.primary,
  },
  typeChipTextSelected: {
    color: THEME.primary,
    fontWeight: '700',
  },
  typeChipTextDisabled: {
    color: THEME.disabled,
  },
  unavailableText: {
    fontSize: 10,
    color: THEME.error,
    marginTop: 4,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.text.secondary,
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  timeScroll: {
    marginBottom: 8,
  },
  timeChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: THEME.border,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  timeChipSelected: {
    borderColor: THEME.primary,
    backgroundColor: '#eff6ff',
  },
  timeChipDisabled: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    opacity: 0.5,
  },
  timeChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.text.primary,
  },
  timeChipTextSelected: {
    color: THEME.primary,
    fontWeight: '700',
  },
  timeChipTextDisabled: {
    color: THEME.disabled,
  },
  summary: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.text.primary,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  summaryItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryItem: {
    fontSize: 14,
    color: THEME.text.secondary,
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  confirmBtn: {
    backgroundColor: THEME.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmBtnDisabled: {
    backgroundColor: THEME.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  reservationCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  reservationCardCancelled: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    opacity: 0.75,
  },
  reservationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 16,
  },
  reservationIconContainer: {
    backgroundColor: '#eff6ff',
    padding: 14,
    borderRadius: 16,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  reservationMainInfo: {
    flex: 1,
    gap: 8,
  },
  reservationTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reservationArea: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.text.primary,
    flex: 1,
    marginRight: 12,
    letterSpacing: -0.5,
    lineHeight: 24,
  },
  reservationTextCancelled: {
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  reservationDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 8,
  },
  reservationDetail: {
    fontSize: 14,
    color: THEME.text.secondary,
    fontWeight: '600',
    flex: 1,
  },
  reservationTimeHighlight: {
    color: THEME.primary,
    fontWeight: '800',
    fontSize: 15,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  residentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 10,
  },
  residentText: {
    fontSize: 14,
    color: THEME.text.secondary,
    flex: 1,
    fontWeight: '700',
    lineHeight: 20,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#fecaca',
    gap: 8,
  },
  cancelBtnText: {
    color: THEME.error,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.text.primary,
    marginTop: 20,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: THEME.text.tertiary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '600',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  filterChipSelected: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
    shadowColor: THEME.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  filterChipTextSelected: {
    color: '#fff',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: THEME.warning,
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400e',
    fontWeight: '600',
    lineHeight: 18,
  },
});