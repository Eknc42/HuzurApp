/**
 * Huzur — Premium Kur'an & İlham Uygulaması
 * Ruh haline göre ayet önerileri, içgörü kartları, tam Kur'an okuyucu
 *
 * Navigasyon:
 * Onboarding (bir kez) → Home (ana merkez)
 *   ├── QuranScreen → SurahDetail
 *   ├── MoodSelection → Verse → AIExplanation / ShareStory
 *   ├── Favorites → Verse
 *   ├── PrayerTimes (canlı namaz vakitleri)
 *   └── LockScreenWidget (konsept)
 */

import React from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Colors, Motion } from './src/theme/colors';
import { ONBOARDING_STORAGE_KEY } from './src/constants/storageKeys';
import { ToastProvider } from './src/contexts/ToastContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import OfflineIndicator from './src/components/OfflineIndicator';
import { initializeNetworkMonitoring } from './src/services/networkService';

import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import MoodSelectionScreen from './src/screens/MoodSelectionScreen';
import MoodVerseListScreen from './src/screens/MoodVerseListScreen';
import VerseScreen from './src/screens/VerseScreen';
import AIExplanationScreen from './src/screens/AIExplanationScreen';
import AIChatScreen from './src/screens/AIChatScreen';
import ShareStoryScreen from './src/screens/ShareStoryScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import LockScreenWidget from './src/screens/LockScreenWidget';
import QuranScreen from './src/screens/QuranScreen';
import QuranPageScreen from './src/screens/QuranPageScreen';
import MushafPageScreen from './src/screens/MushafPageScreen';
import SurahDetailScreen from './src/screens/SurahDetailScreen';
import ReciterSelectScreen from './src/screens/ReciterSelectScreen';
import PremiumPlayerScreen from './src/screens/PremiumPlayerScreen';
import AmbientMixerScreen from './src/screens/AmbientMixerScreen';
import SleepModeScreen from './src/screens/SleepModeScreen';
import RadioScreen from './src/screens/RadioScreen';
import PrayerTimesScreen from './src/screens/PrayerTimesScreen';
import CityPickerScreen from './src/screens/CityPickerScreen';
import PaywallScreen from './src/screens/PaywallScreen';
import LibraryRecitersScreen from './src/screens/LibraryRecitersScreen';
import SimplePlayerScreen from './src/screens/SimplePlayerScreen';
import SurahListScreen from './src/screens/SurahListScreen';
import ZikirmatikScreen from './src/screens/ZikirmatikScreen';
import QiblaScreen from './src/screens/QiblaScreen';
import { PremiumProvider } from './src/contexts/PremiumContext';

const Stack = createNativeStackNavigator();

const HuzurTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.emerald,
    background: Colors.bgPrimary,
    card: Colors.bgPrimary,
    text: Colors.textPrimary,
    border: Colors.borderSubtle,
    notification: Colors.emerald,
  },
};

function AppStack({ initialRouteName }) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        animation: 'fade_from_bottom',
        animationDuration: Motion.base,
        contentStyle: { backgroundColor: Colors.bgPrimary },
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />

      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={({ route }) => ({ animation: route.params?.animation || 'fade' })}
      />

      <Stack.Screen
        name="Quran"
        component={QuranScreen}
        options={({ route }) => ({ animation: route.params?.animation || 'slide_from_right' })}
      />

      <Stack.Screen
        name="QuranPage"
        component={QuranPageScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="MushafPage"
        component={MushafPageScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="SurahDetail"
        component={SurahDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="MoodSelection"
        component={MoodSelectionScreen}
        options={({ route }) => ({ animation: route.params?.animation || 'slide_from_right' })}
      />

      <Stack.Screen
        name="MoodVerseList"
        component={MoodVerseListScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="Verse"
        component={VerseScreen}
        options={{ animation: 'fade_from_bottom' }}
      />

      <Stack.Screen
        name="AIExplanation"
        component={AIExplanationScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="AIChat"
        component={AIChatScreen}
        options={({ route }) => ({ animation: route.params?.animation || 'slide_from_right' })}
      />

      <Stack.Screen
        name="ShareStory"
        component={ShareStoryScreen}
        options={{ animation: 'slide_from_bottom' }}
      />

      <Stack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={({ route }) => ({ animation: route.params?.animation || 'slide_from_right' })}
      />

      <Stack.Screen
        name="LockScreenWidget"
        component={LockScreenWidget}
        options={{ animation: 'fade' }}
      />

      <Stack.Screen
        name="ReciterSelect"
        component={ReciterSelectScreen}
        options={{ animation: 'slide_from_bottom' }}
      />

      <Stack.Screen
        name="PremiumPlayer"
        component={PremiumPlayerScreen}
        options={{ animation: 'fade_from_bottom' }}
      />

      <Stack.Screen
        name="AmbientMixer"
        component={AmbientMixerScreen}
        options={{ animation: 'slide_from_bottom' }}
      />

      <Stack.Screen
        name="SleepMode"
        component={SleepModeScreen}
        options={{ animation: 'fade' }}
      />

      <Stack.Screen
        name="Radio"
        component={RadioScreen}
        options={({ route }) => ({ animation: route.params?.animation || 'slide_from_right' })}
      />

      <Stack.Screen
        name="PrayerTimes"
        component={PrayerTimesScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="CityPicker"
        component={CityPickerScreen}
        options={{ animation: 'slide_from_bottom' }}
      />

      <Stack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="LibraryReciters"
        component={LibraryRecitersScreen}
        options={{ animation: 'slide_from_bottom' }}
      />

      <Stack.Screen
        name="SimplePlayer"
        component={SimplePlayerScreen}
        options={{ animation: 'fade_from_bottom' }}
      />

      <Stack.Screen
        name="SurahList"
        component={SurahListScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Zikirmatik"
        component={ZikirmatikScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="Qibla"
        component={QiblaScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}

function App() {
  const [bootstrapped, setBootstrapped] = React.useState(false);
  const [initialRoute, setInitialRoute] = React.useState('Onboarding');

  React.useEffect(() => {
    const unsubscribeNetwork = initializeNetworkMonitoring();
    return unsubscribeNetwork;
  }, []);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (alive) {
          setInitialRoute(value === 'true' ? 'Home' : 'Onboarding');
        }
      } catch {
        if (alive) setInitialRoute('Onboarding');
      } finally {
        if (alive) setBootstrapped(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!bootstrapped) {
    return (
      <View style={bootStyles.shell}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.bgPrimary} />
        <ActivityIndicator color={Colors.emerald} size="large" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ToastProvider>
          <OfflineIndicator />
          <StatusBar
            barStyle="light-content"
            backgroundColor={Colors.bgPrimary}
            translucent={false}
          />
          <NavigationContainer theme={HuzurTheme}>
            <PremiumProvider>
              <AppStack initialRouteName={initialRoute} />
            </PremiumProvider>
          </NavigationContainer>
        </ToastProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const bootStyles = StyleSheet.create({
  shell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgPrimary,
  },
});

export default App;
