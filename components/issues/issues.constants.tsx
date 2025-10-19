// src/app/(tabs)/issues/issues.constants.ts

export const issueTypes = [
    'Manutenção', 
    'Segurança', 
    'Limpeza', 
    'Infraestrutura', 
    'Barulho', 
    'Iluminação', 
    'Outros'
];

export const statusMap: { [key: string]: string } = {
    'ABERTA': 'Pendente',
    'EM_ANDAMENTO': 'Em andamento',
    'RESOLVIDA': 'Resolvida',
    'FECHADA': 'Resolvida',
    'CANCELADA': 'Cancelada'
};