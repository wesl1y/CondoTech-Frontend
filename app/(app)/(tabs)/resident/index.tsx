// Location: app/(app)/(tabs)/residents.tsx

import { Picker } from '@react-native-picker/picker';
import { Calendar, Car, Mail, MapPin, Phone, Plus, Search, User } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../../components/ui/Dialog';
import { Input } from '@/components/ui/input';
import { useMoradores } from '../../../../hooks/useMoradores';
import { useUnidades } from '../../../../hooks/useUnidades';
import { CreateMoradorDTO, MoradorDTO, TipoMorador } from '../../../../services/moradorService';
import { styles } from '../../../../styles/resident/styles';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ResidentsScreen() {
    // Estados de filtros e busca (locais)
    const [searchTerm, setSearchTerm] = useState('');
    const [filterativo, setFilterativo] = useState<'TODOS' | true | false>('TODOS');
    const { unidades, loading: loadingUnidades } = useUnidades();
    
    // Hook customizado - gerencia todo o estado dos moradores
    const {
        moradores,
        stats,
        loading,
        error,
        refetch,
        createMorador,
        deleteMorador,
        updateMorador
    } = useMoradores({ autoLoad: true });
    
    // Estados de modais
    const [selectedMorador, setSelectedMorador] = useState<MoradorDTO | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    
    // Estados do formulário
    const [formData, setFormData] = useState<CreateMoradorDTO>({
        nome: '',
        cpf: '',
        telefone: '',
        email: '',
        observacoes: '',
        ativo: true,
        tipoMorador: 'PROPRIETARIO',
        unidadeId: undefined,
    });
    const [editFormData, setEditFormData] = useState<Partial<MoradorDTO>>({});
    const [submitting, setSubmitting] = useState(false);
    

    // Filtrar moradores localmente
    const filteredMoradores = useMemo(() => {
        let filtered = [...moradores];

        // Filtro de busca
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(morador => 
                morador.nome?.toLowerCase().includes(search) ||
                morador.email?.toLowerCase().includes(search) ||
                morador.cpf?.includes(search) ||
                morador.telefone?.includes(search) ||
                morador.unidade?.numero?.toLowerCase().includes(search)
            );
        }

        // Filtro de ativo
        if (filterativo !== 'TODOS') {
            filtered = filtered.filter(morador => morador.ativo === filterativo);
        }

        return filtered;
    }, [moradores, searchTerm, filterativo]);

    const [refreshing, setRefreshing] = useState(false); 
    // Função para criar morador
const handleCreateMorador = async () => {
    // Validação de campos obrigatórios
    if (!formData.nome || !formData.email || !formData.telefone || !formData.unidadeId) {
        // ANTES: Alert.alert('Atenção', 'Por favor, preencha todos os campos obrigatórios...');
        Toast.show({
            type: 'error',
            text1: 'Campos Obrigatórios',
            text2: 'Por favor, preencha Nome, Email, Telefone e Unidade.',
        });
        return; // Impede que o código continue
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        // ANTES: Alert.alert('Atenção', 'Por favor, insira um email válido');
        Toast.show({
            type: 'error',
            text1: 'Email Inválido',
            text2: 'Por favor, insira um endereço de email válido.',
        });
        return; // Impede que o código continue
    }

    // Se a validação passou, continue para o cadastro...
    try {
        setSubmitting(true);
        await createMorador(formData);
        
        setFormData({
            nome: '',
            cpf: '',
            telefone: '',
            email: '',
            observacoes: '',
            ativo: true,
            tipoMorador: 'PROPRIETARIO',
            unidadeId: undefined,
        });
        setShowAddModal(false);
        
        Toast.show({
            type: 'success',
            text1: 'Sucesso!',
            text2: 'Morador cadastrado com sucesso!',
        });

    } catch (err: any) {
        Toast.show({
            type: 'error',
            text1: 'Erro ao Cadastrar',
            text2: err.message || 'Não foi possível cadastrar o morador',
        });
    } finally {
        setSubmitting(false);
    }
};
    // Função para deletar morador
