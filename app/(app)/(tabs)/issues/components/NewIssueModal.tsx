// src/app/(tabs)/issues/components/NewIssueModal.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, Image, Alert, ActivityIndicator, Platform, Dimensions, KeyboardAvoidingView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Ocorrencia, ocorrenciaService } from '@/services/ocorrenciaService';
import { styles } from '../styles';
import { Camera } from 'lucide-react-native';
import { issueTypes } from '../issues.constants';

interface NewIssueModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const NewIssueModal = ({ visible, onClose, onSuccess }: NewIssueModalProps) => {
    const { user } = useAuth();
    const [issueType, setIssueType] = useState(issueTypes[0]);
    const [issueTitle, setIssueTitle] = useState('');
    const [issueDescription, setIssueDescription] = useState('');
    const [image, setImage] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const windowHeight = Dimensions.get('window').height;

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert('Permissão necessária', 'É necessário permitir acesso à galeria');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 0.8 });
        if (!result.canceled) setImage(result.assets[0]);
    };

    const takePhoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert('Permissão necessária', 'É necessário permitir acesso à câmera');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.8 });
        if (!result.canceled) setImage(result.assets[0]);
    };

    const showImageOptions = () => Alert.alert('Adicionar Foto', 'Escolha uma opção', [{ text: 'Câmera', onPress: takePhoto }, { text: 'Galeria', onPress: pickImage }, { text: 'Cancelar', style: 'cancel' }]);

    const handleSubmit = async () => {
        if (!issueTitle.trim() || !issueDescription.trim()) {
            Alert.alert('Atenção', 'Preencha o título e a descrição');
            return;
        }
        if (!user || !user.moradorId) {
            Alert.alert('Erro', 'Utilizador não identificado.');
            return;
        }
        setLoading(true);
        try {
            const ocorrencia: Ocorrencia = { moradorId: user.moradorId, tipoOcorrencia: issueType.toUpperCase(), titulo: issueTitle, descricao: issueDescription, statusOcorrencia: 'ABERTA' };
            await ocorrenciaService.create(ocorrencia, image);
            Alert.alert('Sucesso', 'Ocorrência registrada com sucesso');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Erro ao criar ocorrência:', error);
            Alert.alert('Erro', 'Não foi possível registrar a ocorrência');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={visible} onOpenChange={onClose}>
            <DialogContent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={{ height: windowHeight * 0.85 }}>
                        <DialogHeader>
                            <DialogTitle>Nova Ocorrência</DialogTitle>
                            <DialogDescription>Descreva o problema que você encontrou.</DialogDescription>
                        </DialogHeader>

                        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Tipo da ocorrência</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker selectedValue={issueType} onValueChange={(itemValue) => setIssueType(itemValue)} style={styles.picker}>
                                        {issueTypes.map(type => (<Picker.Item key={type} label={type} value={type} />))}
                                    </Picker>
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Título</Text>
                                <Input placeholder="Ex: Elevador com problema" value={issueTitle} onChangeText={setIssueTitle} />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Descrição</Text>
                                <Textarea placeholder="Descreva detalhadamente a ocorrência..." value={issueDescription} onChangeText={setIssueDescription} numberOfLines={5} />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Foto (opcional)</Text>
                                {image ? (
                                    <View>
                                        <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                                        <Button variant="outline" onPress={() => setImage(null)} style={{ marginTop: 12, borderColor: '#ef4444' }}>
                                            <Text style={{ color: '#ef4444', fontWeight: '600' }}>Remover foto</Text>
                                        </Button>
                                    </View>
                                ) : (
                                    <Button variant="outline" style={styles.cameraButton} onPress={showImageOptions}>
                                        <Camera size={24} color="#6b7280" />
                                        <Text style={styles.cameraButtonText}>Adicionar foto</Text>
                                    </Button>
                                )}
                            </View>
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <Button variant="outline" onPress={onClose} style={styles.modalButton} disabled={loading}>
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </Button>
                            <Button onPress={handleSubmit} style={styles.modalButton} disabled={!issueTitle || !issueDescription || loading}>
                                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitButtonText}>Registrar</Text>}
                            </Button>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </DialogContent>
        </Dialog>
    );
};