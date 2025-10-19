// app/(app)/(tabs)/manage-reservations/components/HeaderSection.tsx
import { Plus } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../../styles/common-area/styles';

interface HeaderSectionProps {
  areasCount: number;
  onAddNewPress: () => void;
}

const HeaderSection: React.FC<HeaderSectionProps> = ({ areasCount, onAddNewPress }) => (
  <View style={styles.header}>
    <View style={styles.headerTextContainer}>
      <Text style={styles.headerTitle}>Áreas Comuns</Text>
      <Text style={styles.headerSubtitle}>
        {areasCount} {areasCount === 1 ? 'área cadastrada' : 'áreas cadastradas'}
      </Text>
    </View>
    <TouchableOpacity onPress={onAddNewPress} style={styles.addButton} activeOpacity={0.8}>
      <Plus size={22} color="white" />
      <Text style={styles.buttonText}>Nova</Text>
    </TouchableOpacity>
  </View>
);

export default HeaderSection;