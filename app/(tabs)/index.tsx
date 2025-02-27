import { StyleSheet, SafeAreaView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { VideoFeed } from '@/components/VideoFeed';
import { DPad } from '@/components/DPad';
import { Throttle } from '@/components/Throttle';
import { ThemedText } from '@/components/ThemedText';

export default function HomeScreen() {
  const handleDirection = (direction: 'up' | 'down' | 'left' | 'right') => {
    console.log('Direction:', direction);
  };

  const handleThrottle = (value: number) => {
    console.log('Throttle:', value);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.topContent}>
          <ThemedText style={styles.title}>RC Land Drone Control</ThemedText>
          <VideoFeed />
        </ThemedView>
        <ThemedView style={styles.controls}>
          <DPad onDirectionPress={handleDirection} />
          <Throttle onThrottleChange={handleThrottle} />
        </ThemedView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',  // Or use your theme color
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 80,  // Increased from 40 to 80
  },
  topContent: {
    gap: 20,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
    marginTop: 'auto', // This pushes the controls to the bottom
    paddingBottom: 40, // Add some padding from the bottom edge
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
