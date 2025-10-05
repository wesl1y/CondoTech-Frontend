// src/screens/IssuesScreen/index.tsx

import { Picker } from '@react-native-picker/picker';
import React, { useState, useEffect, useCallback } from 'react';
import { FlatList, SafeAreaView, ScrollView, Text, TouchableOpacity, View, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';

import { AlertTriangle, Camera, CheckCircle2, Clock, Plus, XCircle, ImageIcon, MessageSquare, Trash2, Send, User } from 'lucide-react-native';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { ocorrenciaService, Ocorrencia } from '@/services/ocorrenciaService';
import { comentarioService, Comentario } from '@/services/comentarioService';
import { useFocusEffect } from '@react-navigation/native';
import { getFullImageUrl } from '@/utils/imageUtils';
import { styles } from './styles';

const issueTypes = [
    'Manutenção', 
    'Segurança', 
    'Limpeza', 
    'Infraestrutura', 
    'Barulho', 
    'Iluminação', 
    'Outros'
];

const statusMap: { [key: string]: string } = {
    'ABERTA': 'Pendente',
    'EM_ANDAMENTO': 'Em andamento',
    'RESOLVIDA': 'Resolvida',
    'FECHADA': 'Resolvida',
    'CANCELADA': 'Cancelada'
};

interface IssueCardProps {
    issue: Ocorrencia;
    onPress: () => void;
}


const IssueCard = ({ issue, onPress }: IssueCardProps) => {
    const displayStatus = statusMap[issue.statusOcorrencia] || issue.statusOcorrencia;
    
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Resolvida': return <CheckCircle2 size={22} color="#16a34a" />;
            case 'Em andamento': return <Clock size={22} color="#ca8a04" />;
            case 'Pendente': return <AlertTriangle size={22} color="#dc2626" />;
            case 'Cancelada': return <XCircle size={22} color="#6b7280" />;
            default: return <XCircle size={22} color="#6b7280" />;
        }
    };
    
    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'Resolvida': return 'success';
            case 'Em andamento': return 'warning';
            case 'Pendente': return 'danger';
            case 'Cancelada': return 'default';
            default: return 'default';
        }
    };
    
    const getPriorityColor = (status: string) => {
        switch (status) {
            case 'Resolvida': return '#16a34a';
            case 'Em andamento': return '#ca8a04';
            case 'Pendente': return '#dc2626';
            case 'Cancelada': return '#9ca3af';
            default: return '#6b7280';
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    };

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Card style={[styles.issueCard, { borderLeftColor: getPriorityColor(displayStatus) }]}>
                <CardContent style={styles.issueCardContent}>
                    <View style={styles.statusIconContainer}>
                        {getStatusIcon(displayStatus)}
                    </View>
                    <View style={styles.issueCardBody}>
                        <View style={styles.issueCardHeader}>
                            <Text style={styles.issueTitle} numberOfLines={1}>
                                {issue.titulo}
                            </Text>
                            <Badge 
                                variant={getStatusBadgeVariant(displayStatus)}
                                style={styles.statusBadge}
                            >
                                {displayStatus}
                            </Badge>
                        </View>
                        <Text style={styles.issueType}>{issue.tipoOcorrencia}</Text>
                        <Text style={styles.issueDescription} numberOfLines={2}>
                            {issue.descricao}
                        </Text>
                        <View style={styles.issueMetaContainer}>
                            <Text style={styles.issueMeta}>
                                {issue.moradorNome || 'Morador'}
                            </Text>
                            <View style={styles.metaRight}>
                                {issue.imageUrl && (
                                    <View style={styles.imageIndicator}>
                                        <ImageIcon size={14} color="#6b7280" />
                                    </View>
                                )}
                                <Text style={styles.issueDate}>{formatDate(issue.createdAt)}</Text>
                            </View>
                        </View>
                    </View>
                </CardContent>
            </Card>
        </TouchableOpacity>
    );
};

