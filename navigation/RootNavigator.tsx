import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../lib/types';
import { useApp } from '../context/AppContext';
import { colors } from '../lib/theme';
import { AppShell } from '../components/layout/AppShell';
import LoginScreen from '../screens/LoginScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import DashboardScreen from '../screens/DashboardScreen';
import LiveMonitorScreen from '../screens/LiveMonitorScreen';
import RoadMapScreen from '../screens/RoadMapScreen';
import IncidentsScreen from '../screens/IncidentsScreen';
import IncidentDetailsScreen from '../screens/IncidentDetailsScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import DuplicateScreen from '../screens/DuplicateScreen';
import ComplaintsScreen from '../screens/ComplaintsScreen';
import ComplaintDetailsScreen from '../screens/ComplaintDetailsScreen';
import CamerasScreen from '../screens/CamerasScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MenuScreen from '../screens/MenuScreen';
import EvidencePlayerScreen from '../screens/EvidencePlayerScreen';
import UploadEvidenceScreen from '../screens/UploadEvidenceScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.text,
  },
};

function withShell<P extends object>(Component: React.ComponentType<P>) {
  return function Wrapped(props: P) {
    return (
      <AppShell>
        <Component {...props} />
      </AppShell>
    );
  };
}

const Home = withShell(DashboardScreen);
const Live = withShell(LiveMonitorScreen);
const Map = withShell(RoadMapScreen);
const Incidents = withShell(IncidentsScreen);
const IncidentDetails = withShell(IncidentDetailsScreen);
const Privacy = withShell(PrivacyScreen);
const Duplicate = withShell(DuplicateScreen);
const Complaints = withShell(ComplaintsScreen);
const ComplaintDetails = withShell(ComplaintDetailsScreen);
const Cameras = withShell(CamerasScreen);
const Analytics = withShell(AnalyticsScreen);
const Reports = withShell(ReportsScreen);
const Settings = withShell(SettingsScreen);
const Menu = withShell(MenuScreen);
const EvidencePlayer = withShell(EvidencePlayerScreen);
const UploadEvidence = withShell(UploadEvidenceScreen);

function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: colors.bg },
      }}
      initialRouteName="Home"
    >
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="Live" component={Live} />
      <Stack.Screen name="Map" component={Map} />
      <Stack.Screen name="Incidents" component={Incidents} />
      <Stack.Screen name="IncidentDetails" component={IncidentDetails} />
      <Stack.Screen name="Privacy" component={Privacy} />
      <Stack.Screen name="Duplicate" component={Duplicate} />
      <Stack.Screen name="Complaints" component={Complaints} />
      <Stack.Screen name="ComplaintDetails" component={ComplaintDetails} />
      <Stack.Screen name="Cameras" component={Cameras} />
      <Stack.Screen name="Analytics" component={Analytics} />
      <Stack.Screen name="Reports" component={Reports} />
      <Stack.Screen name="Settings" component={Settings} />
      <Stack.Screen name="Menu" component={Menu} />
      <Stack.Screen name="EvidencePlayer" component={EvidencePlayer} />
      <Stack.Screen name="UploadEvidence" component={UploadEvidence} />
    </Stack.Navigator>
  );
}

export function RootNavigator() {
  const { ready, user, onboarded } = useApp();

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  const showLogin = !user;
  const showOnboarding = !!user && user.role === 'conductor' && !onboarded;

  return (
    <NavigationContainer theme={theme}>
      {showLogin ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      ) : showOnboarding ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        </Stack.Navigator>
      ) : (
        <MainStack />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
