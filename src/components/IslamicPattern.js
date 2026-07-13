// IslamicPattern — Subtle geometric accent decoration
// Very minimal — used as background decoration, never overwhelming
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, G, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { Colors } from '../theme/colors';

// Minimal 8-pointed star pattern — subtle background accent
export function IslamicStar({ size = 60, color = Colors.emeraldBorder, opacity = 0.15 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none" opacity={opacity}>
      <G>
        {/* 8-pointed star from two overlapping squares */}
        <Path
          d="M50 5L61.8 38.2L95 50L61.8 61.8L50 95L38.2 61.8L5 50L38.2 38.2Z"
          stroke={color}
          strokeWidth="1"
          fill="none"
        />
        <Circle cx="50" cy="50" r="12" stroke={color} strokeWidth="0.8" fill="none" />
        <Circle cx="50" cy="50" r="4" fill={color} opacity="0.5" />
      </G>
    </Svg>
  );
}

// Corner accent — for share card and decorative elements
export function CornerAccent({ size = 40, color = Colors.emeraldBorder, opacity = 0.2, rotation = 0 }) {
  return (
    <View style={{ transform: [{ rotate: `${rotation}deg` }] }}>
      <Svg width={size} height={size} viewBox="0 0 40 40" fill="none" opacity={opacity}>
        <Path
          d="M0 0 L15 0 L15 3 L3 3 L3 15 L0 15 Z"
          fill={color}
        />
        <Path
          d="M8 0 L8 8 L0 8"
          stroke={color}
          strokeWidth="0.5"
          fill="none"
        />
      </Svg>
    </View>
  );
}

// Decorative dots — minimal geometric dots pattern
export function GeometricDots({ size = 80, color = Colors.emeraldBorder, opacity = 0.1 }) {
  const dots = [];
  const spacing = 16;
  const cols = 5;
  const rows = 5;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push(
        <Circle
          key={`${r}-${c}`}
          cx={c * spacing + 8}
          cy={r * spacing + 8}
          r="1.5"
          fill={color}
        />
      );
    }
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 80 80" fill="none" opacity={opacity}>
      {dots}
    </Svg>
  );
}
