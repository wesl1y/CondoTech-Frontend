// Localização: components/ui/Textarea.tsx

import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';

export function Textarea({ style, ...props }: TextInputProps) {
  return (
    <TextInput
      style={[styles.textarea, style]}
      placeholderTextColor="#9ca3af"
      multiline
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  textarea: {
    minHeight: 100, // Equivalente a rows={4}
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    textAlignVertical: 'top', // Alinha o texto no topo
  },
});