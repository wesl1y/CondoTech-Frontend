import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import { FlatList, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AlertTriangle, Camera, CheckCircle2, Clock, Plus, XCircle } from 'lucide-react-native';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/Dialog';
import { Textarea } from '../../../components/ui/Textarea';
import { useAuth } from '../../../context/AuthContext';

// Dados mockados
const issuesData: Issue[] = [
    { 
        id: 1, 
        type: 'Manutenção', 
        title: 'Elevador com ruído estranho', 
        description: 'O elevador está fazendo um ruído metálico quando sobe do térreo para o primeiro andar.', 
        status: 'Em andamento', 
        priority: 'high', 
        date: '2024-09-15', 
        time: '14:30', 
        resident: 'Maria Silva - Apt 302', 
        response: 'Técnico já foi acionado e fará vistoria amanhã às 9h.', 
        responseDate: '2024-09-15' 
    },
    { 
        id: 2, 
        type: 'Segurança', 
        title: 'Portão da garagem travando', 
        description: 'O portão da garagem está travando na abertura, causando demora para os moradores.', 
        status: 'Pendente', 
        priority: 'medium', 
        date: '2024-09-14', 
        time: '18:45', 
        resident: 'João Santos - Apt 105', 
        response: null, 
        responseDate: null 
    },
    { 
        id: 3, 
        type: 'Limpeza', 
        title: 'Lixo acumulado no playground', 
        description: 'Há lixo acumulado na área do playground há dois dias.', 
        status: 'Resolvida', 
        priority: 'low', 
        date: '2024-09-12', 
        time: '10:20', 
        resident: 'Ana Costa - Apt 201', 
        response: 'Área já foi limpa pela equipe de limpeza.', 
        responseDate: '2024-09-13' 
    },
];

const issueTypes = [
    'Manutenção', 
    'Segurança', 
    'Limpeza', 
    'Infraestrutura', 
    'Barulho', 
    'Iluminação', 
    'Outros'
];

interface Issue {
    id: number;
    type: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    date: string;
    time: string;
    resident: string;
    response: string | null;
    responseDate: string | null;
}

interface IssueCardProps {
    issue: Issue;
    onPress: () => void;
}

const IssueCard = ({ issue, onPress }: IssueCardProps) => {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Resolvida': return <CheckCircle2 size={22} color="#16a34a" />;
            case 'Em andamento': return <Clock size={22} color="#ca8a04" />;
            case 'Pendente': return <AlertTriangle size={22} color="#dc2626" />;
            default: return <XCircle size={22} color="#6b7280" />;
        }
    };
    
    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'Resolvida': return 'success';
            case 'Em andamento': return 'warning';
            case 'Pendente': return 'danger';
            default: return 'default';
        }
    };
    
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#22c55e';
            default: return '#9ca3af';
        }
    };

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Card style={[styles.issueCard, { borderLeftColor: getPriorityColor(issue.priority) }]}>
                <CardContent style={styles.issueCardContent}>
                    <View style={styles.statusIconContainer}>
                        {getStatusIcon(issue.status)}
                    </View>
                    <View style={styles.issueCardBody}>
                        <View style={styles.issueCardHeader}>
                            <Text style={styles.issueTitle} numberOfLines={1}>
                                {issue.title}
                            </Text>
                            <Badge 
                                variant={getStatusBadgeVariant(issue.status)}
                                style={styles.statusBadge}
                            >
                                {issue.status}
                            </Badge>
                        </View>
                        <Text style={styles.issueDescription} numberOfLines={2}>
                            {issue.description}
                        </Text>
                        <View style={styles.issueMetaContainer}>
                            <Text style={styles.issueMeta}>{issue.resident}</Text>
                            <Text style={styles.issueDate}>{issue.date}</Text>
                        </View>
                    </View>
                </CardContent>
            </Card>
        </TouchableOpacity>
    );
};

