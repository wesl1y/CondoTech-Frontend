import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, Pressable } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import AreaDetailModal from '@/components/manage-areas/modals/AreaDetailModal';


// Configuração do calendário para português
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
enum TipoReserva {
  HORA = "HORA",
  MANHA = "MANHA",
  TARDE = "TARDE",
  NOITE = "NOITE",
  DIA_TODO = "DIA_TODO"
}

enum StatusReserva {
  PENDENTE = "PENDENTE",
  CONFIRMADA = "CONFIRMADA",
  CANCELADA = "CANCELADA",
  FINALIZADA = "FINALIZADA"
}

interface AreaComum {
  id: number;
  nome: string;
  descricao: string;
  icone: string;
  ativa: boolean;
  valorTaxa: number;
  tiposReservaDisponiveis: TipoReserva[];
}

interface Reserva {
  id: number;
  areaComum: AreaComum;
  dataReserva: string;
  tipoReserva: TipoReserva;
  horaInicio?: string;
  horaFim?: string;
  status: StatusReserva;
  morador: {
    id: number;
    nome: string;
    unidade: string;
    torre: string;
  };
}

// Tipo do backend
interface ReservaBackend {
  id: number;
  areaComumId: number;
  areaComumNome: string;
  dataReserva: string;
  tipoReserva: TipoReserva;
  horaInicio?: string;
  horaFim?: string;
  status: StatusReserva;
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

const HORARIOS_FIXOS = {
  MANHA: { inicio: '06:00', fim: '12:00' },
  TARDE: { inicio: '12:01', fim: '18:00' },
  NOITE: { inicio: '18:01', fim: '23:59' },
  DIA_TODO: { inicio: '06:00', fim: '23:59' }
};

const HORA_MINIMA = 6; // 06:00
const HORA_MAXIMA = 23; // 23:00
const MINUTO_MAXIMO = 59; // 23:59

const HORAS_INICIO = Array.from({ length: 17 }, (_, i) => {
  const hora = i + 6;
  return `${hora.toString().padStart(2, '0')}:00`;
});

const DURACOES = Array.from({ length: 17 }, (_, i) => ({
  label: `${i + 1} hora${i > 0 ? 's' : ''}`,
  value: i + 1
}));

const TIPO_LABELS: Record<TipoReserva, string> = {
  HORA: 'Por Hora',
  MANHA: 'Manhã',
  TARDE: 'Tarde',
  NOITE: 'Noite',
  DIA_TODO: 'Dia Todo'
};

// ============= ADAPTERS =============
const adaptarReservaBackend = (reservaBackend: ReservaBackend, areas: AreaComum[]): Reserva => {
  // Extrai torre e unidade do nome do morador se existirem
  let unidade = reservaBackend.moradorUnidade || 'N/A';
  let torre = reservaBackend.moradorTorre || 'N/A';
  let nomeMorador = reservaBackend.moradorNome;

  // Tenta extrair torre e unidade do nome se não vieram separados
  const matchTorre = nomeMorador.match(/Torre\s+(\w+)/i);
  const matchUnidade = nomeMorador.match(/Unidade\s+(\w+)/i);
  
  if (matchTorre) torre = matchTorre[1];
  if (matchUnidade) unidade = matchUnidade[1];

  // Remove informações extras do nome
  nomeMorador = nomeMorador.replace(/\s*\([^)]*\)\s*/g, '').trim();

  // Busca a área completa ou cria uma área mínima
  const areaComum = areas.find(a => a.id === reservaBackend.areaComumId) || {
    id: reservaBackend.areaComumId,
    nome: reservaBackend.areaComumNome,
    descricao: '',
    icone: 'home',
    ativa: true,
    valorTaxa: 0,
    tiposReservaDisponiveis: []
  };

