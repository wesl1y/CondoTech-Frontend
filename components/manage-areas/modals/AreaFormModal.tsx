// app/(app)/(tabs)/manage-reservations/components/modals/AreaFormModal.tsx
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import api from '@/services/api';
import { AlertCircle, Check, Edit, Plus, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';
import { COLORS, styles } from '../../../styles/common-area/styles';
import {
  AreaComumRequestPayload,
  AreaFormModalProps,
  Regra,
  TipoReserva,
  TiposReservaState
} from '../../types/types';
import {
  formatarTipoReserva,
  iconesDisponiveisNomes,
  renderIcon,
  tiposDeReserva
} from '../../utils/helpers';
import Checkbox from '../Checkbox';
import FormRulesSection from '../FormRulesSection';


const AreaFormModal: React.FC<AreaFormModalProps> = ({ visible, onClose, onSave, areaToEdit }) => {
  // Estados básicos
  const [nome, setNome] = useState<string>('');
  const [descricao, setDescricao] = useState<string>('');
  const [valorTaxa, setValorTaxa] = useState<string>('');
  const [icone, setIcone] = useState<string>(iconesDisponiveisNomes[0]);
  const [ativa, setAtiva] = useState<boolean>(true);
  const [tiposReserva, setTiposReserva] = useState<TiposReservaState>({ 
    POR_HORA: false, 
    POR_PERIODO: false, 
    DIARIA: false 
  });
  
  // Estados de controle
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [allRules, setAllRules] = useState<Regra[]>([]);
  const [selectedRuleIds, setSelectedRuleIds] = useState<Set<number>>(new Set());
  const [isLoadingRules, setIsLoadingRules] = useState<boolean>(true);
  const [expandedRuleId, setExpandedRuleId] = useState<number | null>(null);
  
  // Estados de validação e UX
  const [errors, setErrors] = useState<{
    nome?: string;
    tiposReserva?: string;
    valorTaxa?: string;
  }>({});
  const [showIconPicker, setShowIconPicker] = useState<boolean>(false);
  const [touched, setTouched] = useState<{
    nome?: boolean;
    tiposReserva?: boolean;
  }>({});
  
  useEffect(() => {
    if (visible) {
      fetchAllRules();
      if (areaToEdit) {
        setNome(areaToEdit.nome || '');
        setDescricao(areaToEdit.descricao || '');
        setValorTaxa(formatCurrency(areaToEdit.valorTaxa?.toString() || '0'));
        setIcone(areaToEdit.icone || iconesDisponiveisNomes[0]);
        setAtiva(areaToEdit.ativa);
        
        const tiposAtivos: TiposReservaState = { 
          POR_HORA: false, 
          POR_PERIODO: false, 
          DIARIA: false 
        };
        areaToEdit.tiposReservaDisponiveis?.forEach((tipo: TipoReserva) => {
          if (tipo in tiposAtivos) tiposAtivos[tipo] = true;
        });
        setTiposReserva(tiposAtivos);
        
        const initialRuleIds = new Set(areaToEdit.regras?.map(r => r.id) || []);
        setSelectedRuleIds(initialRuleIds);
      } else {
        resetForm();
      }
      setExpandedRuleId(null);
      setErrors({});
      setTouched({});
      setShowIconPicker(false);
    }
  }, [areaToEdit, visible]);

  const fetchAllRules = async () => {
    setIsLoadingRules(true);
    try {
      const rulesData = await api.get('/admin/regras');
      setAllRules(rulesData || []);
    } catch (error: any) {
      Alert.alert(
        "Erro ao Carregar Regras", 
        error.message || "Não foi possível buscar as regras disponíveis."
      );
      setAllRules([]);
    } finally {
      setIsLoadingRules(false);
    }
  };

  const resetForm = () => {
    setNome('');
    setDescricao('');
    setValorTaxa('');
    setIcone(iconesDisponiveisNomes[0]);
    setAtiva(true);
    setTiposReserva({ POR_HORA: false, POR_PERIODO: false, DIARIA: false });
    setSelectedRuleIds(new Set());
    setErrors({});
    setTouched({});
  };

  // Formatação de moeda em tempo real
  const formatCurrency = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    const amount = parseInt(numbers) / 100;
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleCurrencyChange = (text: string) => {
    const formatted = formatCurrency(text);
    setValorTaxa(formatted);
    validateField('valorTaxa', formatted);
  };

  // Validação em tempo real
  const validateField = (field: string, value: any) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'nome':
        if (!value || !value.trim()) {
          newErrors.nome = 'O nome da área é obrigatório';
        } else if (value.trim().length < 3) {
          newErrors.nome = 'O nome deve ter pelo menos 3 caracteres';
        } else {
          delete newErrors.nome;
        }
        break;
        
      case 'tiposReserva':
        const hasSelectedType = Object.values(value).some(v => v === true);
        if (!hasSelectedType) {
          newErrors.tiposReserva = 'Selecione pelo menos um tipo de reserva';
        } else {
          delete newErrors.tiposReserva;
        }
        break;
        
      case 'valorTaxa':
        if (!value) {
          delete newErrors.valorTaxa;
          break;
        }
        const numValue = parseFloat(value.replace(/\./g, '').replace(',', '.'));
        if (isNaN(numValue) || numValue < 0) {
          newErrors.valorTaxa = 'Valor inválido';
        } else {
          delete newErrors.valorTaxa;
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNomeChange = (text: string) => {
    setNome(text);
    if (touched.nome) {
      validateField('nome', text);
    }
  };

  const handleNomeBlur = () => {
    setTouched(prev => ({ ...prev, nome: true }));
    validateField('nome', nome);
  };

  const handleCheckboxChange = (tipo: keyof TiposReservaState): void => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newTipos = { ...tiposReserva, [tipo]: !tiposReserva[tipo] };
    setTiposReserva(newTipos);
    
    if (touched.tiposReserva) {
      validateField('tiposReserva', newTipos);
    }
  };

  const handleTiposReservaTouch = () => {
    if (!touched.tiposReserva) {
      setTouched(prev => ({ ...prev, tiposReserva: true }));
      validateField('tiposReserva', tiposReserva);
    }
  };

  const handleRuleSelectionChange = (ruleId: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedRuleIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ruleId)) newSet.delete(ruleId);
      else newSet.add(ruleId);
      return newSet;
    });
  };

  const handleIconSelect = (selectedIcon: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIcone(selectedIcon);
    setShowIconPicker(false);
  };

  const handleSubmit = async (): Promise<void> => {
    // Marca todos os campos como tocados
    setTouched({ nome: true, tiposReserva: true });
    
    // Valida todos os campos
    const isNomeValid = validateField('nome', nome);
    const isTiposValid = validateField('tiposReserva', tiposReserva);
    const isValorValid = validateField('valorTaxa', valorTaxa);
    
    if (!isNomeValid || !isTiposValid || !isValorValid) {
      Alert.alert(
        "Campos Inválidos", 
        "Por favor, corrija os erros antes de continuar."
      );
      return;
    }
    
    const tiposReservaDisponiveis = (Object.keys(tiposReserva) as TipoReserva[])
      .filter(key => tiposReserva[key as keyof TiposReservaState]);
    
    setIsSubmitting(true);
    
    const valorNumerico = valorTaxa 
      ? parseFloat(valorTaxa.replace(/\./g, '').replace(',', '.'))
      : 0.0;
    
    const payload: AreaComumRequestPayload = {
      nome: nome.trim(),
      descricao: descricao.trim(),
      icone,
      ativa,
      valorTaxa: valorNumerico,
      tiposReservaDisponiveis,
      regraIds: Array.from(selectedRuleIds),
      condominioId: 1,
    };

    try {
      if (areaToEdit) {
        await api.put(`/admin/areas-comuns/${areaToEdit.id}`, payload);
        Alert.alert("Sucesso", "Área comum atualizada com sucesso!");
      } else {
        await api.post('/admin/areas-comuns', payload);
        Alert.alert("Sucesso", "Área comum criada com sucesso!");
      }
      onSave();
    } catch (error: any) {
      console.error('❌ Erro ao salvar área:', error);
      Alert.alert("Erro", error.message || 'Não foi possível salvar a área comum');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRuleExpansion = (ruleId: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedRuleId(prev => prev === ruleId ? null : ruleId);
  };

  const toggleIconPicker = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowIconPicker(!showIconPicker);
  };
  
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.formModalContent}>
          <FormModalHeader 
            isEditing={!!areaToEdit}
            selectedIcon={icone}
            onClose={onClose}
          />
        
          <ScrollView 
            style={styles.formScroll} 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.formScrollContent}
          >
            {/* Informações Básicas */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Informações Básicas</Text>
              
              {/* Nome */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Nome da Área <Text style={styles.required}>*</Text>
                </Text>
                <Input 
                  value={nome} 
                  onChangeText={handleNomeChange}
                  onBlur={handleNomeBlur}
                  placeholder="Ex: Salão de Festas" 
                  style={[
                    styles.formInput,
                    errors.nome && touched.nome && formStyles.formInputError
                  ]} 
                  placeholderTextColor={COLORS.textTertiary}
                />
                {errors.nome && touched.nome && (
                  <View style={formStyles.errorContainer}>
                    <AlertCircle size={14} color={COLORS.danger} />
                    <Text style={formStyles.errorText}>{errors.nome}</Text>
                  </View>
                )}
              </View>

              {/* Descrição */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Descrição</Text>
                <Textarea 
                  value={descricao} 
                  onChangeText={setDescricao} 
                  placeholder="Breve descrição da área..." 
                  style={styles.formTextarea} 
                  numberOfLines={3} 
                  placeholderTextColor={COLORS.textTertiary}
                  maxLength={200}
                />
                <Text style={formStyles.characterCount}>
                  {descricao.length}/200 caracteres
                </Text>
              </View>

              <View style={styles.formRow}>
                {/* Taxa */}
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Taxa de Reserva</Text>
                  <View style={formStyles.currencyInputContainer}>
                    <Text style={formStyles.currencySymbol}>R$</Text>
                    <Input 
                      value={valorTaxa} 
                      onChangeText={handleCurrencyChange} 
                      placeholder="0,00" 
                      keyboardType="numeric" 
                      style={formStyles.currencyInput} 
                      placeholderTextColor={COLORS.textTertiary}
                    />
                  </View>
                  {errors.valorTaxa && (
                    <Text style={formStyles.errorTextSmall}>{errors.valorTaxa}</Text>
                  )}
                </View>

                {/* Ícone */}
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Ícone</Text>
                  <TouchableOpacity
                    style={formStyles.iconPickerButton}
                    onPress={toggleIconPicker}
                    activeOpacity={0.7}
                  >
                    <View style={formStyles.iconPickerPreview}>
                      {renderIcon(icone)}
                    </View>
                    <Text style={formStyles.iconPickerText} numberOfLines={1}>
                      {icone}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Seletor de Ícones Expansível */}
              {showIconPicker && (
                <View style={formStyles.iconPickerContainer}>
                  <View style={formStyles.iconPickerHeader}>
                    <Text style={formStyles.iconPickerTitle}>Escolha um ícone</Text>
                    <TouchableOpacity
                      onPress={toggleIconPicker}
                      style={formStyles.iconPickerClose}
                    >
                      <X size={18} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <ScrollView 
                    style={formStyles.iconGrid}
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={formStyles.iconGridContent}>
                      {iconesDisponiveisNomes.map((iconName: string) => (
                        <TouchableOpacity
                          key={iconName}
                          style={[
                            formStyles.iconOption,
                            icone === iconName && formStyles.iconOptionSelected
                          ]}
                          onPress={() => handleIconSelect(iconName)}
                          activeOpacity={0.7}
                        >
                          <View style={formStyles.iconOptionIcon}>
                            {renderIcon(iconName)}
                          </View>
                          {icone === iconName && (
                            <View style={formStyles.iconSelectedBadge}>
                              <Check size={12} color={COLORS.white} />
                            </View>
                          )}
                          <Text 
                            style={[
                              formStyles.iconOptionText,
                              icone === iconName && formStyles.iconOptionTextSelected
                            ]}
                            numberOfLines={2}
                            adjustsFontSizeToFit
                          >
                            {iconName}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Tipos de Reserva */}
            <View style={styles.formSection}>
              <View style={formStyles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>
                  Tipos de Reserva <Text style={styles.required}>*</Text>
                </Text>
                {Object.values(tiposReserva).filter(Boolean).length > 0 && (
                  <View style={formStyles.selectedCountBadge}>
                    <Text style={formStyles.selectedCountText}>
                      {Object.values(tiposReserva).filter(Boolean).length} selecionado(s)
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.checkboxGroup} onTouchEnd={handleTiposReservaTouch}>
                {tiposDeReserva.map((tipo: TipoReserva) => (
                  <Checkbox 
                    key={tipo} 
                    label={formatarTipoReserva(tipo)} 
                    checked={tiposReserva[tipo]} 
                    onChange={() => handleCheckboxChange(tipo)} 
                  />
                ))}
              </View>
              {errors.tiposReserva && touched.tiposReserva && (
                <View style={formStyles.errorContainer}>
                  <AlertCircle size={14} color={COLORS.danger} />
                  <Text style={formStyles.errorText}>{errors.tiposReserva}</Text>
                </View>
              )}
            </View>

            {/* Regras */}
            <View style={styles.formSection}>
              <View style={formStyles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Regras da Área</Text>
                {selectedRuleIds.size > 0 && (
                  <View style={formStyles.selectedCountBadge}>
                    <Text style={formStyles.selectedCountText}>
                      {selectedRuleIds.size} selecionada(s)
                    </Text>
                  </View>
                )}
              </View>
              <FormRulesSection
                isLoading={isLoadingRules}
                allRules={allRules}
                selectedRuleIds={selectedRuleIds}
                expandedRuleId={expandedRuleId}
                onRuleSelect={handleRuleSelectionChange}
                onRuleToggleExpand={toggleRuleExpansion}
              />
            </View>

            {/* Status */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Status da Área</Text>
              <View style={styles.statusCard}>
                <View style={styles.statusInfo}>
                  <Text style={styles.statusLabel}>Área Ativa</Text>
                  <Text style={styles.statusDescription}>
                    {ativa ? 'Disponível para reservas' : 'Temporariamente indisponível'}
                  </Text>
                </View>
                <Switch 
                  value={ativa} 
                  onValueChange={setAtiva} 
                  trackColor={{ false: '#cbd5e1', true: COLORS.success }} 
                  thumbColor={COLORS.white}
                />
              </View>
            </View>
          </ScrollView>
        
          <FormModalFooter 
            isSubmitting={isSubmitting}
            isEditing={!!areaToEdit}
            onCancel={onClose}
            onSubmit={handleSubmit}
          />
        </View>
      </View>
    </Modal>
  );
};

// Sub-componentes
interface FormModalHeaderProps {
  isEditing: boolean;
  selectedIcon: string;
  onClose: () => void;
}

const FormModalHeader: React.FC<FormModalHeaderProps> = ({ 
  isEditing, 
  selectedIcon, 
  onClose 
}) => {
  return (
    <View style={styles.formModalHeader}>
      <View style={styles.formHeaderLeft}>
        <View style={styles.formHeaderIcon}>
          {renderIcon(selectedIcon)}
        </View>
        <View>
          <Text style={styles.formModalTitle}>
            {isEditing ? 'Editar Área' : 'Nova Área'}
          </Text>
          <Text style={styles.formModalSubtitle}>
            {isEditing ? 'Atualize as informações da área' : 'Cadastre uma nova área comum'}
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={onClose} style={styles.formCloseButton} activeOpacity={0.7}>
        <X size={24} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

interface FormModalFooterProps {
  isSubmitting: boolean;
  isEditing: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

const FormModalFooter: React.FC<FormModalFooterProps> = ({ 
  isSubmitting, 
  isEditing, 
  onCancel, 
  onSubmit 
}) => (
  <View style={styles.formModalFooter}>
    <TouchableOpacity 
      onPress={onCancel} 
      style={styles.formCancelButton} 
      disabled={isSubmitting} 
      activeOpacity={0.7}
    >
      <Text style={styles.formCancelButtonText}>Cancelar</Text>
    </TouchableOpacity>

    <TouchableOpacity 
      onPress={onSubmit} 
      style={[
        styles.formSaveButton, 
        isSubmitting && styles.formSaveButtonDisabled
      ]} 
      disabled={isSubmitting} 
      activeOpacity={0.8}
    >
      {isSubmitting ? (
        <ActivityIndicator color="white" size="small" />
      ) : (
        <>
          {isEditing ? (
            <Edit size={18} color={COLORS.white} />
          ) : (
            <Plus size={18} color={COLORS.white} />
          )}
          <Text style={styles.formSaveButtonText}>
            {isEditing ? 'Salvar Alterações' : 'Criar Área'}
          </Text>
        </>
      )}
    </TouchableOpacity>
  </View>
);

// Estilos específicos do formulário melhorado
const formStyles = StyleSheet.create({
  formInputError: {
    borderColor: COLORS.danger,
    borderWidth: 1.5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '500',
  },
  errorTextSmall: {
    fontSize: 11,
    color: COLORS.danger,
    fontWeight: '500',
    marginTop: 4,
  },
  characterCount: {
    fontSize: 11,
    color: COLORS.textTertiary,
    textAlign: 'right',
    marginTop: 4,
  },
  currencyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    paddingLeft: 12,
    height: 48,
  },
  currencySymbol: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  currencyInput: {
    flex: 1,
    borderWidth: 0,
    paddingLeft: 0,
    height: 48,
  },
  iconPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    height: 48,
  },
  iconPickerPreview: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPickerText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  iconPickerContainer: {
    marginTop: 12,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    maxHeight: 300,
  },
  iconPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iconPickerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  iconPickerClose: {
    padding: 4,
  },
  iconGrid: {
    maxHeight: 240,
  },
  iconGridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
  },
  iconOption: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconOptionSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  iconOptionIcon: {
    marginBottom: 4,
  },
  iconSelectedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    backgroundColor: COLORS.primary,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconOptionText: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  iconOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedCountBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default AreaFormModal;