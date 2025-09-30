// Location: app/(app)/(tabs)/residents.tsx

import { Picker } from '@react-native-picker/picker';
import { Mail, MapPin, Phone, Plus, Search, Car } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/Dialog';
import { Input } from '../../../components/ui/input';

// --- MOCK DATA ---
const residentsData = [ 
    { id: 1, name: 'Maria Silva', unit: 'Apt 302', tower: 'Torre A', email: 'maria.silva@email.com', phone: '(11) 99999-1234', status: 'active', vehicles: ['ABC-1234', 'XYZ-5678'], notes: 'Sindica atual, contato preferencial por WhatsApp' }, 
    { id: 2, name: 'João Santos', unit: 'Apt 105', tower: 'Torre A', email: 'joao.santos@email.com', phone: '(11) 97777-4321', status: 'active', vehicles: ['DEF-9876'], notes: '' }, 
    { id: 3, name: 'Ana Costa', unit: 'Apt 201', tower: 'Torre B', email: 'ana.costa@email.com', phone: '(11) 95555-8765', status: 'active', vehicles: [], notes: 'Apartamento alugado, contrato até dez/2024' }, 
    { id: 4, name: 'Carlos Oliveira', unit: 'Apt 404', tower: 'Torre B', email: 'carlos.oliveira@email.com', phone: '(11) 93333-2109', status: 'inactive', vehicles: ['GHI-5432'], notes: 'Mudança programada para próximo mês' } 
];

interface Resident {
  id: number;
  name: string;
  unit: string;
  tower: string;
  email: string;
  phone: string;
  status: string;
  vehicles: string[];
  notes: string;
}

