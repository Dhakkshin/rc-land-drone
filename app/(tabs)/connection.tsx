import { useState } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { connectToDrone } from '@/services/api';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/Button';
import { TextInput } from '@/components/TextInput';

export default function ConnectionScreen() {
  const [ipAddress, setIpAddress] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!ipAddress.trim()) return;

    setIsConnecting(true);
    try {
      const response = await connectToDrone(ipAddress);
      if (response.success) {
        Alert.alert('Success', response.message, [
          { text: 'OK', onPress: () => router.push('/(tabs)') }
        ]);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to drone');
    } finally {
      setIsConnecting(false);
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
        title={isConnecting ? "Connecting..." : "Connect"}
        style={StyleSheet.compose(
          styles.button,
          isConnecting ? styles.buttonDisabled : {}
        )}
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
  buttonDisabled: {
    opacity: 0.5,
  },
});
