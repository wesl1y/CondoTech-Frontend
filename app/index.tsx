// Localização: app/index.tsx
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  // Esta tela apenas mostra um indicador de carregamento.
  // A lógica de redirecionamento está toda no app/_layout.tsx,
  // que é o lugar certo para ela.
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );
}