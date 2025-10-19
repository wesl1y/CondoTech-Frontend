// app/(app)/(tabs)/manage-reservations/components/AreaCardItem.tsx
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ImageIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, styles } from '../../styles/common-area/styles';
import { AreaItemProps } from '../types/types';
import { loadImageAsBase64, renderIcon } from '../utils/helpers';

const AreaCardItem: React.FC<AreaItemProps> = ({ item, onCardPress }) => {
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [loadingFoto, setLoadingFoto] = useState(false);

  useEffect(() => {
    const loadFoto = async () => {
      if (!item.fotos || item.fotos.length === 0) return;
      
      setLoadingFoto(true);
      const fotoPrincipal = item.fotos.find(foto => foto.principal) || item.fotos[0];
      const base64 = await loadImageAsBase64(fotoPrincipal.url);
      setFotoBase64(base64);
      setLoadingFoto(false);
    };

    loadFoto();
  }, [item.fotos]);
  
  return (
    <TouchableOpacity onPress={() => onCardPress(item)} activeOpacity={0.7}>
      <Card style={styles.areaCard}>
        <View style={styles.cardGradientBorder} />
        
        {item.fotos && item.fotos.length > 0 && (
          <View style={styles.cardImageContainer}>
            {loadingFoto ? (
              <View style={[styles.cardImage, styles.imageLoadingContainer]}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : fotoBase64 ? (
              <>
                <Image 
                  source={{ uri: fotoBase64 }} 
                  style={styles.cardImage}
                  resizeMode="cover"
                />
                {item.fotos.length > 1 && (
                  <View style={styles.cardImageBadge}>
                    <ImageIcon size={12} color={COLORS.white} />
                    <Text style={styles.cardImageBadgeText}>{item.fotos.length}</Text>
                  </View>
                )}
              </>
            ) : null}
          </View>
        )}

        <CardContent style={styles.cardContent}>
          <View style={styles.cardIcon}>
            {renderIcon(item.icone || 'Admin')}
          </View>

          <View style={styles.cardInfo}>
            <View style={styles.cardHeader}>
              <Text style={styles.areaName}>{item.nome}</Text>
              <Badge variant={item.ativa ? 'success' : 'danger'} style={[styles.badge, item.ativa ? styles.badgeActive : styles.badgeInactive]}>
                <Text style={[styles.badgeText, item.ativa ? styles.badgeTextActive : styles.badgeTextInactive]}>
                  {item.ativa ? 'Ativa' : 'Inativa'}
                </Text>
              </Badge>
            </View>

            {item.descricao && (
              <Text style={styles.areaDescription} numberOfLines={2}>{item.descricao}</Text>
            )}

            <View style={styles.areaMetaContainer}>
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Taxa:</Text>
                <Text style={styles.areaPrice}>
                  {item.valorTaxa && item.valorTaxa > 0
                    ? `R$ ${item.valorTaxa.toFixed(2).replace('.', ',')}`
                    : 'Gratuito'}
                </Text>
              </View>

              {item.tiposReservaDisponiveis && item.tiposReservaDisponiveis.length > 0 && (
                <View style={styles.reserveTypesContainer}>
                  <Text style={styles.reserveTypesLabel}>
                    {item.tiposReservaDisponiveis.length} {item.tiposReservaDisponiveis.length === 1 ? 'tipo de reserva' : 'tipos de reserva'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );
};

export default AreaCardItem;