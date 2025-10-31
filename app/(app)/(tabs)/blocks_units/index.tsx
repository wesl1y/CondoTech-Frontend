import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface Bloco {
  id: number;
  nome: string;
  unidades?: Unidade[];
}

interface Unidade {
  id: number;
  blocoId: number;
  numero: string;

  tipoUnidade?: string | null;
  ocupada?: boolean | null;
}

const BlocosUnidadesScreen = () => {
  const [blocos, setBlocos] = useState<Bloco[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'blocos' | 'unidades'>('blocos');
  
  // Modal states
  const [showBlocoModal, setShowBlocoModal] = useState(false);
  const [showUnidadeModal, setShowUnidadeModal] = useState(false);
  
  // Form states - Bloco
  const [blocoNome, setBlocoNome] = useState('');
  const [editingBlocoId, setEditingBlocoId] = useState<number | null>(null);
  
  // Form states - Unidade
  const [unidadeBlocoId, setUnidadeBlocoId] = useState<number | null>(null);
  const [unidadeNumero, setUnidadeNumero] = useState('');
  const [unidadeAndar, setUnidadeAndar] = useState('');
  const [unidadeTipo, setUnidadeTipo] = useState('APARTAMENTO');
  const [unidadeOcupada, setUnidadeOcupada] = useState(false);
  const [editingUnidadeId, setEditingUnidadeId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [blocosData, unidadesData] = await Promise.all([
        api.get('/blocos'),
        api.get('/unidades'),
      ]);
      setBlocos(blocosData);
      setUnidades(unidadesData);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // ==================== BLOCO CRUD ====================
  
  const handleCreateBloco = () => {
    setEditingBlocoId(null);
    setBlocoNome('');
    setShowBlocoModal(true);
  };

  const handleEditBloco = (bloco: Bloco) => {
    setEditingBlocoId(bloco.id);
    setBlocoNome(bloco.nome);
    setShowBlocoModal(true);
  };

  const handleSaveBloco = async () => {
    if (!blocoNome.trim()) {
      Alert.alert('Atenção', 'Nome do bloco é obrigatório');
      return;
    }

    try {
      if (editingBlocoId) {
        await api.put(`/blocos/${editingBlocoId}`, { nome: blocoNome });
        Alert.alert('Sucesso', 'Bloco atualizado!');
      } else {
        await api.post('/blocos', { nome: blocoNome });
        Alert.alert('Sucesso', 'Bloco criado!');
      }
      setShowBlocoModal(false);
      fetchData();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao salvar bloco');
    }
  };

  // helper: conta unidades num bloco
  const countUnidadesInBloco = (blocoId: number) =>
    unidades.filter(u => u.blocoId === blocoId).length;

  const handleDeleteBloco = (blocoId: number) => {
    const linked = countUnidadesInBloco(blocoId);
    if (linked > 0) {
      Alert.alert(
        'Não é possível excluir',
        `Existem ${linked} unidade(s) vinculadas a este bloco. Remova ou transfira as unidades antes de excluir o bloco.`
      );
      return;
    }

    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir este bloco?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/blocos/${blocoId}`);
              Alert.alert('Sucesso', 'Bloco excluído!');
              fetchData();
            } catch (error: any) {
              const resp = error?.response?.data;
              const detail = resp?.detail || resp?.message || resp?.error || error?.message || String(error);

              const fkPattern = /(unidades|referenciad[ao]|violação de chave estrangeira|violates foreign key|foreign key constraint|still referenced|referenced by)/i;
              if (typeof detail === 'string' && fkPattern.test(detail)) {
                Alert.alert(
                  'Não foi possível excluir',
                  'O bloco não pode ser excluído porque existem unidades vinculadas a ele. Remova ou transfira as unidades antes de excluir o bloco.'
                );
              } else if (error?.response?.status === 409) {
                Alert.alert('Conflito', resp?.message || 'Conflito ao excluir bloco. Verifique as dependências.');
              } else {
                Alert.alert('Erro', detail || 'Erro ao excluir bloco');
              }
            }
          },
        },
      ]
    );
  };

  // ==================== UNIDADE CRUD ====================
  
  const handleCreateUnidade = () => {
    setEditingUnidadeId(null);
    setUnidadeBlocoId(blocos[0]?.id || null);
    setUnidadeNumero('');
    setUnidadeAndar('');
    setUnidadeTipo('APARTAMENTO');
    setUnidadeOcupada(false);
    setShowUnidadeModal(true);
  };

  const handleEditUnidade = (unidade: Unidade) => {
    setEditingUnidadeId(unidade.id);
    setUnidadeBlocoId(unidade.blocoId ?? null);
    setUnidadeNumero(unidade.numero ?? '');
    setUnidadeTipo(unidade.tipoUnidade ?? 'APARTAMENTO');
    setUnidadeOcupada(Boolean(unidade.ocupada));
    setShowUnidadeModal(true);
  };

  const handleSaveUnidade = async () => {
    if (!unidadeNumero.trim() || !unidadeBlocoId) {
      Alert.alert('Atenção', 'Número da unidade e bloco são obrigatórios');
      return;
    }

    const payload = {
      blocoId: unidadeBlocoId,
      numero: unidadeNumero,
      andar: parseInt(unidadeAndar) || 0,
      tipoUnidade: unidadeTipo,
      ocupada: unidadeOcupada,
    };

    try {
      if (editingUnidadeId) {
        await api.put(`/unidades/${editingUnidadeId}`, payload);
        Alert.alert('Sucesso', 'Unidade atualizada!');
      } else {
        await api.post('/unidades', payload);
        Alert.alert('Sucesso', 'Unidade criada!');
      }
      setShowUnidadeModal(false);
      fetchData();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao salvar unidade');
    }
  };

  const handleDeleteUnidade = (unidadeId: number) => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir esta unidade?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/unidades/${unidadeId}`);
              Alert.alert('Sucesso', 'Unidade excluída!');
              fetchData();
            } catch (error: any) {
              // Tenta extrair mensagem detalhada do backend (axios-like)
              const resp = error?.response?.data;
              const detail = resp?.detail || resp?.message || resp?.error || error?.message || String(error);

              // Detecta mensagens de violação de FK (pt/eng) e mostra orientação clara ao usuário
              const fkPattern = /(referenciad[ao]|violação de chave estrangeira|violates foreign key|foreign key constraint|still referenced|referenced by)/i;
              if (typeof detail === 'string' && fkPattern.test(detail)) {
                Alert.alert(
                  'Não foi possível excluir',
                  'A unidade não pode ser excluída porque existem moradores vinculados a ela. Remova ou transfira os moradores antes de excluir a unidade.'
                );
              } else if (error?.response?.status === 409) {
                Alert.alert('Conflito', resp?.message || 'Conflito ao excluir unidade. Verifique as dependências.');
              } else {
                Alert.alert('Erro', detail || 'Erro ao excluir unidade');
              }
            }
          },
        },
      ]
    );
  };

  // ==================== RENDER ====================

  const getBlocoNome = (blocoId: number) => {
    return blocos.find(b => b.id === blocoId)?.nome || 'N/A';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Blocos & Unidades</Text>
          <Text style={styles.headerSubtitle}>Gerencie a estrutura do condomínio</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.newButton,
            selectedTab === 'blocos' ? styles.newButtonBloco : styles.newButtonUnidade,
          ]}
          onPress={selectedTab === 'blocos' ? handleCreateBloco : handleCreateUnidade}
          accessibilityLabel={selectedTab === 'blocos' ? 'Criar novo bloco' : 'Criar nova unidade'}
        >
          <Ionicons
            name={selectedTab === 'blocos' ? 'business' : 'home'}
            size={18}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.buttonText}>
            {selectedTab === 'blocos' ? '+ Novo Bloco' : '+ Nova Unidade'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScrollContent}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'blocos' && styles.activeTab]}
            onPress={() => setSelectedTab('blocos')}
          >
            <Ionicons
              name="business"
              size={18}
              color={selectedTab === 'blocos' ? '#2563eb' : '#64748b'}
            />
            <Text style={[styles.tabText, selectedTab === 'blocos' && styles.activeTabText]}>
              Blocos
            </Text>
            <View style={[styles.tabBadge, selectedTab === 'blocos' && styles.activeTabBadge]}>
              <Text style={[styles.tabBadgeText, selectedTab === 'blocos' && styles.activeTabBadgeText]}>
                {blocos.length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, selectedTab === 'unidades' && styles.activeTab]}
            onPress={() => setSelectedTab('unidades')}
          >
            <Ionicons
              name="home"
              size={18}
              color={selectedTab === 'unidades' ? '#2563eb' : '#64748b'}
            />
            <Text style={[styles.tabText, selectedTab === 'unidades' && styles.activeTabText]}>
              Unidades
            </Text>
            <View style={[styles.tabBadge, selectedTab === 'unidades' && styles.activeTabBadge]}>
              <Text style={[styles.tabBadgeText, selectedTab === 'unidades' && styles.activeTabBadgeText]}>
                {unidades.length}
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {selectedTab === 'blocos' ? (
          // Lista de Blocos
          blocos.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="business-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>Nenhum bloco cadastrado</Text>
              <Text style={styles.emptySubtext}>Crie o primeiro bloco do condomínio</Text>

              <TouchableOpacity
                style={[styles.emptyActionButton, styles.newButtonBloco]}
                onPress={handleCreateBloco}
                accessibilityLabel="Criar bloco"
              >
                <Text style={styles.emptyActionText}>+ Criar Bloco</Text>
              </TouchableOpacity>
            </View>
          ) : (
            blocos.map((bloco) => {
              const unidadesCount = countUnidadesInBloco(bloco.id);
              const hasUnidades = unidadesCount > 0;
              return (
                <View key={bloco.id} style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={styles.iconContainer}>
                        <Ionicons name="business" size={24} color="#2563eb" />
                      </View>
                      <View style={styles.cardInfo}>
                        <Text style={styles.cardTitle}>{bloco.nome}</Text>
                        <Text style={styles.cardSubtitle}>
                          {unidadesCount} unidades
                        </Text>
                      </View>
                    </View>
                    <View style={styles.cardActionsRight}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleEditBloco(bloco)}
                      >
                        <Ionicons name="pencil" size={18} color="#2563eb" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          hasUnidades ? styles.deleteButtonDisabled : styles.deleteButton,
                        ]}
                        onPress={() => {
                          if (hasUnidades) {
                            Alert.alert(
                              'Não é possível excluir',
                              `Existem ${unidadesCount} unidade(s) vinculadas a este bloco. Remova ou transfira as unidades antes de excluir.`
                            );
                          } else {
                            handleDeleteBloco(bloco.id);
                          }
                        }}
                      >
                        <Ionicons name="trash" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )
        ) : (
          // Lista de Unidades
          unidades.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="home-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>Nenhuma unidade cadastrada</Text>
              <Text style={styles.emptySubtext}>Crie a primeira unidade</Text>

              <TouchableOpacity
                style={[styles.emptyActionButton, styles.newButtonUnidade]}
                onPress={handleCreateUnidade}
                accessibilityLabel="Criar unidade"
              >
                <Text style={styles.emptyActionText}>+ Criar Unidade</Text>
              </TouchableOpacity>
            </View>
          ) : (
            unidades.map((unidade) => (
              <View key={unidade.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="home" size={24} color="#2563eb" />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>Unidade {unidade.numero}</Text>
                    <Text style={styles.cardSubtitle}>
                      {getBlocoNome(unidade.blocoId)} 
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, unidade.ocupada ? styles.ocupadaBadge : styles.livreBadge]}>
                    <Text style={styles.statusBadgeText}>
                      {unidade.ocupada ? 'Ocupada' : 'Livre'}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardType}>{unidade.tipoUnidade}</Text>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEditUnidade(unidade)}
                    >
                      <Ionicons name="pencil" size={18} color="#3b82f6" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteUnidade(unidade.id)}
                    >
                      <Ionicons name="trash" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )
        )}
      </ScrollView>

      {/* Modal Bloco */}
      <Modal visible={showBlocoModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingBlocoId ? 'Editar Bloco' : 'Novo Bloco'}
              </Text>
              <TouchableOpacity onPress={() => setShowBlocoModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nome do Bloco</Text>
              <TextInput
                style={styles.input}
                value={blocoNome}
                onChangeText={setBlocoNome}
                placeholder="Ex: Bloco A"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowBlocoModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSaveBloco}
              >
                <Text style={styles.submitButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Unidade */}
      <Modal visible={showUnidadeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingUnidadeId ? 'Editar Unidade' : 'Nova Unidade'}
              </Text>
              <TouchableOpacity onPress={() => setShowUnidadeModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Bloco</Text>
                <View style={styles.pickerContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollView}>
                    {blocos.map((bloco) => (
                      <TouchableOpacity
                        key={bloco.id}
                        style={[
                          styles.chip,
                          unidadeBlocoId === bloco.id && styles.chipSelected
                        ]}
                        onPress={() => setUnidadeBlocoId(bloco.id)}
                      >
                        <Text style={[
                          styles.chipText,
                          unidadeBlocoId === bloco.id && styles.chipTextSelected
                        ]}>
                          {bloco.nome}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Número da Unidade</Text>
                <TextInput
                  style={styles.input}
                  value={unidadeNumero}
                  onChangeText={setUnidadeNumero}
                  placeholder="Ex: 101"
                  placeholderTextColor="#94a3b8"
                />
              </View>



              <View style={styles.formGroup}>
                <Text style={styles.label}>Tipo de Unidade</Text>
                <View style={styles.pickerContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollView}>
                    {['APARTAMENTO', 'CASA', 'COBERTURA', 'LOJA'].map((tipo) => (
                      <TouchableOpacity
                        key={tipo}
                        style={[
                          styles.chip,
                          unidadeTipo === tipo && styles.chipSelected
                        ]}
                        onPress={() => setUnidadeTipo(tipo)}
                      >
                        <Text style={[
                          styles.chipText,
                          unidadeTipo === tipo && styles.chipTextSelected
                        ]}>
                          {tipo}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.formGroup}>
                <TouchableOpacity
                  style={styles.switchContainer}
                  onPress={() => setUnidadeOcupada(!unidadeOcupada)}
                >
                  <View style={styles.switchInfo}>
                    <Text style={styles.switchLabel}>Unidade Ocupada</Text>
                    <Text style={styles.switchSubtext}>
                      {unidadeOcupada ? 'Esta unidade está ocupada' : 'Esta unidade está livre'}
                    </Text>
                  </View>
                  <View style={[styles.switch, unidadeOcupada && styles.switchActive]}>
                    <View style={[styles.switchThumb, unidadeOcupada && styles.switchThumbActive]} />
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowUnidadeModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSaveUnidade}
              >
                <Text style={styles.submitButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  newButtonBloco: {
    backgroundColor: '#3b82f6',
  },
  newButtonUnidade: {
    backgroundColor: '#3b82f6', // usar mesmo azul do condomínio
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingTop: 12,
    marginTop: 4,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    gap: 4,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#eff6ff',
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 14,
  },
  activeTabText: {
    color: '#2563eb',
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  activeTabBadge: {
    backgroundColor: '#dbeafe',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  activeTabBadgeText: {
    color: '#2563eb',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#cbd5e1',
    fontSize: 14,
    maxWidth: 280,
  },
  emptyActionButton: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyActionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cardActionsRight: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  deleteButtonDisabled: {
    backgroundColor: '#fff5f5',
    opacity: 0.9,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  ocupadaBadge: {
    backgroundColor: '#dbeafe', // tom mais suave azul claro
  },
  livreBadge: {
    backgroundColor: '#eef2ff', // tom neutro / leve azul
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cardType: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalScrollView: {
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  pickerContainer: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    padding: 10,
  },
  chipScrollView: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  chipTextSelected: {
    color: '#fff',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  switchInfo: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  switchSubtext: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  switch: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#cbd5e1',
    padding: 3,
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: '#3b82f6',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: {
    transform: [{ translateX: 22 }],
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButtonText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 15,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default BlocosUnidadesScreen;