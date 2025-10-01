// Location: services/moradorService.ts

import api from './api';

// ============================================
// TIPOS E INTERFACES
// ============================================

export type TipoMorador = 'PROPRIETARIO' | 'INQUILINO' | 'DEPENDENTE';

export interface MoradorDTO {
  id?: number;
  nome: string;
  cpf?: string;
  rg?: string;
  dataNascimento?: string;
  telefone?: string;
  email?: string;
  observacoes?: string;
  ativo?: boolean;
  unidadeId?: number;
  usuarioId?: number;
  tipoMorador?: TipoMorador;
  // Campos relacionados que podem vir do backend
  unidade?: {
    id: number;
    numero: string;
    bloco?: string;
    andar?: string;
  };
  usuario?: {
    id: number;
    nome: string;
    email: string;
  };
  veiculos?: Array<{
    id: number;
    placa: string;
    modelo?: string;
    cor?: string;
  }>;
}

export interface CreateMoradorDTO {
  nome: string;
  cpf?: string;
  rg?: string;
  dataNascimento?: string;
  telefone?: string;
  email?: string;
  observacoes?: string;
  ativo?: boolean;
  unidadeId?: number;
  usuarioId?: number;
  tipoMorador?: TipoMorador;
}

export interface UpdateMoradorDTO extends Partial<CreateMoradorDTO> {}

export interface MoradorFilters {
  search?: string;
  ativo?: 'TODOS' | 'TRUE' | 'FALSE';
  unidadeId?: number;
  blocoId?: number;
}

// ============================================
// SERVIÇO DE MORADORES
// ============================================

export class MoradorService {
  private static BASE_PATH = '/moradores';

  /**
   * Buscar todos os moradores
   * GET /moradores
   */
  static async findAll(filters?: MoradorFilters): Promise<MoradorDTO[]> {
    try {
      // Construir query string se houver filtros
      let endpoint = this.BASE_PATH;
      
      if (filters) {
        const params = new URLSearchParams();
        
        if (filters.search) {
          params.append('search', filters.search);
        }
        if (filters.ativo && filters.ativo !== 'TODOS') {
          params.append('ativo', filters.ativo);
        }
        if (filters.unidadeId) {
          params.append('unidadeId', filters.unidadeId.toString());
        }
        if (filters.blocoId) {
          params.append('blocoId', filters.blocoId.toString());
        }
        
        const queryString = params.toString();
        if (queryString) {
          endpoint += `?${queryString}`;
        }
      }

      const response = await api.get(endpoint);
      return response as MoradorDTO[];
    } catch (error: any) {
      console.error('Erro ao buscar moradores:', error);
      throw new Error(error.message || 'Erro ao buscar moradores');
    }
  }

  /**
   * Buscar morador por ID
   * GET /moradores/{id}
   */
  static async findById(id: number): Promise<MoradorDTO> {
    try {
      const response = await api.get(`${this.BASE_PATH}/${id}`);
      return response as MoradorDTO;
    } catch (error: any) {
      console.error(`Erro ao buscar morador ${id}:`, error);
      throw new Error(error.message || 'Erro ao buscar morador');
    }
  }

  /**
   * Criar novo morador
   * POST /moradores
   */
  static async create(data: CreateMoradorDTO): Promise<MoradorDTO> {
    try {
      const response = await api.post(this.BASE_PATH, data);
      return response as MoradorDTO;
    } catch (error: any) {
      console.error('Erro ao criar morador:', error);
      throw new Error(error.message || 'Erro ao criar morador');
    }
  }

  /**
   * Atualizar morador
   * PUT /moradores/{id}
   */
  static async update(id: number, data: UpdateMoradorDTO): Promise<MoradorDTO> {
    try {
      const response = await api.put(`${this.BASE_PATH}/${id}`, data);
      return response as MoradorDTO;
    } catch (error: any) {
      console.error(`Erro ao atualizar morador ${id}:`, error);
      throw new Error(error.message || 'Erro ao atualizar morador');
    }
  }

  /**
   * Deletar morador
   * DELETE /moradores/{id}
   */
  static async delete(id: number): Promise<void> {
    try {
      await api.delete(`${this.BASE_PATH}/${id}`);
    } catch (error: any) {
      console.error(`Erro ao deletar morador ${id}:`, error);
      throw new Error(error.message || 'Erro ao deletar morador');
    }
  }

  /**
   * Buscar estatísticas dos moradores
   */
  static async getStats() {
    try {
      // Se você tiver um endpoint específico para stats no backend:
      // const response = await api.get(`${this.BASE_PATH}/stats`);
      // return response;
      
      // Caso contrário, calcular no frontend a partir dos dados
      const moradores = await this.findAll();
      
      return {
        total: moradores.length,
        ativos: moradores.filter(m => m.ativo === true).length,
        inativos: moradores.filter(m => m.ativo === false).length,
        totalVeiculos: moradores.reduce((acc, m) => acc + (m.veiculos?.length || 0), 0),
      };
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas:', error);
      throw new Error(error.message || 'Erro ao buscar estatísticas');
    }
  }

  /**
   * Buscar moradores por unidade
   * Útil para filtrar moradores de uma unidade específica
   */
  static async findByUnidade(unidadeId: number): Promise<MoradorDTO[]> {
    try {
      return await this.findAll({ unidadeId });
    } catch (error: any) {
      console.error(`Erro ao buscar moradores da unidade ${unidadeId}:`, error);
      throw new Error(error.message || 'Erro ao buscar moradores da unidade');
    }
  }

  /**
   * Buscar moradores ativos
   */
  static async findAtivos(): Promise<MoradorDTO[]> {
    try {
      return await this.findAll({ ativo: 'TRUE' });
    } catch (error: any) {
      console.error('Erro ao buscar moradores ativos:', error);
      throw new Error(error.message || 'Erro ao buscar moradores ativos');
    }
  }

  /**
   * Buscar moradores inativos
   */
  static async findInativos(): Promise<MoradorDTO[]> {
    try {
      return await this.findAll({ ativo: 'FALSE' });
    } catch (error: any) {
      console.error('Erro ao buscar moradores inativos:', error);
      throw new Error(error.message || 'Erro ao buscar moradores inativos');
    }
  }

  /**
   * Ativar um morador
   */
  static async ativar(id: number): Promise<MoradorDTO> {
    try {
      return await this.update(id, { ativo: true });
    } catch (error: any) {
      console.error(`Erro ao ativar morador ${id}:`, error);
      throw new Error(error.message || 'Erro ao ativar morador');
    }
  }

  /**
   * Inativar um morador
   */
  static async inativar(id: number): Promise<MoradorDTO> {
    try {
      return await this.update(id, { ativo: false });
    } catch (error: any) {
      console.error(`Erro ao inativar morador ${id}:`, error);
      throw new Error(error.message || 'Erro ao inativar morador');
    }
  }
}

export default MoradorService;