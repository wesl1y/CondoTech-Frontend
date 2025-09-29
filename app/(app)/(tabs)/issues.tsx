import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import { FlatList, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Imports relativos (a versão segura que funciona)
import { AlertTriangle, Camera, CheckCircle2, Clock, Plus, XCircle } from 'lucide-react-native';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/Dialog';
import { Textarea } from '../../../components/ui/Textarea';
import { useAuth } from '../../../context/AuthContext';


// O resto do código (dados, interfaces, componentes e estilos) permanece o mesmo.
// Colei tudo abaixo para garantir.

// --- INÍCIO DO CÓDIGO COMPLETO ---

// Dados mockados
const issuesData: Issue[] = [ { id: 1, type: 'Manutenção', title: 'Elevador com ruído estranho', description: 'O elevador está fazendo um ruído metálico quando sobe do térreo para o primeiro andar.', status: 'Em andamento', priority: 'high', date: '2024-09-15', time: '14:30', resident: 'Maria Silva - Apt 302', response: 'Técnico já foi acionado e fará vistoria amanhã às 9h.', responseDate: '2024-09-15' }, { id: 2, type: 'Segurança', title: 'Portão da garagem travando', description: 'O portão da garagem está travando na abertura, causando demora para os moradores.', status: 'Pendente', priority: 'medium', date: '2024-09-14', time: '18:45', resident: 'João Santos - Apt 105', response: null, responseDate: null }, { id: 3, type: 'Limpeza', title: 'Lixo acumulado no playground', description: 'Há lixo acumulado na área do playground há dois dias.', status: 'Resolvida', priority: 'low', date: '2024-09-12', time: '10:20', resident: 'Ana Costa - Apt 201', response: 'Área já foi limpa pela equipe de limpeza.', responseDate: '2024-09-13' }, ];
const issueTypes = [ 'Manutenção', 'Segurança', 'Limpeza', 'Infraestrutura', 'Barulho', 'Iluminação', 'Outros' ];

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
            case 'Resolvida': return <CheckCircle2 size={20} color="#16a34a" />;
            case 'Em andamento': return <Clock size={20} color="#ca8a04" />;
            case 'Pendente': return <AlertTriangle size={20} color="#dc2626" />;
            default: return <XCircle size={20} color="#6b7280" />;
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
        <TouchableOpacity onPress={onPress}>
            <Card style={[styles.issueCard, { borderLeftColor: getPriorityColor(issue.priority) }]}>
                <CardContent style={styles.issueCardContent}>
                    <View style={{ marginRight: 12 }}>{getStatusIcon(issue.status)}</View>
                    <View style={{ flex: 1 }}>
                        <View style={styles.issueCardHeader}>
                            <Text style={styles.issueTitle} numberOfLines={1}>{issue.title}</Text>
                            <Badge variant={getStatusBadgeVariant(issue.status)}>{issue.status}</Badge>
                        </View>
                        <Text style={styles.issueDescription} numberOfLines={2}>{issue.description}</Text>
                        <Text style={styles.issueMeta}>{issue.resident} - {issue.date}</Text>
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

    const visibleIssues = user?.userType === 'admin' 
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
                <View>
                    <Text style={styles.headerTitle}>Ocorrências</Text>
                    <Text style={styles.headerSubtitle}>Registre e acompanhe problemas</Text>
                </View>
                <Button onPress={() => setShowNewIssueModal(true)}>
                    <Plus size={16} color="white" />
                    <Text style={{color: 'white', fontWeight: 'bold'}}>Nova</Text>
                </Button>
            </View>

            <View style={styles.tabsContainer}>
                {tabs.map(tab => (
                    <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.activeTab]}>
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filteredIssues}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                    <IssueCard issue={item} onPress={() => setSelectedIssue(item)} />
                )}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma ocorrência encontrada.</Text>}
            />
            
            <NewIssueModal visible={showNewIssueModal} onClose={() => setShowNewIssueModal(false)} />

            {selectedIssue && (
                <IssueDetailModal issue={selectedIssue} visible={!!selectedIssue} onClose={() => setSelectedIssue(null)} />
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
                    <DialogDescription>Descreva o problema que você encontrou.</DialogDescription>
                </DialogHeader>

                <ScrollView>
                    <Text style={styles.label}>Tipo da ocorrência</Text>
                    <View style={styles.pickerContainer}>
                        <Picker selectedValue={issueType} onValueChange={(itemValue) => setIssueType(itemValue)}>
                            {issueTypes.map(type => <Picker.Item key={type} label={type} value={type} />)}
                        </Picker>
                    </View>
                    
                    <Text style={styles.label}>Descrição</Text>
                    <Textarea placeholder="Descreva detalhadamente a ocorrência..." value={issueDescription} onChangeText={setIssueDescription} />

                    <Text style={styles.label}>Foto (opcional)</Text>
                    <Button variant="outline" style={styles.cameraButton}>
                        <Camera size={20} color="#6b7280" />
                        <Text style={{color: '#6b7280'}}>Adicionar foto</Text>
                    </Button>
                </ScrollView>
                
                <View style={styles.modalActions}>
                    <Button variant="outline" onPress={onClose} style={{flex: 1}}>Cancelar</Button>
                    <Button onPress={() => { onClose(); }} style={{flex: 1}} disabled={!issueDescription}>Registrar</Button>
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
                <Text>{issue.description}</Text>
                <Button onPress={onClose}>Fechar</Button>
            </DialogContent>
        </Dialog>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f9fafb' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1e3a8a' },
    headerSubtitle: { fontSize: 16, color: '#4b5563' },
    tabsContainer: { flexDirection: 'row', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    tab: { paddingVertical: 12, paddingHorizontal: 16 },
    activeTab: { borderBottomWidth: 2, borderBottomColor: '#2563eb' },
    tabText: { color: '#6b7280', fontWeight: '500' },
    activeTabText: { color: '#2563eb' },
    list: { padding: 16, gap: 12 },
    emptyText: { textAlign: 'center', color: '#6b7280', marginTop: 40 },
    issueCard: { borderWidth: 1, borderColor: '#e5e7eb', borderLeftWidth: 4, },
    issueCardContent: { padding: 12, flexDirection: 'row', alignItems: 'center' },
    issueCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    issueTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', flex: 1 },
    issueDescription: { fontSize: 14, color: '#4b5563', marginBottom: 8 },
    issueMeta: { fontSize: 12, color: '#6b7280' },
    label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8, marginTop: 8 },
    pickerContainer: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, marginBottom: 16 },
    cameraButton: { height: 100, borderStyle: 'dashed', marginTop: 16 },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 }
});