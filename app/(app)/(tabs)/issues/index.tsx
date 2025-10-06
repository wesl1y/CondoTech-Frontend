// src/app/(tabs)/issues/index.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FlatList, SafeAreaView, ScrollView, Text, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Plus, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Ocorrencia, ocorrenciaService } from '@/services/ocorrenciaService';
import { styles } from './styles';


import { IssueCard } from './components/IssueCard';
import { NewIssueModal } from './components/NewIssueModal';
import { IssueDetailModal } from './components/IssueDetailModal';

export default function IssuesScreen() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const [activeTab, setActiveTab] = useState('Todas');
    const [showNewIssueModal, setShowNewIssueModal] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<Ocorrencia | null>(null);
    const [allIssues, setAllIssues] = useState<Ocorrencia[]>([]);
    const [cancelledIssues, setCancelledIssues] = useState<Ocorrencia[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isInitialLoad, setIsInitialLoad] = useState(false);
    const activeTabRef = useRef(activeTab);

    const [totalCounts, setTotalCounts] = useState({
        todas: 0,
        pendente: 0,
        emAndamento: 0,
        resolvida: 0,
        cancelada: 0
    });

    const tabs = ['Todas', 'Pendente', 'Em andamento', 'Resolvida'];
    if (isAdmin) {
        tabs.push('Canceladas');
    }

    const loadCounters = useCallback(async () => {
        if (!user) return;
        try {
            if (isAdmin) {
                const [todasData, pendenteData, emAndamentoData, resolvidaData, canceladaData] = await Promise.all([
                    ocorrenciaService.getAll(undefined, 0, 1),
                    ocorrenciaService.getAll('ABERTA', 0, 1),
                    ocorrenciaService.getAll('EM_ANDAMENTO', 0, 1),
                    ocorrenciaService.getAll('RESOLVIDA', 0, 1),
                    ocorrenciaService.getAll('CANCELADA', 0, 1),
                ]);
                setTotalCounts({
                    todas: todasData.totalItems,
                    pendente: pendenteData.totalItems,
                    emAndamento: emAndamentoData.totalItems,
                    resolvida: resolvidaData.totalItems,
                    cancelada: canceladaData.totalItems,
                });
            } else if (user.moradorId) {
                const allData = await ocorrenciaService.getByMorador(user.moradorId, 0, 9999);
                const pendente = allData.ocorrencias.filter(o => o.statusOcorrencia === 'ABERTA').length;
                const emAndamento = allData.ocorrencias.filter(o => o.statusOcorrencia === 'EM_ANDAMENTO').length;
                const resolvida = allData.ocorrencias.filter(o => ['RESOLVIDA', 'FECHADA'].includes(o.statusOcorrencia)).length;
                setTotalCounts({
                    todas: allData.totalItems,
                    pendente,
                    emAndamento,
                    resolvida,
                    cancelada: 0,
                });
            }
        } catch (error) {
            console.error('Erro ao carregar contadores:', error);
        }
    }, [user, isAdmin]);

    useEffect(() => {
        activeTabRef.current = activeTab;
    }, [activeTab]);

    useFocusEffect(
        useCallback(() => {
            if (user) {
                loadCounters();
            }
        }, [loadCounters, user])
    );
    
    const loadIssues = useCallback(async (page: number = 0, append: boolean = false) => {
        if (!user) return;
        
        const currentTab = activeTabRef.current;
        if (page === 0 && !append) {
            setIsInitialLoad(true);
        }
        
        if (page === 0) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }
        
        try {
            let activeData;
            const getStatusParam = () => {
                if (currentTab === 'Todas') return undefined;
                if (currentTab === 'Canceladas') return 'CANCELADA';
                if (currentTab === 'Pendente') return 'ABERTA';
                if (currentTab === 'Em andamento') return 'EM_ANDAMENTO';
                if (currentTab === 'Resolvida') return 'RESOLVIDA';
                return undefined;
            };
            const statusParam = getStatusParam();
    
            if (isAdmin) {
                activeData = await ocorrenciaService.getAll(statusParam, page, 10);
            } else if (user.moradorId) {
                activeData = await ocorrenciaService.getByMorador(user.moradorId, page, 10);
            }
            
            if (activeData) {
                const targetArraySetter = currentTab === 'Canceladas' ? setCancelledIssues : setAllIssues;
                
                if (append) {
                    targetArraySetter(prev => {
                        const newItems = activeData.ocorrencias.filter(
                            (newItem: Ocorrencia) => !prev.some(existingItem => existingItem.id === newItem.id)
                        );
                        return [...prev, ...newItems];
                    });
                } else {
                    targetArraySetter(activeData.ocorrencias);
                }
                
                setHasMore(activeData.hasMore);
                setCurrentPage(page);
            }
        } catch (error) {
            console.error('Erro ao carregar ocorrências:', error);
            Alert.alert('Erro', 'Não foi possível carregar as ocorrências');
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setTimeout(() => setIsInitialLoad(false), 500);
        }
    }, [user, isAdmin]);

    const handleLoadMore = () => {
        if (!loadingMore && hasMore && !loading && !isInitialLoad) {
            loadIssues(currentPage + 1, true);
        }
    };

    useEffect(() => {
        setCurrentPage(0);
        setHasMore(true);
        setLoading(true);
        setIsInitialLoad(false); 
        
        if (activeTab === 'Canceladas') {
            setCancelledIssues([]);
        } else {
            setAllIssues([]);
        }
        
        loadIssues(0, false);
    }, [activeTab]);

    const handleRefresh = useCallback(() => {
        setCurrentPage(0);
        setHasMore(true);
        loadCounters();
        loadIssues(0, false);
    }, [loadCounters, loadIssues]);

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
                            <View style={[styles.tabBadge, activeTab === tab && styles.activeTabBadge]}>
                                <Text style={[styles.tabBadgeText, activeTab === tab && styles.activeTabBadgeText]}>
                                    {getStatusCount(tab)}
                                </Text>
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
                            <Text style={styles.emptyText}>Nenhuma ocorrência encontrada</Text>
                        </View>
                    ) : null
                }
                ListFooterComponent={renderFooter}
                onEndReached={handleLoadMore}
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