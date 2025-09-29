import { Tabs } from 'expo-router';
import { Home, Bell, Calendar, AlertTriangle, User, Users, BarChart3 } from 'lucide-react-native';
import { useAuth } from '../../../context/AuthContext';

export default function TabLayout() {
  const { user } = useAuth();

  return (
    <Tabs 
      initialRouteName="dashboard" 
      screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        // --- CORREÇÃO AQUI ---
        // Adicionamos esta linha para diminuir o tamanho da fonte dos rótulos
        tabBarLabelStyle: {
          fontSize: 10, // Diminui o tamanho da fonte para caber
          paddingBottom: 2, // Ajuste de espaçamento
        },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard', tabBarIcon: ({ color, size }) => <Home color={color} size={size} />, }} />
      <Tabs.Screen name="notifications" options={{ title: 'Avisos', tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />, }} />
      <Tabs.Screen name="reservations" options={{ title: 'Reservas', tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />, }} />
      <Tabs.Screen name="issues" options={{ title: 'Ocorrências', tabBarIcon: ({ color, size }) => <AlertTriangle color={color} size={size} />, }} />
      
    <Tabs.Screen
      name="residents"
      options={{
        title: 'Moradores',
        tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        href: user?.userType === 'admin' ? undefined : null, // 🔑 esconde para não-admin
      }}
    />

    <Tabs.Screen
      name="reports"
      options={{
        title: 'Relatórios',
        tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
        href: user?.userType === 'admin' ? undefined : null, // 🔑 esconde para não-admin
      }}
    />


      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <User color={color} size={size} />, }} />
    </Tabs>
  );
}