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
  const { user, signOut } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

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
          <StatCard 
            icon={<Bell color="#2563eb" />} 
            value={notifications.filter(n => n.unread).length} 
            label="Notificações" 
            colorTheme="blue" 
          />
          <StatCard 
            icon={<Calendar color="#16a34a" />} 
            value={upcomingReservations.length} 
            label="Reservas" 
            colorTheme="green" 
          />
          <StatCard 
            icon={<AlertTriangle color="#ea580c" />} 
            value={openIssues.length} 
            label="Ocorrências" 
            colorTheme="orange" 
          />
          {isAdmin && (
            <StatCard 
              icon={<Users color="#9333ea" />} 
              value="84" 
              label="Moradores" 
              colorTheme="purple" 
            />
          )}
        </View>

        {/* Admin-only Quick Actions */}
        {isAdmin && (
          <Card style={styles.sectionCard}>
            <CardHeader style={styles.cardHeader}>
              <View style={styles.cardHeaderContent}>
                <BarChart3 size={22} color="#2563eb" />
                <CardTitle style={styles.cardTitle}>Ações Rápidas</CardTitle>
              </View>
            </CardHeader>
            <CardContent style={styles.quickActionsContent}>
              <Button variant="outline" style={styles.quickActionButton}>
                <Users size={22} color="#4b5563" style={styles.actionIcon} />
                <Text style={styles.quickActionText}>Gerenciar Moradores</Text>
              </Button>
              <Button variant="outline" style={styles.quickActionButton}>
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
            {notifications.slice(0, 3).map((notification) => (
              <View key={notification.id} style={styles.notificationItem}>
                <View style={[styles.unreadIndicator, { 
                  backgroundColor: notification.unread ? '#2563eb' : '#e5e7eb' 
                }]} />
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationTime}>{notification.time}</Text>
                </View>
                {notification.unread && (
                  <Badge variant="secondary" style={styles.newBadge}>Nova</Badge>
                )}
              </View>
            ))}
          </CardContent>
        </Card>
        
        <ReservationsList />
        <IssuesList />


      </ScrollView>
    </SafeAreaView>
  );
}

// ----- COMPONENTES AUXILIARES -----

type StatCardProps = {
    icon: React.ReactElement;
    value: string | number;
    label: string;
    colorTheme: keyof typeof colors;
};

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
            <Text style={[styles.statCardValue, { color: colors[colorTheme].value }]}>
              {value}
            </Text>
            <Text style={[styles.statCardLabel, { color: colors[colorTheme].label }]}>
              {label}
            </Text>
        </CardContent>
    </Card>
);

const ReservationsList = () => (
    <Card style={styles.sectionCard}>
      <CardHeader style={styles.cardHeader}>
        <View style={styles.cardHeaderContent}>
          <Calendar size={22} color="#16a34a" />
          <CardTitle style={styles.cardTitle}>Próximas Reservas</CardTitle>
        </View>
      </CardHeader>
      <CardContent style={styles.cardContent}>
        {upcomingReservations.map((r) => (
          <View key={r.id} style={[styles.listItem, styles.reservationItem]}>
            <View style={styles.listIconContainer}>
              <MapPin size={20} color="#16a34a" />
            </View>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>{r.area}</Text>
              <Text style={styles.listItemSubtitle}>{r.date} às {r.time}</Text>
            </View>
          </View>
        ))}
      </CardContent>
    </Card>
);

const IssuesList = () => (
    <Card style={styles.sectionCard}>
        <CardHeader style={styles.cardHeader}>
          <View style={styles.cardHeaderContent}>
            <AlertTriangle size={22} color="#ea580c" />
            <CardTitle style={styles.cardTitle}>Ocorrências em Aberto</CardTitle>
          </View>
        </CardHeader>
        <CardContent style={styles.cardContent}>
            {openIssues.map((i) => (
                <View key={i.id} style={[styles.listItem, styles.issueItem]}>
                    <View style={styles.listIconContainer}>
                      <AlertTriangle size={20} color="#ea580c" />
                    </View>
                    <View style={styles.listItemContent}>
                        <Text style={styles.listItemTitle}>{i.description}</Text>
                        <View style={styles.badgesContainer}>
                            <Badge variant='outline' style={styles.issueBadge}>
                              {i.type}
                            </Badge>
                            <Badge 
                              variant={i.status === 'Em andamento' ? 'default' : 'secondary'}
                              style={styles.issueBadge}
                            >
                              {i.status}
                            </Badge>
                        </View>
                    </View>
                </View>
            ))}
        </CardContent>
    </Card>
);

