// Location: app/(app)/(tabs)/reservations.tsx

import { Picker } from '@react-native-picker/picker';
import { Calendar as CalendarIcon, Clock, MapPin, Plus, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { FlatList, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/Dialog';

// Setup for react-native-calendars in Portuguese
LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  monthNamesShort: ['Jan.','Fev.','Mar','Abr','Mai','Jun','Jul.','Ago','Set.','Out.','Nov.','Dez.'],
  dayNames: ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'],
  dayNamesShort: ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

// --- MOCK DATA (same as your original code) ---
const areas = [ { id: 1, name: 'Salão de Festas', description: 'Capacidade para 50 pessoas, som ambiente, cozinha completa', image: '🎉', price: 'R$ 150,00', available: true, rules: ['Máximo 50 pessoas', 'Término até 23h', 'Limpeza obrigatória'] }, { id: 2, name: 'Churrasqueira', description: 'Área gourmet com churrasqueira, mesas e bancos', image: '🍖', price: 'R$ 80,00', available: true, rules: ['Máximo 20 pessoas', 'Término até 22h', 'Limpeza obrigatória'] }, { id: 3, name: 'Piscina', description: 'Piscina adulto e infantil, área de descanso', image: '🏊', price: 'Gratuito', available: false, rules: ['Máximo 15 pessoas', 'Apenas finais de semana', 'Responsável maior de idade'] }, ];
const myReservations = [ { id: 1, area: 'Salão de Festas', date: '2025-09-22', time: '19:00', status: 'confirmed', guests: 35 }, { id: 2, area: 'Churrasqueira', date: '2025-09-25', time: '12:00', status: 'pending', guests: 15 }, ];
const timeSlots = [ '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00' ];

export default function ReservationsScreen() {
    const [activeTab, setActiveTab] = useState('Áreas Disponíveis');
    const [selectedArea, setSelectedArea] = useState<typeof areas[number] | null>(null);
    const [showBookingModal, setShowBookingModal] = useState(false);

    const handleSelectArea = (area: typeof areas[number]) => {
        setSelectedArea(area);
        setShowBookingModal(true);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Reservas</Text>
                <Text style={styles.headerSubtitle}>Gerencie suas reservas de áreas comuns</Text>
            </View>

            <View style={styles.tabsContainer}>
                <TabButton title="Áreas Disponíveis" isActive={activeTab === 'Áreas Disponíveis'} onPress={() => setActiveTab('Áreas Disponíveis')} />
                <TabButton title="Minhas Reservas" isActive={activeTab === 'Minhas Reservas'} onPress={() => setActiveTab('Minhas Reservas')} />
            </View>

            {activeTab === 'Áreas Disponíveis' && (
                <FlatList
                    data={areas}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => <AreaCard area={item} onReserve={() => handleSelectArea(item)} />}
                    contentContainerStyle={styles.list}
                />
            )}
            {activeTab === 'Minhas Reservas' && (
                <FlatList
                    data={myReservations}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => <MyReservationCard reservation={item} />}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<EmptyState onAction={() => setActiveTab('Áreas Disponíveis')} />}
                />
            )}

            {selectedArea && (
                <BookingModal
                    visible={showBookingModal}
                    onClose={() => setShowBookingModal(false)}
                    area={selectedArea}
                />
            )}
        </SafeAreaView>
    );
}

// --- SUB-COMPONENTS for clarity ---

interface TabButtonProps {
    title: string;
    isActive: boolean;
    onPress: () => void;
}
const TabButton = ({ title, isActive, onPress }: TabButtonProps) => (
    <TouchableOpacity style={[styles.tab, isActive && styles.activeTab]} onPress={onPress}>
        <Text style={[styles.tabText, isActive && styles.activeTabText]}>{title}</Text>
    </TouchableOpacity>
);