  return {
    id: reservaBackend.id,
    areaComum,
    dataReserva: reservaBackend.dataReserva,
    tipoReserva: reservaBackend.tipoReserva,
    horaInicio: reservaBackend.horaInicio,
    horaFim: reservaBackend.horaFim,
    status: reservaBackend.status,
    morador: {
      id: reservaBackend.moradorId,
      nome: nomeMorador,
      unidade,
      torre
    }
  };
};
// ============= SERVICE LAYER =============
const reservaService = {
  getAreasComuns: async (): Promise<AreaComum[]> => {
    try {
      const areas = await api.get('/reservas/areas');
      if (!Array.isArray(areas)) return [];
      return areas.filter((a: AreaComum) => a?.ativa === true);
    } catch (error) {
      console.error('Erro ao buscar áreas:', error);
      throw error;
    }
  },

  getDisponibilidade: async (areaId: number, data: string): Promise<Reserva[]> => {
    try {
      
    const result = await api.get(`/reservas/areas/${areaId}/disponibilidade?data=${data}`);

      return result || [];
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      return [];
    }
  },

  getMinhasReservas: async (areas: AreaComum[]): Promise<Reserva[]> => {
    try {
      console.log('📥 Carregando minhas reservas...');
      const result = await api.get('/reservas/minhas/futuras');
      console.log('✅ Minhas reservas (backend):', result);
      
      if (!Array.isArray(result)) return [];
      
      const adaptadas = result.map((r: ReservaBackend) => adaptarReservaBackend(r, areas));
      console.log('🔄 Reservas adaptadas:', adaptadas);
      
      return adaptadas;
    } catch (error) {
      console.error('❌ Erro ao buscar minhas reservas:', error);
      throw error;
    }
  },

  getTodasReservas: async (areas: AreaComum[]): Promise<Reserva[]> => {
    try {
      console.log('📥 Carregando todas as reservas...');
      // Corrigido: endpoint direto sem parâmetros errados
      const result = await api.get('/reservas/todas');
      console.log('✅ Todas reservas (backend):', result);
      
      if (!Array.isArray(result)) return [];
      
      const adaptadas = result.map((r: ReservaBackend) => adaptarReservaBackend(r, areas));
      console.log('🔄 Todas reservas adaptadas:', adaptadas);
      
      return adaptadas;
    } catch (error) {
      console.error('❌ Erro ao buscar todas as reservas:', error);
      throw error;
    }
  },

  criarReserva: async (data: any): Promise<Reserva> => {
    try {
      const result = await api.post('/reservas', data);
      return result;
    } catch (error) {
      console.error('Erro ao criar reserva:', error);
      throw error;
    }
  },

  cancelarReserva: async (id: number): Promise<void> => {
    try {
      await api.delete(`/reservas/${id}`);
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
      throw error;
    }
  }
};

// ============= UTILITY FUNCTIONS =============
const podeCancelar = (reserva: Reserva, userRole: string, userId: string): boolean => {
  if (userRole === 'ADMIN') return true;
  if (reserva.status === 'CANCELADA') return false;
  const dataReserva = new Date(reserva.dataReserva);
  const hoje = new Date();
  const diffHoras = (dataReserva.getTime() - hoje.getTime()) / (1000 * 60 * 60);
  return diffHoras > 48 && reserva.morador.id.toString() === userId;
};

