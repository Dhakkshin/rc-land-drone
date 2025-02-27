import { StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';

export function VideoFeed() {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.placeholder}>Drone Video Feed</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16/9,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  placeholder: {
    color: '#ffffff',
    fontSize: 18,
  },
});
