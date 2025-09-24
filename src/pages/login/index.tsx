import React, { useState } from "react";
import { Ionicons } from '@expo/vector-icons';
import { style } from "./styles";
import { RootStackParamList } from '../../navigation/types'; 
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
    Text,
    View,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar
} from 'react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function Login({ navigation }: Props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = () => {
        if (!email || !password) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos');
            return;
        }
        // Aqui você implementaria a lógica de login
        Alert.alert('Login', `Email: ${email}`);
    };

    const handleForgotPassword = () => {
        navigation.navigate('ForgotPassword');
    };


    return (
        <KeyboardAvoidingView 
            style={style.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={-100} 
        >
            <ScrollView 
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={style.boxTop}>
                    <View style={style.logoContainer}>
                        <Ionicons name="document-text" size={40} color="#4a90e2" />
                    </View>
                    <Text style={style.appName}>CondoTech</Text>
                    <Text style={style.subtitle}>Gestão inteligente do seu condomínio</Text>
                </View>

                <View style={style.boxMid}>
                    <View style={style.loginCard}>
                        <Text style={style.loginTitle}>Entrar</Text>
                        
                        <View style={style.inputContainer}>
                            <Text style={style.inputLabel}>E-mail</Text>
                            <TextInput
                                style={style.input}
                                placeholder="Digite seu e-mail"
                                placeholderTextColor="#999"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        <View style={style.inputContainer}>
                            <Text style={style.inputLabel}>Senha</Text>
                            <View style={style.passwordContainer}>
                                <TextInput
                                    style={style.passwordInput}
                                    placeholder="Digite sua senha"
                                    placeholderTextColor="#999"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoCorrect={false}
                                />
                                <TouchableOpacity
                                    style={style.eyeButton}
                                    onPress={() => setShowPassword(!showPassword)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={showPassword ? "eye-off" : "eye"}
                                        size={20}
                                        color="#999"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={style.loginButton} 
                            onPress={handleLogin}
                            activeOpacity={0.8}
                        >
                            <Text style={style.loginButtonText}>Entrar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={handleForgotPassword}
                            activeOpacity={0.7}
                        >
                            <Text style={style.forgotPasswordText}>Esqueci minha senha</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}