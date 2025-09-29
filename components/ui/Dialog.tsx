// Localização: components/ui/Dialog.tsx

import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { X } from 'lucide-react-native';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={open}
      onRequestClose={() => onOpenChange(false)}
    >
      <View style={styles.centeredView}>
        <SafeAreaView style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={() => onOpenChange(false)}>
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
          {children}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

export const DialogContent = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.content}>{children}</View>
);
export const DialogHeader = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.header}>{children}</View>
);
export const DialogTitle = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.title}>{children}</Text>
);
export const DialogDescription = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.description}>{children}</Text>
);

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    width: '100%',
    maxHeight: '90%',
  },
  content: { gap: 16 },
  header: { marginBottom: 16, gap: 4 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  description: { fontSize: 14, color: '#6b7280' },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
});