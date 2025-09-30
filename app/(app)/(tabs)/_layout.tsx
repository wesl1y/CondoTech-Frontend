import { Tabs } from 'expo-router';
import { Home, Bell, Calendar, AlertTriangle, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs 
      initialRouteName="dashboard" 
      screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarLabelStyle: { fontSize: 10, paddingBottom: 2 },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard', tabBarIcon: ({ color, size }) => <Home color={color} size={size} />, }} />
      <Tabs.Screen name="notifications" options={{ title: 'Avisos', tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />, }} />
      <Tabs.Screen name="reservations" options={{ title: 'Reservas', tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />, }} />
      <Tabs.Screen name="issues" options={{ title: 'Ocorrências', tabBarIcon: ({ color, size }) => <AlertTriangle color={color} size={size} />, }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <User color={color} size={size} />, }} />
    </Tabs>
  );
}