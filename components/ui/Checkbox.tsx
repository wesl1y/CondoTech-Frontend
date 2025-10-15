import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CheckSquare, Square } from 'lucide-react-native';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, checked, onChange }) => {
  return (
    <Pressable style={styles.container} onPress={() => onChange(!checked)}>
      {checked ? 
        <CheckSquare size={24} color="#2563eb" /> : 
        <Square size={24} color="#6b7280" />
      }
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  label: {
    fontSize: 16,
    color: '#374151',
  },
});