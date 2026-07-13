// useAppearAnimation — Reusable entrance animation hook
// Extracts the opacity+translateY+scale pattern repeated in every screen
import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { Motion } from '../theme/colors';

/**
 * @param {object} [options]
 * @param {number} [options.delay=0]
 * @param {number} [options.duration=Motion.slow]
 * @param {boolean} [options.scale=false]
 * @param {number} [options.translateY=25]
 * @returns {{ opacity: Animated.Value, translateY: Animated.Value, scale: Animated.Value, style: object }}
 */
export default function useAppearAnimation({
  delay = 0,
  duration = Motion.slow,
  scale: useScale = false,
  translateY: targetTranslateY = 25,
} = {}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(targetTranslateY)).current;
  const scale = useRef(new Animated.Value(useScale ? 0.95 : 1)).current;

  useEffect(() => {
    const anims = [
      Animated.timing(opacity, { toValue: 1, duration, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration, delay, useNativeDriver: true }),
    ];
    if (useScale) {
      anims.push(Animated.spring(scale, { toValue: 1, tension: 40, friction: 8, delay, useNativeDriver: true }));
    }
    Animated.parallel(anims).start();
  }, [opacity, translateY, scale, delay, duration, useScale]);

  const style = {
    opacity,
    transform: [{ translateY }, ...(useScale ? [{ scale }] : [])],
  };

  return { opacity, translateY, scale, style };
}

/**
 * Staggered animation for list items
 * @param {number} count - Number of items
 * @param {number} [staggerDelay=Motion.stagger]
 * @returns {Array<{ opacity: Animated.Value, translateY: Animated.Value, style: object }>}
 */
export function useStaggerAnimation(count, staggerDelay = Motion.stagger) {
  const anims = useRef(
    Array.from({ length: count }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(30),
      scale: new Animated.Value(0.92),
    }))
  ).current;

  useEffect(() => {
    const animations = anims.map((a, i) =>
      Animated.parallel([
        Animated.timing(a.opacity, { toValue: 1, duration: 400, delay: 200 + i * staggerDelay, useNativeDriver: true }),
        Animated.timing(a.translateY, { toValue: 0, duration: 400, delay: 200 + i * staggerDelay, useNativeDriver: true }),
        Animated.spring(a.scale, { toValue: 1, tension: 50, friction: 8, delay: 200 + i * staggerDelay, useNativeDriver: true }),
      ])
    );
    Animated.parallel(animations).start();
  }, [anims, staggerDelay]);

  return anims.map((a) => ({
    opacity: a.opacity,
    translateY: a.translateY,
    scale: a.scale,
    style: { opacity: a.opacity, transform: [{ translateY: a.translateY }, { scale: a.scale }] },
  }));
}
