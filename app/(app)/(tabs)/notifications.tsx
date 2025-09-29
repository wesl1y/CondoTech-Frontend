import { CheckCircle2, ChevronRight, Clock } from 'lucide-react-native';
import React from 'react';
import { FlatList, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/Dialog';

// --- MOCK DATA ---
const notificationsData: Notification[] = [
    {
        id: 1,
        title: 'Manutenção da piscina agendada',
        description: 'A piscina passará por manutenção preventiva no dia 20/09 das 8h às 17h...',
        date: '2024-09-15',
        time: '14:30',
        type: 'maintenance',
        unread: true,
        priority: 'high',
    },
    {
        id: 2,
        title: 'Nova assembleia marcada',
        description: 'Assembleia geral extraordinária marcada para o dia 25/09 às 19h30...',
        date: '2024-09-14',
        time: '09:15',
        type: 'meeting',
        unread: true,
        priority: 'high',
    },
    {
        id: 3,
        title: 'Liberação do salão de festas',
        description: 'O salão de festas está novamente disponível para reservas...',
        date: '2024-09-13',
        time: '16:45',
        type: 'info',
        unread: false,
        priority: 'medium',
    },
    {
        id: 4,
        title: 'Portaria - Novo protocolo',
        description: 'Implementamos um novo sistema de cadastro de visitantes...',
        date: '2024-09-12',
        time: '11:20',
        type: 'security',
        unread: false,
        priority: 'medium',
    },
    {
        id: 5,
        title: 'Lembrete: Taxa condominial',
        description: 'A taxa condominial de setembro vence no dia 15...',
        date: '2024-09-10',
        time: '08:00',
        type: 'billing',
        unread: false,
        priority: 'low',
    },
];

export type Notification = {
    id: number;
    title: string;
    description: string;
    date: string;
    time: string;
    type: 'maintenance' | 'meeting' | 'security' | 'billing' | 'info';
    unread: boolean;
    priority: 'high' | 'medium' | 'low';
};

export default function NotificationsScreen() {
    const [filter, setFilter] = React.useState<string>('Todas');
    const [selectedNotification, setSelectedNotification] = React.useState<Notification | null>(null);
    
    // Usamos useMemo para otimizar a filtragem, evitando re-cálculos desnecessários
    const filteredNotifications = React.useMemo(() => {
        if (filter === 'Não lidas') {
            return notificationsData.filter(n => n.unread);
        }
        if (filter === 'Importantes') {
            return notificationsData.filter(n => n.priority === 'high');
        }
        return notificationsData;
    }, [filter]);

    const unreadCount = notificationsData.filter(n => n.unread).length;

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Notificações</Text>
                    <Text style={styles.headerSubtitle}>Acompanhe as novidades do condomínio</Text>
                </View>
                {unreadCount > 0 && <Badge variant="secondary">{unreadCount} novas</Badge>}
            </View>
            
            {/* Filtros */}
            <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
                    <FilterButton title="Todas" isActive={filter === 'Todas'} onPress={() => setFilter('Todas')} />
                    <FilterButton title="Não lidas" isActive={filter === 'Não lidas'} onPress={() => setFilter('Não lidas')} />
                    <FilterButton title="Importantes" isActive={filter === 'Importantes'} onPress={() => setFilter('Importantes')} />
                </ScrollView>
            </View>

            {/* Lista de Notificações */}
            <FlatList
                data={filteredNotifications}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }: { item: Notification }) => <NotificationCard notification={item} onPress={() => setSelectedNotification(item)} />}
                contentContainerStyle={styles.list}
            />

            {/* Modal de Detalhes */}
            {selectedNotification && (
                <NotificationDetailModal 
                    notification={selectedNotification}
                    visible={!!selectedNotification}
                    onClose={() => setSelectedNotification(null)}
                />
            )}
        </SafeAreaView>
    );
}

// --- SUB-COMPONENTES PARA CLAREZA ---

