import { Button } from '@/components/ui/button'; // ATUALIZADO: 'ButtonText' removido da importação
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { API_URL } from '@/constants/api';
import api from '@/services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Loader2, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'; // ATUALIZADO: 'Text' já está aqui
import { SafeAreaView } from 'react-native-safe-area-context';

const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [isEmailValid, setIsEmailValid] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleEmailChange = (text: string) => {
        setEmail(text);
        if (text.length > 0) {
            setIsEmailValid(validateEmail(text));
        } else {
            setIsEmailValid(true);
        }
    };const handlePasswordReset = async () => {
    if (!email || !validateEmail(email)) {
        setIsEmailValid(false);
        Alert.alert('E-mail Inválido', 'Por favor, insira um endereço de e-mail válido.');
        return;
    }

    setIsLoading(true);

    try {
        await api.postPublic('/auth/forgot-password', { email });

        Alert.alert(
            'E-mail Enviado!',
            `Se houver uma conta associada a ${email}, um e-mail com as instruções foi enviado.`,
            [{ text: 'OK', onPress: () => router.back() }],
            { cancelable: false }
        );

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
        
        // Trata o erro 404 (usuário não encontrado)
        if (errorMessage.includes("Usuário não encontrado") || errorMessage.includes("não encontrado")) {
            Alert.alert(
                'E-mail não cadastrado',
                'Não existe uma conta associada a este e-mail. Verifique se digitou corretamente.',
                [{ text: 'OK' }]
            );
        } else {
            // Outros erros
            Alert.alert('Erro', errorMessage);
        }
        
        console.log('❌ Erro:', errorMessage);

    } finally {
        setIsLoading(false);
    }
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
                                    onChangeText={handleEmailChange}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    style={!isEmailValid && styles.inputError}
                                    editable={!isLoading}
                                />
                                {!isEmailValid && (
                                    <Text style={styles.errorText}>Formato de e-mail inválido</Text>
                                )}
                            </View>
                            
                           
                            <Button style={styles.button} onPress={handlePasswordReset} disabled={isLoading}>
                                {isLoading ? (
                                    <Loader2 size={18} color="white" className="animate-spin" />
                                ) : (
                                    <Mail size={18} color="white" />
                                )}
                                <Text style={styles.buttonText}>
                                    {isLoading ? 'Enviando...' : 'Enviar'}
                                </Text>
                            </Button>
                        </CardContent>
                    </Card>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()} disabled={isLoading}>
                        <ArrowLeft size={16} color="#2563eb" />
                        <Text style={styles.backButtonText}>Voltar para o Login</Text>
                    </TouchableOpacity>
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
    card: { 
        width: '100%',
        padding: 16,
        backgroundColor: 'white'
    },
    title: { textAlign: 'center' },
    subtitle: {
        textAlign: 'center',
        color: '#6b7280',
        marginTop: 8,
    },
    inputGroup: { gap: 8, marginBottom: 16 },
    label: { color: '#374151', fontSize: 14, fontWeight: '500' },
    inputError: {
        borderColor: '#ef4444',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 12,
    },
    // NOVO: Estilos para o botão e seu texto
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
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
    },
});