const handleDeleteMorador = async (id: number) => {
    // MANTENHA O ALERT PARA CONFIRMAÇÃO
    Alert.alert(
        'Confirmar exclusão',
        'Tem certeza que deseja excluir este morador?',
        [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Excluir',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteMorador(id);
                        setSelectedMorador(null);

                        // USE O TOAST PARA A NOTIFICAÇÃO DE SUCESSO
                        Toast.show({
                            type: 'success',
                            text1: 'Excluído!',
                            text2: 'O morador foi removido com sucesso.',
                        });

                    } catch (err: any) {
                        // USE O TOAST PARA A NOTIFICAÇÃO DE ERRO
                        Toast.show({
                            type: 'error',
                            text1: 'Erro ao Excluir',
                            text2: err.message || 'Não foi possível excluir o morador.',
                        });
                    }
                }
            }
        ]
    );
};

const handleUpdateMorador = async () => {
    // Validação
    if (!editFormData.id || !editFormData.nome) {
        // Alerta de erro de validação com Toast
        Toast.show({
            type: 'error',
            text1: 'Dados Inválidos',
            text2: 'Por favor, verifique os dados do morador.',
        });
        return;
    }

    try {
        setSubmitting(true);
        await updateMorador(editFormData.id, editFormData);
        
        setShowEditModal(false); // Fecha o modal
        
        // Notificação de sucesso com Toast
        Toast.show({
            type: 'success',
            text1: 'Sucesso!',
            text2: 'Morador atualizado com sucesso.',
        });

    } catch (err: any) {
        // Notificação de erro da API com Toast
        Toast.show({
            type: 'error',
            text1: 'Erro ao Atualizar',
            text2: err.message || 'Não foi possível atualizar o morador.',
        });
    } finally {
        setSubmitting(false);
    }
};

    const getativoBadgeVariant = (ativo?: boolean) => {
        if (ativo === true) return 'success';
        if (ativo === false) return 'danger';
        return 'default';
    };

    const getativoColor = (ativo?: boolean) => {
        return ativo === true ? '#2563eb' : '#dc2626';
    };

    const getativoBgColor = (ativo?: boolean) => {
        return ativo === true ? '#dbeafe' : '#fee2e2';
    };

    // Loading inicial
    if (loading && moradores.length === 0) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={styles.loadingText}>Carregando moradores...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const onRefresh = async () => {
    setRefreshing(true); // Ativa o indicador de refresh
    try {
        await refetch(); // Chama a função para recarregar os dados
    } catch (e) {
        // Opcional: tratar erro ou logar
        console.error("Erro ao recarregar moradores:", e);
    } finally {
        setRefreshing(false); // Desativa o indicador de refresh
    }
};

    return (
        <SafeAreaView style={styles.safeArea}>
            <FlatList
                data={filteredMoradores}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#3b82f6']}
                        tintColor="#3b82f6"
                    />
                }
                ListHeaderComponent={
                    <>
                        <View style={styles.header}>
                            <View style={styles.headerTextContainer}>
                                <Text style={styles.headerTitle}>Moradores</Text>
                                <Text style={styles.headerSubtitle}>
                                    Gerencie informações dos moradores
                                </Text>
                            </View>
                            <Button 
                                onPress={() => setShowAddModal(true)} 
                                style={styles.addButton}
                            >
                                <View style={styles.addButtonContent}>
                                    <Plus size={18} color="white" />
                                    <Text style={styles.addButtonText}>Novo</Text>
                                </View>
                            </Button>
                        </View>

                        {/* Search and Filter */}
                        <View style={styles.filterContainer}>
                            <View style={styles.searchInputContainer}>
                                <Search style={styles.searchIcon} size={18} color="#9ca3af" />
                                <Input
                                    placeholder="Buscar por nome, email, CPF..."
                                    value={searchTerm}
                                    onChangeText={setSearchTerm}
                                    style={styles.searchInput}
                                />
                            </View>
                            <View style={styles.pickerWrapper}>
                                <View style={styles.pickerContainer}>
                                    <Picker 
                                        selectedValue={filterativo} 
                                        onValueChange={(itemValue) => setFilterativo(itemValue)}
                                        style={styles.picker}
                                    >
                                        <Picker.Item label="Todos" value="TODOS" />
                                        <Picker.Item label="Ativos" value={true} />
                                        <Picker.Item label="Inativos" value={false} />
                                    </Picker>
                                </View>
                            </View>
                        </View>


                        {/* Summary Stats */}
                        <View style={styles.statsContainer}>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>{stats.ativos}</Text>
                                <Text style={styles.statLabel}>Ativos</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>{stats.total}</Text>
                                <Text style={styles.statLabel}>Total</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>{stats.totalVeiculos}</Text>
                                <Text style={styles.statLabel}>Veículos</Text>
                            </View>
                        </View>

                        {/* Error message */}
                        {error && (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                                <TouchableOpacity onPress={refetch}>
                                    <Text style={styles.retryText}>Tentar novamente</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        onPress={() => setSelectedMorador(item)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.residentCard}>
                            <View style={styles.cardContent}>
                                <View style={[styles.avatar, { 
                                    backgroundColor: getativoBgColor(item.ativo)
                                }]}>
                                    <Text style={[styles.avatarText, { 
                                        color: getativoColor(item.ativo)
                                    }]}>
                                        {item.nome?.split(' ').map(n => n[0]).join('').substring(0, 2) || '?'}
                                    </Text>
                                </View>
                                <View style={styles.residentInfo}>
                                    <View style={styles.residentHeader}>
                                        <Text style={styles.residentName}>{item.nome}</Text>
                                        <Badge variant={getativoBadgeVariant(item.ativo)}>
                                            {item.ativo === true ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </View>
                                    <View style={styles.residentDetails}>
                                        {item.unidade && (
                                            <View style={styles.detailRow}>
                                                <MapPin size={14} color="#6b7280" />
                                                <Text style={styles.detailText}>
                                                    {item.unidade.numero}
                                                    {item.unidade.bloco ? ` - ${item.unidade.bloco}` : ''}
                                                </Text>
                                            </View>
                                        )}
                                        {item.email && (
                                            <View style={styles.detailRow}>
                                                <Mail size={14} color="#6b7280" />
                                                <Text style={styles.detailText} numberOfLines={1}>
                                                    {item.email}
                                                </Text>
                                            </View>
                                        )}
                                        {item.telefone && (
                                            <View style={styles.detailRow}>
                                                <Phone size={14} color="#6b7280" />
                                                <Text style={styles.detailText}>{item.telefone}</Text>
                                            </View>
                                        )}
                                        {item.veiculos && item.veiculos.length > 0 && (
                                            <View style={styles.detailRow}>
                                                <Car size={14} color="#6b7280" />
                                                <Text style={styles.detailText}>
                                                    {item.veiculos.length} veículo(s)
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Nenhum morador encontrado</Text>
                        <Text style={styles.emptySubtext}>
                            {searchTerm || filterativo !== 'TODOS' 
                                ? 'Tente ajustar os filtros' 
                                : 'Adicione o primeiro morador'}
                        </Text>
                    </View>
                }
            />

            {/* Modal de Detalhes */}
            {selectedMorador && (
                <Dialog open={!!selectedMorador} onOpenChange={() => setSelectedMorador(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{selectedMorador.nome}</DialogTitle>
                            <DialogDescription>
                                {selectedMorador.unidade?.numero && `${selectedMorador.unidade.numero}`}
                                {selectedMorador.unidade?.bloco && ` - ${selectedMorador.unidade.bloco}`}
                            </DialogDescription>
                        </DialogHeader>
                        <ScrollView style={styles.modalContent}>
                            {/* Informações Pessoais */}
                            <View style={styles.modalSection}>
                                <Text style={styles.modalSectionTitle}>Informações Pessoais</Text>
                                {selectedMorador.cpf && (
                                    <View style={styles.modalDetailRow}>
                                        <User size={16} color="#6b7280" />
                                        <Text style={styles.modalDetailText}>CPF: {selectedMorador.cpf}</Text>
                                    </View>
                                )}
                                {selectedMorador.rg && (
                                    <View style={styles.modalDetailRow}>
                                        <User size={16} color="#6b7280" />
                                        <Text style={styles.modalDetailText}>RG: {selectedMorador.rg}</Text>
                                    </View>
                                )}
                                {selectedMorador.dataNascimento && (
                                    <View style={styles.modalDetailRow}>
                                        <Calendar size={16} color="#6b7280" />
                                        <Text style={styles.modalDetailText}>
                                            Nascimento: {new Date(selectedMorador.dataNascimento).toLocaleDateString('pt-BR')}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Contato */}
                            <View style={styles.modalSection}>
                                <Text style={styles.modalSectionTitle}>Contato</Text>
                                {selectedMorador.email && (
                                    <View style={styles.modalDetailRow}>
                                        <Mail size={16} color="#6b7280" />
                                        <Text style={styles.modalDetailText}>{selectedMorador.email}</Text>
                                    </View>
                                )}
                                {selectedMorador.telefone && (
                                    <View style={styles.modalDetailRow}>
                                        <Phone size={16} color="#6b7280" />
                                        <Text style={styles.modalDetailText}>{selectedMorador.telefone}</Text>
                                    </View>
                                )}
                            </View>

                            {/* Veículos */}
                            {selectedMorador.veiculos && selectedMorador.veiculos.length > 0 && (
                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>Veículos</Text>
                                    {selectedMorador.veiculos.map((veiculo) => (
                                        <View key={veiculo.id} style={styles.vehicleTag}>
                                            <Car size={14} color="#3b82f6" />
                                            <View style={styles.vehicleInfo}>
                                                <Text style={styles.vehicleText}>{veiculo.placa}</Text>
                                                {veiculo.modelo && (
                                                    <Text style={styles.vehicleSubtext}>
                                                        {veiculo.modelo}
                                                        {veiculo.cor && ` - ${veiculo.cor}`}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Observações */}
                            {selectedMorador.observacoes && (
                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>Observações</Text>
                                    <Text style={styles.notesText}>{selectedMorador.observacoes}</Text>
                                </View>
                            )}
                            
                            <View style={styles.modalActionButtons}>
                                <Button 
                                    onPress={() => handleDeleteMorador(selectedMorador.id!)}
                                    style={[styles.actionButton, styles.deleteButton]}
                                >
                                    <Text style={styles.actionButtonText}>Excluir</Text>
                                </Button>
                                <Button 
                                    onPress={() => {
                                        setEditFormData(selectedMorador); // Carrega os dados para o formulário de edição
                                        setSelectedMorador(null); // Fecha o modal de detalhes
                                        setShowEditModal(true); // Abre o modal de edição
                                    }}
                                    style={[styles.actionButton, styles.editButton]}
                                >
                                    <Text style={styles.actionButtonText}>Editar</Text>
                                </Button>
                            </View>
                        </ScrollView>
                    </DialogContent>
                </Dialog>
            )}
            
            {/* Modal de Adicionar */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adicionar Novo Morador</DialogTitle>
                        <DialogDescription>Preencha os dados do novo morador</DialogDescription>
                    </DialogHeader>
                    <ScrollView style={styles.formContainer}>
                        <Input 
                            placeholder="Nome Completo *" 
                            value={formData.nome}
                            onChangeText={(text) => setFormData({...formData, nome: text})}
                            style={styles.formInput}
                            autoCapitalize="words"
                        />
                        <Input 
                            placeholder="CPF (opcional)" 
                            value={formData.cpf}
                            onChangeText={(text) => setFormData({...formData, cpf: text})}
                            style={styles.formInput}
                            keyboardType="numeric"
                            maxLength={14}
                        />
                        <Input 
                            placeholder="Email *" 
                            value={formData.email}
                            onChangeText={(text) => setFormData({...formData, email: text})}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={styles.formInput} 
                        />
                        <Input 
                            placeholder="Telefone *" 
                            value={formData.telefone}
                            onChangeText={(text) => setFormData({...formData, telefone: text})}
                            keyboardType="phone-pad"
                            style={styles.formInput}
                            maxLength={15}
                        />
                        
                        {/* Picker de ativo */}
                        <View style={styles.formPickerContainer}>
                            <Text style={styles.formLabel}>ativo</Text>
                            <View style={styles.pickerContainer}>
                                <Picker 
                                    selectedValue={formData.ativo} 
                                    onValueChange={(itemValue) => setFormData({...formData, ativo: itemValue})}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Ativo" value={true} />
                                    <Picker.Item label="Inativo" value={false} />
                                </Picker>
                            </View>
                        </View>
                                <View style={styles.formPickerContainer}>
                                <Text style={styles.formLabel}>Tipo de Morador</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={formData.tipoMorador}
                                        onValueChange={(itemValue: TipoMorador) => setFormData({ ...formData, tipoMorador: itemValue })}
                                        style={styles.picker}
                                    >
                                        {/* Adapte os valores e labels conforme sua necessidade */}
                                        <Picker.Item label="Proprietário" value="PROPRIETARIO" />
                                        <Picker.Item label="Inquilino" value="INQUILINO" />
                                        <Picker.Item label="Dependente" value="DEPENDENTE" />
                                    </Picker>
                                </View>
                            </View>
                                <View style={styles.formPickerContainer}>
                                    <Text style={styles.formLabel}>Unidade *</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            enabled={!loadingUnidades} // Desativa enquanto carrega
                                            selectedValue={formData.unidadeId}
                                            onValueChange={(itemValue) => {
                                                if (itemValue) {
                                                    setFormData({ ...formData, unidadeId: itemValue });
                                                }
                                            }}
                                            style={styles.picker}
                                        >
                                            <Picker.Item label="Selecione uma unidade..." value={undefined} />
                                            {unidades.map((unidade) => (
                                                <Picker.Item
                                                    key={unidade.id}
                                                    label={`Unidade ${unidade.numero}${unidade.bloco ? ` - Bloco ${unidade.bloco}` : ''}`}
                                                    value={unidade.id}
                                                />
                                            ))}
                                        </Picker>
                                    </View>
                                </View>

                        <Input 
                            placeholder="Observações (opcional)" 
                            value={formData.observacoes}
                            onChangeText={(text) => setFormData({...formData, observacoes: text})}
                            multiline
                            numberOfLines={3}
                            style={[styles.formInput, styles.textArea]} 
                        />
                        
                        <View style={styles.formButtons}>
                            <Button 
                                onPress={() => setShowAddModal(false)} 
                                style={styles.cancelButton}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </Button>
                            <Button 
                                onPress={handleCreateMorador} 
                                style={styles.saveButton}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Salvar</Text>
                                )}
                            </Button>
                        </View>
                    </ScrollView>
                </DialogContent>
            </Dialog>

            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Morador</DialogTitle>
                        <DialogDescription>Altere os dados do morador</DialogDescription>
                    </DialogHeader>
                    <ScrollView style={styles.formContainer}>
                        <Input 
                            placeholder="Nome Completo *" 
                            value={editFormData.nome}
                            onChangeText={(text) => setEditFormData({...editFormData, nome: text})}
                            style={styles.formInput}
                        />
                        <Input 
                            placeholder="Email *" 
                            value={editFormData.email}
                            onChangeText={(text) => setEditFormData({...editFormData, email: text})}
                            keyboardType="email-address"
                            style={styles.formInput} 
                        />
                        <Input 
                            placeholder="Telefone *" 
                            value={editFormData.telefone}
                            onChangeText={(text) => setEditFormData({...editFormData, telefone: text})}
                            keyboardType="phone-pad"
                            style={styles.formInput}
                        />

                        {/* Seletor de Unidade */}
                        <View style={styles.formPickerContainer}>
                            <Text style={styles.formLabel}>Unidade *</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={editFormData.unidadeId}
                                    onValueChange={(itemValue) => setEditFormData({ ...editFormData, unidadeId: itemValue })}
                                    style={styles.picker}
                                >
                                    {unidades.map((unidade) => (
                                        <Picker.Item
                                            key={unidade.id}
                                            label={`Unidade ${unidade.numero}${unidade.bloco ? ` - ${unidade.bloco}` : ''}`}
                                            value={unidade.id}
                                        />
                                    ))}
                                </Picker>
                            </View>
                        </View>

                        {/* Seletor de Tipo de Morador */}
                        <View style={styles.formPickerContainer}>
                            <Text style={styles.formLabel}>Tipo de Morador</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={editFormData.tipoMorador}
                                    onValueChange={(itemValue) => setEditFormData({ ...editFormData, tipoMorador: itemValue })}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Proprietário" value="PROPRIETARIO" />
                                    <Picker.Item label="Inquilino" value="INQUILINO" />
                                    <Picker.Item label="Dependente" value="DEPENDENTE" />
                                </Picker>
                            </View>
                        </View>

                        {/* Seletor de Status */}
                        <View style={styles.formPickerContainer}>
                            <Text style={styles.formLabel}>Status</Text>
                            <View style={styles.pickerContainer}>
                                <Picker 
                                    selectedValue={editFormData.ativo} 
                                    onValueChange={(itemValue) => setEditFormData({...editFormData, ativo: itemValue})}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Ativo" value={true} />
                                    <Picker.Item label="Inativo" value={false} />
                                </Picker>
                            </View>
                        </View>

                        <View style={styles.formButtons}>
                            <Button 
                                onPress={() => setShowEditModal(false)} 
                                style={styles.cancelButton}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </Button>
                            <Button 
                                onPress={handleUpdateMorador} 
                                style={styles.saveButton}
                                disabled={submitting}
                            >
                                {submitting 
                                    ? <ActivityIndicator color="white" size="small" /> 
                                    : <Text style={styles.saveButtonText}>Salvar Alterações</Text>
                                }
                            </Button>
                        </View>
                    </ScrollView>
                </DialogContent>
            </Dialog>
        </SafeAreaView>
    );
}
