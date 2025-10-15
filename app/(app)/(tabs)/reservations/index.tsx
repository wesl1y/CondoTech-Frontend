// Location: app/(app)/(tabs)/reservations/index.tsx

import { Picker } from '@react-native-picker/picker';
import { Calendar as CalendarIcon, Clock, MapPin, Plus, X, Home, Flame, Waves } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { FlatList, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent } from '../../../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/Dialog';
import { styles } from './styles';

// Setup for react-native-calendars in Portuguese
LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  monthNamesShort: ['Jan.','Fev.','Mar','Abr','Mai','Jun','Jul.','Ago','Set.','Out.','Nov.','Dez.'],
  dayNames: ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'],
  dayNamesShort: ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

// --- MOCK DATA ---
const areas = [
    { 
        id: 1, 
        name: 'Salão de Festas', 
        description: 'Capacidade para 50 pessoas, som ambiente, cozinha completa', 
        icon: 'party', 
        price: 'R$ 150,00', 
        available: true, 
        rules: ['Máximo 50 pessoas', 'Término até 23h', 'Limpeza obrigatória'] 
    },
    { 
        id: 2, 
        name: 'Churrasqueira', 
        description: 'Área gourmet com churrasqueira, mesas e bancos', 
        icon: 'grill', 
        price: 'R$ 80,00', 
        available: true, 
        rules: ['Máximo 20 pessoas', 'Término até 22h', 'Limpeza obrigatória'] 
    },
    { 
        id: 3, 
        name: 'Piscina', 
        description: 'Piscina adulto e infantil, área de descanso', 
        icon: 'pool', 
        price: 'Gratuito', 
        available: false, 
        rules: ['Máximo 15 pessoas', 'Apenas finais de semana', 'Responsável maior de idade'] 
    },
];

const myReservations = [
    { id: 1, area: 'Salão de Festas', date: '2025-09-22', time: '19:00', status: 'confirmed', guests: 35 },
    { id: 2, area: 'Churrasqueira', date: '2025-09-25', time: '12:00', status: 'pending', guests: 15 },
];

const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', 
    '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
];

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
                <View>
                    <Text style={styles.headerTitle}>Reservas</Text>
                    <Text style={styles.headerSubtitle}>Gerencie suas reservas de áreas comuns</Text>
                </View>
            </View>

            <View style={styles.tabsContainer}>
                <TabButton 
                    title="Áreas Disponíveis" 
                    isActive={activeTab === 'Áreas Disponíveis'} 
                    onPress={() => setActiveTab('Áreas Disponíveis')} 
                />
                <TabButton 
                    title="Minhas Reservas" 
                    isActive={activeTab === 'Minhas Reservas'} 
                    onPress={() => setActiveTab('Minhas Reservas')} 
                />
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

// --- SUB-COMPONENTS ---

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
    icon: string;
    price: string;
    available: boolean;
    rules: string[];
}

interface AreaCardProps {
    area: Area;
    onReserve: () => void;
}

