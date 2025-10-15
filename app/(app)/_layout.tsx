import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { useAuth } from '../../context/AuthContext';
import { View, Text, StyleSheet } from 'react-native';
import { Building2, Home, Users, BarChart3, Grid3X3 } from 'lucide-react-native';
// --- IMPORTS ADICIONAIS ---
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { useRouter, usePathname } from 'expo-router';

// Componente para a logo no header (sem alterações)
const HeaderLogo = () => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
    <View style={styles.logoBackground}><Building2 size={20} color="white" /></View>
    <Text style={styles.appName}>CondoTech</Text>
  </View>
);

// --- CONTEÚDO DE MENU CUSTOMIZADO ATUALIZADO ---
function CustomDrawerContent(props: any) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Pega a rota atual (ex: "/reports")

  // Função para verificar se um item do menu está ativo
  const isItemActive = (path: string) => {
    return pathname.startsWith(path);
  };

  return (
    <DrawerContentScrollView {...props}>
      {/* Item de menu para "Início", que leva para a primeira aba */}
      <DrawerItem
        label="Início"
        icon={({ color, size }) => <Home color={color} size={size} />}
        focused={isItemActive('/dashboard') || isItemActive('/notifications') || isItemActive('/reservations') || isItemActive('/issues') || isItemActive('/profile')}
        onPress={() => router.push('/dashboard')}
      />

      {/* Itens de menu que só aparecem para o admin */}
      {user?.role === 'ADMIN' && (
        <>
          <DrawerItem
            label="Relatórios"
            icon={({ color, size }) => <BarChart3 color={color} size={size} />}
            focused={isItemActive('/reports')} // <-- A MÁGICA ACONTECE AQUI
            onPress={() => router.push('/reports')}
          />
          <DrawerItem
            label="Moradores"
            icon={({ color, size }) => <Users color={color} size={size} />}
            focused={isItemActive('/residents')} 
            onPress={() => router.push('/residents')}
          />
         <DrawerItem
          label="Gerenciar Áreas"
           icon={({ color, size }) => <Grid3X3 color={color} size={size} />}
          focused={isItemActive('/manage-reservations')} 
          onPress={() => router.push('/manage-reservations')} />
          </>
    )}
    </DrawerContentScrollView>
  );
}

export default function AppLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerTitle: () => <HeaderLogo />,
        headerStyle: { backgroundColor: '#fff', elevation: 0, shadowOpacity: 0 },
        headerTintColor: '#1e3a8a',
      }}
    >
      {/* O Drawer não precisa mais definir as telas aqui, pois o menu customizado cuida de tudo */}
    </Drawer>
  );
}

const styles = StyleSheet.create({
  logoBackground: { width: 32, height: 32, backgroundColor: '#2563eb', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  appName: { fontSize: 18, fontWeight: 'bold', color: '#1e3a8a' },

});