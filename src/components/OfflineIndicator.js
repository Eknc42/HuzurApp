// OfflineIndicator — Network status indicator
// Shows when device is offline with cached data info
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Colors, Spacing } from '../theme/colors';
import { Typography } from '../theme/typography';
import { subscribeToNetworkStatus } from '../services/networkService';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    const unsubscribe = subscribeToNetworkStatus(status => {
      setIsOnline(status);

      if (!status) {
        // Animate in
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        // Animate out
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: -60,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }
    });

    return unsubscribe;
  }, [fadeAnim, slideAnim]);

  if (isOnline) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.content}>
        <Text style={styles.icon}>📡</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>İnternet Bağlantısı Yok</Text>
          <Text style={styles.subtitle}>Önbelleğe alınan veriler gösteriliyor</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: 'rgba(251, 146, 60, 0.95)',
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    borderBottomWidth: 1,
    paddingTop: Platform.OS === 'ios' ? Spacing.lg : Spacing.md,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  icon: {
    fontSize: 20,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...Typography.label,
    color: '#1f2937',
    marginBottom: 2,
    fontWeight: '600',
  },
  subtitle: {
    ...Typography.caption,
    color: '#374151',
  },
});