export default function IssuesScreen() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('Todas');
    const [showNewIssueModal, setShowNewIssueModal] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

    const visibleIssues = user?.role === 'ADMIN' 
        ? issuesData
        : issuesData.filter(issue => issue.resident.includes(user?.name || ''));

    const tabs = ['Todas', 'Pendente', 'Em andamento', 'Resolvida'];
    const filteredIssues = visibleIssues.filter(issue => {
        if (activeTab === 'Todas') return true;
        return issue.status === activeTab;
    });

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>Ocorrências</Text>
                    <Text style={styles.headerSubtitle}>Registre e acompanhe problemas</Text>
                </View>
                <Button onPress={() => setShowNewIssueModal(true)} style={styles.newButton}>
                    <Plus size={18} color="white" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Nova</Text>
                </Button>
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
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <FlatList
                data={filteredIssues}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                    <IssueCard issue={item} onPress={() => setSelectedIssue(item)} />
                )}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <AlertTriangle size={48} color="#9ca3af" />
                        <Text style={styles.emptyText}>Nenhuma ocorrência encontrada</Text>
                    </View>
                }
            />
            
            <NewIssueModal visible={showNewIssueModal} onClose={() => setShowNewIssueModal(false)} />

            {selectedIssue && (
                <IssueDetailModal 
                    issue={selectedIssue} 
                    visible={!!selectedIssue} 
                    onClose={() => setSelectedIssue(null)} 
                />
            )}
        </SafeAreaView>
    );
}

interface NewIssueModalProps {
    visible: boolean;
    onClose: () => void;
}

const NewIssueModal = ({ visible, onClose }: NewIssueModalProps) => {
    const [issueType, setIssueType] = useState(issueTypes[0]);
    const [issueDescription, setIssueDescription] = useState('');

    return (
        <Dialog open={visible} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nova Ocorrência</DialogTitle>
                    <DialogDescription>
                        Descreva o problema que você encontrou.
                    </DialogDescription>
                </DialogHeader>

                <ScrollView style={styles.modalScrollView}>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Tipo da ocorrência</Text>
                        <View style={styles.pickerContainer}>
                            <Picker 
                                selectedValue={issueType} 
                                onValueChange={(itemValue) => setIssueType(itemValue)}
                                style={styles.picker}
                            >
                                {issueTypes.map(type => (
                                    <Picker.Item key={type} label={type} value={type} />
                                ))}
                            </Picker>
                        </View>
                    </View>
                    
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Descrição</Text>
                        <Textarea 
                            placeholder="Descreva detalhadamente a ocorrência..." 
                            value={issueDescription} 
                            onChangeText={setIssueDescription}
                            numberOfLines={5}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Foto (opcional)</Text>
                        <Button variant="outline" style={styles.cameraButton}>
                            <Camera size={24} color="#6b7280" />
                            <Text style={styles.cameraButtonText}>Adicionar foto</Text>
                        </Button>
                    </View>
                </ScrollView>
                
                <View style={styles.modalActions}>
                    <Button 
                        variant="outline" 
                        onPress={onClose} 
                        style={styles.modalButton}
                    >
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </Button>
                    <Button 
                        onPress={() => { onClose(); }} 
                        style={styles.modalButton}
                        disabled={!issueDescription}
                    >
                        <Text style={styles.submitButtonText}>Registrar</Text>
                    </Button>
                </View>
            </DialogContent>
        </Dialog>
    );
};

interface IssueDetailModalProps {
    issue: Issue;
    visible: boolean;
    onClose: () => void;
}

