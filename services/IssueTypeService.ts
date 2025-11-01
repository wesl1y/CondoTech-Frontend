import api from './api'; // Importe seu wrapper fetch customizado

// Interface baseada no IssueTypeDTO do backend
export interface IssueTypeDTO {
    id: number;
    name: string;
}

class IssueTypeService {
    /**
     * Busca todos os tipos de ocorrência disponíveis no backend.
     */
    async getAll(): Promise<IssueTypeDTO[]> {
        try {
            // Seu 'api.get' já lida com a URL, headers e o 'handleResponse' já faz o JSON.parse
            const data = await api.get('/issue-types');
            return data as IssueTypeDTO[];
        } catch (error) {
            console.error('Erro ao buscar tipos de ocorrência:', error);
            throw error;
        }
    }
}

export const issueTypeService = new IssueTypeService();