const colors = {
    blue: { bg: '#eff6ff', border: '#bfdbfe', value: '#1e40af', label: '#2563eb'},
    green: { bg: '#f0fdf4', border: '#bbf7d0', value: '#166534', label: '#16a34a'},
    orange: { bg: '#fff7ed', border: '#fed7aa', value: '#9a3412', label: '#ea580c'},
    purple: { bg: '#f5f3ff', border: '#ddd6fe', value: '#6d28d9', label: '#9333ea'},
};

const styles = StyleSheet.create({
    safeArea: { 
      flex: 1, 
      backgroundColor: '#f3f4f6' 
    },
    container: { 
      padding: 20, 
      paddingBottom: 32 
    },
    
    // Header
    header: { 
      marginBottom: 24,
      paddingHorizontal: 4,
    },
    headerTitle: { 
      fontSize: 32, 
      fontWeight: 'bold', 
      color: '#1e3a8a',
      marginBottom: 4,
      lineHeight: 38,
    },
    headerSubtitle: { 
      fontSize: 16, 
      color: '#6b7280',
      lineHeight: 22,
    },
    
    // Quick Stats Grid
    quickStatsGrid: { 
      flexDirection: 'row', 
      flexWrap: 'wrap', 
      justifyContent: 'space-between', 
      gap: 12,
      marginBottom: 24,
    },
    statCard: { 
      width: '48%',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    statCardContent: { 
      padding: 20, 
      alignItems: 'center', 
      gap: 8,
    },
    statIconContainer: {
      marginBottom: 4,
    },
    statCardValue: { 
      fontSize: 32, 
      fontWeight: 'bold',
      lineHeight: 38,
    },
    statCardLabel: { 
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'center',
    },
    
    // Section Cards
    sectionCard: {
      marginBottom: 20,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    cardHeader: { 
      paddingTop: 16,
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
    },
    cardHeaderContent: {
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 10,
    },
    cardTitle: { 
      fontSize: 18, 
      fontWeight: '600',
      color: '#111827',
      lineHeight: 24,
    },
    cardContent: { 
      padding: 16,
    },
    
    // Notifications
    notificationItem: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 12, 
      padding: 14,
      backgroundColor: '#f9fafb',
      borderRadius: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: '#e5e7eb',
    },
    unreadIndicator: { 
      width: 10, 
      height: 10, 
      borderRadius: 5,
    },
    notificationContent: {
      flex: 1,
      gap: 4,
    },
    notificationTitle: { 
      color: '#111827', 
      fontWeight: '500',
      fontSize: 15,
      lineHeight: 20,
    },
    notificationTime: { 
      fontSize: 13, 
      color: '#6b7280',
    },
    newBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    
    // List Items (Reservations & Issues)
    listItem: {
      flexDirection: 'row', 
      alignItems: 'flex-start', 
      gap: 14, 
      padding: 14,
      borderRadius: 10,
      marginBottom: 10,
      borderWidth: 1,
    },
    reservationItem: {
      backgroundColor: '#f0fdf4',
      borderColor: '#bbf7d0',
    },
    issueItem: {
      backgroundColor: '#fff7ed',
      borderColor: '#fed7aa',
    },
    listIconContainer: {
      marginTop: 2,
    },
    listItemContent: {
      flex: 1,
      gap: 6,
    },
    listItemTitle: { 
      color: '#111827', 
      fontWeight: '600',
      fontSize: 15,
      lineHeight: 20,
    },
    listItemSubtitle: { 
      fontSize: 13, 
      color: '#6b7280',
      lineHeight: 18,
    },
    badgesContainer: { 
      flexDirection: 'row', 
      gap: 8,
      flexWrap: 'wrap',
      marginTop: 2,
    },
    issueBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    
    // Quick Actions
    quickActionsContent: { 
      flexDirection: 'row', 
      gap: 12,
      padding: 16,
    },
    quickActionButton: { 
      flex: 1, 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
      paddingHorizontal: 12,
      gap: 10,
      minHeight: 100,
    },
    actionIcon: {
      marginBottom: 4,
    },
    quickActionText: { 
      fontSize: 13, 
      color: '#374151', 
      textAlign: 'center',
      fontWeight: '500',
      lineHeight: 18,
    },
});