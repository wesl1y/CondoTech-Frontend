// Localização: app/_layout.tsx

import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

const InitialLayout = () => {
  const { user, isLoading } = useAuth(); // <-- MUDANÇA AQUI
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAppGroup = segments[0] === '(app)';

    if (user && !inAppGroup) { // <-- MUDANÇA AQUI
      router.replace('/(app)/(tabs)/dashboard' as any);
    } else if (!user && inAppGroup) { // <-- MUDANÇA AQUI
      router.replace('/(auth)/login');
    }
  }, [user, isLoading, segments]); // <-- MUDANÇA AQUI

  if (isLoading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" /></View>;
  }

  return <Slot />;
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}