type FilterButtonProps = {
    title: string;
    isActive: boolean;
    onPress: () => void;
};
const FilterButton = ({ title, isActive, onPress }: FilterButtonProps) => (
    <Button 
        variant={isActive ? 'default' : 'outline'}
        onPress={onPress}
        style={{ paddingHorizontal: 16, paddingVertical: 8, height: 'auto' }}
    >
        <Text style={{ fontWeight: '600', color: isActive ? 'white' : '#374151' }}>{title}</Text>
    </Button>
);

type NotificationCardProps = {
    notification: Notification;
    onPress: () => void;
};
const NotificationCard = ({ notification, onPress }: NotificationCardProps) => {
    const getPriorityColor = (priority: Notification['priority']): string => {
        if (priority === 'high') return '#ef4444';
        if (priority === 'medium') return '#f59e0b';
        return '#22c55e';
    };
    const typeIcons: Record<Notification['type'], string> = {
        maintenance: '🔧',
        meeting: '📋',
        security: '🛡️',
        billing: '💰',
        info: 'ℹ️',
    };
    const getTypeIcon = (type: Notification['type']): string => typeIcons[type];
    const typeNames: Record<Notification['type'], string> = {
        maintenance: 'Manutenção',
        meeting: 'Assembleia',
        security: 'Segurança',
        billing: 'Financeiro',
        info: 'Informativo',
    };
    const getTypeName = (type: Notification['type']): string => typeNames[type];

    return (
        <TouchableOpacity onPress={onPress}>
            <Card style={[
                styles.notificationCard, 
                { borderLeftColor: getPriorityColor(notification.priority) },
                notification.unread && { backgroundColor: '#eff6ff' }
            ]}>
                <CardContent style={styles.cardContent}>
                    <Text style={{ fontSize: 24, marginRight: 12 }}>{getTypeIcon(notification.type)}</Text>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={[styles.cardTitle, notification.unread && { color: '#1e3a8a' }]} numberOfLines={1}>{notification.title}</Text>
                            <ChevronRight size={20} color="#9ca3af" />
                        </View>
                        <Text style={styles.cardDescription} numberOfLines={2}>{notification.description}</Text>
                        <View style={styles.cardFooter}>
                            <Text style={styles.cardMeta}><Clock size={12} color="#6b7280"/> {notification.date}</Text>
                            <Badge variant='outline'>{getTypeName(notification.type)}</Badge>
                        </View>
                    </View>
                </CardContent>
            </Card>
        </TouchableOpacity>
    );
};

type NotificationDetailModalProps = {
    notification: Notification;
    visible: boolean;
    onClose: () => void;
};
const NotificationDetailModal = ({ notification, visible, onClose }: NotificationDetailModalProps) => {
    // Aqui viria a lógica para marcar como lido
    const handleMarkAsRead = () => {
        console.log(`Marcando notificação ${notification.id} como lida.`);
        onClose();
    };

    return (
        <Dialog open={visible} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{notification.title}</DialogTitle>
                    <DialogDescription>{new Date(notification.date).toLocaleDateString('pt-BR', { dateStyle: 'full' })}</DialogDescription>
                </DialogHeader>
                <Text style={styles.modalDescription}>{notification.description}</Text>
                {notification.unread && (
                    <Button onPress={handleMarkAsRead} style={{ marginTop: 16 }}>
                        <CheckCircle2 size={16} color="white" /> Marcar como lida
                    </Button>
                )}
            </DialogContent>
        </Dialog>
    );
};


// --- ESTILOS ---

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: 'white' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1e3a8a' },
    headerSubtitle: { fontSize: 16, color: '#6b7280' },
    filterContainer: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
    list: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
    
    // Estilos do Card
    notificationCard: { borderWidth: 1, borderColor: '#e5e7eb', borderLeftWidth: 4 },
    cardContent: { padding: 12, flexDirection: 'row', alignItems: 'center' },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    cardDescription: { fontSize: 14, color: '#4b5563', lineHeight: 20 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    cardMeta: { fontSize: 12, color: '#6b7280', flexDirection: 'row', alignItems: 'center' },

    // Estilos do Modal
    modalDescription: { fontSize: 16, color: '#374151', lineHeight: 24 }
});