// app/(app)/(tabs)/manage-reservations/components/modals/FotoGalleryModal.tsx
import { X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, styles } from '../../../styles/common-area/styles';
import { FotoGalleryModalProps } from '../../types/types';

const FotoGalleryModal: React.FC<FotoGalleryModalProps> = ({ 
  visible, 
  onClose, 
  fotos, 
  initialIndex 
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : fotos.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev < fotos.length - 1 ? prev + 1 : 0));
  };

  if (fotos.length === 0) return null;

  const currentFoto = fotos[currentIndex];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.galleryModalOverlay}>
        {/* Botão Fechar */}
        <TouchableOpacity 
          style={styles.galleryCloseButton}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <X size={28} color={COLORS.white} />
        </TouchableOpacity>

        {/* Contador */}
        <View style={styles.galleryCounterBadge}>
          <Text style={styles.galleryCounterText}>
            {currentIndex + 1} / {fotos.length}
          </Text>
        </View>

        {/* ScrollView Horizontal para imagens */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width);
            setCurrentIndex(newIndex);
          }}
          contentOffset={{ x: currentIndex * 400, y: 0 }}
        >
          {fotos.map((foto, index) => (
            <View key={foto.id || index} style={styles.galleryImageContainer}>
              {foto.urlBase64 ? (
                <Image
                  source={{ uri: foto.urlBase64 }}
                  style={styles.galleryImage}
                  resizeMode="contain"
                />
              ) : (
                <ActivityIndicator size="large" color={COLORS.white} />
              )}
            </View>
          ))}
        </ScrollView>

        {/* Botões de navegação */}
        {fotos.length > 1 && (
          <>
            <TouchableOpacity 
              style={[styles.galleryNavButton, styles.galleryNavButtonLeft]}
              onPress={handlePrevious}
              activeOpacity={0.8}
            >
              <Text style={styles.galleryNavButtonText}>‹</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.galleryNavButton, styles.galleryNavButtonRight]}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.galleryNavButtonText}>›</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Modal>
  );
};

export default FotoGalleryModal;