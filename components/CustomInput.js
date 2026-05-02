import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ms, fs, wp, hp } from '../utils/responsive';

const CustomInput = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  secureTextEntry, 
  keyboardType,
  leftIcon,
  required = false,
  error
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = secureTextEntry;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
      )}
      <View style={[styles.inputWrapper, error && styles.errorBorder]}>
        {leftIcon && (
          <Ionicons name={leftIcon} size={ms(18)} color="#94A3B8" style={styles.leftIcon} />
        )}
        <TextInput
          style={[
            styles.input, 
            leftIcon && { paddingLeft: wp(5) },
            isPassword && { paddingRight: wp(40) }
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize="none"
        />
        {isPassword && (
          <TouchableOpacity 
            style={styles.rightIcon} 
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={ms(18)} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: hp(15),
    width: '100%',
  },
  label: {
    fontSize: fs(14),
    fontWeight: '600',
    color: '#334155',
    marginBottom: hp(8),
    marginLeft: wp(2),
  },
  required: {
    color: '#EF4444',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: hp(52),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: ms(8),
    backgroundColor: '#fff',
    paddingHorizontal: wp(12),
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: fs(15),
    color: '#1E293B',
  },
  leftIcon: {
    marginRight: wp(2),
  },
  rightIcon: {
    position: 'absolute',
    right: wp(12),
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBorder: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: fs(12),
    marginTop: hp(4),
    marginLeft: wp(2),
  },
});

export default CustomInput;

