import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Bell, Calendar, AlertTriangle, BarChart3, Users, MapPin, LogOut } from 'lucide-react-native';
import { useAuth } from '../../../context/AuthContext';

// Dados mockados
const notifications = [
    { id: 1, title: 'Manutenção da piscina agendada', time: '2h', unread: true },
    { id: 2, title: 'Nova assembleia marcada', time: '1d', unread: true },
    { id: 3, title: 'Liberação do salão de festas', time: '2d', unread: false },
];
const upcomingReservations = [
    { id: 1, area: 'Salão de Festas', date: '15/09', time: '19:00' },
    { id: 2, area: 'Churrasqueira', date: '17/09', time: '12:00' },
];
const openIssues = [
    { id: 1, type: 'Manutenção', description: 'Elevador com ruído', status: 'Em andamento' },
    { id: 2, type: 'Segurança', description: 'Portão da garagem travando', status: 'Pendente' },
];

export default function DashboardScreen() {
  const { user, signOut } = useAuth(); // Pega o usuário e a função de logout do contexto
  const isAdmin = user?.userType === 'admin';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
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
          <StatCard icon={<Bell color="#2563eb" />} value={notifications.filter(n => n.unread).length} label="Notificações" colorTheme="blue" />
          <StatCard icon={<Calendar color="#16a34a" />} value={upcomingReservations.length} label="Reservas" colorTheme="green" />
          <StatCard icon={<AlertTriangle color="#ea580c" />} value={openIssues.length} label="Ocorrências" colorTheme="orange" />
          {isAdmin && (
            <StatCard icon={<Users color="#9333ea" />} value="84" label="Moradores" colorTheme="purple" />
          )}
        </View>

        {/* Recent Notifications */}
        <Card>
          <CardHeader style={styles.cardHeaderWithIcon}>
            <Bell size={20} color="#2563eb" />
            <CardTitle style={styles.cardTitleWithIcon}>Notificações Recentes</CardTitle>
          </CardHeader>
          <CardContent style={styles.listContent}>
            {notifications.slice(0, 3).map((notification) => (
              <View key={notification.id} style={styles.notificationItem}>
                <View style={[styles.unreadIndicator, { backgroundColor: notification.unread ? '#2563eb' : '#d1d5db' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{notification.title}</Text>
                  <Text style={styles.itemSubtitle}>{notification.time}</Text>
                </View>
                {notification.unread && <Badge variant="secondary">Nova</Badge>}
              </View>
            ))}
          </CardContent>
        </Card>
        
        <ReservationsList />
        <IssuesList />

        {/* Admin-only Quick Actions */}
        {isAdmin && (
          <Card>
            <CardHeader style={styles.cardHeaderWithIcon}>
                <BarChart3 size={20} color="#2563eb" />
                <CardTitle style={styles.cardTitleWithIcon}>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent style={styles.quickActionsGrid}>
                <Button variant="outline" style={styles.quickActionButton}>
                    <Users size={20} color="#4b5563" />
                    <Text style={styles.quickActionText}>Gerenciar Moradores</Text>
                </Button>
                <Button variant="outline" style={styles.quickActionButton}>
                    <BarChart3 size={20} color="#4b5563" />
                    <Text style={styles.quickActionText}>Ver Relatórios</Text>
                </Button>
            </CardContent>
          </Card>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ----- COMPONENTES AUXILIARES E ESTILOS -----
// (Colados aqui para manter o arquivo único e fácil de copiar)

type StatCardProps = {
    icon: React.ReactElement;
    value: string | number;
    label: string;
    colorTheme: keyof typeof colors;
};

const StatCard = ({ icon, value, label, colorTheme }: StatCardProps) => (
    <Card style={[styles.statCard, { backgroundColor: colors[colorTheme].bg, borderColor: colors[colorTheme].border }]}>
        <CardContent style={styles.statCardContent}>
            {React.isValidElement(icon)
                ? React.cloneElement(icon as React.ReactElement<any>, { size: 32, style: styles.statCardIcon })
                : icon}
            <Text style={[styles.statCardValue, { color: colors[colorTheme].value }]}>{value}</Text>
            <Text style={[styles.statCardLabel, { color: colors[colorTheme].label }]}>{label}</Text>
        </CardContent>
    </Card>
);

const ReservationsList = () => (
    <Card>
      <CardHeader style={styles.cardHeaderWithIcon}><Calendar size={20} color="#16a34a" /><CardTitle style={styles.cardTitleWithIcon}>Próximas Reservas</CardTitle></CardHeader>
      <CardContent style={styles.listContent}>
        {upcomingReservations.map((r) => (
          <View key={r.id} style={[styles.notificationItem, { backgroundColor: '#f0fdf4'}]}>
            <MapPin size={20} color="#16a34a" />
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{r.area}</Text>
              <Text style={styles.itemSubtitle}>{r.date} às {r.time}</Text>
            </View>
          </View>
        ))}
      </CardContent>
    </Card>
);

const IssuesList = () => (
    <Card>
        <CardHeader style={styles.cardHeaderWithIcon}><AlertTriangle size={20} color="#ea580c" /><CardTitle style={styles.cardTitleWithIcon}>Ocorrências em Aberto</CardTitle></CardHeader>
        <CardContent style={styles.listContent}>
            {openIssues.map((i) => (
                <View key={i.id} style={[styles.notificationItem, { backgroundColor: '#fff7ed'}]}>
                    <AlertTriangle size={20} color="#ea580c" style={{ marginTop: 2 }}/>
                    <View style={{ flex: 1, gap: 4 }}>
                        <Text style={styles.itemTitle}>{i.description}</Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <Badge variant='outline'>{i.type}</Badge>
                            <Badge variant={i.status === 'Em andamento' ? 'default' : 'secondary'}>{i.status}</Badge>
                        </View>
                    </View>
                </View>
            ))}
        </CardContent>
    </Card>
);

const colors = {
    blue: { bg: '#eff6ff', border: '#bfdbfe', value: '#1e3a8a', label: '#1d4ed8'},
    green: { bg: '#f0fdf4', border: '#bbf7d0', value: '#14532d', label: '#15803d'},
    orange: { bg: '#fff7ed', border: '#fed7aa', value: '#7c2d12', label: '#9a3412'},
    purple: { bg: '#f5f3ff', border: '#ddd6fe', value: '#4c1d95', label: '#6d28d9'},
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f9fafb' },
    container: { padding: 16, gap: 24, paddingBottom: 48 },
    header: { gap: 4 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1e3a8a' },
    headerSubtitle: { fontSize: 16, color: '#4b5563' },
    quickStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 },
    statCard: { width: '48%' },
    statCardContent: { padding: 16, alignItems: 'center', gap: 4 },
    statCardIcon: { marginBottom: 4 },
    statCardValue: { fontSize: 24, fontWeight: 'bold' },
    statCardLabel: { fontSize: 14 },
    cardHeaderWithIcon: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 12 },
    cardTitleWithIcon: { textAlign: 'left', fontSize: 18, fontWeight: '600' },
    listContent: { gap: 12, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 0 },
    notificationItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 8 },
    unreadIndicator: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
    itemTitle: { color: '#111827', fontWeight: '500' },
    itemSubtitle: { fontSize: 12, color: '#6b7280' },
    quickActionsGrid: { flexDirection: 'row', gap: 12 },
    quickActionButton: { flex: 1, flexDirection: 'column', height: 'auto', paddingVertical: 12 },
    quickActionText: { fontSize: 12, color: '#374151', textAlign: 'center' }
});