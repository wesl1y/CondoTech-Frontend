// Location: components/ui/Separator.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';

export function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  separator: {
    height: 1,
    width: '100%',
    backgroundColor: '#e5e7eb', // gray-200
  },
});