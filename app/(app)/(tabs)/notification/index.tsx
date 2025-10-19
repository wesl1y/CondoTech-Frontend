import { CheckCircle2, ChevronRight, Clock, Wrench, Users, Shield, DollarSign, Info } from 'lucide-react-native';
import React from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { styles } from '../../../../styles/notifications/styles';
import { SafeAreaView } from 'react-native-safe-area-context';

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
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>Notificações</Text>
                    <Text style={styles.headerSubtitle}>Acompanhe as novidades do condomínio</Text>
                </View>
                {unreadCount > 0 && (
                    <Badge variant="secondary" style={styles.unreadBadge}>
                        {unreadCount} novas
                    </Badge>
                )}
            </View>
            
            {/* Filtros */}
            <View style={styles.filterSection}>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={styles.filterContainer}
                >
                    <FilterButton title="Todas" isActive={filter === 'Todas'} onPress={() => setFilter('Todas')} />
                    <FilterButton title="Não lidas" isActive={filter === 'Não lidas'} onPress={() => setFilter('Não lidas')} />
                    <FilterButton title="Importantes" isActive={filter === 'Importantes'} onPress={() => setFilter('Importantes')} />
                </ScrollView>
            </View>

            {/* Lista de Notificações */}
            <FlatList
                data={filteredNotifications}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }: { item: Notification }) => (
                    <NotificationCard notification={item} onPress={() => setSelectedNotification(item)} />
                )}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Nenhuma notificação encontrada</Text>
                    </View>
                }
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

// --- SUB-COMPONENTES ---

type FilterButtonProps = {
    title: string;
    isActive: boolean;
    onPress: () => void;
};

const FilterButton = ({ title, isActive, onPress }: FilterButtonProps) => (
    <Button 
        variant={isActive ? 'default' : 'outline'}
        onPress={onPress}
        style={styles.filterButton}
    >
        <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
            {title}
        </Text>
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
    
    const typeIcons: Record<Notification['type'], React.ReactElement> = {
        maintenance: <Wrench size={20} color="#2563eb" />,
        meeting: <Users size={20} color="#2563eb" />,
        security: <Shield size={20} color="#2563eb" />,
        billing: <DollarSign size={20} color="#2563eb" />,
        info: <Info size={20} color="#2563eb" />,
    };
    
    const getTypeIcon = (type: Notification['type']): React.ReactElement => typeIcons[type];
    
    const typeNames: Record<Notification['type'], string> = {
        maintenance: 'Manutenção',
        meeting: 'Assembleia',
        security: 'Segurança',
        billing: 'Financeiro',
        info: 'Informativo',
    };
    
    const getTypeName = (type: Notification['type']): string => typeNames[type];

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Card style={[
                styles.notificationCard, 
                { borderLeftColor: getPriorityColor(notification.priority) },
                notification.unread && styles.unreadCard
            ]}>
                <CardContent style={styles.cardContent}>
                    <View style={styles.iconContainer}>
                        {getTypeIcon(notification.type)}
                    </View>
                    <View style={styles.cardBody}>
                        <View style={styles.cardHeader}>
                            <Text 
                                style={[
                                    styles.cardTitle, 
                                    notification.unread && styles.cardTitleUnread
                                ]} 
                                numberOfLines={1}
                            >
                                {notification.title}
                            </Text>
                            <ChevronRight size={20} color="#9ca3af" style={styles.chevron} />
                        </View>
                        <Text style={styles.cardDescription} numberOfLines={2}>
                            {notification.description}
                        </Text>
                        <View style={styles.cardFooter}>
                            <View style={styles.dateContainer}>
                                <Clock size={14} color="#6b7280" />
                                <Text style={styles.cardDate}>{notification.date}</Text>
                            </View>
                            <Badge variant='outline' style={styles.typeBadge}>
                                {getTypeName(notification.type)}
                            </Badge>
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
    const handleMarkAsRead = () => {
        console.log(`Marcando notificação ${notification.id} como lida.`);
        onClose();
    };

    return (
        <Dialog open={visible} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{notification.title}</DialogTitle>
                    <DialogDescription>
                        {new Date(notification.date).toLocaleDateString('pt-BR', { dateStyle: 'full' })}
                    </DialogDescription>
                </DialogHeader>
                
                <ScrollView style={styles.modalScrollView}>
                    <Text style={styles.modalDescription}>{notification.description}</Text>
                </ScrollView>
                
                {notification.unread && (
                    <Button onPress={handleMarkAsRead} style={styles.markReadButton}>
                        <CheckCircle2 size={18} color="white" style={styles.buttonIcon} />
                        <Text style={styles.markReadButtonText}>Marcar como lida</Text>
                    </Button>
                )}
            </DialogContent>
        </Dialog>
    );
};

