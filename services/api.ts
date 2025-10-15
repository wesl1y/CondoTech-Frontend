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
 */const handleResponse = async (response: Response) => {
  // Se o status da resposta for 401, significa que o token é inválido ou expirou.
  if (response.status === 401) {
    console.log("Token expirado ou inválido. Limpando sessão...");
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await Updates.reloadAsync();
    throw new Error("Sua sessão expirou. Você foi desconectado.");
  }
  
  if (!response.ok) {
    // Pega o texto da resposta primeiro
    const errorText = await response.text();
    
    // Tenta parsear como JSON
    try {
      const errorData = JSON.parse(errorText);
      const errorMessage = errorData?.message || errorText || `Erro: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    } catch (e) {
      // Se não for JSON válido, usa o texto mesmo ou a mensagem padrão
      throw new Error(errorText || `Erro: ${response.status} ${response.statusText}`);
    }
  }
  
  // Retorna null para respostas sem conteúdo (como um DELETE bem-sucedido)
  if (response.status === 204) {
    return null;
  }
  
  // Pega o texto da resposta
  const responseText = await response.text();
  
  // Se estiver vazio, retorna null
  if (!responseText) {
    return null;
  }
  
  // Tenta parsear como JSON
  try {
    return JSON.parse(responseText);
  } catch (e) {
    // Se não for JSON, retorna o texto
    return responseText;
  }
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
    // NÃO definir Content-Type para FormData - o browser define automaticamente com boundary
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