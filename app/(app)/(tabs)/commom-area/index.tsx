// app/(app)/(tabs)/manage-reservations/index.tsx

import api from '@/services/api';
import React, { JSX, useCallback, useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, View } from 'react-native';

import AreaCardItem from '@/components/manage-areas/AreaCardItem';
import EmptyAreasComponent from '@/components/manage-areas/EmptyAreasComponent';
import FotoAreaComumManager from '@/components/manage-areas/FotoAreaComumManager';
import HeaderSection from '@/components/manage-areas/HeaderSection';
import AreaDetailModal from '@/components/manage-areas/modals/AreaDetailModal';
import AreaFormModal from '@/components/manage-areas/modals/AreaFormModal';
import { AreaComum } from '@/components/types/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, styles } from '../../../../styles/common-area/styles';

export default function CommomAreaScreen(): JSX.Element {
  const [areas, setAreas] = useState<AreaComum[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState<boolean>(false);
  const [editingArea, setEditingArea] = useState<AreaComum | null>(null);
  const [selectedArea, setSelectedArea] = useState<AreaComum | null>(null);
  const [isFotoModalVisible, setIsFotoModalVisible] = useState(false);
  const [selectedAreaForFotos, setSelectedAreaForFotos] = useState<number | null>(null);
  
  // Ref para controlar se o componente está montado
  const isMountedRef = useRef<boolean>(true);

  const fetchAreas = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const areasData = await api.get('/admin/areas-comuns');
      
      // Validação robusta dos dados recebidos
      if (!Array.isArray(areasData)) {
        console.warn('⚠️ Dados recebidos não são um array:', areasData);
        throw new Error('Formato de dados inválido recebido da API');
      }
      
      // Atualiza estado apenas se componente ainda estiver montado
      if (isMountedRef.current) {
        setAreas(areasData);
      }
    } catch (error: any) {
      console.error('❌ Erro ao buscar áreas:', error);
      
      if (isMountedRef.current) {
        Alert.alert(
          "Erro ao carregar áreas", 
          error.message || "Não foi possível carregar as áreas comuns."
        );
        setAreas([]);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchAreas();

    // Cleanup quando componente desmontar
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const onRefresh = useCallback((): void => {
    if (isMountedRef.current) {
      fetchAreas();
    }
  }, []);

  const handleAddNew = (): void => {
    setEditingArea(null);
    setIsModalVisible(true);
  };

  const handleCardPress = useCallback((area: AreaComum): void => {
    if (!area || !area.id) {
      console.warn('⚠️ Área inválida selecionada:', area);
      return;
    }
    setSelectedArea(area);
    setIsDetailModalVisible(true);
  }, []);

  const handleEdit = useCallback((area: AreaComum): void => {
    if (!area || !area.id) {
      console.warn('⚠️ Área inválida para edição:', area);
      Alert.alert("Erro", "Dados da área inválidos");
      return;
    }
    setIsDetailModalVisible(false);
    setEditingArea(area);
    setIsModalVisible(true);
  }, []);

  const handleDelete = useCallback((id: number, name: string): void => {
    if (!id || !name) {
      console.warn('⚠️ Dados inválidos para exclusão:', { id, name });
      Alert.alert("Erro", "Dados inválidos para exclusão");
      return;
    }

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
              
              if (isMountedRef.current) {
                setIsDetailModalVisible(false);
                setSelectedArea(null);
                Alert.alert("Sucesso", "Área excluída com sucesso!");
                fetchAreas();
              }
            } catch (error: any) {
              console.error('❌ Erro ao excluir área:', error);
              
              if (isMountedRef.current) {
                Alert.alert(
                  "Erro", 
                  error.message || "Não foi possível excluir a área."
                );
              }
            }
          }
        }
      ]
    );
  }, []);

  const handleSave = useCallback((): void => {
    setIsModalVisible(false);
    setEditingArea(null);
    
    if (isMountedRef.current) {
      fetchAreas();
    }
  }, []);

  const handleManageFotos = useCallback((area: AreaComum | null): void => {
    if (!area || !area.id) {
      console.warn('⚠️ Área inválida para gerenciar fotos:', area);
      Alert.alert("Erro", "Dados da área inválidos");
      return;
    }

    setIsDetailModalVisible(false);
    setSelectedArea(null);
    
    // Pequeno delay para garantir que o modal anterior fechou
    setTimeout(() => {
      if (isMountedRef.current) {
        setSelectedAreaForFotos(area.id);
        setIsFotoModalVisible(true);
      }
    }, 100);
  }, []);

  const handleCloseDetailModal = useCallback((): void => {
    setIsDetailModalVisible(false);
    setSelectedArea(null);
  }, []);

  const handleCloseFormModal = useCallback((): void => {
    setIsModalVisible(false);
    setEditingArea(null);
  }, []);

  const handleCloseFotoModal = useCallback((): void => {
    setIsFotoModalVisible(false);
    setSelectedAreaForFotos(null);
    
    if (isMountedRef.current) {
      fetchAreas();
    }
  }, []);

  const renderItem = useCallback(({ item }: { item: AreaComum }): JSX.Element => {
    if (!item || !item.id) {
      console.warn('⚠️ Item inválido no FlatList:', item);
      return <View />;
    }
    return <AreaCardItem item={item} onCardPress={handleCardPress} />;
  }, [handleCardPress]);

  const keyExtractor = useCallback((item: AreaComum): string => {
    return item?.id?.toString() || `temp-${Math.random()}`;
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderSection 
        areasCount={areas.length}
        onAddNewPress={handleAddNew}
      />

      {isLoading && areas.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={areas}
          keyExtractor={keyExtractor}
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
          ListEmptyComponent={<EmptyAreasComponent onAddPress={handleAddNew} />}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      )}

      <AreaDetailModal
        visible={isDetailModalVisible}
        onClose={handleCloseDetailModal}
        area={selectedArea}
        onEdit={() => selectedArea && handleEdit(selectedArea)}
        onDelete={() => selectedArea && handleDelete(selectedArea.id, selectedArea.nome)}
        onManageFotos={() => handleManageFotos(selectedArea)}
      />

      {isModalVisible && (
        <AreaFormModal 
          visible={isModalVisible} 
          onClose={handleCloseFormModal} 
          onSave={handleSave} 
          areaToEdit={editingArea} 
        />
      )}

      {isFotoModalVisible && selectedAreaForFotos && (
        <FotoAreaComumManager
          areaComumId={selectedAreaForFotos}
          visible={isFotoModalVisible}
          onClose={handleCloseFotoModal}
        />
      )}
    </SafeAreaView>
  );
}