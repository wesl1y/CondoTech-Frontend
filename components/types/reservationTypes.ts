// types/reservationTypes.ts

// ============================================
// TIPOS DE RESERVA
// ============================================

export type TipoReserva = 'HORA' | 'MANHA' | 'TARDE' | 'NOITE' | 'DIA_TODO';

export type StatusReserva = 'PENDENTE' | 'CONFIRMADA' | 'CANCELADA' | 'REALIZADA';

// ============================================
// ÁREA COMUM
// ============================================

export interface FotoAreaComum {
  id: number;
  url: string;
  urlBase64?: string;
  principal: boolean;
  ordem?: number;
}

export interface TipoReservaDTO {
  id: number;
  tipo: TipoReserva;
  descricao: string;
  horaInicio?: string;
  horaFim?: string;
}

export interface AreaComumParaReservaDTO {
  id: number;
  nome: string;
  descricao?: string;
  ativa: boolean;
  valorTaxa: number;
  icone?: string;
  fotos?: FotoAreaComum[];
  tiposReservaDisponiveis: TipoReservaDTO[];
}

// ============================================
// RESERVA
// ============================================

export interface ReservaDTO {
  id: number;
  dataReserva: string; // YYYY-MM-DD
  horarioInicio: string; // HH:mm
  horarioFim: string; // HH:mm
  status: StatusReserva;
  observacoes?: string;
  valorTaxa: number;
  
  // Dados da área comum
  areaComumId: number;
  areaComumNome: string;
  areaComumIcone?: string;
  
  // Dados do usuário (visível para admin)
  usuarioId: number;
  usuarioNome: string;
  usuarioApartamento: string;
  
  // Datas de auditoria
  dataCriacao?: string;
  dataAtualizacao?: string;
}

export interface ReservaRelatorioDTO {
  id: number;
  dataReserva: string;
  horarioInicio: string;
  horarioFim: string;
  valorTaxa: number;
  usuarioNome: string;
  usuarioApartamento: string;
}

// ============================================
// PROPS DOS COMPONENTES
// ============================================

export interface ReservationCardProps {
  item: ReservaDTO;
  onCardPress: (reserva: ReservaDTO) => void;
}

export interface CreateReservationModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}

export interface ReservationDetailModalProps {
  visible: boolean;
  onClose: () => void;
  reserva: ReservaDTO | null;
  onCancel: (id: number) => void;
  isAdmin: boolean;
}

export interface ReservationReportModalProps {
  visible: boolean;
  onClose: () => void;
}

// ============================================
// PAYLOADS (Request/Response)
// ============================================

export interface CriarReservaPayload {
  idAreaComum: number;
  idTipoReserva: number;
  data: string; // YYYY-MM-DD
  horarioInicio: string; // HH:mm
  horarioFim: string; // HH:mm
  observacoes?: string;
}

export interface ConsultarDisponibilidadePayload {
  idAreaComum: number;
  data: string; // YYYY-MM-DD
  horarioInicio?: string;
  horarioFim?: string;
}

export interface DisponibilidadeResponse {
  disponivel: boolean;
  mensagem?: string;
  horariosDisponiveis?: string[];
}