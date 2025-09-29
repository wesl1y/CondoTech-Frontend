import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator, Text } from 'react-native';

export default function Index() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    console.log('🏠 Index useEffect - user:', user);

    if (user) {
      console.log('✅ Redirecionando para dashboard');
      router.replace('/(app)/(tabs)/dashboard');
    } else {
      console.log('❌ Redirecionando para login');
      router.replace('/(auth)/login');
    }
  }, [user, isLoading]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text style={{ marginTop: 10 }}>Carregando...</Text>
    </View>
  );
}