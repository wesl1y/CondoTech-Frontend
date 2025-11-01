import api from './api'; // Seu wrapper fetch

export interface Comentario {
    id?: number;
    ocorrenciaId: number;
    moradorId: number;
    moradorNome?: string;
    texto: string;
    createdAt?: string;
    isAdmin?: boolean;
}

class ComentarioService {
    /**
     * Busca comentários por ID da ocorrência
     * (Assumindo o endpoint, ajuste se necessário)
     */
    async getByOcorrencia(ocorrenciaId: number): Promise<Comentario[]> {
        // Assumindo que você tenha um endpoint GET /comentarios/ocorrencia/{id}
        return api.get(`/comentarios/ocorrencia/${ocorrenciaId}`);
    }

    /**
     * Cria um novo comentário
     */
    async create(comentario: Comentario): Promise<Comentario> {
        // Assumindo que você tenha um endpoint POST /comentarios
        return api.post('/comentarios', comentario);
    }
}

export const comentarioService = new ComentarioService();