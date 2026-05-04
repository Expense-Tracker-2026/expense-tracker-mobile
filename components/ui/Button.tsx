import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';

type Variant = 'primary' | 'secondary' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const variantStyles: Record<Variant, { container: ViewStyle; text: TextStyle }> = {
  primary: { container: { backgroundColor: '#7C3AED' }, text: { color: 'white' } },
  secondary: { container: { backgroundColor: '#4F46E5' }, text: { color: 'white' } },
  danger: { container: { backgroundColor: '#DC2626' }, text: { color: 'white' } },
  outline: { container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#7C3AED' }, text: { color: '#7C3AED' } },
};

const sizeStyles: Record<Size, { container: ViewStyle; text: TextStyle }> = {
  sm: { container: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }, text: { fontSize: 13, fontWeight: '600' } },
  md: { container: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 }, text: { fontSize: 15, fontWeight: '600' } },
  lg: { container: { paddingVertical: 16, paddingHorizontal: 20, borderRadius: 12 }, text: { fontSize: 17, fontWeight: '700' } },
};

export function Button({ onPress, title, variant = 'primary', size = 'md', loading = false, disabled = false, style }: ButtonProps) {
  const vs = variantStyles[variant];
  const ss = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.base, vs.container, ss.container, isDisabled && styles.disabled, style]}
    >
      {loading
        ? <ActivityIndicator color={variant === 'outline' ? '#7C3AED' : 'white'} size="small" />
        : <Text style={[vs.text, ss.text]}>{title}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
