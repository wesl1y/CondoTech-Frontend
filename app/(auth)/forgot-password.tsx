import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, ArrowLeft } from 'lucide-react-native';
import { Link, useRouter } from 'expo-router';

// NOVO: Função de validação de e-mail com Regex
const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [isEmailValid, setIsEmailValid] = useState(true); // NOVO: Estado para feedback visual
    const router = useRouter();

    const handleEmailChange = (text: string) => {
        setEmail(text);
        // Valida em tempo real após o usuário começar a digitar
        if (text.length > 0) {
            setIsEmailValid(validateEmail(text));
        } else {
            setIsEmailValid(true); // Reseta para o estado normal se o campo estiver vazio
        }
    };

    const handlePasswordReset = () => {
        // ATUALIZADO: Adicionada a validação de formato
        if (!email) {
            Alert.alert('Campo Obrigatório', 'Por favor, insira seu e-mail.');
            return;
        }
        if (!validateEmail(email)) {
            Alert.alert('E-mail Inválido', 'Por favor, insira um endereço de e-mail válido.');
            setIsEmailValid(false); // Garante que a borda fique vermelha
            return;
        }

        // Lógica de recuperação de senha
        Alert.alert(
            'E-mail Enviado!',
            `Se houver uma conta associada a ${email}, um e-mail com as instruções foi enviado.`,
            [{ text: 'OK', onPress: () => router.back() }],
            { cancelable: false }
        );
    };

    return (
        <LinearGradient colors={['#eff6ff', '#dbeafe']} style={styles.container}>
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <Card style={styles.card}>
                        <CardHeader>
                            <CardTitle style={styles.title}>Recuperar Senha</CardTitle>
                            <Text style={styles.subtitle}>
                                Digite seu e-mail para receber as instruções.
                            </Text>
                        </CardHeader>
                        <CardContent>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>E-mail</Text>
                                <Input
                                    placeholder="Digite seu e-mail"
                                    value={email}
                                    onChangeText={handleEmailChange} // ATUALIZADO
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    // ATUALIZADO: Estilo condicional para feedback visual
                                    style={!isEmailValid && styles.inputError}
                                />
                                {!isEmailValid && (
                                    <Text style={styles.errorText}>Formato de e-mail inválido</Text>
                                )}
                            </View>
                            <Button onPress={handlePasswordReset}>
                                <Mail size={16} color="white" />
                                Enviar
                            </Button>
                        </CardContent>
                    </Card>
                    <Link href="/login" asChild>
                        <TouchableOpacity style={styles.backButton}>
                            <ArrowLeft size={16} color="#2563eb" />
                            <Text style={styles.backButtonText}>Voltar para o Login</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 16,
    },
    card: { width: '100%',
        padding: 16
     },
    title: { textAlign: 'center' },
    subtitle: {
        textAlign: 'center',
        color: '#6b7280',
        marginTop: 8,
    },
    inputGroup: { gap: 8, marginBottom: 16 },
    label: { color: '#374151', fontSize: 14 },
    // NOVO: Estilos para feedback de erro
    inputError: {
        borderColor: '#ef4444', // Vermelho para erro
    },
    errorText: {
        color: '#ef4444',
        fontSize: 12,
        marginTop: 4,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        gap: 8,
    },
    backButtonText: {
        color: '#2563eb',
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
});