import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import dashboardService, { DashboardStats, Notificacao, Ocorrencia, Reserva } from '@/services/dashboardService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { AlertTriangle, BarChart3, Bell, Calendar, MapPin, Users } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { colors, styles } from './styles'; // Certifique-se que colors está exportado em styles.ts

// Define o tipo para as props do StatCard, necessário para o componente auxiliar
type StatCardProps = {
    icon: React.ReactElement;
    value: string | number;
    label: string;
    colorTheme: keyof typeof colors;
};

// ====================================================================
// COMPONENTE PRINCIPAL: DashboardScreen
// ====================================================================

export default function DashboardScreen() {
    const { user, token } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const router = useRouter();

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [notifications, setNotifications] = useState<Notificacao[]>([]);
    const [reservations, setReservations] = useState<Reserva[]>([]);
    const [issues, setIssues] = useState<Ocorrencia[]>([]);
    const [totalResidents, setTotalResidents] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            if (!user?.moradorId || !token) return;

            // Carregar estatísticas
            const statsData = await dashboardService.getStatistics(user.moradorId, token);
            setStats(statsData);

            // Carregar notificações recentes
            const notifData = await dashboardService.getRecentNotifications(user.moradorId, token);
            setNotifications(notifData);

            // Carregar reservas próximas
            const reservData = await dashboardService.getUpcomingReservations(user.moradorId, token);
            setReservations(reservData);

            // Carregar ocorrências em aberto
            const issuesData = await dashboardService.getOpenIssues(user.moradorId, token);
            setIssues(issuesData);

            // Se for admin, carregar total de moradores
            if (isAdmin) {
                const total = await dashboardService.getTotalResidents(token);
                setTotalResidents(total);
            }
        } catch (error) {
            console.error('Erro ao carregar dados do dashboard:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboardData();
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'dd/MM', { locale: ptBR });
        } catch {
            return dateString;
        }
    };

    const formatTime = (timeString: string) => {
        try {
            const [hours, minutes] = timeString.split(':');
            return `${hours}:${minutes}`;
        } catch {
            return timeString;
        }
    };

    const getTimeAgo = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffHours / 24);

            if (diffDays > 0) return `${diffDays}d`;
            if (diffHours > 0) return `${diffHours}h`;
            return 'agora';
        } catch {
            return '';
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text style={{ marginTop: 16, color: '#6b7280' }}>Carregando...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            <ScrollView 
                contentContainerStyle={styles.container}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>
                        {isAdmin ? 'Painel do Síndico' : 'Meu Condomínio'}
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        {isAdmin ? 'Visão geral da gestão do condomínio' : 'Acompanhe as novidades do seu lar'}
                    </Text>
                </View>

                {/* Quick Stats */}
                <View style={styles.quickStatsGrid}>
                    <TouchableOpacity 
                        style={styles.statCardWrapper}
                        onPress={() => router.push('/notifications')}
                    >
                        <StatCard 
                            icon={<Bell color="#2563eb" />} 
                            value={stats?.notificacoesNaoLidas || 0} 
                            label="Notificações" 
                            colorTheme="blue" 
                        />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.statCardWrapper}
                        onPress={() => router.push('/reservations')}
                    >
                        <StatCard 
                            icon={<Calendar color="#16a34a" />} 
                            value={stats?.reservasProximas || 0} 
                            label="Reservas" 
                            colorTheme="green" 
                        />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.statCardWrapper}
                        onPress={() => router.push('/issues')}
                    >
                        <StatCard 
                            icon={<AlertTriangle color="#ea580c" />} 
                            value={stats?.ocorrenciasAbertas || 0} // <--- O valor é lido do state 'stats'
                            label="Ocorrências" 
                            colorTheme="orange" 
                        />
                    </TouchableOpacity>
                    
                    {isAdmin && (
                        <TouchableOpacity 
                            style={styles.statCardWrapper}
                            onPress={() => router.push('/residents')}
                        >
                            <StatCard 
                                icon={<Users color="#9333ea" />} 
                                value={totalResidents} 
                                label="Moradores" 
                                colorTheme="purple" 
                            />
                        </TouchableOpacity>
                    )}
                </View>
                                    
                {/* Admin Quick Actions (CORRIGIDO) */}
                {isAdmin && (
                    <Card style={styles.sectionCard}>
                        <CardHeader style={styles.cardHeader}>
                            <View style={styles.cardHeaderContent}>
                                <BarChart3 size={22} color="#2563eb" />
                                <CardTitle style={styles.cardTitle}>Ações Rápidas</CardTitle>
                            </View>
                        </CardHeader>
                        <CardContent style={styles.quickActionsContent}>
                            <Button 
                                variant="outline" 
                                style={styles.quickActionButton}
                                onPress={() => router.push('/residents')}
                            >
                                <Users size={22} color="#4b5563" style={styles.actionIcon} />
                                <Text style={styles.quickActionText}>Gerenciar Moradores</Text>
                            </Button>
                            <Button 
                                variant="outline" 
                                style={styles.quickActionButton}
                                onPress={() => router.push('/reports')}
                            >
                                <BarChart3 size={22} color="#4b5563" style={styles.actionIcon} />
                                <Text style={styles.quickActionText}>Ver Relatórios</Text>
                            </Button>
                        </CardContent>
                    </Card>
                )}
                
                {/* Recent Notifications */}
                <Card style={styles.sectionCard}>
                    <CardHeader style={styles.cardHeader}>
                        <View style={styles.cardHeaderContent}>
                            <Bell size={22} color="#2563eb" />
                            <CardTitle style={styles.cardTitle}>Notificações Recentes</CardTitle>
                        </View>
                    </CardHeader>
                    <CardContent style={styles.cardContent}>
                        {notifications.length === 0 ? (
                            <Text style={{ textAlign: 'center', color: '#6b7280', paddingVertical: 20 }}>
                                Nenhuma notificação recente
                            </Text>
                        ) : (
                            notifications.map((notification) => (
                                <View key={notification.id} style={styles.notificationItem}>
                                    <View style={[styles.unreadIndicator, { 
                                        backgroundColor: !notification.lida ? '#2563eb' : '#e5e7eb' 
                                    }]} />
                                    <View style={styles.notificationContent}>
                                        <Text style={styles.notificationTitle}>{notification.titulo}</Text>
                                        <Text style={styles.notificationTime}>
                                            {getTimeAgo(notification.createdAt)}
                                        </Text>
                                    </View>
                                    {!notification.lida && (
                                        <Badge variant="secondary" style={styles.newBadge}>Nova</Badge>
                                    )}
                                </View>
                            ))
                        )}
                    </CardContent>
                </Card>
                
                <ReservationsList reservations={reservations} formatDate={formatDate} formatTime={formatTime} />
                <IssuesList issues={issues} />
            </ScrollView>
        </SafeAreaView>
    );
}

