// app/(app)/(tabs)/manage-reservations/components/RuleItem.tsx
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { COLORS, styles } from '../../styles/common-area/styles';
import { RuleItemProps } from '../types/types';

const RuleItem: React.FC<RuleItemProps> = ({ regra, isLast }) => {
  const [expanded, setExpanded] = useState(false);
  const hasDescription = regra.descricao && regra.descricao.trim().length > 0;

  return (
    <View style={[styles.detailRuleCard, isLast && styles.detailRuleCardLast]}>
      <TouchableOpacity 
        style={styles.detailRuleHeader}
        onPress={() => hasDescription && setExpanded(!expanded)}
        activeOpacity={hasDescription ? 0.7 : 1}
        disabled={!hasDescription}
      >
        <View style={styles.detailRuleHeaderContent}>
          <Text style={styles.detailRuleBullet}>•</Text>
          <Text style={styles.detailRuleTitle}>{regra.titulo}</Text>
        </View>
        {hasDescription && (
          <View style={styles.detailRuleIconContainer}>
            {expanded ? (
              <ChevronUp size={18} color={COLORS.primary} />
            ) : (
              <ChevronDown size={18} color={COLORS.textSecondary} />
            )}
          </View>
        )}
      </TouchableOpacity>

      {expanded && hasDescription && (
        <View style={styles.detailRuleDescription}>
          <View style={styles.detailRuleDescriptionDivider} />
          <Text style={styles.detailRuleDescriptionText}>{regra.descricao}</Text>
        </View>
      )}
    </View>
  );
};

export default RuleItem;