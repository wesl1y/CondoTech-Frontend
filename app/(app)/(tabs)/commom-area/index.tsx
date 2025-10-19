// app/(app)/(tabs)/manage-reservations/index.tsx

import api from '@/services/api';
import React, { JSX, useCallback, useEffect, useState } from 'react';
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
          ListEmptyComponent={<EmptyAreasComponent onAddPress={handleAddNew} />}
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