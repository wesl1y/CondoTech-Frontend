import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { Comentario, comentarioService } from '@/services/comentarioService';
import { Ocorrencia, ocorrenciaService } from '@/services/ocorrenciaService';
import { getFullImageUrl } from '@/utils/imageUtils';
import * as SecureStore from 'expo-secure-store';
import { AlertTriangle, CheckCircle2, Clock, MessageSquare, Send, Trash2, User, XCircle } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../../styles/issues/_styles';
import { statusMap } from './issues.constants';

interface IssueDetailModalProps {
    issue: Ocorrencia;
    visible: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

const STATUS_COLORS = {
    Resolvida: { bg: '#f0fdf4', text: '#16a34a' },
    'Em andamento': { bg: '#fefce8', text: '#ca8a04' },
    Pendente: { bg: '#fef2f2', text: '#dc2626' },
    Cancelada: { bg: '#f3f4f6', text: '#6b7280' },
    default: { bg: '#f9fafb', text: '#6b7280' }
} as const;

const getStatusBackgroundColor = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS]?.bg || STATUS_COLORS.default.bg;
};

const getStatusColor = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS]?.text || STATUS_COLORS.default.text;
};

export const IssueDetailModal = ({ issue, visible, onClose, onUpdate }: IssueDetailModalProps) => {
    const { user } = useAuth();
    const [localIssue, setLocalIssue] = useState<Ocorrencia>(issue);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [loadingImage, setLoadingImage] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [comentarios, setComentarios] = useState<Comentario[]>([]);
    const [loadingComentarios, setLoadingComentarios] = useState(false);
    const [novoComentario, setNovoComentario] = useState('');
    const [enviandoComentario, setEnviandoComentario] = useState(false);
    
    // ✅ Ref para evitar requests duplicados
    const loadingRef = useRef({ comentarios: false, image: false });
    const isMountedRef = useRef(true);

    const displayStatus = statusMap[localIssue.issueStatus] || localIssue.issueStatus;
    const isAdmin = user?.role === 'ADMIN';
    const canCancel = isAdmin && !['RESOLVED', 'CANCELED'].includes(localIssue.issueStatus);

    // ✅ Cleanup ao desmontar
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // ✅ Atualiza issue quando prop muda
    useEffect(() => {
        setLocalIssue(issue);
    }, [issue]);

    const getStatusIcon = useCallback((status: string) => {
        const iconProps = { size: 28, color: getStatusColor(status) };
        
        switch (status) {
            case 'Resolvida': return <CheckCircle2 {...iconProps} />;
            case 'Em andamento': return <Clock {...iconProps} />;
            case 'Pendente': return <AlertTriangle {...iconProps} />;
            case 'Cancelada': return <XCircle {...iconProps} />;
            default: return <XCircle {...iconProps} />;
        }
    }, []);

    // ✅ Carrega comentários SEM dependências que mudam
    const loadComentarios = useCallback(async (issueId: number) => {
        if (!issueId || loadingRef.current.comentarios) return;
        
        loadingRef.current.comentarios = true;
        setLoadingComentarios(true);
        
        try {
            const data = await comentarioService.getByOcorrencia(issueId);
            if (isMountedRef.current) {
                setComentarios(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Erro ao carregar comentários:', error);
            if (isMountedRef.current) {
                setComentarios([]);
            }
        } finally {
            if (isMountedRef.current) {
                setLoadingComentarios(false);
            }
            loadingRef.current.comentarios = false;
        }
    }, []);

    // ✅ Carrega imagem SEM dependências que mudam
    const loadImage = useCallback(async (imageUrl: string) => {
        if (!imageUrl || loadingRef.current.image) return;
        
        loadingRef.current.image = true;
        setLoadingImage(true);
        
        try {
            const fullImageUrl = getFullImageUrl(imageUrl);
            if (!fullImageUrl) {
                throw new Error('URL da imagem inválida');
            }

            const token = await SecureStore.getItemAsync('my-jwt');
            const response = await fetch(fullImageUrl, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            
            if (!response.ok) throw new Error('Falha ao carregar imagem');
            
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
                if (isMountedRef.current) {
                    setImageBase64(reader.result as string);
                }
            };
            reader.onerror = () => {
                console.error('Erro ao ler blob da imagem');
                if (isMountedRef.current) {
                    setImageBase64(null);
                }
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error("Erro ao buscar imagem:", error);
            if (isMountedRef.current) {
                setImageBase64(null);
            }
        } finally {
            if (isMountedRef.current) {
                setLoadingImage(false);
            }
            loadingRef.current.image = false;
        }
    }, []);

    // ✅ Effect que carrega dados quando modal abre - SEM dependências circulares
    useEffect(() => {
        if (visible && localIssue.id) {
            // Reseta estados
            setComentarios([]);
            setImageBase64(null);
            loadingRef.current = { comentarios: false, image: false };
            
            // Carrega dados
            loadComentarios(localIssue.id);
            if (localIssue.imageUrl) {
                loadImage(localIssue.imageUrl);
            }
        }
    }, [visible, localIssue.id, localIssue.imageUrl]); // ✅ Apenas IDs/valores primitivos

    const formatDate = useCallback((dateString?: string) => {
        if (!dateString) return 'Não informada';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Data inválida';
            return `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })}`;
        } catch (error) {
            return 'Data inválida';
        }
    }, []);

    const formatCommentDate = useCallback((dateString?: string) => {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            
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
        } catch (error) {
            return '';
        }
    }, []);

    const handleStatusChange = async (newStatus: string) => {
        if (!localIssue.id || updating) return;
        
        const previousIssue = { ...localIssue };
        const updatedIssue: Ocorrencia = { 
            ...localIssue, 
            issueStatus: newStatus,
            resolutionDate: newStatus === 'RESOLVED' ? new Date().toISOString() : localIssue.resolutionDate 
        };
        
        // Atualização otimista
        setLocalIssue(updatedIssue);
        setUpdating(true);
        
        try {
            await ocorrenciaService.update(localIssue.id, updatedIssue);
            if (isMountedRef.current) {
                onUpdate(); // Notifica parent para recarregar lista
            }
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            if (isMountedRef.current) {
                setLocalIssue(previousIssue); // Rollback
                Alert.alert('Erro', 'Não foi possível atualizar o status');
            }
        } finally {
            if (isMountedRef.current) {
                setUpdating(false);
            }
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
                        if (!localIssue.id) return;
                        
                        try {
                            await ocorrenciaService.cancel(localIssue.id);
                            if (isMountedRef.current) {
                                onUpdate();
                                onClose();
                            }
                        } catch (error) {
                            console.error('Erro ao cancelar:', error);
                            Alert.alert('Erro', 'Não foi possível cancelar a ocorrência');
                        }
                    }
                }
            ]
        );
    };

    const handleEnviarComentario = async () => {
        const textoTrimmed = novoComentario.trim();
        if (!textoTrimmed || !localIssue.id || !user?.moradorId || enviandoComentario) return;

        setEnviandoComentario(true);
        try {
            const comentario: Comentario = {
                ocorrenciaId: localIssue.id,
                moradorId: user.moradorId,
                texto: textoTrimmed,
            };

            const novoComent = await comentarioService.create(comentario);
            if (isMountedRef.current) {
                setComentarios(prev => [...prev, novoComent]);
                setNovoComentario('');
            }
        } catch (error) {
            console.error('Erro ao enviar comentário:', error);
            if (isMountedRef.current) {
                Alert.alert('Erro', 'Não foi possível enviar o comentário');
            }
        } finally {
            if (isMountedRef.current) {
                setEnviandoComentario(false);
            }
        }
    };

    return (
        <Dialog open={visible} onOpenChange={onClose}>
            <DialogContent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={100}
                >
                    <ScrollView 
                        style={styles.detailScrollView} 
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 24 }}
                    >
                        <View style={[
                            styles.detailStatusHeader, 
                            { backgroundColor: getStatusBackgroundColor(displayStatus) }
                        ]}>
                            <View style={styles.detailStatusIconContainer}>
                                {getStatusIcon(displayStatus)}
                            </View>
                            <View style={styles.detailStatusInfo}>
                                <Text style={styles.detailStatusLabel}>Status</Text>
                                <Text style={[
                                    styles.detailStatusText, 
                                    { color: getStatusColor(displayStatus) }
                                ]}>
                                    {displayStatus}
                                </Text>
                            </View>
                        </View>

                        {isAdmin && (
                            <View style={styles.quickActionsContainer}>
                                <Text style={styles.quickActionsLabel}>Ações rápidas</Text>
                                <View style={styles.quickActionsButtons}>
                                    {localIssue.issueStatus === 'OPEN' && (
                                        <Button 
                                            variant="outline" 
                                            onPress={() => handleStatusChange('IN_PROGRESS')} 
                                            style={styles.quickActionButton} 
                                            disabled={updating}
                                        >
                                            <Clock size={16} color="#ca8a04" />
                                            <Text style={styles.quickActionText}>Iniciar</Text>
                                        </Button>
                                    )}
                                    {(localIssue.issueStatus === 'OPEN' || localIssue.issueStatus === 'IN_PROGRESS') && (
                                        <Button 
                                            variant="outline" 
                                            onPress={() => handleStatusChange('RESOLVED')} 
                                            style={styles.quickActionButton} 
                                            disabled={updating}
                                        >
                                            <CheckCircle2 size={16} color="#16a34a" />
                                            <Text style={styles.quickActionText}>Resolver</Text>
                                        </Button>
                                    )}
                                    {canCancel && (
                                        <Button 
                                            variant="outline" 
                                            onPress={handleCancel} 
                                            style={[styles.quickActionButton, styles.quickActionButtonDestructive]} 
                                            disabled={updating}
                                        >
                                            <Trash2 size={16} color="#b91c1c" />
                                            <Text style={[styles.quickActionText, styles.quickActionTextDestructive]}>
                                                Cancelar Ocorrência
                                            </Text>
                                        </Button>
                                    )}
                                </View>
                            </View>
                        )}

                        <View style={styles.detailTitleSection}>
                            <Text style={styles.detailTitle}>{localIssue.title}</Text>
                            {localIssue.issueTypeName && (
                                <Badge variant="outline" style={styles.detailTypeBadge}>
                                    <Text>{localIssue.issueTypeName}</Text>
                                </Badge>
                            )}
                        </View>

                        {localIssue.imageUrl && (
                            <View style={styles.detailImageSection}>
                                <Text style={styles.detailLabel}>Foto</Text>
                                {loadingImage ? (
                                    <View style={[styles.detailImage, styles.imageLoadingContainer]}>
                                        <ActivityIndicator size="large" color="#2563eb" />
                                    </View>
                                ) : imageBase64 ? (
                                    <Image source={{ uri: imageBase64 }} style={styles.detailImage} resizeMode="cover" />
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
                            <Text style={styles.detailText}>{localIssue.description}</Text>
                        </View>

                        <View style={styles.detailInfoGrid}>
                            <View style={styles.detailInfoCard}>
                                <Text style={styles.detailInfoLabel}>Morador</Text>
                                <Text style={styles.detailInfoText}>
                                    {localIssue.residentName || 'Não informado'}
                                </Text>
                            </View>
                            <View style={styles.detailInfoCard}>
                                <Text style={styles.detailInfoLabel}>Data de Criação</Text>
                                <Text style={styles.detailInfoText}>{formatDate(localIssue.createdAt)}</Text>
                            </View>
                        </View>

                        <View style={styles.commentsSection}>
                            <View style={styles.commentsSectionHeader}>
                                <MessageSquare size={20} color="#2563eb" />
                                <Text style={styles.commentsSectionTitle}>
                                    Comentários ({comentarios.length})
                                </Text>
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
                                        <View key={comentario.id || Math.random()} style={styles.commentItem}>
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
                                                    <Text style={styles.commentDate}>
                                                        {formatCommentDate(comentario.createdAt)}
                                                    </Text>
                                                </View>
                                                <Text style={styles.commentText}>{comentario.texto}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {localIssue.issueStatus !== 'CANCELED' && (
                                <View style={styles.commentInputContainer}>
                                    <View style={styles.commentInputWrapper}>
                                        <Input
                                            placeholder="Escreva um comentário..."
                                            value={novoComentario}
                                            onChangeText={setNovoComentario}
                                            multiline
                                            style={styles.commentInput}
                                            editable={!enviandoComentario}
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

                        {localIssue.updatedAt && (
                            <Text style={styles.detailUpdateDate}>
                                Última atualização: {formatDate(localIssue.updatedAt)}
                            </Text>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>
            </DialogContent>
        </Dialog>
    );
};