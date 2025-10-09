import { StyleSheet } from 'react-native';
export const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#f9fafb' 
  },
  container: { 
    padding: 20, 
    gap: 16, 
    paddingBottom: 40 
  },
  loadingText: { 
    padding: 20, 
    textAlign: 'center', 
    color: '#6b7280',
    fontSize: 15,
  },
  
  // Header
  headerContainer: { 
    marginBottom: 8,
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
  
  // Profile Card
  profileCard: { 
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: { 
    fontSize: 32, 
    fontWeight: '700',
    letterSpacing: 1,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  profileBody: {
    gap: 12,
  },
  userName: { 
    fontSize: 24, 
    fontWeight: '700', 
    color: '#111827',
    letterSpacing: -0.5,
  },
  profileDetails: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 15,
    color: '#4b5563',
    flex: 1,
  },

  // Section Card
  sectionCard: { 
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: '#111827',
    letterSpacing: -0.3,
    flex: 1,
  },
  sectionContent: { 
    padding: 20,
  },

  // Vehicles
  vehicleGrid: {
    gap: 10,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f9fafb',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  vehicleIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfo: {
    flex: 1,
    gap: 2,
  },
  vehiclePlate: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#111827',
    letterSpacing: 0.5,
  },
  vehicleModel: { 
    fontSize: 13, 
    color: '#6b7280',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyText: { 
    color: '#9ca3af', 
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Settings
  settingRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    gap: 16,
  },
  settingInfo: {
    flex: 1,
    gap: 4,
  },
  settingText: { 
    fontSize: 16, 
    color: '#111827', 
    fontWeight: '600',
  },
  settingDescription: { 
    fontSize: 13, 
    color: '#6b7280',
    lineHeight: 18,
  },
  
  // Action Button
  actionButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f9fafb',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },

  // Logout Button
  logoutButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fecaca',
    marginTop: 8,
  },
  logoutButtonText: { 
    color: '#ef4444', 
    fontWeight: '700',
    fontSize: 16,
  },
});