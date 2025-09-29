// Location: app/(app)/(tabs)/residents.tsx

import { Picker } from '@react-native-picker/picker';
import { Mail, MapPin, Plus, Search } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/Dialog';
import { Input } from '../../../components/ui/input';

// --- MOCK DATA ---
const residentsData = [ { id: 1, name: 'Maria Silva', unit: 'Apt 302', tower: 'Torre A', email: 'maria.silva@email.com', phone: '(11) 99999-1234', status: 'active', vehicles: ['ABC-1234', 'XYZ-5678'], notes: 'Sindica atual, contato preferencial por WhatsApp' }, { id: 2, name: 'João Santos', unit: 'Apt 105', tower: 'Torre A', email: 'joao.santos@email.com', phone: '(11) 97777-4321', status: 'active', vehicles: ['DEF-9876'], notes: '' }, { id: 3, name: 'Ana Costa', unit: 'Apt 201', tower: 'Torre B', email: 'ana.costa@email.com', phone: '(11) 95555-8765', status: 'active', vehicles: [], notes: 'Apartamento alugado, contrato até dez/2024' }, { id: 4, name: 'Carlos Oliveira', unit: 'Apt 404', tower: 'Torre B', email: 'carlos.oliveira@email.com', phone: '(11) 93333-2109', status: 'inactive', vehicles: ['GHI-5432'], notes: 'Mudança programada para próximo mês' } ];

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
                            <View>
                                <Text style={styles.headerTitle}>Moradores</Text>
                                <Text style={styles.headerSubtitle}>Gerencie informações dos moradores</Text>
                            </View>
                            <Button onPress={() => setShowAddModal(true)}>
                                <Plus size={16} color="white" /> Novo
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
                            <View style={styles.pickerContainer}>
                                <Picker selectedValue={filterStatus} onValueChange={(itemValue) => setFilterStatus(itemValue)}>
                                    <Picker.Item label="Todos" value="all" />
                                    <Picker.Item label="Ativos" value="active" />
                                    <Picker.Item label="Inativos" value="inactive" />
                                </Picker>
                            </View>
                        </View>
                        
                        {/* Summary Cards would go here if desired */}
                    </>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => setSelectedResident(item)}>
                        <Card style={styles.residentCard}>
                            <CardContent style={styles.cardContent}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{item.name.split(' ').map(n => n[0]).join('')}</Text>
                                </View>
                                <View style={{ flex: 1, gap: 4 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <Text style={styles.residentName}>{item.name}</Text>
                                        <Badge variant={getStatusBadgeVariant(item.status)}>{item.status === 'active' ? 'Ativo' : 'Inativo'}</Badge>
                                    </View>
                                    <Text style={styles.residentUnit}><MapPin size={14} color="#6b7280"/> {item.unit} - {item.tower}</Text>
                                    <Text style={styles.residentContact}><Mail size={14} color="#6b7280"/> {item.email}</Text>
                                </View>
                            </CardContent>
                        </Card>
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.emptyText}>Nenhum morador encontrado.</Text>}
            />

            {/* Modals */}
            {selectedResident && (
                <Dialog open={!!selectedResident} onOpenChange={() => setSelectedResident(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{selectedResident.name}</DialogTitle>
                            <DialogDescription>{selectedResident.unit} - {selectedResident.tower}</DialogDescription>
                        </DialogHeader>
                        <Text>{selectedResident.notes || 'Nenhuma observação.'}</Text>
                    </DialogContent>
                </Dialog>
            )}
             <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adicionar Novo Morador</DialogTitle>
                    </DialogHeader>
                     <Input placeholder="Nome Completo" />
                     <Input placeholder="Unidade (ex: Apt 101)" />
                     <Button onPress={() => setShowAddModal(false)}>Salvar</Button>
                </DialogContent>
            </Dialog>

        </SafeAreaView>
    );
}

// --- STYLES ---

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: 'white' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1e3a8a' },
    headerSubtitle: { fontSize: 16, color: '#6b7280' },
    filterContainer: { padding: 16, gap: 12 },
    searchInputContainer: { position: 'relative', justifyContent: 'center' },
    searchIcon: { position: 'absolute', left: 12, zIndex: 1 },
    searchInput: { paddingLeft: 40, height: 50 },
    pickerContainer: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12 },
    list: { padding: 16, gap: 12 },
    residentCard: { borderWidth: 1, borderColor: '#e5e7eb' },
    cardContent: { padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 16, fontWeight: 'bold', color: '#2563eb' },
    residentName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    residentUnit: { fontSize: 14, color: '#6b7280' },
    residentContact: { fontSize: 14, color: '#6b7280', flexShrink: 1 },
    emptyText: { textAlign: 'center', color: '#6b7280', marginTop: 40 },
});