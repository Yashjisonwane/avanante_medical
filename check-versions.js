const fs = require('fs');
const path = require('path');

const pkgs = [
  'expo', 'expo-constants', 'expo-device', 'expo-image-picker',
  'expo-linear-gradient', 'expo-linking', 'expo-localization',
  'expo-notifications', 'expo-router', 'expo-status-bar', 'expo-updates',
  'react', 'react-dom', 'react-native', 'react-native-safe-area-context',
  'react-native-screens', 'react-native-svg'
];

pkgs.forEach(pkg => {
  try {
    const p = require(path.join(__dirname, 'node_modules', pkg, 'package.json'));
    console.log(pkg + ': ' + p.version);
  } catch(e) {
    console.log(pkg + ': NOT INSTALLED');
  }
});

// Also check expo's bundledNativeModules
try {
  const bnm = require(path.join(__dirname, 'node_modules', 'expo', 'bundledNativeModules.json'));
  console.log('\n--- SDK 54 Expected Versions ---');
  const interested = ['expo-constants', 'expo-device', 'expo-image-picker', 'expo-linear-gradient', 'expo-linking', 'expo-localization', 'expo-notifications', 'expo-router', 'expo-status-bar', 'expo-updates', 'react-native-safe-area-context', 'react-native-screens', 'react-native-svg'];
  interested.forEach(pkg => {
    if (bnm[pkg]) console.log(pkg + ': ' + bnm[pkg]);
  });
} catch(e) {
  console.log('bundledNativeModules.json not found');
}
