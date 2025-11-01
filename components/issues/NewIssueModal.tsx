import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/context/AuthContext';
import { Ocorrencia, ocorrenciaService } from '@/services/ocorrenciaService';
import { IssueTypeDTO } from '@/services/IssueTypeService';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { styles } from '../../styles/issues/_styles';
import { backendStatus } from './issues.constants';

interface NewIssueModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    availableTypes: IssueTypeDTO[]; // ✅ Recebe tipos como prop
}

export const NewIssueModal = ({ visible, onClose, onSuccess, availableTypes }: NewIssueModalProps) => {
    const { user } = useAuth();
    const windowHeight = Dimensions.get('window').height;
    
    const [selectedIssueTypeId, setSelectedIssueTypeId] = useState<number | null>(null);
    const [issueTitle, setIssueTitle] = useState('');
    const [issueDescription, setIssueDescription] = useState('');
    const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [loading, setLoading] = useState(false);

    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // ✅ Seleciona automaticamente o primeiro tipo quando os tipos são carregados
    useEffect(() => {
        if (visible && availableTypes.length > 0 && selectedIssueTypeId === null) {
            console.log('✅ Selecionando primeiro tipo:', availableTypes[0]);
            setSelectedIssueTypeId(availableTypes[0].id);
        }
    }, [visible, availableTypes, selectedIssueTypeId]);

    // Limpa form quando modal fecha
    useEffect(() => {
        if (!visible) {
            const timer = setTimeout(() => {
                if (isMountedRef.current) {
                    resetForm();
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [visible]);

    const resetForm = () => {
        setSelectedIssueTypeId(null);
        setIssueTitle('');
        setIssueDescription('');
        setImage(null);
    };

    const pickImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                Alert.alert('Permissão necessária', 'É necessário permitir acesso à galeria');
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8
            });
            if (!result.canceled && result.assets && result.assets[0]) {
                setImage(result.assets[0]);
            }
        } catch (error) {
            console.error('Erro ao selecionar imagem:', error);
            Alert.alert('Erro', 'Não foi possível selecionar a imagem');
        }
    };

    const takePhoto = async () => {
        try {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            if (!permissionResult.granted) {
                Alert.alert('Permissão necessária', 'É necessário permitir acesso à câmera');
                return;
            }
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                quality: 0.8
            });
            if (!result.canceled && result.assets && result.assets[0]) {
                setImage(result.assets[0]);
            }
        } catch (error) {
            console.error('Erro ao tirar foto:', error);
            Alert.alert('Erro', 'Não foi possível tirar a foto');
        }
    };

    const showImageOptions = () => {
        Alert.alert(
            'Adicionar Foto',
            'Escolha uma opção',
            [
                { text: 'Câmera', onPress: takePhoto },
                { text: 'Galeria', onPress: pickImage },
                { text: 'Cancelar', style: 'cancel' }
            ]
        );
    };

    const handleSubmit = async () => {
        // Validações
        if (!issueTitle.trim() || !issueDescription.trim()) {
            Alert.alert('Atenção', 'Preencha o título e a descrição');
            return;
        }
        if (!selectedIssueTypeId) {
            Alert.alert('Atenção', 'Selecione um tipo de ocorrência');
            return;
        }
        if (!user?.moradorId) {
            Alert.alert('Erro', 'Utilizador não identificado.');
            return;
        }

        setLoading(true);
        console.log('📝 Criando ocorrência com tipo ID:', selectedIssueTypeId);
        
        try {
            const issueData: Partial<Ocorrencia> = {
                residentId: user.moradorId,
                issueTypeId: selectedIssueTypeId,
                title: issueTitle.trim(),
                description: issueDescription.trim(),
                issueStatus: backendStatus.OPEN
            };

            await ocorrenciaService.create(issueData, image);
            
            if (isMountedRef.current) {
                console.log('✅ Ocorrência criada com sucesso');
                Alert.alert('Sucesso', 'Ocorrência registrada com sucesso', [
                    {
                        text: 'OK',
                        onPress: () => {
                            onSuccess();
                            onClose();
                        }
                    }
                ]);
            }
        } catch (error: any) {
            console.error('❌ Erro ao criar ocorrência:', error);
            if (isMountedRef.current) {
                Alert.alert('Erro', `Não foi possível registrar a ocorrência: ${error.message || 'Erro desconhecido'}`);
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    };

    const handleClose = () => {
        if (loading) return;
        onClose();
    };

    if (!user) {
        return null;
    }

    return (
        <Dialog open={visible} onOpenChange={handleClose}>
            <DialogContent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    
                >
                    <View style={{ height: windowHeight * 0.85 }}>
                        <DialogHeader>
                            <DialogTitle>Nova Ocorrência</DialogTitle>
                            <DialogDescription>Descreva o problema que você encontrou.</DialogDescription>
                        </DialogHeader>

                        <ScrollView 
                            style={{ flex: 1 }} 
                            keyboardShouldPersistTaps="handled" 
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        >
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Tipo da ocorrência</Text>
                                {availableTypes.length === 0 ? (
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <Text style={{ color: '#6b7280', fontSize: 14 }}>
                                            Nenhum tipo disponível
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={selectedIssueTypeId}
                                            onValueChange={(itemValue) => {
                                                if (itemValue !== null) {
                                                    console.log('🎯 Tipo selecionado ID:', itemValue);
                                                    setSelectedIssueTypeId(itemValue as number);
                                                }
                                            }}
                                            style={styles.picker}
                                            enabled={!loading}
                                        >
                                            {availableTypes.map(type => (
                                                <Picker.Item 
                                                    key={type.id} 
                                                    label={type.name} 
                                                    value={type.id} 
                                                />
                                            ))}
                                        </Picker>
                                    </View>
                                )}
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Título</Text>
                                <Input
                                    placeholder="Ex: Elevador com problema"
                                    value={issueTitle}
                                    onChangeText={setIssueTitle}
                                    editable={!loading}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Descrição</Text>
                                <Textarea
                                    placeholder="Descreva detalhadamente a ocorrência..."
                                    value={issueDescription}
                                    onChangeText={setIssueDescription}
                                    numberOfLines={5}
                                    editable={!loading}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Foto (opcional)</Text>
                                {image ? (
                                    <View>
                                        <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                                        <Button
                                            variant="outline"
                                            onPress={() => setImage(null)}
                                            style={{ marginTop: 12, borderColor: '#ef4444' }}
                                            disabled={loading}
                                        >
                                            <Text style={{ color: '#ef4444', fontWeight: '600' }}>
                                                Remover foto
                                            </Text>
                                        </Button>
                                    </View>
                                ) : (
                                    <Button
                                        variant="outline"
                                        style={styles.cameraButton}
                                        onPress={showImageOptions}
                                        disabled={loading}
                                    >
                                        <Camera size={24} color="#6b7280" />
                                        <Text style={styles.cameraButtonText}>Adicionar foto</Text>
                                    </Button>
                                )}
                            </View>
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <Button
                                variant="outline"
                                onPress={handleClose}
                                style={styles.modalButton}
                                disabled={loading}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </Button>
                            <Button
                                onPress={handleSubmit}
                                style={styles.modalButton}
                                disabled={!issueTitle.trim() || !issueDescription.trim() || loading || !selectedIssueTypeId || availableTypes.length === 0}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.submitButtonText}>Registrar</Text>
                                )}
                            </Button>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </DialogContent>
        </Dialog>
    );
};