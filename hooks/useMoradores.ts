// Location: hooks/useMoradores.ts

import { useCallback, useEffect, useState } from 'react';
import { CreateMoradorDTO, MoradorDTO, MoradorFilters, MoradorService, UpdateMoradorDTO } from '../services/moradorService';

export interface UseMoradoresOptions {
  autoLoad?: boolean;
  filters?: MoradorFilters;
}

export interface UseMoradoresReturn {
  // Dados
  moradores: MoradorDTO[];
  stats: {
    total: number;
    ativos: number;
    inativos: number;
    totalVeiculos: number;
  };
  
  // Estados
  loading: boolean;
  error: string | null;
  
  // Ações
  refetch: () => Promise<void>;
  createMorador: (data: CreateMoradorDTO) => Promise<MoradorDTO>;
  updateMorador: (id: number, data: UpdateMoradorDTO) => Promise<MoradorDTO>;
  deleteMorador: (id: number) => Promise<void>;
  getMoradorById: (id: number) => Promise<MoradorDTO>;
  ativarMorador: (id: number) => Promise<MoradorDTO>;
  inativarMorador: (id: number) => Promise<MoradorDTO>;
}

/**
 * Hook customizado para gerenciar o estado dos moradores
 * 
 * @example
 * ```tsx
 * const { moradores, loading, createMorador, deleteMorador } = useMoradores({
 *   autoLoad: true,
 *   filters: { status: 'ATIVO' }
 * });
 * ```
 */
export function useMoradores(options: UseMoradoresOptions = {}): UseMoradoresReturn {
  const { autoLoad = true, filters } = options;

  // Estados
  const [moradores, setMoradores] = useState<MoradorDTO[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    ativos: 0,
    inativos: 0,
    totalVeiculos: 0,
  });

  // Calcular estatísticas
  const calculateStats = useCallback((data: MoradorDTO[]) => {
    setStats({
      total: data.length,
      ativos: data.filter(m => m.ativo === true).length,
      inativos: data.filter(m => m.ativo === false).length,
      totalVeiculos: data.reduce((acc, m) => acc + (m.veiculos?.length || 0), 0),
    });
  }, []);

  // Buscar moradores
  const fetchMoradores = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await MoradorService.findAll(filters);
      setMoradores(data);
      calculateStats(data);
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar moradores';
      setError(errorMessage);
      console.error('Erro ao buscar moradores:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, calculateStats]);

  // Auto-carregar ao montar ou quando filtros mudarem
  useEffect(() => {
    if (autoLoad) {
      fetchMoradores();
    }
  }, [autoLoad, fetchMoradores]);

  // Criar morador
  const createMorador = useCallback(async (data: CreateMoradorDTO): Promise<MoradorDTO> => {
    try {
      const newMorador = await MoradorService.create(data);
      
      // Atualizar lista localmente
      setMoradores(prev => [newMorador, ...prev]);
      
      // Recarregar para garantir sincronização com o servidor
      await fetchMoradores();
      
      return newMorador;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao criar morador';
      throw new Error(errorMessage);
    }
  }, [fetchMoradores]);

  // Atualizar morador
  const updateMorador = useCallback(async (id: number, data: UpdateMoradorDTO): Promise<MoradorDTO> => {
    try {
      const updated = await MoradorService.update(id, data);
      
      // Atualizar lista localmente
      setMoradores(prev => prev.map(m => (m.id === id ? updated : m)));
      
      // Recarregar para garantir sincronização
      await fetchMoradores();
      
      return updated;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao atualizar morador';
      throw new Error(errorMessage);
    }
  }, [fetchMoradores]);

  // Deletar morador
  const deleteMorador = useCallback(async (id: number): Promise<void> => {
    try {
      await MoradorService.delete(id);
      
      // Atualizar lista localmente
      setMoradores(prev => prev.filter(m => m.id !== id));
      
      // Recarregar para atualizar estatísticas
      await fetchMoradores();
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao deletar morador';
      throw new Error(errorMessage);
    }
  }, [fetchMoradores]);

  // Buscar morador por ID
  const getMoradorById = useCallback(async (id: number): Promise<MoradorDTO> => {
    try {
      return await MoradorService.findById(id);
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao buscar morador';
      throw new Error(errorMessage);
    }
  }, []);

  // Ativar morador
  const ativarMorador = useCallback(async (id: number): Promise<MoradorDTO> => {
    try {
      const updated = await MoradorService.ativar(id);
      
      // Atualizar lista localmente
      setMoradores(prev => prev.map(m => (m.id === id ? updated : m)));
      
      // Recarregar para atualizar estatísticas
      await fetchMoradores();
      
      return updated;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao ativar morador';
      throw new Error(errorMessage);
    }
  }, [fetchMoradores]);

  // Inativar morador
  const inativarMorador = useCallback(async (id: number): Promise<MoradorDTO> => {
    try {
      const updated = await MoradorService.inativar(id);
      
      // Atualizar lista localmente
      setMoradores(prev => prev.map(m => (m.id === id ? updated : m)));
      
      // Recarregar para atualizar estatísticas
      await fetchMoradores();
      
      return updated;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao inativar morador';
      throw new Error(errorMessage);
    }
  }, [fetchMoradores]);

  return {
    moradores,
    stats,
    loading,
    error,
    refetch: fetchMoradores,
    createMorador,
    updateMorador,
    deleteMorador,
    getMoradorById,
    ativarMorador,
    inativarMorador,
  };
}

export default useMoradores;