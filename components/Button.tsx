import { Pressable, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { ThemedText } from './ThemedText';

interface ButtonProps {
  onPress: () => void;
  title: string;
  style?: StyleProp<ViewStyle>;
}

export function Button({ onPress, title, style }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        style,
        pressed && styles.pressed,
      ]}>
      <ThemedText style={styles.text}>{title}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
