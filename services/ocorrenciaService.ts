import api from './api';
import { API_URL } from '../constants/api';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'my-jwt';

export interface Ocorrencia {
    id?: number;
    moradorId: number;
    moradorNome?: string;
    tipoOcorrencia: string;
    titulo: string;
    descricao: string;
    statusOcorrencia: string;
    respostaSindico?: string;
    imageUrl?: string;
    createdAt?: string;
    dataResolucao?: string;
    updatedAt?: string;
}

export interface PaginatedResponse {
    ocorrencias: Ocorrencia[];
    currentPage: number;
    totalItems: number;
    totalPages: number;
    hasMore: boolean;
}

const handleFetchResponse = async (response: Response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || `Erro: ${response.status}`;
        throw new Error(errorMessage);
    }
    if (response.status === 204 || response.headers.get("Content-Length") === "0") {
        return null;
    }
    return response.json();
}

export const ocorrenciaService = {
    async getAll(status?: string, page: number = 0, size: number = 10): Promise<PaginatedResponse> {
        let url = `/ocorrencias?page=${page}&size=${size}`;
        if (status) {
            url += `&status=${status}`;
        }
        return api.get(url);
    },

    async getById(id: number): Promise<Ocorrencia> {
        return api.get(`/ocorrencias/${id}`);
    },

    async getByMorador(moradorId: number, page: number = 0, size: number = 10): Promise<PaginatedResponse> {
        return api.get(`/ocorrencias/morador/${moradorId}?page=${page}&size=${size}`);
    },

   async searchByMorador(
        moradorId: number,
        query: string,
        tipo?: string, // ✅ 1. Parâmetro opcional de tipo adicionado
        page: number = 0,
        size: number = 10
    ): Promise<PaginatedResponse> {
        let url = `/ocorrencias/morador/${moradorId}/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`;
        
       
        if (tipo) {
            url += `&tipo=${encodeURIComponent(tipo)}`;
        }
        return api.get(url);
    },

       async search(
        query: string, 
        status?: string, 
        tipo?: string, 
        page: number = 0, 
        size: number = 20
    ): Promise<PaginatedResponse> {
        let url = `/ocorrencias/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`;
        if (status) {
            url += `&status=${status}`;
        }
        if (tipo) {
            url += `&tipo=${encodeURIComponent(tipo)}`;
        }
        return api.get(url);
    },

    async create(ocorrencia: Ocorrencia, image?: any): Promise<Ocorrencia> {
        const formData = new FormData();
        
        const { id, moradorNome, imageUrl, createdAt, dataResolucao, updatedAt, ...ocorrenciaData } = ocorrencia;
        
        formData.append('ocorrencia', JSON.stringify(ocorrenciaData));

        if (image && image.uri) {
            const uriParts = image.uri.split('.');
            const fileType = uriParts[uriParts.length - 1];
            
            formData.append('image', {
                uri: image.uri,
                name: `photo.${fileType}`,
                type: `image/${fileType}`,
            } as any);
        }

        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        
        const response = await fetch(`${API_URL}/ocorrencias`, {
            method: 'POST',
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: formData,
        });

        return handleFetchResponse(response);
    },

    async update(id: number, ocorrencia: Ocorrencia, image?: any): Promise<Ocorrencia> {
        const formData = new FormData();
        
        formData.append('ocorrencia', JSON.stringify(ocorrencia));

        if (image && image.uri) {
            const uriParts = image.uri.split('.');
            const fileType = uriParts[uriParts.length - 1];
            
            formData.append('image', {
                uri: image.uri,
                name: `photo.${fileType}`,
                type: `image/${fileType}`,
            } as any);
        }

        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        
        const response = await fetch(`${API_URL}/ocorrencias/${id}`, {
            method: 'PUT',
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: formData,
        });
        
        return handleFetchResponse(response);
    },

    async cancel(id: number): Promise<void> {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);

        const response = await fetch(`${API_URL}/ocorrencias/${id}/cancelar`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
            },
        });
        
        await handleFetchResponse(response);
    },
};