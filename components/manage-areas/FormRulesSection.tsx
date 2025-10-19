// app/(app)/(tabs)/manage-reservations/components/FormRulesSection.tsx
import { ChevronDown, ChevronUp, Info } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, styles } from '../../styles/common-area/styles';
import { Regra } from '../types/types';

interface FormRulesSectionProps {
  isLoading: boolean;
  allRules: Regra[];
  selectedRuleIds: Set<number>;
  expandedRuleId: number | null;
  onRuleSelect: (ruleId: number) => void;
  onRuleToggleExpand: (ruleId: number) => void;
}

const FormRulesSection: React.FC<FormRulesSectionProps> = ({
  isLoading,
  allRules,
  selectedRuleIds,
  expandedRuleId,
  onRuleSelect,
  onRuleToggleExpand,
}) => {
  return (
    <View style={styles.formSection}>
      <View style={styles.detailSectionHeaderWithInfo}>
        <Text style={styles.sectionTitle}>Regras de Uso</Text>
        {allRules.length > 0 && (
          <View style={styles.detailInfoBadge}>
            <Info size={10} color={COLORS.primary} />
            <Text style={styles.detailInfoTextSmall}>Toque para ver descrição</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
      ) : allRules.length > 0 ? (
        <View style={styles.formRulesContainer}>
          {allRules.map(rule => {
            const isSelected = selectedRuleIds.has(rule.id);
            const isExpanded = expandedRuleId === rule.id;
            const hasDescription = rule.descricao && rule.descricao.trim().length > 0;

            return (
              <View key={rule.id} style={styles.formRuleCard}>
                <View style={styles.formRuleMainRow}>
                  <TouchableOpacity 
                    style={styles.formRuleCheckboxRow}
                    onPress={() => onRuleSelect(rule.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={[styles.formRuleTitle, isSelected && styles.formRuleTitleSelected]}>
                      {rule.titulo}
                    </Text>
                  </TouchableOpacity>

                  {hasDescription && (
                    <TouchableOpacity 
                      style={styles.formRuleExpandButton}
                      onPress={() => onRuleToggleExpand(rule.id)}
                      activeOpacity={0.7}
                    >
                      {isExpanded ? (
                        <ChevronUp size={18} color={COLORS.primary} />
                      ) : (
                        <ChevronDown size={18} color={COLORS.textSecondary} />
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {isExpanded && hasDescription && (
                  <View style={styles.formRuleDescription}>
                    <View style={styles.formRuleDescriptionDivider} />
                    <Text style={styles.formRuleDescriptionText}>{rule.descricao}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.emptySubtext}>
          Nenhuma regra cadastrada no sistema. Crie-as primeiro no painel de regras.
        </Text>
      )}
    </View>
  );
};

export default FormRulesSection;