export default function IssuesScreen() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const [activeTab, setActiveTab] = useState('Todas');
    const [showNewIssueModal, setShowNewIssueModal] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<Ocorrencia | null>(null);
    
    const [allIssues, setAllIssues] = useState<Ocorrencia[]>([]);
    const [cancelledIssues, setCancelledIssues] = useState<Ocorrencia[]>([]);
    const [loading, setLoading] = useState(true);

    const tabs = ['Todas', 'Pendente', 'Em andamento', 'Resolvida'];
    if (isAdmin) {
        tabs.push('Canceladas');
    }
    
    const loadIssues = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            let activeData: Ocorrencia[] = [];
            let cancelledData: Ocorrencia[] = [];

            if (isAdmin) {
                [activeData, cancelledData] = await Promise.all([
                    ocorrenciaService.getAll(),
                    ocorrenciaService.getAll('CANCELADA')
                ]);
            } else if (user.moradorId) {
                activeData = await ocorrenciaService.getByMorador(user.moradorId);
            }
            
            setAllIssues(activeData);
            setCancelledIssues(cancelledData);
        } catch (error) {
            console.error('Erro ao carregar ocorrências:', error);
            Alert.alert('Erro', 'Não foi possível carregar as ocorrências');
        } finally {
            setLoading(false);
        }
    }, [user, isAdmin]);

    useFocusEffect(
        useCallback(() => {
            loadIssues();
        }, [loadIssues])
    );
    
    useEffect(() => {
        if (selectedIssue) {
            const allCurrentIssues = [...allIssues, ...cancelledIssues];
            const refreshedIssue = allCurrentIssues.find(issue => issue.id === selectedIssue.id);
            if (refreshedIssue) {
                setSelectedIssue(refreshedIssue);
            } else {
                setSelectedIssue(null);
            }
        }
    }, [allIssues, cancelledIssues, selectedIssue]);

    const getStatusCount = (status: string) => {
        if (status === 'Todas') return allIssues.length;
        if (status === 'Canceladas') return cancelledIssues.length;
        return allIssues.filter(i => (statusMap[i.statusOcorrencia] || '') === status).length;
    };
    
    const issuesToDisplay = (() => {
        if (activeTab === 'Canceladas') return cancelledIssues;
        if (activeTab === 'Todas') return allIssues;
        return allIssues.filter(i => (statusMap[i.statusOcorrencia] || '') === activeTab);
    })();
    
    if (!user) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.emptyContainer, { flex: 1 }]}>
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>Ocorrências</Text>
                    <Text style={styles.headerSubtitle}>Registe e acompanhe problemas</Text>
                </View>
                <Button onPress={() => setShowNewIssueModal(true)} style={styles.newButton}>
                    <Plus size={18} color="white" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Nova</Text>
                </Button>
            </View>

            <View style={styles.statusCardsContainer}>
                <View style={[styles.statusCard, styles.statusCardDanger]}>
                    <AlertTriangle size={20} color="#dc2626" />
                    <Text style={styles.statusCardNumber}>{getStatusCount('Pendente')}</Text>
                    <Text style={styles.statusCardLabel}>Pendentes</Text>
                </View>
                <View style={[styles.statusCard, styles.statusCardWarning]}>
                    <Clock size={20} color="#ca8a04" />
                    <Text style={styles.statusCardNumber}>{getStatusCount('Em andamento')}</Text>
                    <Text style={styles.statusCardLabel}>Em andamento</Text>
                </View>
                <View style={[styles.statusCard, styles.statusCardSuccess]}>
                    <CheckCircle2 size={20} color="#16a34a" />
                    <Text style={styles.statusCardNumber}>{getStatusCount('Resolvida')}</Text>
                    <Text style={styles.statusCardLabel}>Resolvidas</Text>
                </View>
            </View>

            <View style={styles.tabsContainer}>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsScrollContent}
                >
                    {tabs.map(tab => (
                        <TouchableOpacity 
                            key={tab} 
                            onPress={() => setActiveTab(tab)} 
                            style={[styles.tab, activeTab === tab && styles.activeTab]}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                {tab}
                            </Text>
                            <View style={[styles.tabBadge, activeTab === tab && styles.activeTabBadge]}>
                                <Text style={[styles.tabBadgeText, activeTab === tab && styles.activeTabBadgeText]}>
                                    {getStatusCount(tab)}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <FlatList
                data={loading ? [] : issuesToDisplay}
                keyExtractor={item => item.id?.toString() || Math.random().toString()}
                renderItem={({ item }) => (
                    <IssueCard issue={item} onPress={() => setSelectedIssue(item)} />
                )}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <AlertTriangle size={48} color="#9ca3af" />
                            <Text style={styles.emptyText}>Nenhuma ocorrência encontrada</Text>
                        </View>
                    ) : null
                }
                refreshing={loading}
                onRefresh={loadIssues}
            />
            
            <NewIssueModal 
                visible={showNewIssueModal} 
                onClose={() => setShowNewIssueModal(false)}
                onSuccess={loadIssues}
            />

            {selectedIssue && (
                <IssueDetailModal 
                    issue={selectedIssue} 
                    visible={!!selectedIssue} 
                    onClose={() => setSelectedIssue(null)}
                    onUpdate={loadIssues}
                />
            )}
        </SafeAreaView>
    );
}


