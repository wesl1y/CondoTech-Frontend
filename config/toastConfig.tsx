// Localização: config/toastConfig.tsx

import { AlertCircle, CheckCircle, Info } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

/*
  Aqui, definimos nossos próprios componentes para cada tipo de toast.
  A biblioteca nos passa as props `text1` e `text2` que definimos no `Toast.show()`.
*/

const toastConfig = {
  // Override o tipo 'success'
  success: ({ text1, text2 }: { text1?: string, text2?: string }) => (
    <View style={[styles.base, styles.success]}>
      <CheckCircle color="white" size={28} style={styles.icon} />
      <View style={styles.content}>
        <Text style={styles.text1}>{text1}</Text>
        {text2 && <Text style={styles.text2}>{text2}</Text>}
      </View>
    </View>
  ),

  // Override o tipo 'error'
  error: ({ text1, text2 }: { text1?: string, text2?: string }) => (
    <View style={[styles.base, styles.error]}>
      <AlertCircle color="white" size={28} style={styles.icon} />
      <View style={styles.content}>
        <Text style={styles.text1}>{text1}</Text>
        {text2 && <Text style={styles.text2}>{text2}</Text>}
      </View>
    </View>
  ),
  
  // Você também pode criar seus próprios tipos!
  info: ({ text1, text2 }: { text1?: string, text2?: string }) => (
    <View style={[styles.base, styles.info]}>
      <Info color="white" size={28} style={styles.icon} />
      <View style={styles.content}>
        <Text style={styles.text1}>{text1}</Text>
        {text2 && <Text style={styles.text2}>{text2}</Text>}
      </View>
    </View>
  ),
};

// Nossos estilos personalizados para os toasts
const styles = StyleSheet.create({
  base: {
    // AQUI VOCÊ DEIXA ELE MAIOR
    minHeight: 80, // Altura mínima maior
    width: '90%',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10, // Padding vertical maior
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  icon: {
    marginRight: 15,
  },
  text1: {
    // Fonte do título maior
    fontSize: 17,
    fontWeight: 'bold',
    color: 'white',
  },
  text2: {
    // Fonte do subtítulo maior
    fontSize: 15,
    color: 'white',
    marginTop: 4,
  },
  // Cores para cada tipo
  success: {
    backgroundColor: '#16a34a', // Verde
  },
  error: {
    backgroundColor: '#dc2626', // Vermelho
  },
  info: {
    backgroundColor: '#2563eb', // Azul
  },
});

export { toastConfig };