export default function ResidentsScreen() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');

    const filteredResidents = useMemo(() => residentsData.filter((resident: Resident) => {
        const lowerSearch = searchTerm.toLowerCase();
        const matchesSearch = resident.name.toLowerCase().includes(lowerSearch) ||
                              resident.unit.toLowerCase().includes(lowerSearch) ||
                              resident.email.toLowerCase().includes(lowerSearch);
        const matchesStatus = filterStatus === 'all' || resident.status === filterStatus;
        return matchesSearch && matchesStatus;
    }), [searchTerm, filterStatus]);

    const getStatusBadgeVariant = (status: string) => {
        if (status === 'active') return 'success';
        if (status === 'inactive') return 'danger';
        return 'default';
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <FlatList
                data={filteredResidents}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={
                    <>
                        <View style={styles.header}>
                            <View style={styles.headerTextContainer}>
                                <Text style={styles.headerTitle}>Moradores</Text>
                                <Text style={styles.headerSubtitle}>Gerencie informações dos moradores</Text>
                            </View>
                            <Button onPress={() => setShowAddModal(true)} style={styles.addButton}>
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
                                    placeholder="Buscar por nome, apt..."
                                    value={searchTerm}
                                    onChangeText={setSearchTerm}
                                    style={styles.searchInput}
                                />
                            </View>
                            <View style={styles.pickerWrapper}>
                                <View style={styles.pickerContainer}>
                                    <Picker 
                                        selectedValue={filterStatus} 
                                        onValueChange={(itemValue) => setFilterStatus(itemValue)}
                                        style={styles.picker}
                                        itemStyle={styles.pickerItem}
                                    >
                                        <Picker.Item label="Todos" value="all" />
                                        <Picker.Item label="Ativos" value="active" />
                                        <Picker.Item label="Inativos" value="inactive" />
                                    </Picker>
                                </View>
                            </View>
                        </View>

                        {/* Summary Stats */}
                        <View style={styles.statsContainer}>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>{residentsData.filter(r => r.status === 'active').length}</Text>
                                <Text style={styles.statLabel}>Ativos</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>{residentsData.length}</Text>
                                <Text style={styles.statLabel}>Total</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>{residentsData.reduce((acc, r) => acc + r.vehicles.length, 0)}</Text>
                                <Text style={styles.statLabel}>Veículos</Text>
                            </View>
                        </View>
                    </>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        onPress={() => setSelectedResident(item)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.residentCard}>
                            <View style={styles.cardContent}>
                                <View style={[styles.avatar, { backgroundColor: item.status === 'active' ? '#dbeafe' : '#fee2e2' }]}>
                                    <Text style={[styles.avatarText, { color: item.status === 'active' ? '#2563eb' : '#dc2626' }]}>
                                        {item.name.split(' ').map(n => n[0]).join('')}
                                    </Text>
                                </View>
                                <View style={styles.residentInfo}>
                                    <View style={styles.residentHeader}>
                                        <Text style={styles.residentName}>{item.name}</Text>
                                        <Badge variant={getStatusBadgeVariant(item.status)}>
                                            {item.status === 'active' ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </View>
                                    <View style={styles.residentDetails}>
                                        <View style={styles.detailRow}>
                                            <MapPin size={14} color="#6b7280" />
                                            <Text style={styles.detailText}>{item.unit} - {item.tower}</Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Mail size={14} color="#6b7280" />
                                            <Text style={styles.detailText} numberOfLines={1}>{item.email}</Text>
                                        </View>
                                        {item.vehicles.length > 0 && (
                                            <View style={styles.detailRow}>
                                                <Car size={14} color="#6b7280" />
                                                <Text style={styles.detailText}>{item.vehicles.length} veículo(s)</Text>
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
                        <Text style={styles.emptySubtext}>Tente ajustar os filtros</Text>
                    </View>
                }
            />

            {/* Modals */}
            {selectedResident && (
                <Dialog open={!!selectedResident} onOpenChange={() => setSelectedResident(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{selectedResident.name}</DialogTitle>
                            <DialogDescription>{selectedResident.unit} - {selectedResident.tower}</DialogDescription>
                        </DialogHeader>
                        <ScrollView style={styles.modalContent}>
                            <View style={styles.modalSection}>
                                <Text style={styles.modalSectionTitle}>Contato</Text>
                                <View style={styles.modalDetailRow}>
                                    <Mail size={16} color="#6b7280" />
                                    <Text style={styles.modalDetailText}>{selectedResident.email}</Text>
                                </View>
                                <View style={styles.modalDetailRow}>
                                    <Phone size={16} color="#6b7280" />
                                    <Text style={styles.modalDetailText}>{selectedResident.phone}</Text>
                                </View>
                            </View>

                            {selectedResident.vehicles.length > 0 && (
                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>Veículos</Text>
                                    {selectedResident.vehicles.map((vehicle, idx) => (
                                        <View key={idx} style={styles.vehicleTag}>
                                            <Car size={14} color="#3b82f6" />
                                            <Text style={styles.vehicleText}>{vehicle}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {selectedResident.notes && (
                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>Observações</Text>
                                    <Text style={styles.notesText}>{selectedResident.notes}</Text>
                                </View>
                            )}
                        </ScrollView>
                    </DialogContent>
                </Dialog>
            )}
            
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adicionar Novo Morador</DialogTitle>
                    </DialogHeader>
                    <View style={styles.formContainer}>
                        <Input placeholder="Nome Completo" style={styles.formInput} />
                        <Input placeholder="Unidade (ex: Apt 101)" style={styles.formInput} />
                        <Input placeholder="Torre" style={styles.formInput} />
                        <Input placeholder="Email" style={styles.formInput} />
                        <Input placeholder="Telefone" style={styles.formInput} />
                        <Button onPress={() => setShowAddModal(false)} style={styles.saveButton}>
                            Salvar
                        </Button>
                    </View>
                </DialogContent>
            </Dialog>
        </SafeAreaView>
    );
}

// --- STYLES ---

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: '#f9fafb' 
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    picker: {
        height: 50,
        fontSize: 15,
        color: '#374151',
    },
    pickerItem: {
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
        maxHeight: 400,
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
        gap: 8,
        backgroundColor: '#eff6ff',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    vehicleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e40af',
    },
    notesText: {
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 20,
        backgroundColor: '#f9fafb',
        padding: 12,
        borderRadius: 8,
    },
    formContainer: {
        gap: 12,
        marginTop: 8,
    },
    formInput: {
        height: 48,
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        borderRadius: 10,
    },
    saveButton: {
        marginTop: 8,
        height: 48,
        borderRadius: 10,
    },
});