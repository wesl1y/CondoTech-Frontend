import { Tabs } from 'expo-router';
import { AlertTriangle, Bell, Calendar, Home, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs 
      initialRouteName="dashboard/index" 
      screenOptions={{ 
        headerShown: false, // O header agora é controlado pelo Drawer
        tabBarActiveTintColor: '#2563eb',
        tabBarLabelStyle: { fontSize: 10, paddingBottom: 2 },
      }}
    >
      {/* Abas que APARECEM na barra inferior */}
      <Tabs.Screen name="dashboard/index" options={{ title: 'Dashboard', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} />
      <Tabs.Screen name="notifications" options={{ title: 'Avisos', tabBarIcon: ({ color, size }) => <Bell color={color} size={size} /> }} />
      <Tabs.Screen name="reservations" options={{ title: 'Reservas', tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} /> }} />
      <Tabs.Screen name="issues/index" options={{ title: 'Ocorrências', tabBarIcon: ({ color, size }) => <AlertTriangle color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }} />
      
      {/* Telas que existem DENTRO da navegação por abas, mas ficam ESCONDIDAS da barra inferior */}
      <Tabs.Screen
        name="residents"
        options={{
          href: null, // Esconde esta tela da barra de abas
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          href: null, // Esconde esta tela da barra de abas
        }}
      />
    </Tabs>
  );
}