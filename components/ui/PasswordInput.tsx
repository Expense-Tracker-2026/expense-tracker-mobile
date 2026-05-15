import { useState } from 'react';
import { View, TextInput, TouchableOpacity, TextInputProps, StyleSheet } from 'react-native';

interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  inputStyle?: object;
  containerStyle?: object;
}

export function PasswordInput({ inputStyle, containerStyle, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        {...props}
        secureTextEntry={!visible}
        style={[styles.input, inputStyle, { paddingRight: 48 }]}
      />
      <TouchableOpacity
        onPress={() => setVisible(v => !v)}
        style={styles.eyeBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.6}
      >
        {visible ? (
          /* Eye-slash: password visible, tap to hide */
          <View style={styles.icon}>
            <View style={[styles.eyeOuter, styles.eyeSlash]} />
            <View style={styles.slashLine} />
          </View>
        ) : (
          /* Eye: password hidden, tap to reveal */
          <View style={styles.icon}>
            <View style={styles.eyeOuter} />
            <View style={styles.eyeInner} />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  input: {
    flex: undefined,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 28,
  },
  icon: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeOuter: {
    width: 18,
    height: 12,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#94A3B8',
    position: 'absolute',
  },
  eyeInner: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#94A3B8',
  },
  eyeSlash: {
    opacity: 0.5,
  },
  slashLine: {
    position: 'absolute',
    width: 2,
    height: 20,
    backgroundColor: '#94A3B8',
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
  },
});
