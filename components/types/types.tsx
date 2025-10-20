// app/(app)/(tabs)/manage-reservations/types/index.ts

// ✅ CORRIGIDO: Tipos de reserva conforme aceitos pelo backend
type TipoReserva = 'HORA' | 'MANHA' | 'TARDE' | 'NOITE' | 'DIA_TODO';

interface Regra {
  id: number;
  titulo: string;
  descricao?: string;
}

interface FotoAreaComum {
  id: number;
  url: string;
  urlBase64?: string;
  principal: boolean;
  ordem?: number;
}

interface AreaComum {
  id: number;
  nome: string;
  ativa: boolean;
  descricao?: string;
  valorTaxa?: number;
  tiposReservaDisponiveis?: TipoReserva[];
  regras?: Regra[];
  icone?: string;
  fotos?: FotoAreaComum[];
}

interface AreaComumRequestPayload {
  nome: string;
  descricao?: string;
  icone?: string;
  ativa: boolean;
  valorTaxa: number;
  tiposReservaDisponiveis: TipoReserva[];
  regraIds: number[];
  condominioId: number;
}

// ✅ CORRIGIDO: Estado dos tipos de reserva
interface TiposReservaState {
  HORA: boolean;
  MANHA: boolean;
  TARDE: boolean;
  NOITE: boolean;
  DIA_TODO: boolean;
}

interface AreaItemProps {
  item: AreaComum;
  onCardPress: (area: AreaComum) => void;
}

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

interface AreaFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  areaToEdit: AreaComum | null;
}

interface AreaDetailModalProps {
  visible: boolean;
  onClose: () => void;
  area: AreaComum | null;
  onEdit: () => void;
  onDelete: () => void;
  onManageFotos: () => void;
}

interface RuleItemProps {
  regra: Regra;
  isLast: boolean;
}

interface FotoGalleryModalProps {
  visible: boolean;
  onClose: () => void;
  fotos: FotoAreaComum[];
  initialIndex: number;
}

export type {
  TipoReserva,
  Regra,
  FotoAreaComum,
  AreaComum,
  AreaComumRequestPayload,
  TiposReservaState,
  AreaItemProps,
  CheckboxProps,
  AreaFormModalProps,
  AreaDetailModalProps,
  RuleItemProps,
  FotoGalleryModalProps
};