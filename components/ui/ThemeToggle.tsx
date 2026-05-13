import { TouchableOpacity, Text, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export function ThemeToggle({ style }: { style?: object }) {
  const { theme, toggleTheme, colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      activeOpacity={0.7}
      style={[{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
      }, style]}
    >
      <Text style={{ color: colors.text, fontSize: 15 }}>
        {theme === 'dark' ? '☀️' : '🌙'} {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      </Text>
      <View style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme === 'dark' ? colors.border : colors.brand,
        justifyContent: 'center',
        paddingHorizontal: 2,
      }}>
        <View style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: '#FFFFFF',
          alignSelf: theme === 'dark' ? 'flex-start' : 'flex-end',
        }} />
      </View>
    </TouchableOpacity>
  );
}
