// Localização: components/ui/Button.tsx (ATUALIZADO)

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

type ButtonVariant = 'default' | 'outline';

interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
}

export function Button({ children, style, disabled, variant = 'default', ...props }: ButtonProps) {
  const variantStyles = buttonVariants[variant] || buttonVariants.default;

  return (
    <TouchableOpacity
      style={[styles.buttonBase, variantStyles.container, disabled && styles.disabled, style]}
      disabled={disabled}
      {...props}
    >
      {React.Children.map(children, child => {
        if (typeof child === 'string') {
          return <Text style={[styles.textBase, variantStyles.text]}>{child}</Text>;
        }
        return child; // Renderiza ícones ou outros componentes
      })}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  textBase: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});

const buttonVariants = {
  default: {
    container: {
      backgroundColor: '#2563eb',
    },
    text: {
      color: '#ffffff',
    },
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: '#d1d5db',
    },
    text: {
      color: '#374151',
      fontWeight: '500' as const,
    },
  },
};