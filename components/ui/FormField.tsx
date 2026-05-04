import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  required?: boolean;
}

export function FormField({ label, error, children, style, required }: FormFieldProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>
        {label}{required && <Text style={styles.required}> *</Text>}
      </Text>
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  required: {
    color: '#EF4444',
  },
  error: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
});
