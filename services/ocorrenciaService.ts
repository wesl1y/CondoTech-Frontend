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

const handleFetchResponse = async (response: Response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || `Erro: ${response.status}`;
        throw new Error(errorMessage);
    }
    // Retorna null para respostas sem conteúdo (ex: 204 No Content)
    if (response.status === 204 || response.headers.get("Content-Length") === "0") {
        return null;
    }
    return response.json();
}

export const ocorrenciaService = {
    /**
     * ✅ ALTERADO: Busca ocorrências, opcionalmente filtrando por status.
     * @param status - String opcional (ex: 'CANCELADA') para filtrar os resultados.
     */
    async getAll(status?: string): Promise<Ocorrencia[]> {
        let url = '/ocorrencias';
        if (status) {
            url += `?status=${status}`;
        }
        return api.get(url);
    },

    async getById(id: number): Promise<Ocorrencia> {
        return api.get(`/ocorrencias/${id}`);
    },

    async getByMorador(moradorId: number): Promise<Ocorrencia[]> {
        return api.get(`/ocorrencias/morador/${moradorId}`);
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

    /**
     * ✅ NOVO MÉTODO: Em vez de deletar, faz uma chamada PUT para o endpoint que
     * altera o status da ocorrência para 'CANCELADA'.
     * @param id - O ID da ocorrência a ser cancelada.
     */
    async cancel(id: number): Promise<void> {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);

        const response = await fetch(`${API_URL}/ocorrencias/${id}/cancelar`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
            },
        });
        
        // handleFetchResponse retornará null ou lançará um erro, o que é perfeito para um retorno Promise<void>
        await handleFetchResponse(response);
    },
};
