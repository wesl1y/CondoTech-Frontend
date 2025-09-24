import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import Login from './src/pages/login';
import ForgotPassword from './src/pages/forgotPassword'

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      
      {/* 4. O Stack.Navigator controla qual tela está visível */}
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{ headerShown: false }} // Oculta o cabeçalho padrão
      >
        {/* 5. Cada Stack.Screen é uma tela do seu app */}
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}