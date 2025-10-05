// Location: app/(app)/(tabs)/residents.tsx

import { Picker } from '@react-native-picker/picker';
import { Calendar, Car, Mail, MapPin, Phone, Plus, Search, User } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/Dialog';
import { Input } from '@/components/ui/input';
import { useMoradores } from '../../../hooks/useMoradores';
import { useUnidades } from '../../../hooks/useUnidades';
import { CreateMoradorDTO, MoradorDTO, TipoMorador } from '../../../services/moradorService';


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

// --- STYLES ---
const styles = StyleSheet.create({
     modalActionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    actionButton: {
        flex: 1,
        height: 48,
        borderRadius: 10,
    },
    deleteButton: {
        backgroundColor: '#fee2e2', // Fundo vermelho claro para o botão de excluir
    },
    editButton: {
        backgroundColor: '#dbeafe', // Fundo azul claro para o botão de editar
    },
    actionButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1f2937' // Cor do texto mais escura para contraste
    },


    saveButtonText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '600',
    },
    safeArea: { 
        flex: 1, 
        backgroundColor: '#f9fafb' 
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: '#6b7280',
    },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 20, 
        paddingBottom: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1, 
        borderBottomColor: '#f3f4f6',
    },
    headerTextContainer: {
        flex: 1,
        gap: 4,
    },
    headerTitle: { 
        fontSize: 32, 
        fontWeight: '700', 
        color: '#1e3a8a',
        letterSpacing: -0.5,
    },
    headerSubtitle: { 
        fontSize: 15, 
        color: '#6b7280',
        marginTop: 2,
    },
    addButton: {
        backgroundColor: '#3b82f6',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    addButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    addButtonText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '600',
    },
    filterContainer: { 
        padding: 20,
        paddingTop: 16,
        paddingBottom: 16,
        gap: 12,
        backgroundColor: '#ffffff',
    },
    searchInputContainer: { 
        position: 'relative', 
        justifyContent: 'center',
    },
    searchIcon: { 
        position: 'absolute', 
        left: 14, 
        zIndex: 1,
    },
    searchInput: { 
        paddingLeft: 44, 
        height: 50,
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        fontSize: 15,
    },
    pickerWrapper: {
        width: '100%',
    },
    pickerContainer: { 
        borderWidth: 1.5, 
        borderColor: '#e5e7eb', 
        borderRadius: 12,
        backgroundColor: '#ffffff',
        overflow: 'hidden',
    },
    picker: {
        height: 50,
        fontSize: 15,
        color: '#374151',
    },
    statsContainer: {
        flexDirection: 'row',
        padding: 20,
        paddingTop: 12,
        paddingBottom: 16,
        gap: 12,
        backgroundColor: '#ffffff',
    },
    statCard: {
        flex: 1,
        backgroundColor: '#f9fafb',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1e3a8a',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6b7280',
    },
    errorContainer: {
        margin: 20,
        padding: 16,
        backgroundColor: '#fee2e2',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    errorText: {
        color: '#dc2626',
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '500',
    },
    retryText: {
        color: '#2563eb',
        fontSize: 14,
        fontWeight: '600',
    },
    list: { 
        padding: 20,
        paddingTop: 12,
        gap: 12,
        paddingBottom: 40,
    },
    residentCard: { 
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden',
    },
    cardContent: { 
        padding: 16, 
        flexDirection: 'row', 
        alignItems: 'flex-start', 
        gap: 14,
    },
    avatar: { 
        width: 52, 
        height: 52, 
        borderRadius: 26, 
        justifyContent: 'center', 
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    avatarText: { 
        fontSize: 17, 
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    residentInfo: {
        flex: 1,
        gap: 8,
    },
    residentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    residentName: { 
        fontSize: 17, 
        fontWeight: '700', 
        color: '#111827',
        letterSpacing: -0.3,
        flex: 1,
    },
    residentDetails: {
        gap: 6,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailText: {
        fontSize: 14,
        color: '#6b7280',
        flex: 1,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
        paddingHorizontal: 40,
    },
    emptyText: { 
        textAlign: 'center', 
        color: '#374151', 
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6,
    },
    emptySubtext: {
        textAlign: 'center',
        color: '#9ca3af',
        fontSize: 14,
    },
    modalContent: {
        maxHeight: 500,
    },
    modalSection: {
        marginBottom: 20,
    },
    modalSectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
    },
    modalDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        marginBottom: 8,
    },
    modalDetailText: {
        fontSize: 14,
        color: '#374151',
        flex: 1,
    },
    vehicleTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#eff6ff',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    vehicleInfo: {
        flex: 1,
    },
    vehicleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e40af',
    },
    vehicleSubtext: {
        fontSize: 12,
        color: '#3b82f6',
        marginTop: 2,
    },
    notesText: {
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 20,
        backgroundColor: '#f9fafb',
        padding: 12,
        borderRadius: 8,
    },
    deleteButtonText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '600',
    },
    formContainer: {
        maxHeight: 500,
    },
    formInput: {
        height: 48,
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        marginBottom: 12,
        fontSize: 15,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    formPickerContainer: {
        marginBottom: 12,
    },
    formLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    formButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    cancelButton: {
        flex: 1,
        height: 48,
        borderRadius: 10,
        backgroundColor: '#f3f4f6',
    },
    cancelButtonText: {
        color: '#374151',
        fontSize: 15,
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        height: 48,
        borderRadius: 10,
        backgroundColor: '#3b82f6',
    },
});