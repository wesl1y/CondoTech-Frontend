// app/(app)/(tabs)/manage-reservations/components/EmptyAreasComponent.tsx
import { Grid3X3, Plus } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { COLORS, styles } from '../../styles/common-area/styles';

interface EmptyAreasComponentProps {
  onAddPress: () => void;
}

const EmptyAreasComponent: React.FC<EmptyAreasComponentProps> = ({ onAddPress }) => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconContainer}>
      <Grid3X3 size={56} color={COLORS.primary} />
    </View>
    <Text style={styles.emptyText}>Nenhuma área cadastrada</Text>
    <Text style={styles.emptySubtext}>
      Comece adicionando uma nova área comum para o condomínio gerenciar reservas
    </Text>
    <TouchableOpacity onPress={onAddPress} style={styles.emptyButton} activeOpacity={0.8}>
      <Plus size={20} color="white" />
      <Text style={styles.emptyButtonText}>Adicionar Primeira Área</Text>
    </TouchableOpacity>
  </View>
);

export default EmptyAreasComponent;