interface NewIssueModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const NewIssueModal = ({ visible, onClose, onSuccess }: NewIssueModalProps) => {
    const { user } = useAuth();
    const [issueType, setIssueType] = useState(issueTypes[0]);
    const [issueTitle, setIssueTitle] = useState('');
    const [issueDescription, setIssueDescription] = useState('');
    const [image, setImage] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const windowHeight = Dimensions.get('window').height;

    // Funções (pickImage, takePhoto, handleSubmit) permanecem as mesmas...
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
                    {/* ETAPA 1: O Container principal com ALTURA DEFINIDA. */}
                    <View style={{ height: windowHeight * 0.85 }}>
                        <DialogHeader>
                            <DialogTitle>Nova Ocorrência</DialogTitle>
                            <DialogDescription>Descreva o problema que você encontrou.</DialogDescription>
                        </DialogHeader>
                        
                        {/* ETAPA 2: A área de rolagem que ocupa o espaço flexível. */}
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
                                <Input placeholder="Ex: Elevador com problema" value={issueTitle} onChangeText={setIssueTitle}/>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Descrição</Text>
                                <Textarea placeholder="Descreva detalhadamente a ocorrência..." value={issueDescription} onChangeText={setIssueDescription} numberOfLines={5}/>
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
                        
                        {/* ETAPA 3: O rodapé com os botões, agora fixo na base do container. */}
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

interface IssueDetailModalProps {
    issue: Ocorrencia;
    visible: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

const IssueDetailModal = ({ issue, visible, onClose, onUpdate }: IssueDetailModalProps) => {
    const { user } = useAuth();
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [loadingImage, setLoadingImage] = useState(false);
    const [updating, setUpdating] = useState(false);
    
    const [comentarios, setComentarios] = useState<Comentario[]>([]);
    const [loadingComentarios, setLoadingComentarios] = useState(false);
    const [novoComentario, setNovoComentario] = useState('');
    const [enviandoComentario, setEnviandoComentario] = useState(false);
    
    const displayStatus = statusMap[issue.statusOcorrencia] || issue.statusOcorrencia;
    const isAdmin = user?.role === 'ADMIN';
    const canCancel = isAdmin && !['RESOLVIDA', 'CANCELADA', 'FECHADA'].includes(issue.statusOcorrencia);

    
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Resolvida': return <CheckCircle2 size={28} color="#16a34a" />;
            case 'Em andamento': return <Clock size={28} color="#ca8a04" />;
            case 'Pendente': return <AlertTriangle size={28} color="#dc2626" />;
            case 'Cancelada': return <XCircle size={28} color="#6b7280" />;
            default: return <XCircle size={28} color="#6b7280" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Resolvida': return '#16a34a';
            case 'Em andamento': return '#ca8a04';
            case 'Pendente': return '#dc2626';
            case 'Cancelada': return '#6b7280';
            default: return '#6b7280';
        }
    };

    const getStatusBackgroundColor = (status: string) => {
        switch (status) {
            case 'Resolvida': return '#f0fdf4';
            case 'Em andamento': return '#fefce8';
            case 'Pendente': return '#fef2f2';
            case 'Cancelada': return '#f3f4f6';
            default: return '#f9fafb';
        }
    };

    useEffect(() => {
        const loadComentarios = async () => {
            if (!issue.id || !visible) return;
            setLoadingComentarios(true);
            try {
                const data = await comentarioService.getByOcorrencia(issue.id);
                setComentarios(data);
            } catch (error) {
                console.error('Erro ao carregar comentários:', error);
            } finally {
                setLoadingComentarios(false);
            }
        };
        loadComentarios();
    }, [issue.id, visible]);

