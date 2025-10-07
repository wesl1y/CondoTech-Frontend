import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../../../../context/AuthContext';
import { Badge } from '../../../../components/ui/badge';
import { Switch } from '../../../../components/ui/Switch';
import { User, Mail, MapPin, Car, Shield, Bell, LogOut, Key, Settings, ChevronRight } from 'lucide-react-native';
import { styles } from './styles';
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