const calcularHoraFim = (horaInicio: string, duracao: number): string => {
  const [hora, minuto] = horaInicio.split(':').map(Number);
  const horaFim = hora + duracao;
  return `${horaFim.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
};

const verificarConflitoHorario = (novoInicio: string, novoFim: string, reservas: Reserva[]): boolean => {
  const [nInicioH, nInicioM] = novoInicio.split(':').map(Number);
  const [nFimH, nFimM] = novoFim.split(':').map(Number);
  const novoInicioMin = nInicioH * 60 + nInicioM;
  const novoFimMin = nFimH * 60 + nFimM;

  return reservas.some(r => {
    if (r.status !== 'CONFIRMADA') return false;
    const inicio = r.horaInicio || HORARIOS_FIXOS[r.tipoReserva as keyof typeof HORARIOS_FIXOS]?.inicio;
    const fim = r.horaFim || HORARIOS_FIXOS[r.tipoReserva as keyof typeof HORARIOS_FIXOS]?.fim;
    if (!inicio || !fim) return false;
    const [rInicioH, rInicioM] = inicio.split(':').map(Number);
    const [rFimH, rFimM] = fim.split(':').map(Number);
    const rInicioMin = rInicioH * 60 + rInicioM;
    const rFimMin = rFimH * 60 + rFimM;
    return !(novoFimMin <= rInicioMin || novoInicioMin >= rFimMin);
  });
};
// Verifica se uma hora específica está disponível como INÍCIO de reserva
const isHoraDisponivel = (hora: string, reservas: Reserva[]): boolean => {
  const [h, m] = hora.split(':').map(Number);
  const horarioMin = h * 60 + m;
  
  // Filtra apenas reservas confirmadas
  const reservasConfirmadas = reservas.filter(r => r.status === 'CONFIRMADA');
  
  return !reservasConfirmadas.some(r => {
    const inicio = r.horaInicio || HORARIOS_FIXOS[r.tipoReserva as keyof typeof HORARIOS_FIXOS]?.inicio;
    const fim = r.horaFim || HORARIOS_FIXOS[r.tipoReserva as keyof typeof HORARIOS_FIXOS]?.fim;
    
    if (!inicio || !fim) return false;
    
    const [rInicioH, rInicioM] = inicio.split(':').map(Number);
    const [rFimH, rFimM] = fim.split(':').map(Number);
    const rInicioMin = rInicioH * 60 + rInicioM;
    const rFimMin = rFimH * 60 + rFimM;
    
    // O horário está indisponível se estiver DENTRO de uma reserva existente
    return horarioMin >= rInicioMin && horarioMin < rFimMin;
  });
};

// Calcula a duração máxima permitida considerando horário de funcionamento E próximas reservas
const calcularDuracaoMaxima = (horaInicio: string, reservas: Reserva[]): number => {
  const [horaInicioH] = horaInicio.split(':').map(Number);
  
  // Limite 1: Horário de funcionamento (até 23:00)
  const limitePorHorario = HORA_MAXIMA - horaInicioH;
  
  // Filtra apenas reservas confirmadas
  const reservasConfirmadas = reservas.filter(r => r.status === 'CONFIRMADA');
  
  // Se não há reservas, o limite é apenas o horário
  if (reservasConfirmadas.length === 0) {
    return Math.max(1, limitePorHorario);
  }
  
  // Limite 2: Próxima reserva
  let limitePorReserva = limitePorHorario;
  const inicioMin = horaInicioH * 60;
  
  for (const r of reservasConfirmadas) {
    const inicio = r.horaInicio || HORARIOS_FIXOS[r.tipoReserva as keyof typeof HORARIOS_FIXOS]?.inicio;
    
    if (!inicio) continue;
    
    const [rInicioH, rInicioM] = inicio.split(':').map(Number);
    const rInicioMin = rInicioH * 60 + rInicioM;
    
    // Se a reserva começa DEPOIS do horário desejado
    if (rInicioMin > inicioMin) {
      const minutosAteReserva = rInicioMin - inicioMin;
      const horasAteReserva = Math.floor(minutosAteReserva / 60);
      limitePorReserva = Math.min(limitePorReserva, horasAteReserva);
    }
  }
  
  return Math.max(1, Math.min(limitePorHorario, limitePorReserva));
};

// Verifica se a duração é válida
const isDuracaoValida = (horaInicio: string, duracao: number, reservas: Reserva[]): boolean => {
  const horaFim = calcularHoraFim(horaInicio, duracao);
  const [horaFimH, horaFimM] = horaFim.split(':').map(Number);
  
  // Verifica se ultrapassa o horário máximo (23:59)
  if (horaFimH > HORA_MAXIMA || (horaFimH === HORA_MAXIMA && horaFimM > MINUTO_MAXIMO)) {
    return false;
  }
  
  // Verifica se não conflita com outras reservas
  const reservasConfirmadas = reservas.filter(r => r.status === 'CONFIRMADA');
  return !verificarConflitoHorario(horaInicio, horaFim, reservasConfirmadas);
};
// ============= SHARED COMPONENTS =============

const StatusBadge: React.FC<{ status: StatusReserva }> = ({ status }) => (
  <View style={[styles.badge, { backgroundColor: STATUS_COLORS[status] }]}>
    <Text style={styles.badgeText}>{status}</Text>
  </View>
);

const AreaCard: React.FC<{
area: AreaComum;
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
        <Text style={styles.areaNome} numberOfLines={2} ellipsizeMode="tail">
          {area.nome}
        </Text>

        {/* Sempre mostra o container de valor - agora é obrigatório */}
        <View style={styles.valorContainer}>
          {area.valorTaxa > 0 ? (
            <>
              <MaterialCommunityIcons name="currency-brl" size={12} color={THEME.success} />
              <Text style={styles.areaValor}>{area.valorTaxa.toFixed(2)}</Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="check-circle" size={12} color={THEME.success} />
              <Text style={styles.areaValorGratis}>Grátis</Text>
            </>
          )}
        </View>

        <View style={styles.tiposContainer}>
          {area.tiposReservaDisponiveis.slice(0, 2).map(tipo => (
            <View key={tipo} style={styles.tipoTag}>
              <Text style={styles.tipoTagText}>{TIPO_LABELS[tipo]}</Text>
            </View>
          ))}
          {area.tiposReservaDisponiveis.length > 2 && (
            <View style={styles.tipoTag}>
              <Text style={styles.tipoTagText}>+{area.tiposReservaDisponiveis.length - 2}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Botão Ver detalhes fixo no bottom */}
      <TouchableOpacity
        style={styles.verDetalhesBtn}
        onPress={(e) => {
          e.stopPropagation();
          onInfoPress();
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.verDetalhesBtnText}>Ver detalhes</Text>
        <MaterialCommunityIcons name="chevron-right" size={14} color={THEME.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const getIconName = (iconeName: string): string => {
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
  return validIcons[iconeName] || 'home';
};

const ReservaCard: React.FC<{
  reserva: Reserva;
  onCancelar: () => void;
  showMorador?: boolean;
  canCancel: boolean;
}> = ({ reserva, onCancelar, showMorador = false, canCancel }) => {
  if (!reserva || !reserva.areaComum) {
    return null;
  }

  const iconName = getIconName(reserva.areaComum.icone);
  const isCancelada = reserva.status === StatusReserva.CANCELADA;
  const showCancelButton = canCancel && !isCancelada;

  return (
    <View style={[
      styles.reservaCard,
      isCancelada && styles.reservaCardCancelada
    ]}>
      <View style={styles.reservaHeader}>
        <View style={styles.reservaIconContainer}>
          <MaterialCommunityIcons 
            name={iconName as any} 
            size={40} 
            color={isCancelada ? THEME.disabled : THEME.primary} 
          />
        </View>
        <View style={styles.reservaMainInfo}>
          <View style={styles.reservaTopRow}>
            <Text style={[
              styles.reservaArea,
              isCancelada && styles.reservaTextCancelada
            ]}>
              {reserva.areaComum.nome}
            </Text>
            <StatusBadge status={reserva.status} />
          </View>
          
          <View style={styles.reservaDetailsRow}>
            <MaterialCommunityIcons name="calendar" size={16} color={isCancelada ? THEME.disabled : '#666'} />
            <Text style={[
              styles.reservaDetail,
              isCancelada && styles.reservaTextCancelada
            ]}>
              {new Date(reserva.dataReserva).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
            </Text>
          </View>

          <View style={styles.reservaDetailsRow}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={isCancelada ? THEME.disabled : THEME.primary} />
            <Text style={[
              styles.reservaDetail,
              isCancelada && styles.reservaTextCancelada,
              !isCancelada && styles.reservaHorarioDestaque
            ]}>
              {reserva.tipoReserva === TipoReserva.HORA
                ? `${reserva.horaInicio} - ${reserva.horaFim}`
                : TIPO_LABELS[reserva.tipoReserva]}
            </Text>
          </View>
        </View>
      </View>

      {showMorador && reserva.morador && (
        <View style={styles.moradorInfo}>
          <MaterialCommunityIcons name="account" size={18} color={isCancelada ? THEME.disabled : '#666'} />
          <Text style={[
            styles.moradorText,
            isCancelada && styles.reservaTextCancelada
          ]}>
            {reserva.morador.nome} - Torre {reserva.morador.torre}, Unidade {reserva.morador.unidade}
          </Text>
        </View>
      )}

      {showCancelButton && (
        <TouchableOpacity style={styles.cancelarBtn} onPress={onCancelar}>
          <MaterialCommunityIcons name="close-circle" size={20} color={THEME.error} />
          <Text style={styles.cancelarBtnText}>Cancelar Reserva</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ============= MAIN COMPONENT =============
export default function ReservasScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  
  const [activeTab, setActiveTab] = useState('Criar');
  const tabs = isAdmin ? ['Criar', 'Minhas', 'Todas'] : ['Criar', 'Minhas'];
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Criar Tab
  const [areas, setAreas] = useState<AreaComum[]>([]);
  const [selectedArea, setSelectedArea] = useState<AreaComum | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTipo, setSelectedTipo] = useState<TipoReserva | null>(null);
  const [horaInicio, setHoraInicio] = useState('');
  const [duracao, setDuracao] = useState(1);
  const [disponibilidade, setDisponibilidade] = useState<Reserva[]>([]);
  const [loadingCriar, setLoadingCriar] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(true);
  
  // Minhas Reservas
  const [minhasReservas, setMinhasReservas] = useState<Reserva[]>([]);
  const [loadingMinhas, setLoadingMinhas] = useState(false);
  const [refreshingMinhas, setRefreshingMinhas] = useState(false);
  
  // Todas Reservas
  const [todasReservas, setTodasReservas] = useState<Reserva[]>([]);
  const [loadingTodas, setLoadingTodas] = useState(false);
  const [refreshingTodas, setRefreshingTodas] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('TODAS');

  const [areaDetailModalVisible, setAreaDetailModalVisible] = useState(false);
  const [selectedAreaForDetail, setSelectedAreaForDetail] = useState<AreaComum | null>(null);

  const filteredReservas = useMemo(() => {
    let filtered = [...todasReservas];
    if (filterStatus !== 'TODAS') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }
    return filtered;
  }, [todasReservas, filterStatus]);
// Calcula durações válidas baseado na hora de início
  const duracoesValidas = useMemo(() => {
    if (!horaInicio) return DURACOES;
    
    const duracaoMaxima = calcularDuracaoMaxima(horaInicio, disponibilidade);
    
    return DURACOES.filter(d => {
      if (d.value > duracaoMaxima) return false;
      return isDuracaoValida(horaInicio, d.value, disponibilidade);
    });
  }, [horaInicio, disponibilidade]);

    const handleShowAreaDetail = (area: AreaComum) => {
      setSelectedAreaForDetail(area);
      setAreaDetailModalVisible(true);
   };

  // ============= EFFECTS =============
  
  // Atualiza áreas ao focar na tela
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Tela focada, recarregando áreas...');
      loadAreasData();
    }, [])
  );

  const loadAreasData = async () => {
    try {
      setLoadingAreas(true);
      const data = await reservaService.getAreasComuns();
      console.log('✅ Áreas carregadas:', data);
      setAreas(data);
      if (data.length === 0) {
        Alert.alert('Aviso', 'Nenhuma área comum ativa disponível.', [{ text: 'OK' }]);
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar áreas:', error);
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
        if (activeTab === 'Minhas') {
          setLoadingMinhas(true);
          const data = await reservaService.getMinhasReservas(areas);
          setMinhasReservas(data);
          setLoadingMinhas(false);
        } else if (activeTab === 'Todas' && isAdmin) {
          setLoadingTodas(true);
          const data = await reservaService.getTodasReservas(areas);
          setTodasReservas(data);
          setLoadingTodas(false);
        }
      } catch (error: any) {
        console.error('❌ Erro ao carregar dados da tab:', error);
        Alert.alert('Erro', 'Não foi possível carregar os dados');
        setLoadingMinhas(false);
        setLoadingTodas(false);
      } finally {
        setRefreshingMinhas(false);
        setRefreshingTodas(false);
      }
    };
    
    // Só carrega se houver áreas disponíveis
    if (areas.length > 0) {
      loadTabData();
    }
  }, [activeTab, refreshKey, isAdmin, areas]);

  // Reseta duração quando hora de início muda
  useEffect(() => {
    if (horaInicio && duracoesValidas.length > 0) {
      // Se a duração atual não é válida, seleciona a primeira válida
      if (!duracoesValidas.find(d => d.value === duracao)) {
        setDuracao(duracoesValidas[0].value);
      }
    }
  }, [horaInicio, duracoesValidas]);

  // ============= HANDLERS =============
  
  const handleSelectArea = (area: AreaComum) => {
    setSelectedArea(area);
    setSelectedDate('');
    setSelectedTipo(null);
    setDisponibilidade([]);
  };

  const handleSelectDate = useCallback(async (date: string) => {
    setSelectedDate(date);
    setSelectedTipo(null);
    setHoraInicio('');
    setDuracao(1);
    if (selectedArea) {
      try {
        const reservas = await reservaService.getDisponibilidade(selectedArea.id, date);
        setDisponibilidade(reservas);
      } catch (error) {
        console.error('Erro:', error);
        setDisponibilidade([]);
      }
    }
  }, [selectedArea]);

  const isPeriodoDisponivel = (tipo: TipoReserva): boolean => {
      const reservasConfirmadas = disponibilidade.filter(r => r.status === 'CONFIRMADA');

      // REGRA 1: Se "DIA_TODO" já está reservado, NADA MAIS (incluindo "DIA_TODO") está disponível.
      const diaTodoReservado = reservasConfirmadas.some(
        r => r.tipoReserva === TipoReserva.DIA_TODO
      );
      if (diaTodoReservado) {
        return false; // Bloqueia HORA, MANHA, TARDE, NOITE e o próprio DIA_TODO
      }

      // REGRA 2: Se estamos tentando selecionar "DIA_TODO",
      // ele só está disponível se NÃO HOUVER NENHUMA outra reserva (de qualquer tipo).
      if (tipo === TipoReserva.DIA_TODO) {
        return reservasConfirmadas.length === 0;
      }

      // REGRA 3: Se estamos tentando selecionar um período fixo (MANHA, TARDE, NOITE),
      // ele fica indisponível se houver QUALQUER conflito (seja HORA, ou o próprio período).
      if (
        tipo === TipoReserva.MANHA ||
        tipo === TipoReserva.TARDE ||
        tipo === TipoReserva.NOITE
      ) {
        const { inicio, fim } = HORARIOS_FIXOS[tipo];
        // A função 'verificarConflitoHorario' checa se o período (ex: 06:00-12:00)
        // conflita com QUALQUER reserva existente na lista 'reservasConfirmadas'.
        if (verificarConflitoHorario(inicio, fim, reservasConfirmadas)) {
          return false; // Há conflito, o período não está disponível
        }
      }

      // REGRA 4: Se estamos tentando selecionar "HORA".
      // A seleção "HORA" é bloqueada se todos os períodos fixos já estiverem tomados.
      if (tipo === TipoReserva.HORA) {
        const manhaReservada = verificarConflitoHorario(
          HORARIOS_FIXOS.MANHA.inicio,
          HORARIOS_FIXOS.MANHA.fim,
          reservasConfirmadas
        );
        const tardeReservada = verificarConflitoHorario(
          HORARIOS_FIXOS.TARDE.inicio,
          HORARIOS_FIXOS.TARDE.fim,
          reservasConfirmadas
        );
        const noiteReservada = verificarConflitoHorario(
          HORARIOS_FIXOS.NOITE.inicio,
          HORARIOS_FIXOS.NOITE.fim,
          reservasConfirmadas
        );
        
        // Se todos os 3 períodos fixos estão indisponíveis, não há espaço para HORA.
        if (manhaReservada && tardeReservada && noiteReservada) {
          return false;
        }
      }

      // Se passou por todas as regras de bloqueio, o período está disponível.
      return true;
    };

  const handleCriarReserva = async () => {
    if (!selectedArea || !selectedDate || !selectedTipo) {
      Alert.alert('Atenção', 'Preencha todos os campos');
      return;
    }
    if (selectedTipo === TipoReserva.HORA && !horaInicio) {
      Alert.alert('Atenção', 'Selecione o horário de início');
      return;
    }
    try {
      setLoadingCriar(true);
      const payload: any = {
        areaComumId: selectedArea.id,
        dataReserva: selectedDate,
        tipoReserva: selectedTipo,
      };
      if (selectedTipo === TipoReserva.HORA) {
        payload.horaInicio = horaInicio;
        payload.horaFim = calcularHoraFim(horaInicio, duracao);
        
        // Verifica se ultrapassa o horário máximo
        const [horaFimH, horaFimM] = payload.horaFim.split(':').map(Number);
        if (horaFimH > HORA_MAXIMA || (horaFimH === HORA_MAXIMA && horaFimM > MINUTO_MAXIMO)) {
          Alert.alert('Horário Inválido', 'A reserva não pode ultrapassar às 23:59');
          setLoadingCriar(false);
          return;
        }
        
        if (verificarConflitoHorario(payload.horaInicio, payload.horaFim, disponibilidade)) {
          Alert.alert('Conflito', 'Este horário já está reservado');
          setLoadingCriar(false);
          return;
        }
      }
      await reservaService.criarReserva(payload);
      Alert.alert('Sucesso!', 'Reserva criada com sucesso', [
        {
          text: 'OK',
          onPress: () => {
            setSelectedArea(null);
            setSelectedDate('');
            setSelectedTipo(null);
            setHoraInicio('');
            setDuracao(1);
            setRefreshKey(prev => prev + 1);
            // Recarrega as áreas para atualizar a lista
            loadAreasData();
          }
        }
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível criar a reserva');
    } finally {
      setLoadingCriar(false);
    }
  };

  const handleCancelarMinhas = async (reserva: Reserva) => {
    Alert.alert('Cancelar Reserva', 'Tem certeza que deseja cancelar esta reserva?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim',
        onPress: async () => {
          try {
            await reservaService.cancelarReserva(reserva.id);
            Alert.alert('Sucesso', 'Reserva cancelada');
            setRefreshKey(prev => prev + 1);
          } catch (error: any) {
            Alert.alert('Erro', error.message || 'Não foi possível cancelar');
          }
        }
      }
    ]);
  };

  const handleCancelarTodas = async (reserva: Reserva) => {
    Alert.alert('Cancelar Reserva', `Cancelar reserva de ${reserva.morador.nome}?`, [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim',
        onPress: async () => {
          try {
            await reservaService.cancelarReserva(reserva.id);
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
  
  const renderCriarTab = () => {
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
            <View style={styles.tiposGrid}>
              {selectedArea.tiposReservaDisponiveis.map(tipo => {
                const disponivel = isPeriodoDisponivel(tipo);
                return (
                  <TouchableOpacity
                    key={tipo}
                    style={[
                      styles.tipoChip,
                      selectedTipo === tipo && styles.tipoChipSelected,
                      !disponivel && styles.tipoChipDisabled
                    ]}
                    onPress={() => disponivel && setSelectedTipo(tipo)}
                    disabled={!disponivel}
                  >
                    <Text
                      style={[
                        styles.tipoChipText,
                        selectedTipo === tipo && styles.tipoChipTextSelected,
                        !disponivel && styles.tipoChipTextDisabled
                      ]}
                    >
                      {TIPO_LABELS[tipo]}
                    </Text>
                    {!disponivel && <Text style={styles.indisponivelText}>Indisponível</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {selectedTipo === TipoReserva.HORA && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Horário e Duração</Text>
            <Text style={styles.label}>Horário de Início</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horaScroll}>
              {HORAS_INICIO.map(hora => {
                const disponivel = isHoraDisponivel(hora, disponibilidade);
                return (
                  <TouchableOpacity
                    key={hora}
                    style={[
                      styles.horaChip, 
                      horaInicio === hora && styles.horaChipSelected,
                      !disponivel && styles.horaChipDisabled
                    ]}
                    onPress={() => disponivel && setHoraInicio(hora)}
                    disabled={!disponivel}
                  >
                    <Text style={[
                      styles.horaChipText, 
                      horaInicio === hora && styles.horaChipTextSelected,
                      !disponivel && styles.horaChipTextDisabled
                    ]}>
                      {hora}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            {horaInicio && (
              <>
                <Text style={styles.label}>Duração</Text>
                {duracoesValidas.length === 0 ? (
                  <Text style={styles.avisoText}>Nenhuma duração disponível para este horário</Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horaScroll}>
                    {duracoesValidas.map(d => (
                      <TouchableOpacity
                        key={d.value}
                        style={[styles.horaChip, duracao === d.value && styles.horaChipSelected]}
                        onPress={() => setDuracao(d.value)}
                      >
                        <Text style={[styles.horaChipText, duracao === d.value && styles.horaChipTextSelected]}>
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

        {selectedArea && selectedDate && selectedTipo && (selectedTipo !== TipoReserva.HORA || (horaInicio && duracoesValidas.length > 0)) && (
          <View style={styles.section}>
            <View style={styles.resumo}>
              <Text style={styles.resumoTitle}>Resumo da Reserva</Text>

              <View style={styles.resumoItemContainer}>
                <MaterialCommunityIcons name="map-marker-outline" size={18} color={THEME.primary} />
                <Text style={styles.resumoItem}>{selectedArea.nome}</Text>
              </View>

              <View style={styles.resumoItemContainer}>
                <MaterialCommunityIcons name="calendar-today" size={18} color={THEME.primary} />
                <Text style={styles.resumoItem}>
                  {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('pt-BR')}
                </Text>
              </View>

              <View style={styles.resumoItemContainer}>
                <MaterialCommunityIcons name="clock-outline" size={18} color={THEME.primary} />
                <Text style={styles.resumoItem}>
                  {selectedTipo === TipoReserva.HORA && horaInicio
                    ? `${horaInicio} - ${calcularHoraFim(horaInicio, duracao)}`
                    : TIPO_LABELS[selectedTipo]}
                </Text>
              </View>

              {selectedArea.valorTaxa > 0 && (
                <View style={styles.resumoItemContainer}>
                  <MaterialCommunityIcons name="currency-brl" size={18} color={THEME.primary} />
                  <Text style={styles.resumoItem}>R$ {selectedArea.valorTaxa.toFixed(2)}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={[styles.confirmarBtn, loadingCriar && styles.confirmarBtnDisabled]}
              onPress={handleCriarReserva}
              disabled={loadingCriar}
            >
              {loadingCriar ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmarBtnText}>Confirmar Reserva</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderMinhasTab = () => {
    if (loadingMinhas) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text style={styles.loadingText}>Carregando reservas...</Text>
        </View>
      );
    }
    if (minhasReservas.length === 0) {
      return (
        <ScrollView
          style={styles.tabContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshingMinhas}
              onRefresh={() => {
                setRefreshingMinhas(true);
                setRefreshKey(prev => prev + 1);
              }}
            />
          }
        >
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="calendar-blank" size={80} color={THEME.disabled} />
            <Text style={styles.emptyStateTitle}>Nenhuma reserva</Text>
            <Text style={styles.emptyStateText}>Você ainda não possui reservas futuras</Text>
          </View>
        </ScrollView>
      );
    }
    return (
      <ScrollView
        style={styles.tabContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshingMinhas}
            onRefresh={() => {
              setRefreshingMinhas(true);
              setRefreshKey(prev => prev + 1);
            }}
          />
        }
      >
        {minhasReservas.map(reserva => (
          <ReservaCard
            key={reserva.id}
            reserva={reserva}
            onCancelar={() => handleCancelarMinhas(reserva)}
            canCancel={podeCancelar(reserva, user?.role || 'USER', user?.id || '')}
          />
        ))}
      </ScrollView>
    );
  };

  const renderTodasTab = () => {
    if (loadingTodas) {
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
            {['TODAS', 'PENDENTE', 'CONFIRMADA', 'CANCELADA'].map(status => (
              <TouchableOpacity
                key={status}
                style={[styles.filterChip, filterStatus === status && styles.filterChipSelected]}
                onPress={() => setFilterStatus(status)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filterStatus === status && styles.filterChipTextSelected
                  ]}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshingTodas}
              onRefresh={() => {
                setRefreshingTodas(true);
                setRefreshKey(prev => prev + 1);
              }}
            />
          }
        >
          {filteredReservas.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="filter-off" size={80} color={THEME.disabled} />
              <Text style={styles.emptyStateTitle}>Nenhuma reserva encontrada</Text>
            </View>
          ) : (
            filteredReservas.map(reserva => (
              <ReservaCard
                key={reserva.id}
                reserva={reserva}
                onCancelar={() => handleCancelarTodas(reserva)}
                showMorador
                canCancel={isAdmin}
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
                  tab === 'Criar'
                    ? 'plus-circle'
                    : tab === 'Minhas'
                    ? 'calendar-account'
                    : 'calendar-multiple'
                }
                size={20}
                color={activeTab === tab ? THEME.primary : '#666'}
              />
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {activeTab === 'Criar' && renderCriarTab()}
      {activeTab === 'Minhas' && renderMinhasTab()}
      {activeTab === 'Todas' && isAdmin && renderTodasTab()}
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
  infoButton:{
    marginTop:4

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
    height: 180,
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
  areaNome: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.text.primary,
    textAlign: 'center',
    lineHeight: 17,
    letterSpacing: -0.2,
    height: 34, 
  },
  valorContainer: {
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
  areaValor: {
    fontSize: 11,
    color: THEME.success,
    fontWeight: '800',
  },
  areaValorGratis: {
    fontSize: 11,
    color: THEME.success,
    fontWeight: '800',
  },
  tiposContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
    height: 30,
  },
  tipoTag: {
    backgroundColor: '#eff6ff', 
    paddingHorizontal: 8, // Mais espaço horizontal
    paddingVertical: 3,
    borderRadius: 12,
  },
  tipoTagText: {
    fontSize: 9,
    color: THEME.primary, 
    fontWeight: '600',
    textTransform: 'capitalize',
    letterSpacing: 0.2,
  },
  verDetalhesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10, 
    paddingHorizontal: 8,
    gap: 4,
    backgroundColor: '#f8fafc', 
  },
  verDetalhesBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tiposGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tipoChip: {
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
  tipoChipSelected: {
    borderColor: THEME.primary,
    backgroundColor: '#eff6ff',
  },
  tipoChipDisabled: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    opacity: 0.6,
  },
  tipoChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.text.primary,
  },
  tipoChipTextSelected: {
    color: THEME.primary,
    fontWeight: '700',
  },
  tipoChipTextDisabled: {
    color: THEME.disabled,
  },
  indisponivelText: {
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
  horaScroll: {
    marginBottom: 8,
  },
  horaChip: {
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
  horaChipSelected: {
    borderColor: THEME.primary,
    backgroundColor: '#eff6ff',
  },
  horaChipDisabled: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    opacity: 0.5,
  },
  horaChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.text.primary,
  },
  horaChipTextSelected: {
    color: THEME.primary,
    fontWeight: '700',
  },
  horaChipTextDisabled: {
    color: THEME.disabled,
  },
  avisoText: {
    fontSize: 14,
    color: THEME.error,
    fontStyle: 'italic',
    marginTop: 8,
    fontWeight: '500',
  },
  resumo: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  resumoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.text.primary,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  resumoItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resumoItem: {
    fontSize: 14,
    color: THEME.text.secondary,
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  confirmarBtn: {
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
  confirmarBtnDisabled: {
    backgroundColor: THEME.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmarBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  reservaCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: THEME.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  reservaCardCancelada: {
    backgroundColor: '#fafafa',
    opacity: 0.8,
    borderLeftColor: THEME.disabled,
  },
  reservaHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  reservaIconContainer: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  reservaMainInfo: {
    flex: 1,
  },
  reservaTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  reservaArea: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.text.primary,
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.3,
  },
  reservaTextCancelada: {
    color: THEME.disabled,
    textDecorationLine: 'line-through',
  },
  reservaDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  reservaDetail: {
    fontSize: 14,
    color: THEME.text.secondary,
    fontWeight: '500',
  },
  reservaHorarioDestaque: {
    color: THEME.primary,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  moradorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 8,
  },
  moradorText: {
    fontSize: 13,
    color: THEME.text.secondary,
    flex: 1,
    fontWeight: '600',
  },
  cancelarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 8,
  },
  cancelarBtnText: {
    color: THEME.error,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.text.primary,
    marginTop: 16,
    letterSpacing: -0.3,
  },
  emptyStateText: {
    fontSize: 14,
    color: THEME.text.tertiary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
    fontWeight: '500',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: THEME.border,
  },
  filterChipSelected: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterChipTextSelected: {
    color: '#fff',
  },
  infoLinkText: {
    color: THEME.primary,
    fontSize: 13,
    fontWeight: '700',
    marginRight: 4,
  },

});