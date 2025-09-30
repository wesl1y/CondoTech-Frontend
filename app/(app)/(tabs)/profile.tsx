import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { Badge } from '../../../components/ui/badge';
import { Switch } from '../../../components/ui/Switch';
import { User, Mail, MapPin, Car, Shield, Bell, LogOut, Key, Settings, ChevronRight } from 'lucide-react-native';

// --- INTERFACE DE TIPAGEM PARA O INFO CARD ---
type InfoCardProps = {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </SafeAreaView>
    );
  }
  
  const getRoleBadgeVariant = (role: 'ADMIN' | 'USER') => (role === 'ADMIN' ? 'secondary' : 'success');
  const getRoleDisplayName = (role: 'ADMIN' | 'USER') => (role === 'ADMIN' ? 'Síndico' : 'Morador');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Meu Perfil</Text>
          <Text style={styles.headerSubtitle}>Gerencie suas informações e configurações</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatar, { backgroundColor: user.role === 'ADMIN' ? '#fef3c7' : '#dbeafe' }]}>
              <Text style={[styles.avatarText, { color: user.role === 'ADMIN' ? '#d97706' : '#2563eb' }]}>
                {user.avatar}
              </Text>
            </View>
            <Badge 
              variant={getRoleBadgeVariant(user.role)} 
              style={styles.roleBadge}
            >
              {getRoleDisplayName(user.role)}
            </Badge>
          </View>
          
          <View style={styles.profileBody}>
            <Text style={styles.userName}>{user.name}</Text>
            
            <View style={styles.profileDetails}>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <MapPin size={16} color="#6b7280" />
                </View>
                <Text style={styles.detailText}>{user.unit} - {user.tower}</Text>
              </View>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Mail size={16} color="#6b7280" />
                </View>
                <Text style={styles.detailText}>{user.email}</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Vehicles Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrapper}>
              <Car size={18} color="#3b82f6" />
            </View>
            <Text style={styles.sectionTitle}>Veículos Cadastrados</Text>
          </View>
          <View style={styles.sectionContent}>
            {user.vehicles && user.vehicles.length > 0 ? (
              <View style={styles.vehicleGrid}>
                {user.vehicles.map((vehicle) => (
                  <View key={vehicle.id} style={styles.vehicleCard}>
                    <View style={styles.vehicleIcon}>
                      <Car size={16} color="#3b82f6" />
                    </View>
                    <View style={styles.vehicleInfo}>
                      <Text style={styles.vehiclePlate}>{vehicle.placa}</Text>
                      {vehicle.modelo && <Text style={styles.vehicleModel}>{vehicle.modelo}</Text>}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Car size={32} color="#d1d5db" />
                <Text style={styles.emptyText}>Nenhum veículo cadastrado</Text>
              </View>
            )}
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrapper}>
              <Bell size={18} color="#3b82f6" />
            </View>
            <Text style={styles.sectionTitle}>Notificações</Text>
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingText}>Notificações Push</Text>
                <Text style={styles.settingDescription}>Receber alertas e avisos no dispositivo</Text>
              </View>
              <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
            </View>
          </View>
        </View>
        
        {/* Security Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrapper}>
              <Shield size={18} color="#3b82f6" />
            </View>
            <Text style={styles.sectionTitle}>Segurança</Text>
          </View>
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
              <View style={styles.actionIcon}>
                <Key size={18} color="#4b5563" />
              </View>
              <Text style={styles.actionText}>Alterar Senha</Text>
              <ChevronRight size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Admin Settings - Only for ADMIN */}
        {user.role === 'ADMIN' && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconWrapper}>
                <Settings size={18} color="#3b82f6" />
              </View>
              <Text style={styles.sectionTitle}>Administração</Text>
            </View>
            <View style={styles.sectionContent}>
              <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
                <View style={styles.actionIcon}>
                  <Settings size={18} color="#4b5563" />
                </View>
                <Text style={styles.actionText}>Configurações do Condomínio</Text>
                <ChevronRight size={18} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={signOut}
          activeOpacity={0.7}
        >
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.logoutButtonText}>Sair do Aplicativo</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- ESTILOS COMPLETAMENTE REFATORADOS ---
const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#f9fafb' 
  },
  container: { 
    padding: 20, 
    gap: 16, 
    paddingBottom: 40 
  },
  loadingText: { 
    padding: 20, 
    textAlign: 'center', 
    color: '#6b7280',
    fontSize: 15,
  },
  
  // Header
  headerContainer: { 
    marginBottom: 8,
    gap: 4,
  },
  headerTitle: { 
    fontSize: 32, 
    fontWeight: '700', 
    color: '#1e3a8a',
    letterSpacing: -0.5,
  },
  headerSubtitle: { 
    fontSize: 15, 
    color: '#6b7280',
    marginTop: 2,
  },
  
  // Profile Card
  profileCard: { 
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: { 
    fontSize: 32, 
    fontWeight: '700',
    letterSpacing: 1,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  profileBody: {
    gap: 12,
  },
  userName: { 
    fontSize: 24, 
    fontWeight: '700', 
    color: '#111827',
    letterSpacing: -0.5,
  },
  profileDetails: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 15,
    color: '#4b5563',
    flex: 1,
  },

  // Section Card
  sectionCard: { 
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: '#111827',
    letterSpacing: -0.3,
    flex: 1,
  },
  sectionContent: { 
    padding: 20,
  },

  // Vehicles
  vehicleGrid: {
    gap: 10,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f9fafb',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  vehicleIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfo: {
    flex: 1,
    gap: 2,
  },
  vehiclePlate: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#111827',
    letterSpacing: 0.5,
  },
  vehicleModel: { 
    fontSize: 13, 
    color: '#6b7280',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyText: { 
    color: '#9ca3af', 
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Settings
  settingRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    gap: 16,
  },
  settingInfo: {
    flex: 1,
    gap: 4,
  },
  settingText: { 
    fontSize: 16, 
    color: '#111827', 
    fontWeight: '600',
  },
  settingDescription: { 
    fontSize: 13, 
    color: '#6b7280',
    lineHeight: 18,
  },
  
  // Action Button
  actionButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f9fafb',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },

  // Logout Button
  logoutButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fecaca',
    marginTop: 8,
  },
  logoutButtonText: { 
    color: '#ef4444', 
    fontWeight: '700',
    fontSize: 16,
  },
});