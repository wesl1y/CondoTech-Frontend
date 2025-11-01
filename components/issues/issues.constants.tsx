// Mapeamento dos status do backend (inglês) para exibição (português)
export const statusMap: { [key: string]: string } = {
    'OPEN': 'Pendente',
    'IN_PROGRESS': 'Em andamento',
    'RESOLVED': 'Resolvida',
    'CANCELED': 'Cancelada'
};

// Status do backend (inglês) - para usar nas requisições
export const backendStatus = {
    OPEN: 'OPEN',
    IN_PROGRESS: 'IN_PROGRESS',
    RESOLVED: 'RESOLVED',
    CANCELED: 'CANCELED'
} as const;