// ====================================================================
// COMPONENTES AUXILIARES
// ====================================================================

// StatCard (CORRIGIDO E PADRONIZADO)
const StatCard = ({ icon, value, label, colorTheme }: StatCardProps) => (
    <Card style={[styles.statCard, { 
      backgroundColor: colors[colorTheme].bg, 
      borderColor: colors[colorTheme].border,
      borderWidth: 1,
    }]}>
        <CardContent style={styles.statCardContent}>
            <View style={styles.statIconContainer}>
                {React.isValidElement(icon)
                    ? React.cloneElement(icon as React.ReactElement<any>, { size: 28 })
                    : icon}
            </View>
            <Text 
                style={[styles.statCardValue, { color: colors[colorTheme].value }]}
            >
              {value}
            </Text>
            <Text 
                style={[styles.statCardLabel, { color: colors[colorTheme].label }]}
            >
              {label}
            </Text>
        </CardContent>
    </Card>
);

type ReservationsListProps = {
    reservations: Reserva[];
    formatDate: (date: string) => string;
    formatTime: (time: string) => string;
};

// ReservationsList (ESTRUTURA OK)
const ReservationsList = ({ reservations, formatDate, formatTime }: ReservationsListProps) => (
    <Card style={styles.sectionCard}>
      <CardHeader style={styles.cardHeader}>
        <View style={styles.cardHeaderContent}>
          <Calendar size={22} color="#16a34a" />
          <CardTitle style={styles.cardTitle}>Próximas Reservas</CardTitle>
        </View>
      </CardHeader>
      <CardContent style={styles.cardContent}>
        {reservations.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#6b7280', paddingVertical: 20 }}>
            Nenhuma reserva próxima
          </Text>
        ) : (
          reservations.map((r) => (
            <View key={r.id} style={[styles.listItem, styles.reservationItem]}>
              <View style={styles.listIconContainer}>
                <MapPin size={20} color="#16a34a" />
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{r.areaComumNome || 'Área Comum'}</Text>
                <Text style={styles.listItemSubtitle}>
                  {formatDate(r.dataReserva)} às {formatTime(r.horaInicio)}
                </Text>
              </View>
            </View>
          ))
        )}
      </CardContent>
    </Card>
);

type IssuesListProps = {
    issues: Ocorrencia[];
};

// IssuesList (ESTRUTURA OK)
const IssuesList = ({ issues }: IssuesListProps) => (
    <Card style={styles.sectionCard}>
        <CardHeader style={styles.cardHeader}>
          <View style={styles.cardHeaderContent}>
            <AlertTriangle size={22} color="#ea580c" />
            <CardTitle style={styles.cardTitle}>Ocorrências em Aberto</CardTitle>
          </View>
        </CardHeader>
        <CardContent style={styles.cardContent}>
            {issues.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#6b7280', paddingVertical: 20 }}>
                Nenhuma ocorrência em aberto
              </Text>
            ) : (
              issues.map((i) => (
                  <View key={i.id} style={[styles.listItem, styles.issueItem]}>
                      <View style={styles.listIconContainer}>
                        <AlertTriangle size={20} color="#ea580c" />
                      </View>
                      <View style={styles.listItemContent}>
                          <Text style={styles.listItemTitle}>{i.titulo}</Text>
                          <View style={styles.badgesContainer}>
                              <Badge variant='outline' style={styles.issueBadge}>
                                {i.tipoOcorrencia}
                              </Badge>
                              <Badge 
                                variant={i.statusOcorrencia === 'EM_ANDAMENTO' ? 'default' : 'secondary'}
                                style={styles.issueBadge}
                              >
                                {i.statusOcorrencia === 'EM_ANDAMENTO' ? 'Em andamento' : i.statusOcorrencia}
                              </Badge>
                          </View>
                      </View>
                  </View>
              ))
            )}
        </CardContent>
    </Card>
);