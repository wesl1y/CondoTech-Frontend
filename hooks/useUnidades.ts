import { useEffect, useState } from 'react';
import { UnidadeDTO, UnidadeService } from '../services/unidadeService';

export function useUnidades() {
  const [unidades, setUnidades] = useState<UnidadeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUnidades() {
      try {
        setLoading(true);
        setError(null);
        const data = await UnidadeService.findAll();
        setUnidades(data);
      } catch (err: any) {
        setError(err.message || 'Falha ao carregar unidades');
      } finally {
        setLoading(false);
      }
    }

    fetchUnidades();
  }, []); // O array vazio [] faz com que isso rode apenas uma vez

  return { unidades, loading, error };
}