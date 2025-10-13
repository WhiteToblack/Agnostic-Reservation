import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import SignInScreen from '../screens/Auth/SignInScreen';
import SignUpScreen from '../screens/Auth/SignUpScreen';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import AgendaScreen from '../screens/Reservations/AgendaScreen';
import AdminScreen from '../screens/Admin/AdminScreen';
import { useTheme } from '../theme/ThemeProvider';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

const AppTabs = () => (
  <Tab.Navigator>
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Reservations" component={AgendaScreen} />
    <Tab.Screen name="Admin" component={AdminScreen} />
  </Tab.Navigator>
);

const AppNavigator: React.FC = () => {
  const { mode } = useTheme();
  return (
    <NavigationContainer theme={mode === 'dark' ? DarkTheme : DefaultTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="SignIn" component={SignInScreen} />
        <RootStack.Screen name="SignUp" component={SignUpScreen} />
        <RootStack.Screen name="Main" component={AppTabs} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
