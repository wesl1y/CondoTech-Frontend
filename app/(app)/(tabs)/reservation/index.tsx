import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  primary: '#2196F3',
  secondary: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  success: '#4CAF50',
  disabled: '#BDBDBD',
  background: '#F5F5F5',
};

const STATUS_COLORS = {
  PENDENTE: '#FF9800',
  CONFIRMADA: '#4CAF50',
  CANCELADA: '#F44336',
  FINALIZADA: '#9E9E9E',
};

const HORARIOS_FIXOS = {
  MANHA: { inicio: '06:00', fim: '12:00' },
  TARDE: { inicio: '12:01', fim: '18:00' },
  NOITE: { inicio: '18:01', fim: '23:59' },
  DIA_TODO: { inicio: '06:00', fim: '23:59' }
};

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
}> = ({ area, selected, onPress }) => {
  const iconName = getIconName(area.icone);
  return (
    <TouchableOpacity
      style={[styles.areaCard, selected && styles.areaCardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons name={iconName as any} size={32} color={selected ? THEME.primary : '#666'} />
      <Text style={styles.areaNome}>{area.nome}</Text>
      {area.valorTaxa > 0 && <Text style={styles.areaValor}>R$ {area.valorTaxa.toFixed(2)}</Text>}
      <View style={styles.tiposContainer}>
        {area.tiposReservaDisponiveis.slice(0, 2).map(tipo => (
          <Text key={tipo} style={styles.tipoTag}>
            {TIPO_LABELS[tipo]}
          </Text>
        ))}
        {area.tiposReservaDisponiveis.length > 2 && (
          <Text style={styles.tipoTag}>+{area.tiposReservaDisponiveis.length - 2}</Text>
        )}
      </View>
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

  return (
    <View style={styles.reservaCard}>
      <View style={styles.reservaHeader}>
        <View style={styles.reservaInfo}>
          <MaterialCommunityIcons name={iconName as any} size={24} color={THEME.primary} />
          <View style={styles.reservaTexts}>
            <Text style={styles.reservaArea}>{reserva.areaComum.nome}</Text>
            <Text style={styles.reservaData}>{new Date(reserva.dataReserva).toLocaleDateString('pt-BR')}</Text>
            <Text style={styles.reservaHorario}>
              {reserva.tipoReserva === TipoReserva.HORA
                ? `${reserva.horaInicio} - ${reserva.horaFim}`
                : TIPO_LABELS[reserva.tipoReserva]}
            </Text>
          </View>
        </View>
        <StatusBadge status={reserva.status} />
      </View>
      {showMorador && reserva.morador && (
        <View style={styles.moradorInfo}>
          <MaterialCommunityIcons name="account" size={16} color="#666" />
          <Text style={styles.moradorText}>
            {reserva.morador.nome} - Torre {reserva.morador.torre}, Unidade {reserva.morador.unidade}
          </Text>
        </View>
      )}
      {canCancel && (
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

  const filteredReservas = useMemo(() => {
    let filtered = [...todasReservas];
    if (filterStatus !== 'TODAS') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }
    return filtered;
  }, [todasReservas, filterStatus]);

  

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
          <Text style={styles.sectionTitle}>1. Selecione a Área</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {areas.map(area => (
              <AreaCard
                key={area.id}
                area={area}
                selected={selectedArea?.id === area.id}
                onPress={() => handleSelectArea(area)}
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
              {HORAS_INICIO.map(hora => (
                <TouchableOpacity
                  key={hora}
                  style={[styles.horaChip, horaInicio === hora && styles.horaChipSelected]}
                  onPress={() => setHoraInicio(hora)}
                >
                  <Text style={[styles.horaChipText, horaInicio === hora && styles.horaChipTextSelected]}>
                    {hora}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.label}>Duração</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horaScroll}>
              {DURACOES.slice(0, 8).map(d => (
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
          </View>
        )}

        {selectedArea && selectedDate && selectedTipo && (selectedTipo !== TipoReserva.HORA || horaInicio) && (
          <View style={styles.section}>
            <View style={styles.resumo}>
              <Text style={styles.resumoTitle}>Resumo da Reserva</Text>
              <Text style={styles.resumoItem}>📍 {selectedArea.nome}</Text>
              <Text style={styles.resumoItem}>📅 {new Date(selectedDate).toLocaleDateString('pt-BR')}</Text>
              <Text style={styles.resumoItem}>
                ⏰{' '}
                {selectedTipo === TipoReserva.HORA && horaInicio
                  ? `${horaInicio} - ${calcularHoraFim(horaInicio, duracao)}`
                  : TIPO_LABELS[selectedTipo]}
              </Text>
              {selectedArea.valorTaxa > 0 && (
                <Text style={styles.resumoItem}>💰 R$ {selectedArea.valorTaxa.toFixed(2)}</Text>
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
    <SafeAreaView style={styles.safeArea}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTextContainer: {
    marginBottom: 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  activeTab: {
    backgroundColor: '#E3F2FD',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  activeTabText: {
    color: THEME.primary,
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
    color: '#666',
  },
  section: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  areaCard: {
    width: 160,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  areaCardSelected: {
    borderColor: THEME.primary,
    backgroundColor: '#E3F2FD',
  },
  areaNome: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  areaValor: {
    fontSize: 12,
    color: THEME.success,
    fontWeight: 'bold',
    marginTop: 4,
  },
  tiposContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    justifyContent: 'center',
  },
  tipoTag: {
    fontSize: 10,
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginTop: 4,
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
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  tipoChipSelected: {
    borderColor: THEME.primary,
    backgroundColor: '#E3F2FD',
  },
  tipoChipDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: THEME.disabled,
  },
  tipoChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  tipoChipTextSelected: {
    color: THEME.primary,
  },
  tipoChipTextDisabled: {
    color: THEME.disabled,
  },
  indisponivelText: {
    fontSize: 10,
    color: THEME.error,
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  horaScroll: {
    marginBottom: 8,
  },
  horaChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 8,
  },
  horaChipSelected: {
    borderColor: THEME.primary,
    backgroundColor: '#E3F2FD',
  },
  horaChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  horaChipTextSelected: {
    color: THEME.primary,
  },
  resumo: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  resumoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  resumoItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  confirmarBtn: {
    backgroundColor: THEME.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmarBtnDisabled: {
    backgroundColor: THEME.disabled,
  },
  confirmarBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reservaCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reservaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reservaInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  reservaTexts: {
    marginLeft: 12,
    flex: 1,
  },
  reservaArea: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  reservaData: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  reservaHorario: {
    fontSize: 14,
    color: THEME.primary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  moradorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  moradorText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  cancelarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelarBtnText: {
    color: THEME.error,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipSelected: {
    backgroundColor: THEME.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  filterChipTextSelected: {
    color: '#fff',
  },
});