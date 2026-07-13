// AnimatedText — Word-by-word reveal animation
// Used for AI explanation typing effect
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View, StyleSheet } from 'react-native';

export default function AnimatedText({ text, style, delay = 30, onComplete }) {
  const [displayedWords, setDisplayedWords] = useState([]);
  const safeText = text || 'Manevi yansıma metni bulunamadı.';
  const words = safeText.split(' ');
  const opacities = useRef(words.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = words.map((_, index) =>
      Animated.timing(opacities[index], {
        toValue: 1,
        duration: 200,
        delay: index * delay,
        useNativeDriver: true,
      })
    );

    Animated.stagger(delay, animations).start(() => {
      if (onComplete) onComplete();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeText]);

  return (
    <View style={styles.container}>
      <Text style={style}>
        {words.map((word, index) => (
          <Animated.Text
            key={`${word}-${index}`}
            style={{ opacity: opacities[index] }}
          >
            {word}{index < words.length - 1 ? ' ' : ''}
          </Animated.Text>
        ))}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
