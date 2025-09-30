import React from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Calendar, AlertTriangle, BarChart3, Users, MapPin } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { styles, colors } from './styles';

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
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
              <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isAdmin ? 'Painel do Síndico' : 'Meu Condomínio'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isAdmin ? 'Visão geral da gestão do condomínio' : 'Acompanhe as novidades do seu lar'}
          </Text>
        </View>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}


        {/* Quick Stats */}
        <View style={styles.quickStatsGrid}>
          <TouchableOpacity 
            style={styles.statCardWrapper}
            onPress={() => router.push('/notifications')}
          >
            <StatCard 
              icon={<Bell color="#2563eb" />} 
              value={notifications.filter(n => n.unread).length} 
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
              value={upcomingReservations.length} 
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
              value={openIssues.length} 
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
                value="84" 
                label="Moradores" 
                colorTheme="purple" 
              />
            </TouchableOpacity>
          )}
        </View>
                  
        {/* Admin Quick Actions */}
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