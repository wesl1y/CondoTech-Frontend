// Localização: components/ui/Badge.tsx (ATUALIZADO)

import React from 'react';
import { View, Text, StyleSheet, ViewProps } from 'react-native';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger';

interface BadgeProps extends ViewProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; border?: string }> = {
  default: { bg: '#e5e7eb', text: '#374151', border: undefined },
  secondary: { bg: '#e0e7ff', text: '#3730a3', border: undefined },
  outline: { bg: 'transparent', text: '#4b5563', border: '#d1d5db' },
  success: { bg: '#dcfce7', text: '#166534', border: undefined }, // green
  warning: { bg: '#fef3c7', text: '#b45309', border: undefined }, // yellow
  danger: { bg: '#fee2e2', text: '#b91c1c', border: undefined },   // red
};

export function Badge({ children, variant = 'default', style, ...props }: BadgeProps) {
  const stylesForVariant = variantStyles[variant];

  return (
    <View 
      style={[
        styles.badge, 
        { backgroundColor: stylesForVariant.bg },
        stylesForVariant.border && { borderColor: stylesForVariant.border, borderWidth: 1 },
        style
      ]} 
      {...props}
    >
      <Text style={[styles.text, { color: stylesForVariant.text }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});