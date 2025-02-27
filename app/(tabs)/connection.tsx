import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/Button';
import { TextInput } from '@/components/TextInput';

export default function ConnectionScreen() {
  const [ipAddress, setIpAddress] = useState('');

  const handleConnect = () => {
    if (ipAddress.trim()) {
      console.log('Connecting to:', ipAddress);
      // TODO: Add connection logic
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Connect to Drone</ThemedText>
      <TextInput
        style={styles.input}
        value={ipAddress}
        onChangeText={setIpAddress}
        placeholder="Enter IP Address"
        keyboardType="numeric"
      />
      <Button
        onPress={handleConnect}
        title="Connect"
        style={styles.button}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  button: {
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
