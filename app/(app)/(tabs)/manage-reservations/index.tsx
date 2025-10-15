import React, { useState, useEffect, useCallback, JSX } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  RefreshControl, 
  ScrollView,
  Modal,
  Pressable,
  TextInput,
  Image
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { Plus, Edit, Trash2, Home, Waves, Flame, Grid3X3, X, Image as ImageIcon, ChevronDown, ChevronUp, Info } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { styles, COLORS } from './styles';
import FotoAreaComumManager from '@/components/FotoAreaComumManager';

// 1. IMPORTAÇÃO DO SEU SERVIÇO DE API
import api from '@/services/api';
import { API_URL } from '@/constants/api';

// --- INTERFACES E TIPOS ATUALIZADOS ---
type TipoReserva = 'POR_HORA' | 'POR_PERIODO' | 'DIARIA';
interface AreaItemProps {
  item: AreaComum;
  onCardPress: (area: AreaComum) => void;
}

const AreaCardItem: React.FC<AreaItemProps> = ({ item, onCardPress }) => {
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [loadingFoto, setLoadingFoto] = useState(false);

  useEffect(() => {
    const loadFoto = async () => {
      if (!item.fotos || item.fotos.length === 0) return;
      
      setLoadingFoto(true);
      const base64 = await loadImageAsBase64(item.fotos[0].url);
      setFotoBase64(base64);
      setLoadingFoto(false);
    };

    loadFoto();
  }, [item.fotos]);
  
  return (
    <TouchableOpacity onPress={() => onCardPress(item)} activeOpacity={0.7}>
      <Card style={styles.areaCard}>
        <View style={styles.cardGradientBorder} />
        {item.fotos && item.fotos.length > 0 && (
          <View style={styles.cardImageContainer}>
            {loadingFoto ? (
              <View style={[styles.cardImage, styles.imageLoadingContainer]}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : fotoBase64 ? (
              <>
                <Image 
                  source={{ uri: fotoBase64 }} 
                  style={styles.cardImage}
                  resizeMode="cover"
                />
                {item.fotos.length > 1 && (
                  <View style={styles.cardImageBadge}>
                    <ImageIcon size={12} color={COLORS.white} />
                    <Text style={styles.cardImageBadgeText}>{item.fotos.length}</Text>
                  </View>
                )}
              </>
            ) : null}
          </View>
        )}
        <CardContent style={styles.cardContent}>
          <View style={styles.cardIcon}>
            {iconesDisponiveis[item.icone || 'Admin'] || iconesDisponiveis['Admin']}
          </View>
          <View style={styles.cardInfo}>
            <View style={styles.cardHeader}>
              <Text style={styles.areaName}>{item.nome}</Text>
              <Badge variant={item.ativa ? 'success' : 'danger'} style={[styles.badge, item.ativa ? styles.badgeActive : styles.badgeInactive]}>
                <Text style={[styles.badgeText, item.ativa ? styles.badgeTextActive : styles.badgeTextInactive]}>
                  {item.ativa ? 'Ativa' : 'Inativa'}
                </Text>
              </Badge>
            </View>
            {item.descricao && (
              <Text style={styles.areaDescription} numberOfLines={2}>{item.descricao}</Text>
            )}
            <View style={styles.areaMetaContainer}>
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Taxa:</Text>
                <Text style={styles.areaPrice}>
                  {item.valorTaxa && item.valorTaxa > 0
                    ? `R$ ${item.valorTaxa.toFixed(2).replace('.', ',')}`
                    : 'Gratuito'}
                </Text>
              </View>
              {item.tiposReservaDisponiveis && item.tiposReservaDisponiveis.length > 0 && (
                <View style={styles.reserveTypesContainer}>
                  <Text style={styles.reserveTypesLabel}>
                    {item.tiposReservaDisponiveis.length} {item.tiposReservaDisponiveis.length === 1 ? 'tipo' : 'tipos'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );
};

// Nova interface para a entidade Regra
interface Regra {
  id: number;
  titulo: string;
  descricao?: string;
}

// Interface para Foto
interface FotoAreaComum {
  id: number;
  url: string;
  urlBase64?: string;
  ordem?: number;
}

const loadImageAsBase64 = async (imageUrl: string): Promise<string | null> => {
  try {
    const token = await SecureStore.getItemAsync('my-jwt');
    
    if (!token) {
      console.warn('⚠️ Token não encontrado para carregar imagem');
      return null;
    }

    // Construir URL completa se for relativa
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

// Função helper para formatar URL de imagem base64
const getImageSource = (foto: FotoAreaComum): { uri: string } | null => {
  if (foto.urlBase64) {
    return { uri: foto.urlBase64 };
  }
  if (foto.url) {
    return { uri: foto.url };
  }
  return null;
};

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

// DTO para criar/atualizar Área Comum no frontend
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

interface TiposReservaState {
  POR_HORA: boolean;
  POR_PERIODO: boolean;
  DIARIA: boolean;
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

// --- DADOS ---
const iconesDisponiveis: Record<string, JSX.Element> = {
  "Salão de Festas": <Home size={24} color={COLORS.primary} />,
  "Churrasqueira": <Flame size={24} color={COLORS.primary} />,
  "Piscina": <Waves size={24} color={COLORS.primary} />,
  "Admin": <Grid3X3 size={24} color={COLORS.primary} />
};

const tiposDeReserva: TipoReserva[] = ['POR_HORA', 'POR_PERIODO', 'DIARIA'];

const formatarTipoReserva = (tipo: TipoReserva): string => {
  const tipos: Record<TipoReserva, string> = {
    'POR_HORA': 'Por Hora',
    'POR_PERIODO': 'Por Período',
    'DIARIA': 'Diária'
  };
  return tipos[tipo] || tipo;
};

// --- COMPONENTE CHECKBOX ---
const Checkbox: React.FC<CheckboxProps> = ({ label, checked, onChange }) => (
  <TouchableOpacity 
    onPress={onChange} 
    style={[styles.checkboxContainer, checked && styles.checkboxContainerChecked]}
    activeOpacity={0.7}
  >
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && <Text style={styles.checkmark}>✓</Text>}
    </View>
    <Text style={styles.checkboxLabel}>{label}</Text>
  </TouchableOpacity>
);

// --- COMPONENTE DE REGRA EXPANSÍVEL ---
interface RuleItemProps {
  regra: Regra;
  isLast: boolean;
}

const RuleItem: React.FC<RuleItemProps> = ({ regra, isLast }) => {
  const [expanded, setExpanded] = useState(false);
  const hasDescription = regra.descricao && regra.descricao.trim().length > 0;

  return (
    <View style={[styles.detailRuleCard, isLast && styles.detailRuleCardLast]}>
      <TouchableOpacity 
        style={styles.detailRuleHeader}
        onPress={() => hasDescription && setExpanded(!expanded)}
        activeOpacity={hasDescription ? 0.7 : 1}
        disabled={!hasDescription}
      >
        <View style={styles.detailRuleHeaderContent}>
          <Text style={styles.detailRuleBullet}>•</Text>
          <Text style={styles.detailRuleTitle}>{regra.titulo}</Text>
        </View>
        {hasDescription && (
          <View style={styles.detailRuleIconContainer}>
            {expanded ? (
              <ChevronUp size={18} color={COLORS.primary} />
            ) : (
              <ChevronDown size={18} color={COLORS.textSecondary} />
            )}
          </View>
        )}
      </TouchableOpacity>
      {expanded && hasDescription && (
        <View style={styles.detailRuleDescription}>
          <View style={styles.detailRuleDescriptionDivider} />
          <Text style={styles.detailRuleDescriptionText}>{regra.descricao}</Text>
        </View>
      )}
    </View>
  );
};

// --- MODAL DE GALERIA DE FOTOS ---
interface FotoGalleryModalProps {
  visible: boolean;
  onClose: () => void;
  fotos: FotoAreaComum[];
  initialIndex: number;
}

const FotoGalleryModal: React.FC<FotoGalleryModalProps> = ({ visible, onClose, fotos, initialIndex }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : fotos.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev < fotos.length - 1 ? prev + 1 : 0));
  };

  if (fotos.length === 0) return null;

  const currentFoto = fotos[currentIndex];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.galleryModalOverlay}>
        <TouchableOpacity 
          style={styles.galleryCloseButton}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <X size={28} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.galleryCounterBadge}>
          <Text style={styles.galleryCounterText}>
            {currentIndex + 1} / {fotos.length}
          </Text>
        </View>

        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width);
            setCurrentIndex(newIndex);
          }}
          contentOffset={{ x: currentIndex * 400, y: 0 }}
        >
          {fotos.map((foto, index) => (
            <View key={foto.id || index} style={styles.galleryImageContainer}>
              {foto.urlBase64 ? (
                <Image
                  source={{ uri: foto.urlBase64 }}
                  style={styles.galleryImage}
                  resizeMode="contain"
                />
              ) : (
                <ActivityIndicator size="large" color={COLORS.white} />
              )}
            </View>
          ))}
        </ScrollView>

        {fotos.length > 1 && (
          <>
            <TouchableOpacity 
              style={[styles.galleryNavButton, styles.galleryNavButtonLeft]}
              onPress={handlePrevious}
              activeOpacity={0.8}
            >
              <Text style={styles.galleryNavButtonText}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.galleryNavButton, styles.galleryNavButtonRight]}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.galleryNavButtonText}>›</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Modal>
  );
};
// --- MODAL DE DETALHES REESTRUTURADO ---
const AreaDetailModal: React.FC<AreaDetailModalProps> = ({ visible, onClose, area, onEdit, onDelete, onManageFotos }) => {
  const [fotosComBase64, setFotosComBase64] = useState<FotoAreaComum[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  useEffect(() => {
    const loadImages = async () => {
      if (!area?.fotos || area.fotos.length === 0 || !visible) {
        setFotosComBase64([]);
        return;
      }

      setLoadingImages(true);
      try {
        const fotosPromises = area.fotos.map(async (foto) => {
          const base64 = await loadImageAsBase64(foto.url);
          return { ...foto, urlBase64: base64 || undefined };
        });
        
        const fotosCarregadas = await Promise.all(fotosPromises);
        setFotosComBase64(fotosCarregadas);
      } catch (error) {
        console.error('Erro ao carregar imagens:', error);
        setFotosComBase64([]);
      } finally {
        setLoadingImages(false);
      }
    };

    loadImages();
  }, [area?.fotos, visible]);

  const handleOpenGallery = (index: number) => {
    setSelectedPhotoIndex(index);
    setIsGalleryVisible(true);
  };

  if (!area) return null;

  const primeiraFoto = fotosComBase64.length > 0 ? fotosComBase64[0] : null;

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.detailModalOverlay}>
          <View style={styles.detailModalContent}>
            <View style={{ flex: 1 }}>
              <View style={styles.detailModalHandle} />
            
              {/* Header */}
              {loadingImages && area.fotos && area.fotos.length > 0 ? (
                <View style={styles.detailModalHeaderWithImage}>
                  <View style={[styles.detailModalHeaderImage, styles.imageLoadingContainer]}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                  </View>
                  <View style={styles.detailModalHeaderOverlay}>
                    <View style={styles.detailHeaderContent}>
                      <Text style={styles.detailModalTitleWithImage}>{area.nome}</Text>
                      <Badge variant={area.ativa ? 'success' : 'danger'} style={[styles.badge, area.ativa ? styles.badgeActive : styles.badgeInactive]}>
                        <Text style={[styles.badgeText, area.ativa ? styles.badgeTextActive : styles.badgeTextInactive]}>
                          {area.ativa ? 'Ativa' : 'Inativa'}
                        </Text>
                      </Badge>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.detailCloseButtonWithImage}>
                      <X size={22} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : primeiraFoto?.urlBase64 ? (
                <View style={styles.detailModalHeaderWithImage}>
                  <Image source={{ uri: primeiraFoto.urlBase64 }} style={styles.detailModalHeaderImage} resizeMode="cover" />
                  <View style={styles.detailModalHeaderOverlay}>
                    <View style={styles.detailHeaderContent}>
                      <Text style={styles.detailModalTitleWithImage}>{area.nome}</Text>
                      <Badge variant={area.ativa ? 'success' : 'danger'} style={[styles.badge, area.ativa ? styles.badgeActive : styles.badgeInactive]}>
                        <Text style={[styles.badgeText, area.ativa ? styles.badgeTextActive : styles.badgeTextInactive]}>
                          {area.ativa ? 'Ativa' : 'Inativa'}
                        </Text>
                      </Badge>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.detailCloseButtonWithImage}>
                      <X size={22} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.detailModalHeader}>
                  <View style={styles.detailHeaderContent}>
                    <Text style={styles.detailModalTitle}>{area.nome}</Text>
                    <Badge variant={area.ativa ? 'success' : 'danger'} style={[styles.badge, area.ativa ? styles.badgeActive : styles.badgeInactive]}>
                      <Text style={[styles.badgeText, area.ativa ? styles.badgeTextActive : styles.badgeTextInactive]}>
                        {area.ativa ? 'Ativa' : 'Inativa'}
                      </Text>
                    </Badge>
                  </View>
                  <TouchableOpacity onPress={onClose} style={styles.detailCloseButton}>
                    <X size={22} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}

              {/* ScrollView Principal - SEM nestedScrollEnabled */}
              <ScrollView 
                style={styles.detailModalScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.detailModalScrollContent}
              >
                {/* Galeria de fotos - ScrollView Horizontal */}
                {fotosComBase64.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Fotos ({fotosComBase64.length})</Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={true}
                      style={styles.detailFotosScroll}
                      contentContainerStyle={styles.detailFotosScrollContent}
                    >
                      {fotosComBase64.map((foto, index) => (
                        foto.urlBase64 ? (
                          <TouchableOpacity key={foto.id || index} style={styles.detailFotoItem} onPress={() => handleOpenGallery(index)} activeOpacity={0.8}>
                            <Image source={{ uri: foto.urlBase64 }} style={styles.detailFotoImage} resizeMode="cover" />
                          </TouchableOpacity>
                        ) : null
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Informações Básicas */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Informações</Text>
                  {area.descricao && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Descrição</Text>
                      <Text style={styles.detailValue}>{area.descricao}</Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Taxa de Reserva</Text>
                    <Text style={[styles.detailValue, { color: COLORS.success }]}>
                      {area.valorTaxa && area.valorTaxa > 0 
                        ? `R$ ${area.valorTaxa.toFixed(2).replace('.', ',')}` 
                        : 'Gratuito'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Ícone</Text>
                    <Text style={styles.detailValue}>{area.icone || 'Admin'}</Text>
                  </View>
                </View>

                {/* Tipos de Reserva */}
                {area.tiposReservaDisponiveis && area.tiposReservaDisponiveis.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Tipos de Reserva</Text>
                    <View style={styles.detailChipsContainer}>
                      {area.tiposReservaDisponiveis.map((tipo) => (
                        <View key={tipo} style={styles.detailChip}>
                          <Text style={styles.detailChipText}>{formatarTipoReserva(tipo)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Regras */}
                {area.regras && area.regras.length > 0 && (
                  <View style={styles.detailSection}>
                    <View style={styles.detailSectionHeaderWithInfo}>
                      <Text style={styles.detailSectionTitle}>Regras de Uso ({area.regras.length})</Text>
                      <View style={styles.detailInfoBadge}>
                        <Info size={12} color={COLORS.primary} />
                        <Text style={styles.detailInfoText}>Toque para ver descrição</Text>
                      </View>
                    </View>
                    <View style={styles.detailRulesContainer}>
                      {area.regras.map((regra, index) => (
                        <RuleItem key={regra.id} regra={regra} isLast={index === area.regras!.length - 1} />
                      ))}
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Footer de ações */}
              <View style={styles.detailActionsFooter}>
                <TouchableOpacity style={[styles.detailActionButton, styles.detailEditButton]} onPress={() => { onClose(); onEdit(); }} activeOpacity={0.7}>
                  <Edit size={16} color={COLORS.primary} />
                  <Text style={[styles.detailActionButtonText, styles.detailEditButtonText]}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.detailActionButton, styles.detailFotoButton]} onPress={onManageFotos} activeOpacity={0.7}>
                  <ImageIcon size={16} color={COLORS.primary} />
                  <Text style={[styles.detailActionButtonText, styles.detailFotoButtonText]}>Fotos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.detailActionButton, styles.detailDeleteButton]} onPress={() => { onClose(); onDelete(); }} activeOpacity={0.7}>
                  <Trash2 size={16} color={COLORS.danger} />
                  <Text style={[styles.detailActionButtonText, styles.detailDeleteButtonText]}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <FotoGalleryModal
        visible={isGalleryVisible}
        onClose={() => setIsGalleryVisible(false)}
        fotos={fotosComBase64}
        initialIndex={selectedPhotoIndex}
      />
    </>
  );
};

// --- TELA PRINCIPAL ---
export default function ManageAreasScreen(): JSX.Element {
  const [areas, setAreas] = useState<AreaComum[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState<boolean>(false);
  const [editingArea, setEditingArea] = useState<AreaComum | null>(null);
  const [selectedArea, setSelectedArea] = useState<AreaComum | null>(null);
  const [isFotoModalVisible, setIsFotoModalVisible] = useState(false);
  const [selectedAreaForFotos, setSelectedAreaForFotos] = useState<number | null>(null);

  const fetchAreas = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const areasData = await api.get('/admin/areas-comuns');
      setAreas(areasData || []);
    } catch (error: any) {
      console.error('❌ Erro ao buscar áreas:', error);
      Alert.alert("Erro ao carregar áreas", error.message || "Não foi possível carregar as áreas comuns.");
      setAreas([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const onRefresh = useCallback((): void => {
    fetchAreas();
  }, []);

  const handleAddNew = (): void => {
    setEditingArea(null);
    setIsModalVisible(true);
  };

  const handleCardPress = (area: AreaComum): void => {
    setSelectedArea(area);
    setIsDetailModalVisible(true);
  };

  const handleEdit = (area: AreaComum): void => {
    setEditingArea(area);
    setIsModalVisible(true);
  };

  const handleDelete = (id: number, name: string): void => {
    Alert.alert(
      "Confirmar Exclusão",
      `Deseja realmente excluir "${name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/admin/areas-comuns/${id}`);
              Alert.alert("Sucesso", "Área excluída com sucesso!");
              fetchAreas();
            } catch (error: any) {
              console.error('❌ Erro ao excluir área:', error);
              Alert.alert("Erro", error.message || "Não foi possível excluir a área.");
            }
          }
        }
      ]
    );
  };

  const handleSave = (): void => {
    setIsModalVisible(false);
    setEditingArea(null);
    fetchAreas();
  };

  const renderItem = ({ item }: { item: AreaComum }): JSX.Element => (
    <AreaCardItem item={item} onCardPress={handleCardPress} />
  );

  const renderEmptyComponent = (): JSX.Element => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Grid3X3 size={56} color={COLORS.primary} /></View>
      <Text style={styles.emptyText}>Nenhuma área cadastrada</Text>
      <Text style={styles.emptySubtext}>
        Comece adicionando uma nova área comum para o condomínio gerenciar reservas
      </Text>
      <TouchableOpacity onPress={handleAddNew} style={styles.emptyButton} activeOpacity={0.8}>
        <Plus size={20} color="white" />
        <Text style={styles.emptyButtonText}>Adicionar Primeira Área</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Áreas Comuns</Text>
          <Text style={styles.headerSubtitle}>
            {areas.length} {areas.length === 1 ? 'área cadastrada' : 'áreas cadastradas'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleAddNew} style={styles.addButton} activeOpacity={0.8}>
          <Plus size={22} color="white" />
          <Text style={styles.buttonText}>Nova</Text>
        </TouchableOpacity>
      </View>

      {isLoading && areas.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Carregando áreas...</Text>
        </View>
      ) : (
        <FlatList
          data={areas}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl 
              refreshing={isLoading && areas.length > 0} 
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={renderEmptyComponent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <AreaDetailModal
        visible={isDetailModalVisible}
        onClose={() => {
          setIsDetailModalVisible(false);
          setSelectedArea(null);
        }}
        area={selectedArea}
        onEdit={() => selectedArea && handleEdit(selectedArea)}
        onDelete={() => selectedArea && handleDelete(selectedArea.id, selectedArea.nome)}
        onManageFotos={() => {
          if (selectedArea) {
            setIsDetailModalVisible(false);
            setSelectedAreaForFotos(selectedArea.id);
            setIsFotoModalVisible(true);
          }
        }}
      />

      {isModalVisible && (
        <AreaFormModal 
          visible={isModalVisible} 
          onClose={() => {
            setIsModalVisible(false);
            setEditingArea(null);
          }} 
          onSave={handleSave} 
          areaToEdit={editingArea} 
        />
      )}

      {isFotoModalVisible && selectedAreaForFotos && (
        <FotoAreaComumManager
          areaComumId={selectedAreaForFotos}
          visible={isFotoModalVisible}
          onClose={() => {
            setIsFotoModalVisible(false);
            setSelectedAreaForFotos(null);
            fetchAreas();
          }}
        />
      )}
    </SafeAreaView>
  );
}

// --- MODAL DE FORMULÁRIO ---
const AreaFormModal: React.FC<AreaFormModalProps> = ({ visible, onClose, onSave, areaToEdit }) => {
  const [nome, setNome] = useState<string>('');
  const [descricao, setDescricao] = useState<string>('');
  const [valorTaxa, setValorTaxa] = useState<string>('');
  const [icone, setIcone] = useState<string>(Object.keys(iconesDisponiveis)[0]);
  const [ativa, setAtiva] = useState<boolean>(true);
  const [tiposReserva, setTiposReserva] = useState<TiposReservaState>({ POR_HORA: false, POR_PERIODO: false, DIARIA: false });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [allRules, setAllRules] = useState<Regra[]>([]);
  const [selectedRuleIds, setSelectedRuleIds] = useState<Set<number>>(new Set());
  const [isLoadingRules, setIsLoadingRules] = useState<boolean>(true);
  const [expandedRuleId, setExpandedRuleId] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      const fetchAllRules = async () => {
        setIsLoadingRules(true);
        try {
          const rulesData = await api.get('/admin/regras');
          setAllRules(rulesData || []);
        } catch (error: any) {
          Alert.alert("Erro ao Carregar Regras", error.message || "Não foi possível buscar as regras disponíveis.");
          setAllRules([]);
        } finally {
          setIsLoadingRules(false);
        }
      };
      fetchAllRules();
    }
  }, [visible]);
  
  useEffect(() => {
    if (visible) {
      if (areaToEdit) {
        setNome(areaToEdit.nome || '');
        setDescricao(areaToEdit.descricao || '');
        setValorTaxa(areaToEdit.valorTaxa?.toString() || '');
        setIcone(areaToEdit.icone || Object.keys(iconesDisponiveis)[0]);
        setAtiva(areaToEdit.ativa);
        
        const tiposAtivos: TiposReservaState = { POR_HORA: false, POR_PERIODO: false, DIARIA: false };
        areaToEdit.tiposReservaDisponiveis?.forEach((tipo: TipoReserva) => {
          if (tipo in tiposAtivos) tiposAtivos[tipo] = true;
        });
        setTiposReserva(tiposAtivos);
        
        const initialRuleIds = new Set(areaToEdit.regras?.map(r => r.id) || []);
        setSelectedRuleIds(initialRuleIds);

      } else {
        setNome('');
        setDescricao('');
        setValorTaxa('');
        setIcone(Object.keys(iconesDisponiveis)[0]);
        setAtiva(true);
        setTiposReserva({ POR_HORA: false, POR_PERIODO: false, DIARIA: false });
        setSelectedRuleIds(new Set());
      }
      setExpandedRuleId(null);
    }
  }, [areaToEdit, visible]);

  const handleCheckboxChange = (tipo: keyof TiposReservaState): void => {
    setTiposReserva(prev => ({ ...prev, [tipo]: !prev[tipo] }));
  };

  const handleRuleSelectionChange = (ruleId: number) => {
    setSelectedRuleIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ruleId)) newSet.delete(ruleId);
      else newSet.add(ruleId);
      return newSet;
    });
  };

  const handleSubmit = async (): Promise<void> => {
    if (!nome.trim()) {
      Alert.alert("Campo Obrigatório", "O nome da área é obrigatório.");
      return;
    }
    
    const tiposReservaDisponiveis = (Object.keys(tiposReserva) as TipoReserva[]).filter(key => tiposReserva[key as keyof TiposReservaState]);
    if (tiposReservaDisponiveis.length === 0) {
      Alert.alert("Campo Obrigatório", "Selecione pelo menos um tipo de reserva.");
      return;
    }
    
    setIsSubmitting(true);
    
    const payload: AreaComumRequestPayload = {
      nome: nome.trim(),
      descricao: descricao.trim(),
      icone,
      ativa,
      valorTaxa: parseFloat(valorTaxa) || 0.0,
      tiposReservaDisponiveis,
      regraIds: Array.from(selectedRuleIds),
      condominioId: 1,
    };

    try {
      if (areaToEdit) {
        await api.put(`/admin/areas-comuns/${areaToEdit.id}`, payload);
      } else {
        await api.post('/admin/areas-comuns', payload);
      }
      Alert.alert("Sucesso", `Área comum ${areaToEdit ? 'atualizada' : 'criada'} com sucesso!`);
      onSave();
    } catch (error: any) {
      console.error('❌ Erro ao salvar área:', error);
      Alert.alert("Erro", error.message || 'Não foi possível salvar a área comum');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRuleExpansion = (ruleId: number) => {
    setExpandedRuleId(prev => prev === ruleId ? null : ruleId);
  };
  
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.formModalContent}>
          <View style={styles.formModalHeader}>
            <View style={styles.formHeaderLeft}>
              <View style={styles.formHeaderIcon}>
                {iconesDisponiveis[icone] || iconesDisponiveis['Admin']}
              </View>
              <View>
                <Text style={styles.formModalTitle}>{areaToEdit ? 'Editar Área' : 'Nova Área'}</Text>
                <Text style={styles.formModalSubtitle}>{areaToEdit ? 'Atualize as informações' : 'Cadastre uma nova área'}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.formCloseButton}>
              <X size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        
          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScrollContent}>
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Informações Básicas</Text>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nome da Área <Text style={styles.required}>*</Text></Text>
                <Input value={nome} onChangeText={setNome} placeholder="Ex: Salão de Festas" style={styles.formInput} placeholderTextColor={COLORS.textTertiary}/>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Descrição</Text>
                <Textarea value={descricao} onChangeText={setDescricao} placeholder="Breve descrição da área..." style={styles.formTextarea} numberOfLines={3} placeholderTextColor={COLORS.textTertiary}/>
              </View>
              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Taxa de Reserva (R$)</Text>
                  <Input value={valorTaxa} onChangeText={setValorTaxa} placeholder="0.00" keyboardType="numeric" style={styles.formInput} placeholderTextColor={COLORS.textTertiary}/>
                </View>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Ícone</Text>
                  <View style={styles.formPickerContainer}>
                    <Picker selectedValue={icone} onValueChange={(value: string) => setIcone(value)} style={styles.formPicker}>
                      {Object.keys(iconesDisponiveis).map((key: string) => (<Picker.Item key={key} label={key} value={key} />))}
                    </Picker>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Tipos de Reserva <Text style={styles.required}>*</Text></Text>
              <View style={styles.checkboxGroup}>
                {tiposDeReserva.map((tipo: TipoReserva) => (
                  <Checkbox key={tipo} label={formatarTipoReserva(tipo)} checked={tiposReserva[tipo]} onChange={() => handleCheckboxChange(tipo)} />
                ))}
              </View>
            </View>
            
            <View style={styles.formSection}>
              <View style={styles.detailSectionHeaderWithInfo}>
                <Text style={styles.sectionTitle}>Regras de Uso</Text>
                {allRules.length > 0 && (
                  <View style={styles.detailInfoBadge}>
                    <Info size={10} color={COLORS.primary} />
                    <Text style={styles.detailInfoTextSmall}>Toque para ver descrição</Text>
                  </View>
                )}
              </View>
              {isLoadingRules ? (
                <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
              ) : allRules.length > 0 ? (
                <View style={styles.formRulesContainer}>
                  {allRules.map(rule => {
                    const isSelected = selectedRuleIds.has(rule.id);
                    const isExpanded = expandedRuleId === rule.id;
                    const hasDescription = rule.descricao && rule.descricao.trim().length > 0;

                    return (
                      <View key={rule.id} style={styles.formRuleCard}>
                        <View style={styles.formRuleMainRow}>
                          <TouchableOpacity 
                            style={styles.formRuleCheckboxRow}
                            onPress={() => handleRuleSelectionChange(rule.id)}
                            activeOpacity={0.7}
                          >
                            <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                              {isSelected && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                            <Text style={[styles.formRuleTitle, isSelected && styles.formRuleTitleSelected]}>
                              {rule.titulo}
                            </Text>
                          </TouchableOpacity>
                          {hasDescription && (
                            <TouchableOpacity 
                              style={styles.formRuleExpandButton}
                              onPress={() => toggleRuleExpansion(rule.id)}
                              activeOpacity={0.7}
                            >
                              {isExpanded ? (
                                <ChevronUp size={18} color={COLORS.primary} />
                              ) : (
                                <ChevronDown size={18} color={COLORS.textSecondary} />
                              )}
                            </TouchableOpacity>
                          )}
                        </View>
                        {isExpanded && hasDescription && (
                          <View style={styles.formRuleDescription}>
                            <View style={styles.formRuleDescriptionDivider} />
                            <Text style={styles.formRuleDescriptionText}>{rule.descricao}</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.emptySubtext}>Nenhuma regra cadastrada no sistema. Crie-as primeiro no painel de regras.</Text>
              )}
            </View>
            
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Status da Área</Text>
              <View style={styles.statusCard}>
                <View style={styles.statusInfo}>
                  <Text style={styles.statusLabel}>Área Ativa</Text>
                  <Text style={styles.statusDescription}>{ativa ? 'Disponível para reservas' : 'Temporariamente indisponível'}</Text>
                </View>
                <Switch value={ativa} onValueChange={setAtiva} trackColor={{ false: '#cbd5e1', true: COLORS.success }} thumbColor={COLORS.white}/>
              </View>
            </View>
          </ScrollView>
        
          <View style={styles.formModalFooter}>
            <TouchableOpacity onPress={onClose} style={styles.formCancelButton} disabled={isSubmitting} activeOpacity={0.7}>
              <Text style={styles.formCancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSubmit} style={[styles.formSaveButton, isSubmitting && styles.formSaveButtonDisabled]} disabled={isSubmitting} activeOpacity={0.8}>
              {isSubmitting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  {areaToEdit ? <Edit size={18} color={COLORS.white} /> : <Plus size={18} color={COLORS.white} />}
                  <Text style={styles.formSaveButtonText}>{areaToEdit ? 'Salvar Alterações' : 'Criar Área'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}