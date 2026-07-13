// SearchBar — Animated search input with focus state and clear button
// Extracted from inline search implementation in QuranScreen
import React, { useRef, useState, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Colors, Radius, Spacing, ComponentSize, Motion } from '../theme/colors';
import { Typography } from '../theme/typography';
import { SearchIcon } from './IconsExtra';
import Svg, { Line } from 'react-native-svg';

// Simple X icon for clear button
function ClearIcon({ size = 12, color = Colors.textMuted }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Line x1="2" y1="2" x2="10" y2="10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="10" y1="2" x2="2" y2="10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

/**
 * @param {object} props
 * @param {string} props.value
 * @param {function} props.onChangeText
 * @param {string} [props.placeholder='Ara...']
 * @param {boolean} [props.autoFocus=false]
 * @param {function} [props.onFocus]
 * @param {function} [props.onBlur]
 * @param {object} [props.style]
 */
export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Ara...',
  autoFocus = false,
  onFocus,
  onBlur,
  style,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: Motion.fast,
      useNativeDriver: false,
    }).start();
    onFocus?.();
  }, [borderAnim, onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: Motion.fast,
      useNativeDriver: false,
    }).start();
    onBlur?.();
  }, [borderAnim, onBlur]);

  const handleClear = useCallback(() => {
    onChangeText('');
    inputRef.current?.focus();
  }, [onChangeText]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.borderSubtle, Colors.emeraldBorder],
  });

  return (
    <Animated.View style={[styles.container, { borderColor }, style]}>
      <SearchIcon size={18} color={isFocused ? Colors.emerald : Colors.textMuted} />
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        returnKeyType="search"
        autoCorrect={false}
        autoFocus={autoFocus}
        autoCapitalize="none"
        accessibilityLabel={placeholder}
        accessibilityRole="search"
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Temizle"
          accessibilityRole="button"
        >
          <View style={styles.clearBtn}>
            <ClearIcon size={12} color={Colors.textMuted} />
          </View>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgTertiary,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    height: ComponentSize.inputHeight,
    borderWidth: 1,
    gap: 10,
  },
  input: {
    ...Typography.input,
    flex: 1,
    paddingVertical: 0,
    color: Colors.textPrimary,
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
