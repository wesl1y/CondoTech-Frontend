import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';



export function Input({ style, ...props }: TextInputProps) {
  return (
    <TextInput
      style={[styles.input, style]}
      placeholderTextColor="#9ca3af" // Cor para o placeholder
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 48, // h-12
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e7eb', // border-gray-200
    borderRadius: 12, // rounded-xl
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
  },
});