interface Area {
    id: number;
    name: string;
    description: string;
    image: string;
    price: string;
    available: boolean;
    rules: string[];
}
interface AreaCardProps {
    area: Area;
    onReserve: () => void;
}
const AreaCard = ({ area, onReserve }: AreaCardProps) => (
    <Card style={!area.available && { opacity: 0.6 }}>
        <CardContent style={styles.cardContent}>
            <View style={{ flexDirection: 'row', gap: 16 }}>
                <Text style={{ fontSize: 40 }}>{area.image}</Text>
                <View style={{ flex: 1, gap: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.cardTitle}>{area.name}</Text>
                        <Text style={styles.price}>{area.price}</Text>
                    </View>
                    <Text style={styles.description}>{area.description}</Text>
                    <View style={styles.rulesContainer}>
                        {area.rules.map((rule: string, index: number) => <Badge key={index} variant="outline">{rule}</Badge>)}
                    </View>
                    <Button disabled={!area.available} onPress={onReserve}>
                        <Plus size={16} color="white" />
                        Reservar
                    </Button>
                </View>
            </View>
        </CardContent>
    </Card>
);

interface Reservation {
    id: number;
    area: string;
    date: string;
    time: string;
    status: string;
    guests: number;
}
interface MyReservationCardProps {
    reservation: Reservation;
}
const MyReservationCard = ({ reservation }: MyReservationCardProps) => {
        const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', weekday: 'long' });
        const getStatusVariant = (status: string) => status === 'confirmed' ? 'success' : 'warning';

    return (
        <Card>
            <CardContent style={styles.cardContent}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ gap: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <MapPin size={16} color="#2563eb" />
                            <Text style={styles.cardTitle}>{reservation.area}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><CalendarIcon size={14} color="#4b5563" /><Text style={styles.metaText}>{formatDate(reservation.date)}</Text></View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Clock size={14} color="#4b5563" /><Text style={styles.metaText}>{reservation.time}</Text></View>
                        </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 8 }}>
                        <Badge variant={getStatusVariant(reservation.status)}>{reservation.status === 'confirmed' ? 'Confirmada' : 'Pendente'}</Badge>
                        <Button variant="outline" style={{ paddingVertical: 6, borderColor: '#fecaca', borderWidth: 1 }}>
                            <X size={14} color="#dc2626" />
                            <Text style={{ color: '#dc2626', fontSize: 12 }}>Cancelar</Text>
                        </Button>
                    </View>
                </View>
            </CardContent>
        </Card>
    );
};

interface BookingModalProps {
    visible: boolean;
    onClose: () => void;
    area: Area;
}
const BookingModal = ({ visible, onClose, area }: BookingModalProps) => {
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState(timeSlots[0]);

    const today = new Date().toISOString().split('T')[0];
    
    // useMemo to create the markedDates object
    const markedDates = useMemo(() => {
        if (!selectedDate) return {};
        return {
            [selectedDate]: { selected: true, selectedColor: '#2563eb', disableTouchEvent: true }
        };
    }, [selectedDate]);

    return (
        <Dialog open={visible} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reservar {area.name}</DialogTitle>
                </DialogHeader>
                <ScrollView>
                    <Text style={styles.label}>1. Selecione a data</Text>
                    <Card>
                        <Calendar
                            onDayPress={day => setSelectedDate(day.dateString)}
                            markedDates={markedDates}
                            minDate={today}
                        />
                    </Card>

                    {selectedDate && (
                        <>
                            <Text style={styles.label}>2. Selecione o horário</Text>
                            <View style={styles.pickerContainer}>
                                <Picker selectedValue={selectedTime} onValueChange={itemValue => setSelectedTime(itemValue)}>
                                    {timeSlots.map(time => <Picker.Item key={time} label={time} value={time} />)}
                                </Picker>
                            </View>
                        </>
                    )}
                    
                    <View style={styles.modalActions}>
                        <Button variant="outline" onPress={onClose} style={{ flex: 1 }}>Cancelar</Button>
                        <Button onPress={onClose} style={{ flex: 1 }} disabled={!selectedDate || !selectedTime}>Confirmar</Button>
                    </View>
                </ScrollView>
            </DialogContent>
        </Dialog>
    );
};

interface EmptyStateProps {
    onAction: () => void;
}
const EmptyState = ({ onAction }: EmptyStateProps) => (
    <Card>
        <CardContent style={{ alignItems: 'center', padding: 24 }}>
            <CalendarIcon size={48} color="#9ca3af" style={{ marginBottom: 16 }} />
            <Text style={styles.cardTitle}>Nenhuma reserva encontrada</Text>
            <Text style={styles.description}>Você ainda não possui reservas ativas.</Text>
            <Button onPress={onAction} style={{ marginTop: 16 }}>
                <Plus size={16} color="white" /> Fazer primeira reserva
            </Button>
        </CardContent>
    </Card>
);


// --- STYLES ---

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f9fafb' },
    header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1e3a8a' },
    headerSubtitle: { fontSize: 16, color: '#4b5563' },
    tabsContainer: { flexDirection: 'row', backgroundColor: '#e5e7eb', margin: 16, borderRadius: 8, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 6 },
    activeTab: { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    tabText: { textAlign: 'center', color: '#4b5563', fontWeight: '500' },
    activeTabText: { color: '#1e3a8a' },
    list: { paddingHorizontal: 16, paddingBottom: 16, gap: 16 },
    cardContent: { padding: 16 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    price: { fontSize: 16, fontWeight: 'bold', color: '#2563eb' },
    description: { fontSize: 14, color: '#6b7280' },
    rulesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    metaText: { fontSize: 14, color: '#4b5563' },
    label: { fontSize: 16, fontWeight: '500', color: '#374151', marginVertical: 16 },
    pickerContainer: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12 },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 }
});