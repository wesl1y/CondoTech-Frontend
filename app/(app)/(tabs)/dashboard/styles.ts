import { StyleSheet } from 'react-native';

export const colors = {
    blue: { bg: '#eff6ff', border: '#bfdbfe', value: '#1e40af', label: '#2563eb'},
    green: { bg: '#f0fdf4', border: '#bbf7d0', value: '#166534', label: '#16a34a'},
    orange: { bg: '#fff7ed', border: '#fed7aa', value: '#9a3412', label: '#ea580c'},
    purple: { bg: '#f5f3ff', border: '#ddd6fe', value: '#6d28d9', label: '#9333ea'},
};

export const styles = StyleSheet.create({
    safeArea: { 
      flex: 1, 
      backgroundColor: '#f3f4f6' 
    },
    container: { 
      padding: 20, 
      paddingBottom: 32 
    },
    
    // Header
    header: { 
      marginBottom: 24,
      paddingHorizontal: 4,
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
    
    // Quick Stats Grid
    quickStatsGrid: { 
      flexDirection: 'row', 
      flexWrap: 'wrap', 
      justifyContent: 'space-between', 
      gap: 12,
      marginBottom: 24,
    },
    statCardWrapper: {
      width: '48%',
    },
    statCard: { 
      flex: 1,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    statCardContent: { 
      padding: 20, 
      alignItems: 'center', 
      gap: 8,
    },
    statIconContainer: {
      marginBottom: 4,
    },
    statCardValue: { 
      fontSize: 32, 
      fontWeight: 'bold',
      lineHeight: 38,
    },
    statCardLabel: { 
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'center',
    },
    
    // Section Cards
    sectionCard: {
      marginBottom: 20,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    cardHeader: { 
      paddingTop: 16,
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
    },
    cardHeaderContent: {
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 10,
    },
    cardTitle: { 
      fontSize: 18, 
      fontWeight: '600',
      color: '#111827',
      lineHeight: 24,
    },
    cardContent: { 
      padding: 16,
    },
    
    // Notifications
    notificationItem: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 12, 
      padding: 14,
      backgroundColor: '#f9fafb',
      borderRadius: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: '#e5e7eb',
    },
    unreadIndicator: { 
      width: 10, 
      height: 10, 
      borderRadius: 5,
    },
    notificationContent: {
      flex: 1,
      gap: 4,
    },
    notificationTitle: { 
      color: '#111827', 
      fontWeight: '500',
      fontSize: 15,
      lineHeight: 20,
    },
    notificationTime: { 
      fontSize: 13, 
      color: '#6b7280',
    },
    newBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    
    // List Items (Reservations & Issues)
    listItem: {
      flexDirection: 'row', 
      alignItems: 'flex-start', 
      gap: 14, 
      padding: 14,
      borderRadius: 10,
      marginBottom: 10,
      borderWidth: 1,
    },
    reservationItem: {
      backgroundColor: '#f0fdf4',
      borderColor: '#bbf7d0',
    },
    issueItem: {
      backgroundColor: '#fff7ed',
      borderColor: '#fed7aa',
    },
    listIconContainer: {
      marginTop: 2,
    },
    listItemContent: {
      flex: 1,
      gap: 6,
    },
    listItemTitle: { 
      color: '#111827', 
      fontWeight: '600',
      fontSize: 15,
      lineHeight: 20,
    },
    listItemSubtitle: { 
      fontSize: 13, 
      color: '#6b7280',
      lineHeight: 18,
    },
    badgesContainer: { 
      flexDirection: 'row', 
      gap: 8,
      flexWrap: 'wrap',
      marginTop: 2,
    },
    issueBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    
    // Quick Actions
    quickActionsContent: { 
      flexDirection: 'row', 
      gap: 12,
      padding: 16,
    },
    quickActionButton: { 
      flex: 1, 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
      paddingHorizontal: 12,
      gap: 10,
      minHeight: 100,
    },
    actionIcon: {
      marginBottom: 4,
    },
    quickActionText: { 
      fontSize: 13, 
      color: '#374151', 
      textAlign: 'center',
      fontWeight: '500',
      lineHeight: 18,
    },
});