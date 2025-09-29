import React from 'react';
import { View, Text, StyleSheet, ViewProps, TextProps } from 'react-native';

// TRADUÇÃO: O Card, Header, Content e Title eram divs e h1/p.
// Agora são componentes View e Text com estilos aplicados via `style`.

export const Card = ({ style, ...props }: ViewProps) => (
  <View style={[styles.card, style]} {...props} />
);

export const CardHeader = ({ style, ...props }: ViewProps) => (
  <View style={[styles.cardHeader, style]} {...props} />
);

export const CardContent = ({ style, ...props }: ViewProps) => (
  <View style={[styles.cardContent, style]} {...props} />
);

export const CardTitle = ({ style, ...props }: TextProps) => (
  <Text style={[styles.cardTitle, style]} {...props} />
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb', // border-gray-200
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    paddingBottom: 16,
  },
  cardContent: {
    padding: 16,
    gap: 16, // Equivalente ao space-y-4
  },
  cardTitle: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#111827', // text-gray-900
  },
});