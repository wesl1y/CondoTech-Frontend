import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { style } from "./styles"; // Vamos criar este estilo
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types'; 
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    Alert,
    SafeAreaView,
    StatusBar
} from 'react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPassword({ navigation }: Props) {
    const [email, setEmail] = useState('');

    const handlePasswordRecovery = () => {
        if (!email) {
            Alert.alert('Erro', 'Por favor, digite seu e-mail.');
            return;
        }
        console.log('Enviando link de recuperação para:', email);
        Alert.alert(
            'Verifique seu E-mail',
            `Enviamos um link de recuperação de senha para ${email}.`
        );
        navigation.goBack(); 
    };

    return (
        <SafeAreaView style={style.container}>
            <StatusBar barStyle="dark-content" />
            <View style={style.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={style.backButton}>
                    <Ionicons name="arrow-back" size={28} color="#333" />
                </TouchableOpacity>
            </View>

            <View style={style.content}>
                <Text style={style.title}>Esqueceu sua senha?</Text>
                <Text style={style.subtitle}>
                    Sem problemas! Digite seu e-mail abaixo e enviaremos instruções para você criar uma nova senha.
                </Text>

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
                    />
                </View>

                <TouchableOpacity style={style.button} onPress={handlePasswordRecovery}>
                    <Text style={style.buttonText}>Enviar Link</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}