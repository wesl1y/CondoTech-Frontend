// app/(app)/(tabs)/manage-reservations/components/Checkbox.tsx
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../../styles/common-area/styles';
import { CheckboxProps } from '../types/types';

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

export default Checkbox;