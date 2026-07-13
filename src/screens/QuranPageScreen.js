import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

export default function QuranPageScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Sayfa Görünümü</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary, justifyContent: 'center', alignItems: 'center' },
  text: { color: Colors.textPrimary, fontSize: 18 }
});
