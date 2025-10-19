import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { X, Upload, Trash2, Star, Image as ImageIcon, CheckCircle, Circle } from 'lucide-react-native';
import api from '@/services/api';
import { API_URL } from '@/constants/api';

const { width } = Dimensions.get('window');
const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  background: '#f8fafc',
  white: '#ffffff',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
};

interface Foto {
  id: number;
  url: string;
  nomeArquivo: string;
  ordem: number;
  principal: boolean;
  urlBase64?: string;
}

interface FotoAreaComumManagerProps {
  areaComumId: number;
  visible: boolean;
  onClose: () => void;
}

const loadImageAsBase64 = async (imageUrl: string): Promise<string | null> => {
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

const FotoAreaComumManager: React.FC<FotoAreaComumManagerProps> = ({
  areaComumId,
  visible,
  onClose,
}) => {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingImageIds, setLoadingImageIds] = useState<Set<number>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [uploadProgress, setUploadProgress] = useState<string>('');

  useEffect(() => {
    if (visible) {
      fetchFotos();
      setSelectionMode(false);
      setSelectedIds(new Set());
    }
  }, [visible, areaComumId]);

  const fetchFotos = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/admin/areas-comuns/${areaComumId}/fotos`);
      setFotos(response || []);
      carregarTodasAsImagens(response || []);
    } catch (error: any) {
      console.error('Erro ao carregar fotos:', error);
      Alert.alert('Erro', 'Não foi possível carregar as fotos');
    } finally {
      setIsLoading(false);
    }
  };

  const carregarTodasAsImagens = async (fotosData: Foto[]) => {
    if (!fotosData || fotosData.length === 0) return;

    const promises = fotosData.map(async (foto) => {
      if (foto.urlBase64) return foto;

      setLoadingImageIds(prev => new Set([...prev, foto.id]));
      
      try {
        const base64 = await loadImageAsBase64(foto.url);
        setFotos(prev =>
          prev.map(f =>
            f.id === foto.id ? { ...f, urlBase64: base64 || undefined } : f
          )
        );
      } catch (error) {
        console.error(`Erro ao carregar imagem ${foto.id}:`, error);
      } finally {
        setLoadingImageIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(foto.id);
          return newSet;
        });
      }
    });

    await Promise.all(promises);
  };

  const pickMultipleImages = async () => {
    const remainingSlots = 10 - fotos.length;
    if (remainingSlots <= 0) {
      Alert.alert('Limite Atingido', 'Você pode adicionar no máximo 10 fotos por área comum.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão Negada', 'É necessário permitir o acesso à galeria de fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const assetsToUpload = result.assets.slice(0, remainingSlots);
      
      if (result.assets.length > remainingSlots) {
        Alert.alert(
          'Limite de Fotos',
          `Você selecionou ${result.assets.length} fotos, mas só há espaço para ${remainingSlots}. Apenas as primeiras ${remainingSlots} serão enviadas.`
        );
      }

      uploadMultipleFotos(assetsToUpload.map(asset => asset.uri));
    }
  };

  const uploadMultipleFotos = async (uris: string[]) => {
    setIsUploading(true);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < uris.length; i++) {
      setUploadProgress(`Enviando ${i + 1}/${uris.length}...`);
      
      try {
        const formData = new FormData();
        const uri = uris[i];
        const filename = uri.split('/').pop() || `photo_${i}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('foto', {
          uri,
          name: filename,
          type,
        } as any);

        formData.append('principal', (fotos.length === 0 && i === 0) ? 'true' : 'false');

        await api.postFormData(
          `/admin/areas-comuns/${areaComumId}/fotos`,
          formData
        );
        
        successCount++;
      } catch (error: any) {
        console.error(`Erro ao fazer upload da foto ${i + 1}:`, error);
        failCount++;
      }
    }

    setIsUploading(false);
    setUploadProgress('');

    if (successCount > 0) {
      Alert.alert(
        'Upload Concluído',
        `${successCount} foto(s) enviada(s) com sucesso!${failCount > 0 ? ` ${failCount} falhou.` : ''}`
      );
      fetchFotos();
    } else {
      Alert.alert('Erro', 'Não foi possível enviar as fotos');
    }
  };

  const toggleSelection = (fotoId: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fotoId)) {
        newSet.delete(fotoId);
      } else {
        newSet.add(fotoId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === fotos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(fotos.map(f => f.id)));
    }
  };

  const deleteSelectedFotos = () => {
    const count = selectedIds.size;
    const hasPrincipal = fotos.some(f => selectedIds.has(f.id) && f.principal);

    Alert.alert(
      'Confirmar Exclusão',
      `Deseja remover ${count} foto(s) selecionada(s)?${hasPrincipal ? '\n\n⚠️ A foto principal será removida.' : ''}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            let successCount = 0;
            let failCount = 0;

            for (const fotoId of Array.from(selectedIds)) {
              try {
                await api.deleteAuth(`/admin/areas-comuns/${areaComumId}/fotos/${fotoId}`);
                successCount++;
              } catch (error) {
                console.error(`Erro ao deletar foto ${fotoId}:`, error);
                failCount++;
              }
            }

            setIsLoading(false);
            setSelectionMode(false);
            setSelectedIds(new Set());

            if (successCount > 0) {
              Alert.alert(
                'Exclusão Concluída',
                `${successCount} foto(s) removida(s)!${failCount > 0 ? ` ${failCount} falhou.` : ''}`
              );
              fetchFotos();
            } else {
              Alert.alert('Erro', 'Não foi possível remover as fotos');
            }
          },
        },
      ]
    );
  };

  const setPrincipal = async (fotoId: number) => {
    try {
      await api.put(`/admin/areas-comuns/${areaComumId}/fotos/${fotoId}/principal`, {});
      Alert.alert('Sucesso', 'Foto principal atualizada!');
      fetchFotos();
    } catch (error: any) {
      console.error('Erro ao definir principal:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a foto principal');
    }
  };

  const renderFotoItem = ({ item }: { item: Foto }) => {
    const isLoadingImage = loadingImageIds.has(item.id);
    const hasBase64 = !!item.urlBase64;
    const isSelected = selectedIds.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.fotoCard, isSelected && styles.fotoCardSelected]}
        onPress={() => selectionMode ? toggleSelection(item.id) : null}
        onLongPress={() => {
          if (!selectionMode) {
            setSelectionMode(true);
            toggleSelection(item.id);
          }
        }}
        activeOpacity={0.8}
      >
        {isLoadingImage ? (
          <View style={[styles.fotoImage, styles.imageLoadingContainer]}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : hasBase64 ? (
          <Image
            source={{ uri: item.urlBase64 }}
            style={styles.fotoImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.fotoImage, styles.imageErrorContainer]}>
            <ImageIcon size={32} color={COLORS.textSecondary} />
            <Text style={styles.imageErrorText}>Erro ao carregar</Text>
          </View>
        )}
        
        {/* Checkbox de Seleção */}
        {selectionMode && (
          <View style={styles.selectionCheckbox}>
            {isSelected ? (
              <CheckCircle size={24} color={COLORS.primary} fill={COLORS.primary} />
            ) : (
              <Circle size={24} color={COLORS.white} />
            )}
          </View>
        )}

        {/* Badge Principal */}
        {item.principal && !selectionMode && (
          <View style={styles.principalBadge}>
            <Star size={14} color={COLORS.warning} fill={COLORS.warning} />
            <Text style={styles.principalBadgeText}>Principal</Text>
          </View>
        )}

        {/* Ações (apenas quando não está em modo seleção) */}
        {!selectionMode && (
          <View style={styles.fotoActions}>
            {!item.principal && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setPrincipal(item.id)}
                activeOpacity={0.7}
              >
                <Star size={18} color={COLORS.warning} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Nome do arquivo */}
        <View style={styles.fotoInfo}>
          <Text style={styles.fotoNome} numberOfLines={1}>
            {item.nomeArquivo}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <ImageIcon size={64} color={COLORS.textSecondary} />
      <Text style={styles.emptyText}>Nenhuma foto adicionada</Text>
      <Text style={styles.emptySubtext}>
        Adicione fotos para destacar esta área comum
      </Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>
                {selectionMode ? `${selectedIds.size} selecionada(s)` : 'Gerenciar Fotos'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {fotos.length}/10 fotos adicionadas
              </Text>
            </View>
            
            {selectionMode ? (
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  onPress={selectAll} 
                  style={styles.headerButton}
                >
                  <Text style={styles.headerButtonText}>
                    {selectedIds.size === fotos.length ? 'Desmarcar' : 'Todas'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => {
                    setSelectionMode(false);
                    setSelectedIds(new Set());
                  }} 
                  style={styles.headerButton}
                >
                  <Text style={styles.headerButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Lista de Fotos */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Carregando fotos...</Text>
            </View>
          ) : (
            <FlatList
              data={fotos}
              renderItem={renderFotoItem}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              contentContainerStyle={styles.fotosList}
              ListEmptyComponent={renderEmptyComponent}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Footer - Botões de Ação */}
          <View style={styles.footer}>
            {selectionMode && selectedIds.size > 0 ? (
              <TouchableOpacity
                style={[styles.uploadButton, styles.deleteButtonLarge]}
                onPress={deleteSelectedFotos}
                activeOpacity={0.8}
              >
                <Trash2 size={20} color={COLORS.white} />
                <Text style={styles.uploadButtonText}>
                  Excluir {selectedIds.size} foto(s)
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.uploadButton,
                    (isUploading || fotos.length >= 10) && styles.uploadButtonDisabled,
                  ]}
                  onPress={pickMultipleImages}
                  disabled={isUploading || fotos.length >= 10}
                  activeOpacity={0.8}
                >
                  {isUploading ? (
                    <>
                      <ActivityIndicator color={COLORS.white} size="small" />
                      <Text style={styles.uploadButtonText}>{uploadProgress}</Text>
                    </>
                  ) : (
                    <>
                      <Upload size={20} color={COLORS.white} />
                      <Text style={styles.uploadButtonText}>
                        {fotos.length >= 10 ? 'Limite Atingido' : 'Adicionar Fotos'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                
                {fotos.length > 0 && !selectionMode && (
                  <TouchableOpacity
                    style={styles.selectionModeButton}
                    onPress={() => setSelectionMode(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.selectionModeButtonText}>
                      Selecionar para excluir
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  fotosList: {
    padding: 16,
    paddingBottom: 120,
  },
  fotoCard: {
    width: (width - 48) / 2,
    marginBottom: 16,
    marginHorizontal: 4,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fotoCardSelected: {
    borderColor: COLORS.primary,
    borderWidth: 3,
  },
  fotoImage: {
    width: '100%',
    height: 140,
    backgroundColor: COLORS.background,
  },
  imageLoadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageErrorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  imageErrorText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  selectionCheckbox: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: 2,
  },
  principalBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  principalBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.warning,
  },
  fotoActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'column',
    gap: 6,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  fotoInfo: {
    padding: 10,
    backgroundColor: COLORS.background,
  },
  fotoNome: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  uploadButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.6,
  },
  deleteButtonLarge: {
    backgroundColor: COLORS.danger,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  selectionModeButton: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  selectionModeButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});

export default FotoAreaComumManager;