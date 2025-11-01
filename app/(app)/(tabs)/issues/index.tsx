import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Ocorrencia, ocorrenciaService } from '@/services/ocorrenciaService';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { AlertTriangle, CheckCircle2, Clock, Plus, Search, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import { ActivityIndicator, Alert, FlatList, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { IssueCard } from '../../../../components/issues/IssueCard';
import { IssueDetailModal } from '../../../../components/issues/IssueDetailModal';
import { backendStatus } from '../../../../components/issues/issues.constants';
import { NewIssueModal } from '../../../../components/issues/NewIssueModal';
import { styles } from '../../../../styles/issues/_styles';
import { IssueTypeDTO, issueTypeService } from '../../../../services/IssueTypeService';

/**
 * Componente memoizado para renderizar uma única linha (cartão) de ocorrência.
 * Utiliza `React.memo` para evitar re-renderizações desnecessárias quando a
 * lista principal for atualizada, mas este item específico não mudou.
 */
const IssueRow = memo(({ item, onSelectItem }: { item: Ocorrencia, onSelectItem: (item: Ocorrencia) => void }) => {
    /**
     * `useCallback` garante que a função `handlePress` não seja recriada
     * a cada renderização, a menos que `item` ou `onSelectItem` mudem.
     * Isso é crucial para a otimização do `React.memo`.
     */
    const handlePress = useCallback(() => {
        onSelectItem(item);
    }, [item, onSelectItem]);

    return <IssueCard issue={item} onPress={handlePress} />;
});
// Define um nome de exibição para facilitar a depuração no React DevTools
IssueRow.displayName = 'IssueRow';


/**
 * Componente principal da tela de Ocorrências.
 * Gerencia o estado, busca de dados, filtros, paginação e
 * renderização da lista de ocorrências.
 */
export default function IssuesScreen() {
    // Obtém dados do usuário e verifica se é administrador
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    
    // --- ESTADO DA UI ---
    /** @state Controla a aba (status) atualmente selecionada. */
    const [activeTab, setActiveTab] = useState('Todas');
    /** @state Controla a visibilidade do modal de criação de nova ocorrência. */
    const [showNewIssueModal, setShowNewIssueModal] = useState(false);
    /** @state Armazena a ocorrência selecionada para exibir o modal de detalhes. */
    const [selectedIssue, setSelectedIssue] = useState<Ocorrencia | null>(null);
    
    // --- ESTADO DOS DADOS ---
    /** @state Armazena a lista principal de ocorrências (Todas, Pendente, Em andamento, Resolvida). */
    const [allIssues, setAllIssues] = useState<Ocorrencia[]>([]);
    /** @state Armazena a lista de ocorrências canceladas (tratada separadamente). */
    const [cancelledIssues, setCancelledIssues] = useState<Ocorrencia[]>([]);
    /** @state Armazena os tipos de ocorrência disponíveis para o filtro. */
    const [availableTypes, setAvailableTypes] = useState<IssueTypeDTO[]>([]);
    /** @state Armazena a contagem total de itens para cada aba. */
    const [totalCounts, setTotalCounts] = useState({
        todas: 0,
        pendente: 0,
        emAndamento: 0,
        resolvida: 0,
        cancelada: 0
    });
    
    // --- ESTADO DE CARREGAMENTO ---
    /** @state Controla o carregamento inicial ou refresh (exibe loader principal). */
    const [loading, setLoading] = useState(true);
    /** @state Controla o carregamento da paginação (exibe loader no rodapé). */
    const [loadingMore, setLoadingMore] = useState(false);
    /** @state Controla o indicador de atividade na barra de busca (debounce). */
    const [isSearching, setIsSearching] = useState(false);
    
    // --- ESTADO DE PAGINAÇÃO ---
    /** @state Armazena o número da página atual. */
    const [currentPage, setCurrentPage] = useState(0);
    /** @state Indica se existem mais páginas a serem carregadas. */
    const [hasMore, setHasMore] = useState(true);
    
    // --- ESTADO DE BUSCA E FILTRO ---
    /** @state Armazena o texto da consulta de busca. */
    const [searchQuery, setSearchQuery] = useState('');
    /** @state Armazena o tipo (categoria) selecionado no filtro. */
    const [searchTipo, setSearchTipo] = useState<string>(''); // nome do tipo

    // --- REFS ---
    /** @ref Armazena o ID do timeout para o debounce da busca por texto. */
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    /** @ref Armazena o ID do timeout para o debounce do filtro de tipo. */
    const filterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    /** @ref Controla se o componente está montado (para evitar updates de estado em componente desmontado). */
    const isMountedRef = useRef(true);
    /** @ref ID único para cada requisição. Usado para prevenir race conditions. */
    const loadRequestIdRef = useRef(0);
    /** @ref Flag para evitar chamadas múltiplas simultâneas de `loadIssues`. */
    const isLoadingRef = useRef(false);
    
    /** Constante com os nomes das abas de status. */
    const tabs = ['Todas', 'Pendente', 'Em andamento', 'Resolvida', 'Canceladas'];

    /**
     * Efeito de limpeza.
     * Define `isMountedRef` como falso quando o componente é desmontado
     * e limpa qualquer timeout pendente de debounce.
     */
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
        };
    }, []);

    /**
     * Carrega as contagens de ocorrências para cada status (aba).
     * Faz 5 chamadas paralelas (uma para cada status + 'todas') pedindo apenas 1 item
     * para obter o `totalItems` de forma eficiente.
     * Define a função de busca apropriada (admin vs. morador).
     */
    const loadCounters = useCallback(async () => {
        if (!user || !isMountedRef.current) return;
        
        try {
            const newCounts = { todas: 0, pendente: 0, emAndamento: 0, resolvida: 0, cancelada: 0 };
            
            // Escolhe a função de serviço correta baseada no perfil do usuário
            const searchFn = isAdmin 
                ? ocorrenciaService.search 
                : (query: string, status?: string, tipo?: string, page?: number, size?: number) => 
                    ocorrenciaService.searchByMorador(user.moradorId!, query, status, tipo, page, size);

            // Cria um array de promises para buscar as contagens em paralelo
            const counterPromises = [
                searchFn('', undefined, undefined, 0, 1).then(data => ({ key: 'todas', value: data?.totalItems || 0 })).catch(() => ({ key: 'todas', value: 0 })),
                searchFn('', backendStatus.OPEN, undefined, 0, 1).then(data => ({ key: 'pendente', value: data?.totalItems || 0 })).catch(() => ({ key: 'pendente', value: 0 })),
                searchFn('', backendStatus.IN_PROGRESS, undefined, 0, 1).then(data => ({ key: 'emAndamento', value: data?.totalItems || 0 })).catch(() => ({ key: 'emAndamento', value: 0 })),
                searchFn('', backendStatus.RESOLVED, undefined, 0, 1).then(data => ({ key: 'resolvida', value: data?.totalItems || 0 })).catch(() => ({ key: 'resolvida', value: 0 })),
                searchFn('', backendStatus.CANCELED, undefined, 0, 1).then(data => ({ key: 'cancelada', value: data?.totalItems || 0 })).catch(() => ({ key: 'cancelada', value: 0 }))
            ];

            const results = await Promise.all(counterPromises);
            
            results.forEach(result => {
                newCounts[result.key as keyof typeof newCounts] = result.value;
            });

            if (isMountedRef.current) {
                setTotalCounts(newCounts);
            }
        } catch (error) {
            // Erro silencioso no console, pois contadores não são críticos
        }
    }, [user, isAdmin]);

    /**
     * Função central de carregamento de ocorrências.
     * Lida com paginação, filtros e controle de concorrência (race conditions).
     * @param page A página a ser buscada.
     * @param append Se `true`, adiciona os resultados aos existentes (paginação). Se `false`, substitui.
     * @param query Termo de busca textual.
     * @param tipo Categoria (tipo) para filtrar.
     * @param tab Aba de status ativa.
     */
    const loadIssues = useCallback(async (
        page: number, 
        append: boolean, 
        query: string, 
        tipo: string,
        tab: string
    ) => {
        if (!user || !isMountedRef.current) return;
        // Evita chamadas duplicadas se uma já estiver em andamento
        if (isLoadingRef.current) return; 
        isLoadingRef.current = true;

        // Incrementa o ID da requisição para invalidar respostas de requisições anteriores
        const requestId = ++loadRequestIdRef.current;

        // Define o estado de loading apropriado (principal ou de paginação)
        if (page === 0) { 
            setLoading(true);
            if (!append) {
                // Limpa a lista correta (Canceladas é separada)
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
            // Mapeia o nome da aba para o status esperado pelo backend
            const getStatusParam = () => {
                if (tab === 'Todas') return undefined;
                if (tab === 'Canceladas') return backendStatus.CANCELED;
                if (tab === 'Pendente') return backendStatus.OPEN;
                if (tab === 'Em andamento') return backendStatus.IN_PROGRESS;
                if (tab === 'Resolvida') return backendStatus.RESOLVED;
                return undefined;
            };
            
            const statusParam = getStatusParam();
            const tipoParam = tipo || undefined; // Converte string vazia para undefined

            let responseData;
            // Chama o serviço apropriado (Admin vs. Morador)
            if (isAdmin) {
                responseData = await ocorrenciaService.search(
                    query, 
                    statusParam, 
                    tipoParam, 
                    page, 
                    10 // Tamanho da página
                );
            } else {
                if (!user.moradorId) {
                    throw new Error('ID do morador não encontrado');
                }
                responseData = await ocorrenciaService.searchByMorador(
                    user.moradorId,
                    query, 
                    statusParam, 
                    tipoParam, 
                    page, 
                    10
                );
            }
            
            // Se o componente foi desmontado ou uma nova requisição foi iniciada, ignora a resposta
            if (!isMountedRef.current || requestId !== loadRequestIdRef.current) {
                isLoadingRef.current = false;
                return;
            }

            // Define qual array de estado (allIssues ou cancelledIssues) deve ser atualizado
            const targetArraySetter = tab === 'Canceladas' ? setCancelledIssues : setAllIssues;
            const newIssues = responseData?.issues || [];
            
            if (append) {
                // Adiciona novos itens, garantindo que não haja duplicatas
                targetArraySetter(prev => {
                    const existingIds = new Set(prev.map(item => item.id));
                    const filteredNew = newIssues.filter((item: Ocorrencia) => !existingIds.has(item.id));
                    const combined = [...prev, ...filteredNew];
                    return combined;
                });
            } else {
                // Substitui a lista inteira
                targetArraySetter(newIssues);
            }
            // Atualiza o estado da paginação
            setHasMore(responseData?.hasMore || false);
            setCurrentPage(page);

        } catch (error: any) {
            if (isMountedRef.current && requestId === loadRequestIdRef.current) {
                // Exibe alerta de erro, exceto se for um erro de "cancelamento" (comum em race conditions)
                if (error.message !== 'canceled') {
                    Alert.alert('Erro', `Não foi possível carregar as ocorrências: ${error.message || 'Erro desconhecido'}`);
                }
            }
        } finally {
            // Limpa os estados de loading apenas se esta for a requisição mais recente
            if (isMountedRef.current && requestId === loadRequestIdRef.current) {
                setLoading(false);
                setLoadingMore(false);
                setIsSearching(false);
                isLoadingRef.current = false;
            } else {
                // Se não for a mais recente, apenas libera o "lock" de carregamento
                isLoadingRef.current = false;
            }
        }
    }, [user, isAdmin]); // Depende do usuário e seu perfil

    /**
     * `useFocusEffect` é usado em vez de `useEffect` para re-carregar os dados
     * toda vez que o usuário navegar para esta tela (e não apenas no mount inicial).
     * Carrega os contadores e os tipos de ocorrência.
     */
    useFocusEffect(
        useCallback(() => {
            if (!user) return;
            
            // Carrega as contagens das abas
            loadCounters();
            
            // Carrega os tipos de ocorrência para o dropdown de filtro
            const fetchTypes = async () => {
                try {
                    const types = await issueTypeService.getAll();
                    if (isMountedRef.current) {
                        setAvailableTypes(types || []);
                    }
                } catch (error) {
                    if (isMountedRef.current) {
                        setAvailableTypes([]);
                    }
                }
            };
            fetchTypes();
        }, [user, loadCounters])
    );

    /**
     * Efeito que monitora a mudança da aba ativa (`activeTab`).
     * Quando a aba muda, reseta os filtros, a paginação e
     * dispara uma nova busca (`loadIssues`) para a aba selecionada.
     */
    useEffect(() => {
        if (!user) return;
        
        // Invalida requisições anteriores
        loadRequestIdRef.current++;
        
        // Reseta o estado para a nova aba
        setCurrentPage(0);
        setHasMore(true);
        setSearchQuery('');
        setSearchTipo('');
        
        // Um pequeno delay para permitir que o estado de 'loading' atualize a UI
        const timer = setTimeout(() => {
            if (isMountedRef.current) {
                loadIssues(0, false, '', '', activeTab);
            }
        }, 100);
        
        return () => clearTimeout(timer);
        // A dependência `loadIssues` foi removida da lista original para evitar re-execução
        // desnecessária, pois `loadIssues` é estável (graças ao useCallback) mas
        // o lint pode sugeri-la. A lógica aqui depende apenas da 'activeTab'.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, user?.moradorId]); // Dispara na mudança de aba ou usuário

    /**
     * Efeito para aplicar "debounce" à busca por texto (`searchQuery`).
     * Aguarda 500ms após o usuário parar de digitar para iniciar a busca,
     * evitando chamadas de API a cada tecla pressionada.
     */
    useEffect(() => {
        if (!user) return;
        
        // Limpa o timeout anterior, se houver
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        setIsSearching(true); // Ativa o indicador de loading na busca
        searchTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
                setCurrentPage(0); // Reseta a paginação
                setHasMore(true);
                loadIssues(0, false, searchQuery, searchTipo, activeTab);
            }
        }, 500); // 500ms de espera

        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
        // A dependência `loadIssues` foi removida (ver comentário no useEffect anterior)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]); // Dispara a cada mudança no texto de busca

    /**
     * Efeito para aplicar "debounce" ao filtro de tipo (`searchTipo`).
     * Aplica um debounce menor (300ms) pois a seleção em um Picker é uma ação única.
     */
    useEffect(() => {
        if (!user) return;
        
        if (filterTimeoutRef.current) {
            clearTimeout(filterTimeoutRef.current);
        }

        setIsSearching(true);
        filterTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
                setCurrentPage(0); // Reseta a paginação
                setHasMore(true);
                loadIssues(0, false, searchQuery, searchTipo, activeTab);
            }
        }, 300); // 300ms de espera

        return () => {
            if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
        };
        // A dependência `loadIssues` foi removida (ver comentário no useEffect anterior)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTipo]); // Dispara a cada mudança no filtro de tipo

    /**
     * Handler para a ação "Pull to Refresh" (puxar para atualizar).
     * Reseta todo o estado de filtros, paginação e dados,
     * e recarrega tanto os contadores quanto a lista da aba ativa.
     */
    const handleRefresh = useCallback(() => {
        if (isLoadingRef.current) return;
        
        loadRequestIdRef.current++; // Invalida requisições pendentes
        
        // Reseta estados
        setCurrentPage(0);
        setHasMore(true);
        setSearchQuery('');
        setSearchTipo('');
        
        // Limpa dados
        setAllIssues([]);
        setCancelledIssues([]);
        
        // Recarrega contadores
        loadCounters();
        
        // Recarrega a lista
        setTimeout(() => {
            if (isMountedRef.current) {
                loadIssues(0, false, '', '', activeTab);
            }
        }, 100);
    }, [loadCounters, loadIssues, activeTab]); // Adicionadas dependências corretas

    /**
     * Retorna a contagem de itens para uma aba específica.
     * `useCallback` é usado para memoizar a função, já que ela
     * só precisa ser recriada se `totalCounts` mudar.
     */
    const getStatusCount = useCallback((status: string) => {
        switch (status) {
            case 'Todas': return totalCounts.todas;
            case 'Pendente': return totalCounts.pendente;
            case 'Em andamento': return totalCounts.emAndamento;
            case 'Resolvida': return totalCounts.resolvida;
            case 'Canceladas': return totalCounts.cancelada;
            default: return 0;
        }
    }, [totalCounts]);

    /**
     * `useMemo` seleciona qual lista de dados (allIssues ou cancelledIssues)
     * deve ser passada para a `FlatList`, baseado na `activeTab`.
     * Isso evita recálculos desnecessários a cada renderização.
     */
    const issuesToDisplay = useMemo(() => {
        return activeTab === 'Canceladas' ? cancelledIssues : allIssues;
    }, [activeTab, allIssues, cancelledIssues]);

    /**
     * Renderiza o componente de rodapé da lista,
     * exibindo um indicador de "Carregando mais..." durante a paginação.
     * Memoizado com `useCallback` pois só depende de `loadingMore`.
     */
    const renderFooter = useCallback(() => {
        if (!loadingMore) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#2563eb" />
                <Text style={styles.footerLoaderText}>Carregando mais...</Text>
            </View>
        );
    }, [loadingMore]);

    /**
     * Handler chamado quando o usuário rola a lista até o final.
     * Dispara o carregamento da próxima página se `hasMore` for verdadeiro
     * e se nenhuma outra carga estiver em andamento.
     */
    const handleEndReached = useCallback(() => {
        // Múltiplas checagens para evitar chamadas de paginação desnecessárias ou duplicadas
        if (isLoadingRef.current || loadingMore || loading || !hasMore || issuesToDisplay.length === 0) return;
        
        loadIssues(currentPage + 1, true, searchQuery, searchTipo, activeTab);
    }, [loadingMore, loading, hasMore, issuesToDisplay.length, currentPage, searchQuery, searchTipo, activeTab, loadIssues]); // Adicionadas dependências corretas

    /**
     * Callback passado para os modais (Novo e Detalhe).
     * Quando uma ocorrência é criada, atualizada ou excluída,
     * fecha o modal e força um `handleRefresh` completo da tela
     * para garantir que todos os dados e contagens estejam atualizados.
     */
    const handleIssueUpdate = useCallback(() => {
        setSelectedIssue(null);
        setShowNewIssueModal(false); // Garante que ambos os modais fechem

        // Adiciona um pequeno delay para dar tempo à animação do modal fechar
        setTimeout(() => {
            if (!isMountedRef.current) return;
            handleRefresh();
        }, 400); 
    }, [handleRefresh]);

    /**
     * Callback estável (memoizado) para selecionar um item da lista
     * e abrir o modal de detalhes.
     */
    const handleSelectItem = useCallback((item: Ocorrencia) => {
        setSelectedIssue(item);
    }, []); // `setSelectedIssue` do `useState` é estável

    /**
     * Função memoizada para renderizar cada item na `FlatList`.
     * Utiliza o componente `IssueRow` (que também é memoizado)
     * e passa o callback `handleSelectItem`.
     */
    const renderItem = useCallback(({ item }: { item: Ocorrencia }) => (
        <IssueRow item={item} onSelectItem={handleSelectItem} />
    ), [handleSelectItem]);


    // Renderiza um loader central se o usuário ainda não foi carregado
    if (!user) {
        return (
            <View style={styles.safeArea}>
                <View style={[styles.emptyContainer, { flex: 1 }]}>
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            </View>
        );
    }

    // Renderização principal do componente
    return (
        <View style={styles.safeArea}>
            {/* --- Cabeçalho --- */}
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
            
            {/* --- Barra de Busca e Filtro --- */}
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
                    {/* Botão de limpar busca / indicador de atividade */}
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClearButton}>
                            {isSearching ? <ActivityIndicator size="small" color="#64748b" /> : <X size={18} color="#64748b" />}
                        </TouchableOpacity>
                    )}
                </View>

                {/* Filtro de Categoria (Picker) */}
                {availableTypes.length > 0 && (
                    <View style={styles.filterPickerContainer}>
                        <Picker
                            selectedValue={searchTipo}
                            onValueChange={(itemValue) => {
                                setSearchTipo(itemValue);
                            }}
                            style={styles.filterPicker}
                        >
                            <Picker.Item label="Todas as categorias" value="" />
                            {availableTypes.map(type => (
                                <Picker.Item key={type.id} label={type.name} value={type.name} />
                            ))}
                        </Picker>
                    </View>
                )}
            </View>

            {/* --- Cartões de Status Resumidos --- */}
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
            
            {/* --- Abas de Navegação (Status) --- */}
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
                                <Text style={[styles.tabBadgeText, activeTab === tab && styles.activeTabBadgeText]}>
                                    {getStatusCount(tab)}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
            
            {/* --- Lista Principal de Ocorrências --- */}
            <FlatList
                data={issuesToDisplay} // Dados memoizados
                keyExtractor={item => String(item.id)} // Chave única para cada item
                renderItem={renderItem} // Função de renderização memoizada
                contentContainerStyle={styles.list}
                
                // Componente para lista vazia ou estado de carregamento inicial
                ListEmptyComponent={() => {
                    // Estado de "Nenhum resultado"
                    if (!loading && !loadingMore) {
                        return (
                            <View style={styles.emptyContainer}>
                                <AlertTriangle size={48} color="#9ca3af" />
                                <Text style={styles.emptyText}>
                                    {searchQuery || searchTipo 
                                        ? 'Nenhuma ocorrência encontrada para esta pesquisa' 
                                        : 'Nenhuma ocorrência encontrada'}
                                </Text>
                                {/* Botão para limpar filtros se houver busca ativa */}
                                {(searchQuery || searchTipo) && (
                                    <TouchableOpacity 
                                        onPress={() => {
                                            setSearchQuery('');
                                            setSearchTipo('');
                                        }} 
                                        style={styles.clearSearchButton}
                                    >
                                        <Text style={styles.clearSearchButtonText}>Limpar filtros</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    }
                    // Estado de "Carregamento inicial"
                    if (loading && !loadingMore) {
                        return (
                            <View style={[styles.emptyContainer, { paddingTop: 80 }]}>
                                <ActivityIndicator size="large" color="#2563eb" />
                            </View>
                        );
                    }
                    return null;
                }}
                
                // Componente de rodapé para "Carregando mais..."
                ListFooterComponent={renderFooter}
                
                // Paginação
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.3} // Dispara a 30% do final
                
                // Pull-to-Refresh
                refreshing={loading && !loadingMore} // Controla o ícone de refresh
                onRefresh={handleRefresh}
                
                // Otimizações de performance da FlatList
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                updateCellsBatchingPeriod={50}
                initialNumToRender={10}
                windowSize={5} 
            />
            
            {/* --- Modais --- */}
            {/* Modal de Nova Ocorrência */}
            <NewIssueModal 
                visible={showNewIssueModal} 
                onClose={() => setShowNewIssueModal(false)}
                onSuccess={handleIssueUpdate} // Callback para recarregar a lista
                availableTypes={availableTypes}
            />

            {/* Modal de Detalhes da Ocorrência */}
            {selectedIssue !== null && (
                <IssueDetailModal 
                    issue={selectedIssue} 
                    visible={selectedIssue !== null}
                    onClose={() => setSelectedIssue(null)}
                    onUpdate={handleIssueUpdate} // Callback para recarregar a lista
                />
            )}
        </View>
    );
}