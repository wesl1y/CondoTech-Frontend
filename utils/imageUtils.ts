// src/utils/imageUtils.ts

import { API_URL } from '../constants/api';

/**
 * Converte uma URL de imagem relativa para absoluta
 * @param imageUrl - URL da imagem (pode ser relativa ou absoluta)
 * @returns URL completa da imagem
 */
export const getFullImageUrl = (imageUrl?: string | null): string | undefined => {
    if (!imageUrl) return undefined;
    
    // Se já for uma URL completa (começa com http:// ou https://), retorna como está
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }
    
    // Remove a barra inicial se houver
    const cleanUrl = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
    
    // Concatena com a URL base da API
    return `${API_URL}/${cleanUrl}`;
};