    useEffect(() => {
        const loadImage = async () => {
            if (!issue.imageUrl) return;
            setLoadingImage(true);
            try {
                const imageUrl = getFullImageUrl(issue.imageUrl);
                const token = await SecureStore.getItemAsync('my-jwt');
                const response = await fetch(imageUrl!, { headers: { Authorization: `Bearer ${token}` } });
                if (response.ok) {
                    const blob = await response.blob();
                    const reader = new FileReader();
                    reader.onloadend = () => setImageBase64(reader.result as string);
                    reader.readAsDataURL(blob);
                } else {
                    setImageBase64(null);
                }
            } catch (error) {
                console.error("Erro ao buscar imagem:", error);
                setImageBase64(null);
            } finally {
                setLoadingImage(false);
            }
        };
        if (visible) loadImage();
    }, [issue.imageUrl, visible]);
    
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Não informada';
        const date = new Date(dateString);
        return `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    };

    const formatCommentDate = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'Agora';
        if (minutes < 60) return `${minutes}m`;
        if (hours < 24) return `${hours}h`;
        if (days < 7) return `${days}d`;
        return date.toLocaleDateString('pt-BR');
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!issue.id) return;
        setUpdating(true);
        try {
            const updatedData: Ocorrencia = { ...issue, statusOcorrencia: newStatus, dataResolucao: ['RESOLVIDA', 'FECHADA'].includes(newStatus) ? new Date().toISOString() : issue.dataResolucao };
            await ocorrenciaService.update(issue.id, updatedData);
            onUpdate();
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível atualizar o status');
        } finally {
            setUpdating(false);
        }
    };

    const handleCancel = () => {
        Alert.alert(
            'Confirmar Cancelamento',
            'Deseja realmente cancelar esta ocorrência? Esta ação não pode ser desfeita.',
            [
                { text: 'Voltar', style: 'cancel' },
                {
                    text: 'Sim, Cancelar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (issue.id) {
                                await ocorrenciaService.cancel(issue.id);
                                onUpdate();
                                onClose();
                            }
                        } catch (error) {
                            Alert.alert('Erro', 'Não foi possível cancelar a ocorrência');
                        }
                    }
                }
            ]
        );
    };

    const handleEnviarComentario = async () => {
        if (!novoComentario.trim() || !issue.id || !user || !user.moradorId) return;
        
        setEnviandoComentario(true);
        try {
            const comentario: Comentario = {
                ocorrenciaId: issue.id,
                moradorId: user.moradorId,
                texto: novoComentario.trim(),
            };
            
            const novoComent = await comentarioService.create(comentario);
            setComentarios(prev => [...prev, novoComent]);
            setNovoComentario('');
        } catch (error) {
            console.error('Erro ao enviar comentário:', error);
            Alert.alert('Erro', 'Não foi possível enviar o comentário');
        } finally {
            setEnviandoComentario(false);
        }
    };

    return (
        <Dialog open={visible} onOpenChange={onClose}>
            <DialogContent>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={100} 
                >
                    <ScrollView style={styles.detailScrollView} showsVerticalScrollIndicator={false}>
                        <View style={[styles.detailStatusHeader, { backgroundColor: getStatusBackgroundColor(displayStatus) }]}>
                            <View style={styles.detailStatusIconContainer}>{getStatusIcon(displayStatus)}</View>
                            <View style={styles.detailStatusInfo}>
                                <Text style={styles.detailStatusLabel}>Status</Text>
                                <Text style={[styles.detailStatusText, { color: getStatusColor(displayStatus) }]}>{displayStatus}</Text>
                            </View>
                        </View>

                        {isAdmin && (
                            <View style={styles.quickActionsContainer}>
                                <Text style={styles.quickActionsLabel}>Ações rápidas</Text>
                                <View style={styles.quickActionsButtons}>
                                    {issue.statusOcorrencia === 'ABERTA' && (
                                        <Button variant="outline" onPress={() => handleStatusChange('EM_ANDAMENTO')} style={styles.quickActionButton} disabled={updating}>
                                            <Clock size={16} color="#ca8a04" />
                                            <Text style={styles.quickActionText}>Iniciar</Text>
                                        </Button>
                                    )}
                                    {(issue.statusOcorrencia === 'ABERTA' || issue.statusOcorrencia === 'EM_ANDAMENTO') && (
                                        <Button variant="outline" onPress={() => handleStatusChange('RESOLVIDA')} style={styles.quickActionButton} disabled={updating}>
                                            <CheckCircle2 size={16} color="#16a34a" />
                                            <Text style={styles.quickActionText}>Resolver</Text>
                                        </Button>
                                    )}
                                    {canCancel && (
                                        <Button variant="outline" onPress={handleCancel} style={[styles.quickActionButton, styles.quickActionButtonDestructive]} disabled={updating}>
                                            <Trash2 size={16} color="#b91c1c" />
                                            <Text style={[styles.quickActionText, styles.quickActionTextDestructive]}>Cancelar Ocorrência</Text>
                                        </Button>
                                    )}
                                </View>
                            </View>
                        )}
                        
                        <View style={styles.detailTitleSection}>
                            <Text style={styles.detailTitle}>{issue.titulo}</Text>
                            <Badge variant="outline" style={styles.detailTypeBadge}>{issue.tipoOcorrencia}</Badge>
                        </View>

                        {issue.imageUrl && (
                            <View style={styles.detailImageSection}>
                                <Text style={styles.detailLabel}>Foto</Text>
                                {loadingImage ? (
                                    <View style={[styles.detailImage, styles.imageLoadingContainer]}>
                                        <ActivityIndicator size="large" color="#2563eb" />
                                    </View>
                                ) : imageBase64 ? (
                                    <Image source={{ uri: imageBase64 }} style={styles.detailImage} resizeMode="cover"/>
                                ) : (
                                    <View style={[styles.detailImage, styles.imageErrorContainer]}>
                                        <AlertTriangle size={32} color="#9ca3af" />
                                        <Text style={styles.imageErrorText}>Erro ao carregar imagem</Text>
                                    </View>
                                )}
                            </View>
                        )}
                        
                        <View style={styles.detailSection}>
                            <Text style={styles.detailLabel}>Descrição</Text>
                            <Text style={styles.detailText}>{issue.descricao}</Text>
                        </View>
                        
                        <View style={styles.detailInfoGrid}>
                            <View style={styles.detailInfoCard}>
                                <Text style={styles.detailInfoLabel}>Morador</Text>
                                <Text style={styles.detailInfoText}>{issue.moradorNome || 'Não informado'}</Text>
                            </View>
                            <View style={styles.detailInfoCard}>
                                <Text style={styles.detailInfoLabel}>Data de Criação</Text>
                                <Text style={styles.detailInfoText}>{formatDate(issue.createdAt)}</Text>
                            </View>
                        </View>

                        {/* Seção de Comentários */}
                        <View style={styles.commentsSection}>
                            <View style={styles.commentsSectionHeader}>
                                <MessageSquare size={20} color="#2563eb" />
                                <Text style={styles.commentsSectionTitle}>Comentários ({comentarios.length})</Text>
                            </View>

                            {loadingComentarios ? (
                                <View style={styles.commentsLoading}>
                                    <ActivityIndicator size="small" color="#2563eb" />
                                </View>
                            ) : comentarios.length === 0 ? (
                                <View style={styles.commentsEmpty}>
                                    <Text style={styles.commentsEmptyText}>Nenhum comentário ainda</Text>
                                    <Text style={styles.commentsEmptySubtext}>Seja o primeiro a comentar</Text>
                                </View>
                            ) : (
                                <View style={styles.commentsList}>
                                    {comentarios.map((comentario) => (
                                        <View key={comentario.id} style={styles.commentItem}>
                                            <View style={[
                                                styles.commentAvatar,
                                                comentario.isAdmin ? styles.commentAvatarAdmin : styles.commentAvatarMorador
                                            ]}>
                                                <User size={16} color="#fff" />
                                            </View>
                                            <View style={styles.commentContent}>
                                                <View style={styles.commentHeader}>
                                                    <Text style={styles.commentAuthor}>
                                                        {comentario.moradorNome || 'Usuário'}
                                                    </Text>
                                                    {comentario.isAdmin && (
                                                        <Badge variant="outline" style={styles.adminBadge}>
                                                            <Text style={styles.adminBadgeText}>Síndico</Text>
                                                        </Badge>
                                                    )}
                                                    <Text style={styles.commentDate}>{formatCommentDate(comentario.createdAt)}</Text>
                                                </View>
                                                <Text style={styles.commentText}>{comentario.texto}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {issue.statusOcorrencia !== 'CANCELADA' && (
                                <View style={styles.commentInputContainer}>
                                    <View style={styles.commentInputWrapper}>
                                        <Input
                                            placeholder="Escreva um comentário..."
                                            value={novoComentario}
                                            onChangeText={setNovoComentario}
                                            multiline
                                            style={styles.commentInput}
                                        />
                                        <TouchableOpacity
                                            onPress={handleEnviarComentario}
                                            disabled={!novoComentario.trim() || enviandoComentario}
                                            style={[
                                                styles.commentSendButton,
                                                (!novoComentario.trim() || enviandoComentario) && styles.commentSendButtonDisabled
                                            ]}
                                        >
                                            {enviandoComentario ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <Send size={20} color="#fff" />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>

                        {issue.updatedAt && (
                            <Text style={styles.detailUpdateDate}>
                                Última atualização: {formatDate(issue.updatedAt)}
                            </Text>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>
            </DialogContent>
        </Dialog>
    );
};