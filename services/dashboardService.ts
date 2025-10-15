// services/api/dashboardService.ts
import axios from 'axios';
import { API_URL } from '../constants/api';

export interface DashboardStats {
  notificacoesNaoLidas: number;
  reservasProximas: number;
  ocorrenciasAbertas: number;
}

export interface Notificacao {
  id: number;
  titulo: string;
  mensagem: string;
  lida: boolean;
  createdAt: string;
  moradorId: number;
}

export interface Reserva {
  id: number;
  dataReserva: string;
  horaInicio: string;
  horaFim: string;
  statusReserva: string;
  areaComumId: number;
  areaComumNome?: string;
  moradorId: number;
}

export interface Ocorrencia {
  id: number;
  titulo: string;
  descricao: string;
  tipoOcorrencia: string;
  statusOcorrencia: string;
  createdAt: string;
  moradorId: number;
}

class DashboardService {
  private getAuthHeaders(token: string) {
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  }

  // Buscar estatísticas do dashboard
  async getStatistics(moradorId: number, token: string): Promise<DashboardStats> {
    const url = `${API_URL}/moradores/${moradorId}/estatisticas`;
    try {
      const response = await axios.get(url, this.getAuthHeaders(token));
      return response.data;
    } catch (error) {
      console.error(`[API Error] Falha ao buscar estatísticas:`, error);
      throw error;
    }
  }

  // Buscar notificações recentes
  async getRecentNotifications(moradorId: number, token: string): Promise<Notificacao[]> {
    const url = `${API_URL}/notificacoes/morador/${moradorId}/recentes`;
    try {
      const response = await axios.get(url, this.getAuthHeaders(token));
      return response.data;
    } catch (error) {
      console.error(`[API Error] Falha ao buscar notificações:`, error);
      throw error;
    }
  }

  // Buscar reservas próximas
  async getUpcomingReservations(moradorId: number, token: string): Promise<Reserva[]> {
    const url = `${API_URL}/reservas/morador/${moradorId}/proximas`;
    try {
      const response = await axios.get(url, this.getAuthHeaders(token));
      return response.data;
    } catch (error) {
      console.error(`[API Error] Falha ao buscar reservas:`, error);
      throw error;
    }
  }

  // Buscar ocorrências em aberto
  async getOpenIssues(moradorId: number, token: string): Promise<Ocorrencia[]> {
    const url = `${API_URL}/ocorrencias/morador/${moradorId}/abertas`;
    try {
      const response = await axios.get(url, this.getAuthHeaders(token));
      return response.data;
    } catch (error) {
      console.error(`[API Error] Falha ao buscar ocorrências:`, error);
      throw error;
    }
  }

  // Marcar notificação como lida
  async markNotificationAsRead(notificationId: number, token: string): Promise<void> {
    const url = `${API_URL}/notificacoes/${notificationId}/marcar-lida`;
    try {
      await axios.patch(url, {}, this.getAuthHeaders(token));
    } catch (error) {
      console.error(`[API Error] Falha ao marcar notificação como lida:`, error);
      throw error;
    }
  }

  async getTotalResidents(token: string): Promise<number> {
    const url = `${API_URL}/moradores/count`;

    try {
      const headers = this.getAuthHeaders(token);
      const response = await axios.get(url, headers);


      if (response.data && typeof response.data.total !== 'undefined') {
        return response.data.total;
      } else {
        console.warn('[API Warning] A resposta da API não contém a chave "total".');
        return 0; // Retorna 0 se a resposta for malformada
      }

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('[API Error] Erro do Axios ao buscar total de moradores:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
      } else {
        console.error('[API Error] Erro genérico ao buscar total de moradores:', error);
      }
      throw error; 
    }
  }
}

export default new DashboardService();