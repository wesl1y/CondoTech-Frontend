import api from './api';

export interface Comentario {
    id?: number;
    ocorrenciaId: number;
    moradorId: number;
    texto: string;
    isAdmin?: boolean;
    moradorNome?: string;
    createdAt?: string;
}

export const comentarioService = {
    async getByOcorrencia(ocorrenciaId: number): Promise<Comentario[]> {
        return api.get(`/comentarios/ocorrencia/${ocorrenciaId}`);
    },

    async create(comentario: Comentario): Promise<Comentario> {
        return api.post('/comentarios', comentario);
    },

    async delete(id: number): Promise<void> {
        return api.delete(`/comentarios/${id}`);
    },
};