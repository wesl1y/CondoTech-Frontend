import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    
    safeArea: { 
        flex: 1, 
        backgroundColor: '#f3f4f6' 
    },
    
    // Header
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 20,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: { 
        fontSize: 32, 
        fontWeight: 'bold', 
        color: '#1e3a8a',
        marginBottom: 4,
        lineHeight: 38,
    },
    headerSubtitle: { 
        fontSize: 16, 
        color: '#6b7280',
        lineHeight: 22,
    },
    unreadBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    
    // Filtros
    filterSection: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    filterContainer: { 
        paddingHorizontal: 20, 
        paddingVertical: 16,
        gap: 10,
    },
    filterButton: {
        paddingHorizontal: 20, 
        paddingVertical: 10,
        height: 'auto',
    },
    filterButtonText: {
        fontWeight: '600',
        color: '#374151',
        fontSize: 15,
    },
    filterButtonTextActive: {
        color: 'white',
    },
    
    // Lista
    list: { 
        padding: 20,
        paddingBottom: 32,
    },
    emptyContainer: {
        paddingVertical: 60,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#9ca3af',
        fontWeight: '500',
    },
    
    // Card de Notificação
    notificationCard: { 
        borderWidth: 1, 
        borderColor: '#e5e7eb', 
        borderLeftWidth: 4,
        marginBottom: 16,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        backgroundColor: '#fff',
    },
    unreadCard: {
        backgroundColor: '#eff6ff',
        borderColor: '#bfdbfe',
    },
    cardContent: { 
        padding: 16, 
        flexDirection: 'row', 
        alignItems: 'flex-start',
        gap: 14,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    typeEmoji: {
        fontSize: 20,
    },
    cardBody: {
        flex: 1,
        gap: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
    },
    cardTitle: { 
        fontSize: 17, 
        fontWeight: '600', 
        color: '#111827',
        flex: 1,
        lineHeight: 22,
    },
    cardTitleUnread: {
        color: '#1e40af',
        fontWeight: '700',
    },
    chevron: {
        marginTop: 2,
    },
    cardDescription: { 
        fontSize: 15, 
        color: '#4b5563', 
        lineHeight: 21,
    },
    cardFooter: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: 4,
        flexWrap: 'wrap',
        gap: 10,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    cardDate: { 
        fontSize: 13, 
        color: '#6b7280',
        fontWeight: '500',
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },

    // Modal
    modalScrollView: {
        marginVertical: 20,
    },
    modalDescription: { 
        fontSize: 16, 
        color: '#374151', 
        lineHeight: 24,
    },
    markReadButton: {
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 12,
    },
    buttonIcon: {
        marginRight: 22,
    },
    markReadButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 15,
    },
});