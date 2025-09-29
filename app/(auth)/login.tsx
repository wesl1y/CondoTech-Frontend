import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LinearGradient } from 'expo-linear-gradient';
import { Building2, Eye, EyeOff } from 'lucide-react-native';
import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = () => {
    if (email && password) {
      signIn(email);
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
          
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Building2 size={32} color="white" />
            </View>
            <Text style={styles.appName}>CondoTech</Text>
            <Text style={styles.appSubtitle}>Gestão inteligente do seu condomínio</Text>
          </View>

          {/* Login Form */}
          <Card style={styles.loginCard}>
            <CardHeader>
              <CardTitle>Entrar</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>E-mail</Text>
                <Input
                  placeholder="Digite seu e-mail"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Senha</Text>
                <View style={styles.passwordContainer}>
                  <Input
                    placeholder="Digite sua senha"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    style={styles.passwordInput}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    {showPassword ? <EyeOff size={20} color="#6b7280" /> : <Eye size={20} color="#6b7280" />}
                  </TouchableOpacity>
                </View>
              </View>

              <Button 
                onPress={handleLogin}
                disabled={!email || !password}
              >
                Entrar
              </Button>

              <View style={styles.forgotPasswordContainer}>
                <TouchableOpacity>
                  <Text style={styles.forgotPasswordText}>
                    Esqueci minha senha
                  </Text>
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>

          {/* Demo accounts */}
          <Card style={styles.demoCard}>
            <CardContent style={{ paddingTop: 16 }}>
              <Text style={styles.demoTitle}>Contas de demonstração:</Text>
              <View style={styles.demoTextContainer}>
                <Text style={styles.demoText}><Text style={{fontWeight: 'bold'}}>Síndico:</Text> sindico@demo.com / 123456</Text>
                <Text style={styles.demoText}><Text style={{fontWeight: 'bold'}}>Morador:</Text> morador@demo.com / 123456</Text>
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
  demoCard: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  demoTitle: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 12,
  },
  demoTextContainer: {
    gap: 8,
  },
  demoText: {
    fontSize: 12,
    color: '#6b7280',
  }
});