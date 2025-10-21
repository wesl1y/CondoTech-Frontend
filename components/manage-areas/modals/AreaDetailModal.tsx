// app/(app)/(tabs)/manage-reservations/components/modals/AreaDetailModal.tsx
import { Badge } from '@/components/ui/badge';
import { Edit, ImageIcon, Trash2, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, styles } from '../../../styles/common-area/styles';
import { AreaDetailModalProps } from '../../types/types';
import { formatarTipoReserva, loadImageAsBase64 } from '../../utils/helpers';
import RuleItem from '../RuleItem';
import FotoGalleryModal from './FotoGalleryModal';

const AreaDetailModal: React.FC<AreaDetailModalProps> = ({ 
  visible, 
  onClose, 
  area,
  mode = 'admin', // Padrão: modo admin com todos os botões
  onEdit, 
  onDelete, 
  onManageFotos 
}) => {
  const [fotosComBase64, setFotosComBase64] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const isViewMode = mode === 'view';

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

  const primeiraFoto = fotosComBase64.find(foto => foto.principal) || fotosComBase64[0] || null;


  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.detailModalOverlay}>
          <View style={styles.detailModalContent}>
            <View style={{ flex: 1 }}>
              <View style={styles.detailModalHandle} />
            
              {/* Header com imagem */}
              {loadingImages && area.fotos && area.fotos.length > 0 ? (
                <HeaderWithImage 
                  title={area.nome}
                  active={area.ativa}
                  onClose={onClose}
                  imageStyle={[styles.detailModalHeaderImage, styles.imageLoadingContainer]}
                  isLoading
                />
              ) : primeiraFoto?.urlBase64 ? (
                <HeaderWithImage 
                  title={area.nome}
                  active={area.ativa}
                  onClose={onClose}
                  imageUri={primeiraFoto.urlBase64}
                />
              ) : (
                <HeaderWithoutImage 
                  title={area.nome}
                  active={area.ativa}
                  onClose={onClose}
                />
              )}

              {/* Conteúdo */}
              <ScrollView 
                style={styles.detailModalScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.detailModalScrollContent}
              >
                {/* Galeria de fotos */}
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
                          <TouchableOpacity 
                            key={foto.id || index} 
                            style={styles.detailFotoItem} 
                            onPress={() => handleOpenGallery(index)} 
                            activeOpacity={0.8}
                          >
                            <Image 
                              source={{ uri: foto.urlBase64 }} 
                              style={styles.detailFotoImage} 
                              resizeMode="cover" 
                            />
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
                    <DetailRow 
                      label="Descrição"
                      value={area.descricao}
                    />
                  )}
                  <DetailRow 
                    label="Taxa de Reserva"
                    value={area.valorTaxa && area.valorTaxa > 0 
                      ? `R$ ${area.valorTaxa.toFixed(2).replace('.', ',')}` 
                      : 'Gratuito'}
                    valueColor={COLORS.success}
                  />
                  <DetailRow 
                    label="Ícone"
                    value={area.icone || 'Admin'}
                  />
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
                  <RulesSection rules={area.regras} />
                )}
              </ScrollView>

              {/* Footer de ações - Apenas no modo admin */}
              {!isViewMode && (
                <View style={styles.detailActionsFooter}>
                  <TouchableOpacity 
                    style={[styles.detailActionButton, styles.detailEditButton]} 
                    onPress={() => { onClose(); onEdit?.(); }} 
                    activeOpacity={0.7}
                  >
                    <Edit size={16} color={COLORS.primary} />
                    <Text style={[styles.detailActionButtonText, styles.detailEditButtonText]}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.detailActionButton, styles.detailFotoButton]} 
                    onPress={onManageFotos} 
                    activeOpacity={0.7}
                  >
                    <ImageIcon size={16} color={COLORS.primary} />
                    <Text style={[styles.detailActionButtonText, styles.detailFotoButtonText]}>Fotos</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.detailActionButton, styles.detailDeleteButton]} 
                    onPress={() => { onClose(); onDelete?.(); }} 
                    activeOpacity={0.7}
                  >
                    <Trash2 size={16} color={COLORS.danger} />
                    <Text style={[styles.detailActionButtonText, styles.detailDeleteButtonText]}>Excluir</Text>
                  </TouchableOpacity>
                </View>
              )}
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

// Componentes auxiliares

interface HeaderWithImageProps {
  title: string;
  active: boolean;
  onClose: () => void;
  imageUri?: string;
  imageStyle?: any;
  isLoading?: boolean;
}
const HeaderWithImage: React.FC<HeaderWithImageProps> = ({ 
  title, 
  active, 
  onClose, 
  imageUri, 
  imageStyle, 
  isLoading 
}) => (
  <View style={styles.detailModalHeaderWithImage}>
    {isLoading ? (
      <View style={imageStyle}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    ) : (
      <Image source={{ uri: imageUri }} style={styles.detailModalHeaderImage} />
    )}
    <View style={styles.detailModalHeaderOverlay}>
      <Text style={styles.detailModalTitleWithImage}>{title}</Text>
      <Badge variant={active ? 'success' : 'danger'} style={[styles.badge, active ? styles.badgeActive : styles.badgeInactive]}>
        <Text style={[styles.badgeText, active ? styles.badgeTextActive : styles.badgeTextInactive]}>
          {active ? 'Ativa' : 'Inativa'}
        </Text>
      </Badge>
    </View>
    <TouchableOpacity onPress={onClose} style={styles.detailCloseButtonWithImage}>
      <X size={24} color={COLORS.white} />
    </TouchableOpacity>
  </View>
);
interface HeaderWithoutImageProps {
  title: string;
  active: boolean;
  onClose: () => void;
}

const HeaderWithoutImage: React.FC<HeaderWithoutImageProps> = ({ title, active, onClose }) => (
  <View style={styles.detailModalHeader}>
    <View style={styles.detailHeaderContent}>
      <Text style={styles.detailModalTitle}>{title}</Text>
      <Badge variant={active ? 'success' : 'danger'} style={[styles.badge, active ? styles.badgeActive : styles.badgeInactive]}>
        <Text style={[styles.badgeText, active ? styles.badgeTextActive : styles.badgeTextInactive]}>
          {active ? 'Ativa' : 'Inativa'}
        </Text>
      </Badge>
    </View>
    <TouchableOpacity onPress={onClose} style={styles.detailCloseButton}>
      <X size={22} color={COLORS.textSecondary} />
    </TouchableOpacity>
  </View>
);

interface DetailRowProps {
  label: string;
  value: string;
  valueColor?: string;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, valueColor }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, valueColor && { color: valueColor }]}>{value}</Text>
  </View>
);

interface RulesSectionProps {
  rules: any[];
}

const RulesSection: React.FC<RulesSectionProps> = ({ rules }) => (
  <View style={styles.detailSection}>
    <View style={styles.detailSectionHeaderWithInfo}>
      <Text style={styles.detailSectionTitle}>Regras de Uso ({rules.length})</Text>
    </View>
    <View style={styles.detailRulesContainer}>
      {rules.map((regra, index) => (
        <RuleItem key={regra.id} regra={regra} isLast={index === rules.length - 1} />
      ))}
    </View>
  </View>
);

export default AreaDetailModal;