// src/app/(tabs)/issues/components/IssueDetailModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, Alert, ActivityIndicator, Platform, KeyboardAvoidingView, TouchableOpacity } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { Ocorrencia, ocorrenciaService } from '@/services/ocorrenciaService';
import { Comentario, comentarioService } from '@/services/comentarioService';
import { getFullImageUrl } from '@/utils/imageUtils';
import { styles } from '../styles';
import { AlertTriangle, CheckCircle2, Clock, MessageSquare, Send, Trash2, User, XCircle } from 'lucide-react-native';
import { statusMap } from '../issues.constants';

interface IssueDetailModalProps {
    issue: Ocorrencia;
    visible: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export const IssueDetailModal = ({ issue, visible, onClose, onUpdate }: IssueDetailModalProps) => {
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
            // AQUI ESTÁ A CORREÇÃO:
            // Reverti para a sua lógica original, garantindo que o objeto `updatedData`
            // seja do tipo `Ocorrencia` completo, como a função de update espera.
            const updatedData: Ocorrencia = { 
                ...issue, 
                statusOcorrencia: newStatus, 
                dataResolucao: ['RESOLVIDA', 'FECHADA'].includes(newStatus) ? new Date().toISOString() : issue.dataResolucao 
            };
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
                            <Badge variant="outline" style={styles.detailTypeBadge}><Text>{issue.tipoOcorrencia}</Text></Badge>
                        </View>

                        {issue.imageUrl && (
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