// ErrorBoundary — React Error Boundary
// Catches runtime errors and displays graceful fallback UI
import React, { Component } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Spacing, Radius } from '../theme/colors';
import { Typography } from '../theme/typography';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught:', error);
    console.error('Error Info:', errorInfo);

    // Track error count
    this.setState(prev => ({
      error,
      errorInfo,
      errorCount: prev.errorCount + 1,
    }));

    // Optional: Send to error tracking service (Sentry, etc)
    // logErrorToService(error, errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={Colors.bgPrimary} />

          <LinearGradient
            colors={[Colors.bgPrimary, Colors.bgSecondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Error Icon */}
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>⚠️</Text>
              </View>

              {/* Title */}
              <Text style={styles.title}>Bir Sorun Oluştu</Text>

              {/* Description */}
              <Text style={styles.description}>
                Uygulamada beklenmeyen bir hata oluştu. Lütfen bir sorun raporu gönderin veya sayfayı yenileyip deneyin.
              </Text>

              {/* Error Details (Development Only) */}
              {__DEV__ && this.state.error && (
                <View style={styles.errorDetailsContainer}>
                  <Text style={styles.errorTitle}>Hata Detayları:</Text>
                  <Text style={styles.errorMessage}>{String(this.state.error)}</Text>
                  {this.state.errorInfo?.componentStack && (
                    <Text style={styles.stackTrace}>
                      {this.state.errorInfo.componentStack}
                    </Text>
                  )}
                  <Text style={styles.errorCount}>
                    Hata Sayısı: {this.state.errorCount}
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={this.resetError}
                  activeOpacity={0.7}
                >
                  <Text style={styles.primaryButtonText}>Tekrar Deneyin</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={() => {
                    // Clear app state and navigate to home
                    this.resetError();
                    if (this.props.onNavigateHome) {
                      this.props.onNavigateHome();
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.secondaryButtonText}>Ana Sayfaya Dön</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </LinearGradient>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  iconContainer: {
    marginBottom: Spacing.lg,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    ...Typography.heading1,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 24,
  },
  errorDetailsContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: Radius.md,
    borderColor: 'rgba(255, 0, 0, 0.3)',
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    maxHeight: 200,
  },
  errorTitle: {
    ...Typography.label,
    color: '#ff6b6b',
    marginBottom: Spacing.sm,
  },
  errorMessage: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    fontFamily: 'Menlo',
  },
  stackTrace: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontFamily: 'Menlo',
    marginBottom: Spacing.sm,
  },
  errorCount: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  buttonContainer: {
    width: '100%',
    gap: Spacing.md,
  },
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.emerald,
  },
  primaryButtonText: {
    ...Typography.button,
    color: Colors.bgPrimary,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.emerald,
  },
  secondaryButtonText: {
    ...Typography.button,
    color: Colors.emerald,
    fontWeight: '600',
  },
});

export default ErrorBoundary;