const IssueDetailModal = ({ issue, visible, onClose }: IssueDetailModalProps) => {
    return (
        <Dialog open={visible} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{issue.title}</DialogTitle>
                </DialogHeader>
                
                <ScrollView style={styles.detailScrollView}>
                    <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Tipo</Text>
                        <Text style={styles.detailText}>{issue.type}</Text>
                    </View>
                    
                    <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Descrição</Text>
                        <Text style={styles.detailText}>{issue.description}</Text>
                    </View>
                    
                    <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Morador</Text>
                        <Text style={styles.detailText}>{issue.resident}</Text>
                    </View>
                    
                    <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Data e Hora</Text>
                        <Text style={styles.detailText}>{issue.date} às {issue.time}</Text>
                    </View>
                    
                    {issue.response && (
                        <View style={styles.responseSection}>
                            <Text style={styles.responseLabel}>Resposta da Administração</Text>
                            <Text style={styles.responseText}>{issue.response}</Text>
                            {issue.responseDate && (
                                <Text style={styles.responseDate}>
                                    Respondido em {issue.responseDate}
                                </Text>
                            )}
                        </View>
                    )}
                </ScrollView>
                
                <Button onPress={onClose} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>Fechar</Text>
                </Button>
            </DialogContent>
        </Dialog>
    );
};

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: '#f3f4f6' 
    },
    
    // Header
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 20,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: { 
        fontSize: 32, 
        fontWeight: 'bold', 
        color: '#1e3a8a',
        marginBottom: 4,
        lineHeight: 38,
    },
    headerSubtitle: { 
        fontSize: 16, 
        color: '#6b7280',
        lineHeight: 22,
    },
    newButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    buttonIcon: {
        marginRight: 2,
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 15,
    },
    
    // Tabs
    tabsContainer: { 
        backgroundColor: '#fff',
        borderBottomWidth: 1, 
        borderBottomColor: '#e5e7eb',
    },
    tabsScrollContent: {
        paddingHorizontal: 12,
    },
    tab: { 
        paddingVertical: 14, 
        paddingHorizontal: 20,
        marginHorizontal: 4,
    },
    activeTab: { 
        borderBottomWidth: 3, 
        borderBottomColor: '#2563eb',
    },
    tabText: { 
        color: '#6b7280', 
        fontWeight: '500',
        fontSize: 15,
    },
    activeTabText: { 
        color: '#2563eb',
        fontWeight: '600',
    },
    
    // List
    list: { 
        padding: 20,
        paddingBottom: 32,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 16,
    },
    emptyText: { 
        textAlign: 'center', 
        color: '#9ca3af',
        fontSize: 16,
        fontWeight: '500',
    },
    
    // Issue Card
    issueCard: { 
        borderWidth: 1, 
        borderColor: '#e5e7eb', 
        borderLeftWidth: 4,
        marginBottom: 16,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    issueCardContent: { 
        padding: 16, 
        flexDirection: 'row', 
        alignItems: 'flex-start',
        gap: 14,
    },
    statusIconContainer: {
        marginTop: 2,
    },
    issueCardBody: {
        flex: 1,
        gap: 8,
    },
    issueCardHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        gap: 12,
    },
    issueTitle: { 
        fontSize: 17, 
        fontWeight: '600', 
        color: '#111827', 
        flex: 1,
        lineHeight: 22,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    issueDescription: { 
        fontSize: 15, 
        color: '#4b5563',
        lineHeight: 21,
    },
    issueMetaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    issueMeta: { 
        fontSize: 13, 
        color: '#6b7280',
        fontWeight: '500',
    },
    issueDate: {
        fontSize: 13,
        color: '#9ca3af',
    },
    
    // Modal
    modalScrollView: {
        marginVertical: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: { 
        fontSize: 15, 
        fontWeight: '600', 
        color: '#374151', 
        marginBottom: 10,
    },
    pickerContainer: { 
        borderWidth: 1, 
        borderColor: '#d1d5db', 
        borderRadius: 12,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    cameraButton: { 
        height: 120, 
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: '#d1d5db',
        flexDirection: 'column',
        gap: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraButtonText: {
        color: '#6b7280',
        fontSize: 15,
        fontWeight: '500',
    },
    modalActions: { 
        flexDirection: 'row', 
        gap: 12,
        marginTop: 20,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
    },
    cancelButtonText: {
        color: '#374151',
        fontWeight: '600',
        fontSize: 15,
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
    
    // Detail Modal
    detailScrollView: {
        marginVertical: 20,
    },
    detailSection: {
        marginBottom: 20,
    },
    detailLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    detailText: {
        fontSize: 16,
        color: '#111827',
        lineHeight: 22,
    },
    responseSection: {
        backgroundColor: '#f0fdf4',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#bbf7d0',
        marginTop: 8,
    },
    responseLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#166534',
        marginBottom: 8,
    },
    responseText: {
        fontSize: 15,
        color: '#14532d',
        lineHeight: 21,
        marginBottom: 8,
    },
    responseDate: {
        fontSize: 13,
        color: '#16a34a',
        fontStyle: 'italic',
    },
    closeButton: {
        marginTop: 20,
        paddingVertical: 12,
    },
    closeButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
});