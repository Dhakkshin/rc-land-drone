import { StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DPadProps {
  onDirectionPress: (direction: 'up' | 'down' | 'left' | 'right') => void;
}

export function DPad({ onDirectionPress }: DPadProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.spacer} />
        <Pressable 
          onPress={() => onDirectionPress('up')}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Ionicons name="chevron-up" size={24} color="white" />
        </Pressable>
        <View style={styles.spacer} />
      </View>
      <View style={styles.row}>
        <Pressable 
          onPress={() => onDirectionPress('left')}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </Pressable>
        <View style={styles.centerButton} />
        <Pressable 
          onPress={() => onDirectionPress('right')}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Ionicons name="chevron-forward" size={24} color="white" />
        </Pressable>
      </View>
      <View style={styles.row}>
        <View style={styles.spacer} />
        <Pressable 
          onPress={() => onDirectionPress('down')}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Ionicons name="chevron-down" size={24} color="white" />
        </Pressable>
        <View style={styles.spacer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  button: {
    width: 60,
    height: 60,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  pressed: {
    opacity: 0.7,
  },
  spacer: {
    width: 60,
    height: 60,
  },
  centerButton: {
    width: 60,
    height: 60,
    backgroundColor: '#1976D2',
    borderRadius: 8,
  },
});
