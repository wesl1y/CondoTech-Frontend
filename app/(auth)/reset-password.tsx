import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { API_URL } from '@/constants/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, KeyRound } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      Alert.alert('Erro', 'Token inválido ou ausente', [
        {
          text: 'OK',
          onPress: () => router.replace('/(auth)/login'),
        },
      ]);
    }
  }, [token]);

  const handleResetPassword = async () => {
    // Validações
    if (!newPassword || !confirmPassword) {
      Alert.alert('Campos Obrigatórios', 'Preencha todos os campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Erro', 'A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_URL + '/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          newPassword: newPassword,
        }),
      });

      const responseText = await response.text();
      let data;

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('❌ Erro ao fazer parse do JSON:', parseError);
          throw new Error('Resposta inválida do servidor');
        }
      } else {
        console.error('❌ Resposta vazia do servidor');
        throw new Error('Servidor retornou resposta vazia');
      }

      if (response.ok) {
        Alert.alert(
          'Sucesso!',
          'Sua senha foi redefinida com sucesso. Faça login com sua nova senha.',
          [
            {
              text: 'Fazer Login',
              onPress: () => router.replace('/(auth)/login'),
            },
          ]
        );
      } else {
        Alert.alert('Erro', data.message || 'Erro ao redefinir senha');
      }
    } catch (error) {
      console.error('❌ Erro completo ao redefinir senha:', error);

      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        Alert.alert(
          'Erro de Conexão',
          `Não foi possível conectar ao servidor.\n\nVerifique:\n• Sua internet\n• Se o backend está rodando\n• Se o API_URL está correto: ${API_URL}`
        );
      } else {
        Alert.alert(
          'Erro',
          error instanceof Error ? error.message : 'Erro ao redefinir senha. Tente novamente.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#eff6ff', '#dbeafe']} style={styles.container}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.content}>
          {/* Logo/Ícone */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <KeyRound size={32} color="white" />
            </View>
            <Text style={styles.appName}>Redefinir Senha</Text>
            <Text style={styles.appSubtitle}>Digite sua nova senha abaixo</Text>
          </View>

          {/* Card Principal */}
          <Card style={styles.resetCard}>
            <CardHeader>
              <CardTitle>Nova Senha</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Campo Nova Senha */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nova senha</Text>
                <View style={styles.passwordContainer}>
                  <Input
                    placeholder="Digite sua nova senha"
                    secureTextEntry={!showPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    autoCapitalize="none"
                    style={styles.passwordInput}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#6b7280" />
                    ) : (
                      <Eye size={20} color="#6b7280" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Campo Confirmar Senha */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirmar nova senha</Text>
                <View style={styles.passwordContainer}>
                  <Input
                    placeholder="Digite novamente sua senha"
                    secureTextEntry={!showPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    autoCapitalize="none"
                    style={styles.passwordInput}
                  />
                </View>
              </View>

              {/* Botão Redefinir */}
              <Button onPress={handleResetPassword} disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : 'Redefinir Senha'}
              </Button>

              {/* Botão Cancelar */}
              <View style={styles.cancelContainer}>
                <TouchableOpacity
                  onPress={() => router.replace('/(auth)/login')}
                  disabled={loading}
                >
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 24,
  },
  logoContainer: {
    alignItems: 'center',
    gap: 8,
  },
  logoBackground: {
    width: 64,
    height: 64,
    backgroundColor: '#2563eb',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  appSubtitle: {
    color: '#4b5563',
    textAlign: 'center',
  },
  resetCard: {
    padding: 16,
    width: '100%',
  },
  inputGroup: {
    gap: 8,
    marginBottom: 16, // Adicionado para espaçamento
  },
  label: {
    color: '#374151',
    fontSize: 14,
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
  },
  cancelContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  cancelText: {
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
});