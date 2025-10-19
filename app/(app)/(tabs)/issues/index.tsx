import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Ocorrencia, ocorrenciaService } from '@/services/ocorrenciaService';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { AlertTriangle, CheckCircle2, Clock, Plus, Search, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IssueCard } from '../../../../components/issues/IssueCard';
import { IssueDetailModal } from '../../../../components/issues/IssueDetailModal';
import { issueTypes } from '../../../../components/issues/issues.constants';
import { NewIssueModal } from '../../../../components/issues/NewIssueModal';
import { styles } from '../../../../styles/issues/_styles';

export default function IssuesScreen() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    
    // UI State
    const [activeTab, setActiveTab] = useState('Todas');
    const [showNewIssueModal, setShowNewIssueModal] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<Ocorrencia | null>(null);
    
    // Data State
    const [allIssues, setAllIssues] = useState<Ocorrencia[]>([]);
    const [cancelledIssues, setCancelledIssues] = useState<Ocorrencia[]>([]);
    const [totalCounts, setTotalCounts] = useState({
        todas: 0,
        pendente: 0,
        emAndamento: 0,
        resolvida: 0,
        cancelada: 0
    });
    
    // Loading State
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    
    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchTipo, setSearchTipo] = useState<string>('');
    
    // Refs - Evita memory leaks e race conditions
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isMountedRef = useRef(true);
    const loadRequestIdRef = useRef(0); // ← NOVO: Controla qual requisição é mais recente
    
    const tabs = ['Todas', 'Pendente', 'Em andamento', 'Resolvida', 'Canceladas'];

    // Cleanup ao desmontar
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, []);

    // Carrega contadores - mantido igual
    const loadCounters = useCallback(async () => {
        if (!user || !isMountedRef.current) return;
        
        try {
            const newCounts = {
                todas: 0,
                pendente: 0,
                emAndamento: 0,
                resolvida: 0,
                cancelada: 0
            };

            if (isAdmin) {
                try {
                    const data = await ocorrenciaService.search('', undefined, undefined, 0, 1);
                    newCounts.todas = data?.totalItems || 0;
                } catch (e) { /* requisição falhou */ }

                try {
                    const data = await ocorrenciaService.search('', 'ABERTA', undefined, 0, 1);
                    newCounts.pendente = data?.totalItems || 0;
                } catch (e) { /* requisição falhou */ }

                try {
                    const data = await ocorrenciaService.search('', 'EM_ANDAMENTO', undefined, 0, 1);
                    newCounts.emAndamento = data?.totalItems || 0;
                } catch (e) { /* requisição falhou */ }

                try {
                    const data = await ocorrenciaService.search('', 'RESOLVIDA', undefined, 0, 1);
                    newCounts.resolvida = data?.totalItems || 0;
                } catch (e) { /* requisição falhou */ }

                try {
                    const data = await ocorrenciaService.search('', 'CANCELADA', undefined, 0, 1);
                    newCounts.cancelada = data?.totalItems || 0;
                } catch (e) { /* requisição falhou */ }

            } else if (user.moradorId) {
                try {
                    const data = await ocorrenciaService.searchByMorador(user.moradorId, '', undefined, undefined, 0, 1);
                    newCounts.todas = data?.totalItems || 0;
                } catch (e) { /* requisição falhou */ }

                try {
                    const data = await ocorrenciaService.searchByMorador(user.moradorId, '', 'ABERTA', undefined, 0, 1);
                    newCounts.pendente = data?.totalItems || 0;
                } catch (e) { /* requisição falhou */ }

                try {
                    const data = await ocorrenciaService.searchByMorador(user.moradorId, '', 'EM_ANDAMENTO', undefined, 0, 1);
                    newCounts.emAndamento = data?.totalItems || 0;
                } catch (e) { /* requisição falhou */ }

                try {
                    const data = await ocorrenciaService.searchByMorador(user.moradorId, '', 'RESOLVIDA', undefined, 0, 1);
                    newCounts.resolvida = data?.totalItems || 0;
                } catch (e) { /* requisição falhou */ }

                try {
                    const data = await ocorrenciaService.searchByMorador(user.moradorId, '', 'CANCELADA', undefined, 0, 1);
                    newCounts.cancelada = data?.totalItems || 0;
                } catch (e) { /* requisição falhou */ }
            }

            if (isMountedRef.current) {
                setTotalCounts(newCounts);
            }
        } catch (error) {
            console.error('Erro ao carregar contadores:', error);
        }
    }, [user, isAdmin]);

    // Carrega dados quando screen entra em foco
    useFocusEffect(
        useCallback(() => {
            if (user) {
                loadCounters();
                loadIssues(0, false);
            }
        }, [user]) // ← CORRIGIDO: Removido loadCounters da dependência
    );
    
    // FUNÇÃO PRINCIPAL CORRIGIDA
    const loadIssues = useCallback(async (
        page: number = 0, 
        append: boolean = false, 
        query: string = searchQuery, // ← Usa valores atuais do estado
        tipo: string = searchTipo,
        tab: string = activeTab // ← NOVO: Recebe tab como parâmetro
    ) => {
        if (!user || !isMountedRef.current) return;
        
        // ← NOVO: Incrementa ID da requisição
        const requestId = ++loadRequestIdRef.current;
        
        if (page === 0) { 
            setLoading(true); 
            // ← NOVO: Limpa arrays imediatamente ao trocar de aba
            if (!append) {
                if (tab === 'Canceladas') {
                    setCancelledIssues([]);
                } else {
                    setAllIssues([]);
                }
            }
        } else { 
            setLoadingMore(true); 
        }
        
        try {
            const getStatusParam = () => {
                if (tab === 'Todas') return undefined;
                if (tab === 'Canceladas') return 'CANCELADA';
                if (tab === 'Pendente') return 'ABERTA';
                if (tab === 'Em andamento') return 'EM_ANDAMENTO';
                if (tab === 'Resolvida') return 'RESOLVIDA';
                return undefined;
            };
            const statusParam = getStatusParam();

            let responseData;
            if (isAdmin) {
                responseData = await ocorrenciaService.search(
                    query, 
                    statusParam, 
                    tipo || undefined, 
                    page, 
                    10
                );
            } else if (user.moradorId) {
                responseData = await ocorrenciaService.searchByMorador(
                    user.moradorId, 
                    query, 
                    statusParam,
                    tipo || undefined, 
                    page, 
                    10
                );
            }
            
            // ← NOVO: Verifica se esta ainda é a requisição mais recente
            if (responseData && isMountedRef.current && requestId === loadRequestIdRef.current) {
                const targetArraySetter = tab === 'Canceladas' ? setCancelledIssues : setAllIssues;
                
                if (append) {
                    targetArraySetter(prev => [
                        ...prev, 
                        ...responseData.ocorrencias.filter(
                            (newItem: Ocorrencia) => !prev.some(existing => existing.id === newItem.id)
                        )
                    ]);
                } else {
                    targetArraySetter(responseData.ocorrencias);
                }
                setHasMore(responseData.hasMore);
                setCurrentPage(page);
            }
        } catch (error) {
            console.error('Erro ao carregar ocorrências:', error);
            if (isMountedRef.current && requestId === loadRequestIdRef.current) {
                Alert.alert('Erro', 'Não foi possível carregar as ocorrências');
            }
        } finally {
            if (isMountedRef.current && requestId === loadRequestIdRef.current) {
                setLoading(false);
                setLoadingMore(false);
                setIsSearching(false);
            }
        }
    }, [user, isAdmin, searchQuery, searchTipo, activeTab]); // ← Dependências corretas

    // ← NOVO: useEffect separado para mudança de aba
    useEffect(() => {
        if (!user) return;
        
        // Reseta paginação e carrega nova aba
        setCurrentPage(0);
        setHasMore(true);
        loadIssues(0, false, searchQuery, searchTipo, activeTab);
    }, [activeTab]); // ← Só dispara quando a aba muda

    // Debounce de busca - CORRIGIDO
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (searchQuery.trim()) {
            setIsSearching(true);
            searchTimeoutRef.current = setTimeout(() => {
                setCurrentPage(0);
                setHasMore(true);
                loadIssues(0, false, searchQuery, searchTipo, activeTab);
            }, 500);
        } else {
            setIsSearching(false);
            setCurrentPage(0);
            setHasMore(true);
            loadIssues(0, false, '', searchTipo, activeTab);
        }

        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        }
    }, [searchQuery, searchTipo]); // ← CORRIGIDO: Removido activeTab e loadIssues

    // Refresh completo
    const handleRefresh = useCallback(() => {
        setCurrentPage(0);
        setHasMore(true);
        setSearchQuery('');
        setSearchTipo('');
        loadCounters();
        loadIssues(0, false, '', '', activeTab); // ← Passa activeTab explicitamente
    }, [loadCounters, activeTab]); // ← Removido loadIssues

    // Retorna contador do status selecionado
    const getStatusCount = (status: string) => {
        switch (status) {
            case 'Todas': return totalCounts.todas;
            case 'Pendente': return totalCounts.pendente;
            case 'Em andamento': return totalCounts.emAndamento;
            case 'Resolvida': return totalCounts.resolvida;
            case 'Canceladas': return totalCounts.cancelada;
            default: return 0;
        }
    };

    const issuesToDisplay = activeTab === 'Canceladas' ? cancelledIssues : allIssues;
    
    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#2563eb" />
                <Text style={styles.footerLoaderText}>Carregando mais...</Text>
            </View>
        );
    };

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
            
            <View style={styles.searchFilterContainer}>
                <View style={styles.searchInputWrapper}>
                    <Search size={20} color="#64748b" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Pesquisar por título, descrição..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#94a3b8"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClearButton}>
                            {isSearching ? <ActivityIndicator size="small" color="#64748b" /> : <X size={18} color="#64748b" />}
                        </TouchableOpacity>
                    )}
                </View>

                {searchQuery.trim().length > 0 && (
                    <View style={styles.filterPickerContainer}>
                        <Picker
                            selectedValue={searchTipo}
                            onValueChange={(itemValue) => setSearchTipo(itemValue)}
                            style={styles.filterPicker}
                        >
                            <Picker.Item label="Todas as categorias" value="" />
                            {issueTypes.map(type => (
                                <Picker.Item key={type} label={type} value={type.toUpperCase()} />
                            ))}
                        </Picker>
                    </View>
                )}
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
                    <CheckCircle2 size={20} color="#16a4aa" />
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
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                            <View style={[styles.tabBadge, activeTab === tab && styles.activeTabBadge]}>
                                <Text style={[styles.tabBadgeText, activeTab === tab && styles.activeTabBadgeText]}>{getStatusCount(tab)}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
            
            <FlatList
                data={issuesToDisplay}
                keyExtractor={item => item.id?.toString() || Math.random().toString()}
                renderItem={({ item }) => (
                    <IssueCard issue={item} onPress={() => setSelectedIssue(item)} />
                )}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    !loading && !loadingMore ? (
                        <View style={styles.emptyContainer}>
                            <AlertTriangle size={48} color="#9ca3af" />
                            <Text style={styles.emptyText}>
                                {searchQuery ? 'Nenhuma ocorrência encontrada para esta pesquisa' : 'Nenhuma ocorrência encontrada'}
                            </Text>
                            {searchQuery && (
                                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
                                    <Text style={styles.clearSearchButtonText}>Limpar pesquisa</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : null
                }
                ListFooterComponent={renderFooter}
                onEndReached={() => { 
                    if (!loadingMore && hasMore) { 
                        loadIssues(currentPage + 1, true, searchQuery, searchTipo, activeTab); 
                    }
                }}
                onEndReachedThreshold={0.5}
                refreshing={loading}
                onRefresh={handleRefresh}
            />
            
            <NewIssueModal 
                visible={showNewIssueModal} 
                onClose={() => setShowNewIssueModal(false)}
                onSuccess={handleRefresh}
            />

            {selectedIssue && (
                <IssueDetailModal 
                    issue={selectedIssue} 
                    visible={!!selectedIssue} 
                    onClose={() => setSelectedIssue(null)}
                    onUpdate={handleRefresh}
                />
            )}
        </SafeAreaView>
    );
}