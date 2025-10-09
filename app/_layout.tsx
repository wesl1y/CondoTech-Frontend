// Localização: app/_layout.tsx

import { Stack, useRouter, useSegments } from 'expo-router'; // 1. Importe 'Stack' aqui
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Toast from 'react-native-toast-message'; // 2. Importe 'Toast' aqui
import { toastConfig } from '../config/toastConfig';
import { AuthProvider, useAuth } from '../context/AuthContext';

const InitialLayout = () => {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAppGroup = segments[0] === '(app)';

    // --- LÓGICA SIMPLIFICADA E MAIS ROBUSTA ---
    if (user && !inAppGroup) {
      // Se está logado, GARANTA que ele vá para a área do app.
      router.replace('/(app)/(tabs)/dashboard');
    } else if (!user) {
      // Se NÃO está logado, GARANTA que ele vá para a área de login,
      // não importa onde ele esteja (seja na área do app ou não).
      router.replace('/(auth)/login');
    }
  }, [user, isLoading]);

  // Enquanto carrega, mostre um indicador de atividade
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  // A Stack define a estrutura de navegação principal
  // headerShown: false para que as telas internas controlem seus próprios cabeçalhos
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(app)" />
      <Stack.Screen name="(auth)" />
      {/* Adicione outras rotas de nível raiz aqui se necessário, como modais */}
    </Stack>
  );
};


// Esta é a única exportação padrão, que o Expo Router usará
export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
      
      {/* 2. PASSE A CONFIGURAÇÃO PARA O COMPONENTE TOAST */}
      <Toast config={toastConfig} />
    </AuthProvider>
  );
}