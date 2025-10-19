import { StyleSheet } from "react-native";


export const styles = StyleSheet.create({
     modalActionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    actionButton: {
        flex: 1,
        height: 48,
        borderRadius: 10,
    },
    deleteButton: {
        backgroundColor: '#fee2e2', // Fundo vermelho claro para o botão de excluir
    },
    editButton: {
        backgroundColor: '#dbeafe', // Fundo azul claro para o botão de editar
    },
    actionButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1f2937' // Cor do texto mais escura para contraste
    },


    saveButtonText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '600',
    },
    safeArea: { 
        flex: 1, 
        backgroundColor: '#f9fafb' 
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: '#6b7280',
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
    },
    picker: {
        height: 50,
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
    errorContainer: {
        margin: 20,
        padding: 16,
        backgroundColor: '#fee2e2',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    errorText: {
        color: '#dc2626',
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '500',
    },
    retryText: {
        color: '#2563eb',
        fontSize: 14,
        fontWeight: '600',
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
        maxHeight: 500,
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
        gap: 10,
        backgroundColor: '#eff6ff',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    vehicleInfo: {
        flex: 1,
    },
    vehicleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e40af',
    },
    vehicleSubtext: {
        fontSize: 12,
        color: '#3b82f6',
        marginTop: 2,
    },
    notesText: {
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 20,
        backgroundColor: '#f9fafb',
        padding: 12,
        borderRadius: 8,
    },
    deleteButtonText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '600',
    },
    formContainer: {
        maxHeight: 500,
    },
    formInput: {
        height: 48,
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        marginBottom: 12,
        fontSize: 15,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    formPickerContainer: {
        marginBottom: 12,
    },
    formLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    formButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    cancelButton: {
        flex: 1,
        height: 48,
        borderRadius: 10,
        backgroundColor: '#f3f4f6',
    },
    cancelButtonText: {
        color: '#374151',
        fontSize: 15,
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        height: 48,
        borderRadius: 10,
        backgroundColor: '#3b82f6',
    },
});