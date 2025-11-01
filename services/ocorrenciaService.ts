import api from './api'; // Seu wrapper fetch

// Interface alinhada com a IssueDTO do backend
// (Renomeei para Ocorrencia para manter a consistência do seu código)
export interface Ocorrencia {
    id?: number;
    residentId?: number;
    residentName?: string;
    issueTypeId?: number;
    issueTypeName?: string;
    title: string;
    description: string;
    issueStatus: string; // ex: 'OPEN', 'IN_PROGRESS'
    imageUrl?: string;
    createdAt?: string;
    resolutionDate?: string;
    updatedAt?: string;
}

// Interface para a resposta da paginação do backend
export interface OcorrenciaResponse {
    issues: Ocorrencia[]; // O backend retorna 'issues'
    currentPage: number;
    totalItems: number;
    totalPages: number;
    hasMore: boolean;
}

class OcorrenciaService {

    /**
     * Busca paginada de ocorrências (Admin)
     */
    async search(
        query: string, 
        status?: string, 
        tipo?: string, 
        page: number = 0, 
        size: number = 10
    ): Promise<OcorrenciaResponse> {
        const params = { query, status, tipo, page, size };
        // 'api.get' já usa 'buildQueryString' internamente
        return api.get('/issues/search', params);
    }

    /**
     * Busca paginada de ocorrências (Morador)
     */
    async searchByMorador(
        moradorId: number,
        query: string, 
        status?: string, 
        tipo?: string, 
        page: number = 0, 
        size: number = 10
    ): Promise<OcorrenciaResponse> {
        const params = { query, status, tipo, page, size };
        return api.get(`/issues/morador/${moradorId}/search`, params);
    }

    /**
     * Cria uma nova ocorrência (com ou sem imagem)
     * @param issueData Objeto da ocorrência (sem id)
     * @param image Asset do Expo ImagePicker (opcional)
     */
    async create(issueData: Partial<Ocorrencia>, image: any): Promise<Ocorrencia> {
        const formData = new FormData();
        
        // 1. Adiciona o JSON da ocorrência
        // O backend espera uma @RequestPart("issue")
        formData.append('issue', JSON.stringify(issueData));

        // 2. Adiciona a imagem, se existir
        // O backend espera uma @RequestPart("image")
        if (image) {
            const fileType = image.uri.split('.').pop();
            const mimeType = image.type ? `${image.type}/${fileType}` : `image/${fileType || 'jpeg'}`;
            
            formData.append('image', {
                uri: image.uri,
                name: image.fileName || `photo.${fileType}`,
                type: mimeType,
            } as any);
        }
        
        // Usa o método 'postFormData' do seu api.ts
        return api.postFormData('/issues', formData);
    }

    /**
     * Atualiza uma ocorrência (com ou sem imagem)
     * @param id ID da ocorrência
     * @param issueData Objeto da ocorrência
     * @param image Asset do Expo ImagePicker (opcional, se for trocar)
     */
    async update(id: number, issueData: Ocorrencia, image?: any): Promise<Ocorrencia> {
        const formData = new FormData();
        formData.append('issue', JSON.stringify(issueData));

        if (image) {
            const fileType = image.uri.split('.').pop();
            const mimeType = image.type ? `${image.type}/${fileType}` : `image/${fileType || 'jpeg'}`;
            formData.append('image', {
                uri: image.uri,
                name: image.fileName || `photo.${fileType}`,
                type: mimeType,
            } as any);
        }

        // Usa o novo método 'putFormData'
        return api.putFormData(`/issues/${id}`, formData);
    }
    
    /**
     * Cancela uma ocorrência
     */
    async cancel(id: number): Promise<void> {
        // O endpoint @PutMapping("/{id}/cancel") não espera body,
        // mas o 'api.put' envia um. Enviar um body vazio {} é inofensivo.
        return api.put(`/issues/${id}/cancel`, {});
    }
}

export const ocorrenciaService = new OcorrenciaService();