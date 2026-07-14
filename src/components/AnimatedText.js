// AnimatedText — Word-by-word reveal animation
// Used for AI explanation typing effect
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View, StyleSheet } from 'react-native';

export default function AnimatedText({ text, style, delay = 30, onComplete }) {
  const safeText = text || 'Manevi yansıma metni bulunamadı.';
  
  const sections = safeText.split('[SEPARATOR]');
  const itemsCount = sections.reduce((acc, sec) => acc + sec.split(' ').length, 0) + sections.length - 1;
  const opacities = useRef(Array.from({ length: itemsCount }).map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = opacities.map((anim, index) =>
      Animated.timing(anim, {
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

  let currentItemIndex = 0;

  return (
    <View style={styles.container}>
      {sections.map((sectionText, sIndex) => {
        const words = sectionText.split(' ');
        const sectionWords = words.map((word, i) => {
          const index = currentItemIndex++;
          return (
            <Animated.Text
              key={`word-${index}`}
              style={{ opacity: opacities[index] }}
            >
              {word}{i < words.length - 1 ? ' ' : ''}
            </Animated.Text>
          );
        });

        const hasSeparator = sIndex < sections.length - 1;
        let sepIndex = -1;
        if (hasSeparator) {
          sepIndex = currentItemIndex++;
        }

        return (
          <React.Fragment key={`sec-${sIndex}`}>
            <Text style={style}>{sectionWords}</Text>
            {hasSeparator && (
              <Animated.View style={[styles.greenSeparator, { opacity: opacities[sepIndex] }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
  },
  greenSeparator: {
    height: 1,
    backgroundColor: '#10b981', // Colors.emerald
    marginVertical: 14,
    width: '100%',
    alignSelf: 'stretch'
  }
});
