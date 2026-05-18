import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { AppColors } from '../constants/Theme';

const CustomButton = ({ 
  title, 
  onPress, 
  variant = 'primary', // 'primary' or 'secondary'
  style, 
  textStyle,
  disabled = false,
}) => {
  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        variant === 'primary' ? styles.primary : styles.secondary,
        disabled && styles.disabledButton,
        style
      ]} 
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <Text 
        style={[
          styles.text, 
          variant === 'primary' ? styles.primaryText : styles.secondaryText,
          textStyle
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    width: '100%',
  },
  primary: {
    backgroundColor: AppColors.primary,
  },
  secondary: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: AppColors.border,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: '#24458B', // Navy blue
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default CustomButton;
