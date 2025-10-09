import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: '#f3f4f6' 
    },
    
    // Header
    header: { 
        padding: 20,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
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
    
    // Tabs
    tabsContainer: { 
        flexDirection: 'row', 
        backgroundColor: '#e5e7eb', 
        margin: 20,
        marginBottom: 16,
        borderRadius: 12, 
        padding: 4,
    },
    tab: { 
        flex: 1, 
        paddingVertical: 12,
        borderRadius: 10,
    },
    activeTab: { 
        backgroundColor: 'white', 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 4, 
        elevation: 3,
    },
    tabText: { 
        textAlign: 'center', 
        color: '#6b7280', 
        fontWeight: '600',
        fontSize: 15,
    },
    activeTabText: { 
        color: '#1e3a8a',
    },
    
    // List
    list: { 
        paddingHorizontal: 20,
        paddingBottom: 32,
    },
    
    // Area Card
    areaCard: {
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    unavailableCard: {
        opacity: 0.65,
    },
    areaCardContent: { 
        padding: 20,
    },
    areaCardLayout: {
        flexDirection: 'row',
        gap: 16,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    areaCardBody: {
        flex: 1,
        gap: 12,
    },
    areaCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    areaTitle: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        color: '#111827',
        lineHeight: 26,
    },
    areaPrice: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: '#3b82f6',
    },
    areaDescription: { 
        fontSize: 15, 
        color: '#6b7280',
        lineHeight: 21,
    },
    unavailableBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    rulesContainer: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        gap: 8,
    },
    ruleBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    reserveButton: {
        marginTop: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
    },
    buttonIcon: {
        marginRight: 2,
    },
    reserveButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 15,
    },
    
    // Reservation Card
    reservationCard: {
        marginBottom: 16,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    reservationCardContent: {
        padding: 16,
    },
    reservationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
    },
    reservationInfo: {
        flex: 1,
        gap: 10,
    },
    reservationTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    reservationTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    reservationMetaContainer: {
        gap: 8,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: { 
        fontSize: 14, 
        color: '#6b7280',
        fontWeight: '500',
    },
    reservationActions: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 10,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    cancelButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderColor: '#fecaca',
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    cancelIcon: {
        marginRight: 2,
    },
    cancelButtonText: {
        color: '#dc2626',
        fontSize: 13,
        fontWeight: '600',
    },
    
    // Modal
    modalScrollView: {
        marginVertical: 20,
    },
    modalLabel: { 
        fontSize: 16, 
        fontWeight: '600', 
        color: '#374151',
        marginBottom: 12,
        marginTop: 8,
    },
    calendarCard: {
        marginBottom: 16,
        overflow: 'hidden',
    },
    pickerContainer: { 
        borderWidth: 1, 
        borderColor: '#d1d5db', 
        borderRadius: 12,
        backgroundColor: '#fff',
        overflow: 'hidden',
        marginBottom: 16,
    },
    modalActions: { 
        flexDirection: 'row', 
        gap: 12,
        marginTop: 24,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
    },
    cancelModalText: {
        color: '#374151',
        fontWeight: '600',
        fontSize: 15,
    },
    confirmButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
    
    // Empty State
    emptyCard: {
        marginTop: 40,
    },
    emptyContent: { 
        alignItems: 'center',
        padding: 32,
        gap: 12,
    },
    emptyIcon: {
        marginBottom: 8,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    emptyDescription: {
        fontSize: 15,
        color: '#6b7280',
        textAlign: 'center',
    },
    emptyButton: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    emptyButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 15,
    },
});