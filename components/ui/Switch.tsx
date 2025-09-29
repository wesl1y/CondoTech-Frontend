// Location: components/ui/Switch.tsx

import React from 'react';
import { Switch as RNSwitch, SwitchProps } from 'react-native';

export function Switch(props: SwitchProps) {
  return (
    <RNSwitch
      trackColor={{ false: '#767577', true: '#2563eb' }}
      thumbColor={props.value ? '#f4f3f4' : '#f4f3f4'}
      ios_backgroundColor="#3e3e3e"
      {...props}
    />
  );
}