const AreaCard = ({ area, onReserve }: AreaCardProps) => {
    const getAreaIcon = (iconType: string) => {
        switch (iconType) {
            case 'party': return <Home size={28} color="#2563eb" />;
            case 'grill': return <Flame size={28} color="#2563eb" />;
            case 'pool': return <Waves size={28} color="#2563eb" />;
            default: return <Home size={28} color="#2563eb" />;
        }
    };

    return (
        <Card style={[styles.areaCard, !area.available && styles.unavailableCard]}>
            <CardContent style={styles.areaCardContent}>
                <View style={styles.areaCardLayout}>
                    <View style={styles.iconContainer}>
                        {getAreaIcon(area.icon)}
                    </View>
                    <View style={styles.areaCardBody}>
                        <View style={styles.areaCardHeader}>
                            <Text style={styles.areaTitle}>{area.name}</Text>
                            <Text style={styles.areaPrice}>{area.price}</Text>
                        </View>
                        <Text style={styles.areaDescription}>{area.description}</Text>
                        {!area.available && (
                            <Badge variant="danger" style={styles.unavailableBadge}>
                                Indisponível
                            </Badge>
                        )}
                        <View style={styles.rulesContainer}>
                            {area.rules.map((rule: string, index: number) => (
                                <Badge key={index} variant="outline" style={styles.ruleBadge}>
                                    {rule}
                                </Badge>
                            ))}
                        </View>
                        <Button 
                            disabled={!area.available} 
                            onPress={onReserve}
                            style={styles.reserveButton}
                        >
                            <Plus size={18} color="white" style={styles.buttonIcon} />
                            <Text style={styles.reserveButtonText}>Reservar</Text>
                        </Button>
                    </View>
                </View>
            </CardContent>
        </Card>
    );
};

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
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: 'long', 
            weekday: 'long' 
        });
    };
    
    const getStatusVariant = (status: string) => status === 'confirmed' ? 'success' : 'warning';

    return (
        <Card style={styles.reservationCard}>
            <CardContent style={styles.reservationCardContent}>
                <View style={styles.reservationHeader}>
                    <View style={styles.reservationInfo}>
                        <View style={styles.reservationTitleRow}>
                            <MapPin size={18} color="#2563eb" />
                            <Text style={styles.reservationTitle}>{reservation.area}</Text>
                        </View>
                        <View style={styles.reservationMetaContainer}>
                            <View style={styles.metaItem}>
                                <CalendarIcon size={16} color="#6b7280" />
                                <Text style={styles.metaText}>{formatDate(reservation.date)}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Clock size={16} color="#6b7280" />
                                <Text style={styles.metaText}>{reservation.time}</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.reservationActions}>
                        <Badge variant={getStatusVariant(reservation.status)} style={styles.statusBadge}>
                            {reservation.status === 'confirmed' ? 'Confirmada' : 'Pendente'}
                        </Badge>
                        <Button variant="outline" style={styles.cancelButton}>
                            <X size={16} color="#dc2626" style={styles.cancelIcon} />
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
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
    
    const markedDates = useMemo(() => {
        if (!selectedDate) return {};
        return {
            [selectedDate]: { selected: true, selectedColor: '#3b82f6', disableTouchEvent: true }
        };
    }, [selectedDate]);

    return (
        <Dialog open={visible} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reservar {area.name}</DialogTitle>
                </DialogHeader>
                <ScrollView style={styles.modalScrollView}>
                    <Text style={styles.modalLabel}>1. Selecione a data</Text>
                    <Card style={styles.calendarCard}>
                        <Calendar
                            onDayPress={day => setSelectedDate(day.dateString)}
                            markedDates={markedDates}
                            minDate={today}
                            theme={{
                                todayTextColor: '#3b82f6',
                                selectedDayBackgroundColor: '#3b82f6',
                                selectedDayTextColor: '#ffffff',
                                arrowColor: '#3b82f6',
                            }}
                        />
                    </Card>

                    {selectedDate && (
                        <>
                            <Text style={styles.modalLabel}>2. Selecione o horário</Text>
                            <View style={styles.pickerContainer}>
                                <Picker 
                                    selectedValue={selectedTime} 
                                    onValueChange={itemValue => setSelectedTime(itemValue)}
                                >
                                    {timeSlots.map(time => (
                                        <Picker.Item key={time} label={time} value={time} />
                                    ))}
                                </Picker>
                            </View>
                        </>
                    )}
                    
                    <View style={styles.modalActions}>
                        <Button 
                            variant="outline" 
                            onPress={onClose} 
                            style={styles.modalButton}
                        >
                            <Text style={styles.cancelModalText}>Cancelar</Text>
                        </Button>
                        <Button 
                            onPress={onClose} 
                            style={styles.modalButton}
                            disabled={!selectedDate || !selectedTime}
                        >
                            <Text style={styles.confirmButtonText}>Confirmar</Text>
                        </Button>
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
    <Card style={styles.emptyCard}>
        <CardContent style={styles.emptyContent}>
            <CalendarIcon size={56} color="#9ca3af" style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>Nenhuma reserva encontrada</Text>
            <Text style={styles.emptyDescription}>Você ainda não possui reservas ativas.</Text>
            <Button onPress={onAction} style={styles.emptyButton}>
                <Plus size={18} color="white" style={styles.buttonIcon} />
                <Text style={styles.emptyButtonText}>Fazer primeira reserva</Text>
            </Button>
        </CardContent>
    </Card>
);

