// src/app/(tabs)/issues/components/IssueCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ocorrencia } from '@/services/ocorrenciaService';
import { styles } from '../styles';
import { AlertTriangle, CheckCircle2, Clock, ImageIcon, XCircle } from 'lucide-react-native';
import { statusMap } from '../issues.constants';

interface IssueCardProps {
    issue: Ocorrencia;
    onPress: () => void;
}

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

export const IssueCard = ({ issue, onPress }: IssueCardProps) => {
    const displayStatus = statusMap[issue.statusOcorrencia] || issue.statusOcorrencia;

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
                                variant={getStatusBadgeVariant(displayStatus) as any}
                                style={styles.statusBadge}
                            >
                                <Text>{displayStatus}</Text>
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