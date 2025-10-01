import * as SecureStore from 'expo-secure-store';
import * as Updates from 'expo-updates';
import { API_URL } from '../constants/api';

const TOKEN_KEY = 'my-jwt'; // A mesma chave que usamos no AuthContext

/**
 * Pega o token de autenticação armazenado de forma segura.
 */
const getAuthToken = async () => {
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

/**
 * Cria os cabeçalhos padrão para as requisições, incluindo o token Bearer.
 */
const createHeaders = async () => {
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
  return headers;
};

/**
 * Uma função genérica para lidar com as respostas da API.
 */
const handleResponse = async (response: Response) => {
  // Se o status da resposta for 401, significa que o token é inválido ou expirou.
  if (response.status === 401) {
    console.log("Token expirado ou inválido. Limpando sessão...");

    // 2. Remove o token inválido do armazenamento seguro.
    await SecureStore.deleteItemAsync(TOKEN_KEY);

    // 3. Força o aplicativo a recarregar completamente.
    // Ao recarregar, a lógica de autenticação no seu app/_layout.tsx será
    // executada novamente. Como não haverá mais token, o usuário será
    // redirecionado para a tela de login.
    await Updates.reloadAsync();

    // Lança um erro para que a execução atual pare.
    throw new Error("Sua sessão expirou. Você foi desconectado.");
  }
  if (!response.ok) {
    // Tenta pegar uma mensagem de erro do corpo da resposta, se houver
    const errorData = await response.json().catch(() => null);
    const errorMessage = errorData?.message || `Erro: ${response.status} ${response.statusText}`;
    throw new Error(errorMessage);
  }
  
  // Retorna null para respostas sem conteúdo (como um DELETE bem-sucedido)
  if (response.status === 204) {
    return null;
  }
  
  return response.json();
};

// Nosso cliente de API completo
const api = {
  /**
   * Realiza uma requisição GET.
   * @param endpoint O endpoint da API (ex: '/users')
   */
  get: async (endpoint: string) => {
    const headers = await createHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });
    return handleResponse(response);
  },

  /**
   * Realiza uma requisição POST.
   * @param endpoint O endpoint da API (ex: '/users')
   * @param body O corpo da requisição em formato de objeto.
   */
  post: async (endpoint: string, body: unknown) => {
    const headers = await createHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  /**
   * Realiza uma requisição PUT.
   * @param endpoint O endpoint da API (ex: '/users/1')
   * @param body O corpo da requisição com os dados a serem atualizados.
   */
  put: async (endpoint: string, body: unknown) => {
    const headers = await createHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  /**
   * Realiza uma requisição DELETE.
   * @param endpoint O endpoint da API (ex: '/users/1')
   */
  delete: async (endpoint: string) => {
    const headers = await createHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    return handleResponse(response);
  },
};

export default api;