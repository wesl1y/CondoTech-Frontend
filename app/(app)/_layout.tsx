import { Drawer } from 'expo-router/drawer';
import { useAuth } from '../../context/AuthContext';
import { View, Text, StyleSheet } from 'react-native';
import { Building2, Home, Users, BarChart3 } from 'lucide-react-native';

// Componente da logo no header
const HeaderLogo = () => (
  <View style={styles.headerLogoContainer}>
    <View style={styles.logoBackground}>
      <Building2 size={22} color="white" strokeWidth={2.5} />
    </View>
    <Text style={styles.appName}>CondoTech</Text>
  </View>
);

export default function AppLayout() {
  const { user } = useAuth();

  return (
    <Drawer
      screenOptions={{
        headerShown: true,
        headerTitle: () => <HeaderLogo />,
        headerStyle: styles.header,
        headerTintColor: '#3b82f6',
        drawerActiveTintColor: '#3b82f6',
        drawerInactiveTintColor: '#6b7280',
        drawerActiveBackgroundColor: '#eff6ff',
        drawerLabelStyle: styles.drawerLabel,
        drawerItemStyle: styles.drawerItem,
        drawerStyle: styles.drawer,
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          drawerLabel: 'Início',
          title: 'Início',
          drawerIcon: ({ color, size }) => <Home color={color} size={22} strokeWidth={2} />,
        }}
      />
      
      <Drawer.Screen
        name="reports"
        options={{
          drawerLabel: 'Relatórios',
          title: 'Relatórios',
          drawerIcon: ({ color, size }) => <BarChart3 color={color} size={22} strokeWidth={2} />,
          drawerItemStyle: user?.role !== 'ADMIN' ? { display: 'none' } : undefined,
        }}
      />
      
      <Drawer.Screen
        name="residents"
        options={{
          drawerLabel: 'Moradores',
          title: 'Moradores',
          drawerIcon: ({ color, size }) => <Users color={color} size={22} strokeWidth={2} />,
          drawerItemStyle: user?.role !== 'ADMIN' ? { display: 'none' } : undefined,
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  // Header
  header: {
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  logoBackground: {
    width: 40,
    height: 40,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e3a8a',
    letterSpacing: -0.5,
  },
  
  // Drawer
  drawer: {
    backgroundColor: '#ffffff',
    paddingTop: 20,
  },
  drawerLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 4,
  },
  drawerItem: {
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 4,
    paddingVertical: 4,
  },
});