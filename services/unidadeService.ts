import api from './api';

// Interface para representar uma Unidade
export interface UnidadeDTO {
  id: number;
  numero: string;
  bloco?: string;
  andar?: string;
}

export class UnidadeService {
  private static BASE_PATH = '/unidades'; // <-- Confirme se este é o endpoint correto no seu backend

  /**
   * Buscar todas as unidades
   * GET /unidades
   */
  static async findAll(): Promise<UnidadeDTO[]> {
    try {
      const response = await api.get(this.BASE_PATH);
      return response as UnidadeDTO[];
    } catch (error: any) {
      console.error('Erro ao buscar unidades:', error);
      throw new Error(error.message || 'Erro ao buscar unidades');
    }
  }
}

export default UnidadeService;