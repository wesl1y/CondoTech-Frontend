import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { API_URL } from '@/constants/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Building2, Eye, EyeOff } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false); // NOVO: Estado de carregamento
  const { signIn } = useAuth();
    const testApi = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: 'teste@email.com', password: '1234' })
      });
      const data = await res.json();
      console.log('API Response:', data);
      alert('Sucesso: ' + JSON.stringify(data));
    } catch (e: unknown) {
  let errorMessage = 'Erro desconhecido';
  if (e instanceof Error) {
    errorMessage = e.message;
  }
  console.error('Erro fetch API:', errorMessage);
  alert('Erro: ' + errorMessage);
}

  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Campos Obrigatórios', 'Por favor, preencha o e-mail e a senha.');
      return;
    }
    
    setIsLoggingIn(true); // Inicia o carregamento
    try {
      await signIn(email, password); // Chama o signIn com a senha
    } catch (error) {
      // O erro já é tratado e exibido pelo AuthContext,
      // mas podemos fazer algo a mais aqui se necessário.
    } finally {
      setIsLoggingIn(false); // Finaliza o carregamento, independentemente do resultado
    }
  };

  return (
    <LinearGradient
      colors={['#eff6ff', '#dbeafe']}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.content}>
          
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}><Building2 size={32} color="white" /></View>
            <Text style={styles.appName}>CondoTech</Text>
            <Text style={styles.appSubtitle}>Gestão inteligente do seu condomínio</Text>
          </View>

          <Card style={styles.loginCard}>
            <CardHeader><CardTitle>Entrar</CardTitle></CardHeader>
            <CardContent>
              <View style={styles.inputGroup}><Text style={styles.label}>E-mail</Text><Input placeholder="Digite seu e-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" /></View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Senha</Text>
                <View style={styles.passwordContainer}>
                  <Input placeholder="Digite sua senha" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} style={styles.passwordInput} />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    {showPassword ? <EyeOff size={20} color="#6b7280" /> : <Eye size={20} color="#6b7280" />}
                  </TouchableOpacity>
                </View>
              </View>

              <Button onPress={handleLogin} disabled={isLoggingIn}>
                {isLoggingIn ? (
                  <ActivityIndicator color="white" />
                ) : (
                  'Entrar'
                )}
              </Button>

              <View style={styles.forgotPasswordContainer}>
                <Link href="/forgot-password" asChild>
                  <TouchableOpacity disabled={isLoggingIn}>
                    <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
                  </TouchableOpacity>
                </Link>
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
  },
  loginCard: {
    width: '100%',
  },
  // ---------------------------------------------------
  inputGroup: {
    gap: 8,
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
  forgotPasswordContainer: {
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
});