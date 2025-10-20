import * as SecureStore from 'expo-secure-store';
import * as Updates from 'expo-updates';
import { API_URL } from '../constants/api';

const TOKEN_KEY = 'my-jwt';

const getAuthToken = async () => {
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

const createHeaders = async () => {
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
  return headers;
};

const handleResponse = async (response: Response) => {
  if (response.status === 401) {
    console.log("Token expirado ou inválido. Limpando sessão...");
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await Updates.reloadAsync();
    throw new Error("Sua sessão expirou. Você foi desconectado.");
  }
  
  if (!response.ok) {
    const errorText = await response.text();
    
    try {
      const errorData = JSON.parse(errorText);
      const errorMessage = errorData?.message || errorText || `Erro: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    } catch (e) {
      throw new Error(errorText || `Erro: ${response.status} ${response.statusText}`);
    }
  }
  
  if (response.status === 204) {
    return null;
  }
  
  const responseText = await response.text();
  
  if (!responseText) {
    return null;
  }
  
  try {
    return JSON.parse(responseText);
  } catch (e) {
    return responseText;
  }
};

/**
 * Constrói uma query string a partir de um objeto de parâmetros
 */
const buildQueryString = (params?: Record<string, any>): string => {
  if (!params) return '';
  
  const queryParams = Object.entries(params)
    .filter(([, value]) => value !== null && value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  
  return queryParams ? `?${queryParams}` : '';
};

const api = {
  /**
   * Realiza uma requisição GET.
   * @param endpoint O endpoint da API (ex: '/users')
   * @param params Parâmetros de query opcionais (ex: { data: '2025-01-20' })
   */
  get: async (endpoint: string, params?: Record<string, any>) => {
    const headers = await createHeaders();
    const queryString = buildQueryString(params);
    const response = await fetch(`${API_URL}${endpoint}${queryString}`, {
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
   * Realiza uma requisição PATCH para atualizações parciais.
   * @param endpoint O endpoint da API (ex: '/users/1')
   * @param body O corpo da requisição com os campos a serem atualizados.
   */
  patch: async (endpoint: string, body?: unknown) => {
    const headers = await createHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
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

  /**
   * Realiza uma requisição POST pública (sem autenticação).
   * @param endpoint O endpoint da API
   * @param body O corpo da requisição
   */
  postPublic: async (endpoint: string, body: unknown) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  /**
   * Realiza upload de arquivo com FormData (multipart/form-data)
   * @param endpoint O endpoint da API
   * @param formData O FormData com os arquivos
   */
  postFormData: async (endpoint: string, formData: FormData) => {
    const token = await getAuthToken();
    const headers: Record<string, string> = {
      ...(token && { Authorization: `Bearer ${token}` }),
    };
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return handleResponse(response);
  },

  /**
   * Realiza DELETE com autenticação
   */
  deleteAuth: async (endpoint: string) => {
    const headers = await createHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    return handleResponse(response);
  },
};

export default api;