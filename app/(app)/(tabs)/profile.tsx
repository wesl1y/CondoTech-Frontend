// Location: app/(app)/(tabs)/profile.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Separator } from '../../../components/ui/Separator';
import { Switch } from '../../../components/ui/Switch';
import { User, Mail, MapPin, Car, Shield, Bell, LogOut, Edit, Key, Settings } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  if (!user) {
    // This is a safeguard in case the user data is not available yet
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text>Carregando perfil...</Text>
      </SafeAreaView>
    );
  }

  const getRoleBadgeVariant = (role: string) => (role === 'Síndico' ? 'secondary' : 'success');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Meu Perfil</Text>
          <Text style={styles.headerSubtitle}>Gerencie suas informações e configurações</Text>
        </View>

        {/* Profile Summary */}
        <Card>
          <CardContent style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user.avatar}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                </View>
                <Text style={styles.userInfoText}><MapPin size={14} color="#6b7280"/> {user.unit} - {user.tower}</Text>
                <Text style={styles.userInfoText}><Mail size={14} color="#6b7280"/> {user.email}</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Details Section (Vehicles, Notifications, Security) */}
        <InfoCard title="Veículos" icon={<Car color="#2563eb" />}>
            <View style={styles.vehicleContainer}>
                {user.vehicles.map((v) => <Badge key={v} variant='outline'>{v}</Badge>)}
            </View>
        </InfoCard>

        <InfoCard title="Notificações" icon={<Bell color="#2563eb" />}>
            <View style={styles.settingRow}>
                <View style={{ flex: 1 }}><Text style={styles.settingText}>Notificações Push</Text></View>
                <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
            </View>
        </InfoCard>
        
        <InfoCard title="Segurança" icon={<Shield color="#2563eb" />}>
             <Button variant="outline" style={{ justifyContent: 'flex-start' }}>
                <Key size={16} color="#4b5563" /> Alterar Senha
            </Button>
        </InfoCard>
        
        {/* Admin-only Settings */}
        {user.userType === 'admin' && (
            <InfoCard title="Configurações de Administrador" icon={<Settings color="#2563eb" />}>
                <Button variant="outline" style={{ justifyContent: 'flex-start' }}>
                    <Settings size={16} color="#4b5563" /> Configurações do Condomínio
                </Button>
            </InfoCard>
        )}

        {/* Logout */}
        <View style={{ marginTop: 16 }}>
            <Button onPress={signOut} variant='outline' style={{ borderColor: '#ef4444' }}>
                <LogOut size={16} color="#ef4444" />
                <Text style={{ color: '#ef4444', fontWeight: '600' }}>Sair do Aplicativo</Text>
            </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


type InfoCardProps = {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
};

const InfoCard: React.FC<InfoCardProps> = ({ title, icon, children }) => (
    <Card>
        <CardHeader style={styles.cardHeader}>
            {icon}
            <CardTitle style={{ fontSize: 18 }}>{title}</CardTitle>
        </CardHeader>
        <CardContent style={{ paddingTop: 0, paddingBottom: 16, paddingHorizontal: 16 }}>
            {children}
        </CardContent>
    </Card>
);

// --- STYLES ---

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9fafb' },
  container: { padding: 16, gap: 16 },
  header: { marginBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1e3a8a' },
  headerSubtitle: { fontSize: 16, color: '#4b5563' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#2563eb' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  userInfoText: { fontSize: 14, color: '#6b7280', marginTop: 4, flexDirection: 'row', alignItems: 'center' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 12 },
  vehicleContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingText: { fontSize: 16, color: '#374151' },
});