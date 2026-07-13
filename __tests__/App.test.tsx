/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../App';

test('renders correctly', async () => {
  await AsyncStorage.clear();

  await ReactTestRenderer.act(async () => {
    ReactTestRenderer.create(<App />);
  });
});
