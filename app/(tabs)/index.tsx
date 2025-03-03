import { StyleSheet, SafeAreaView, Alert } from "react-native";
import { useState, useEffect } from "react";
import { ThemedView } from "@/components/ThemedView";
import { VideoFeed } from "@/components/VideoFeed";
import { DPad } from "@/components/DPad";
import { Throttle } from "@/components/Throttle";
import { ThemedText } from "@/components/ThemedText";
import { sendCommand, checkConnection, getBaseUrl } from "@/services/api";

export default function HomeScreen() {
  const [throttleValue, setThrottleValue] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [ipAddress, setIpAddress] = useState("");

  // Check connection when the component mounts
  useEffect(() => {
    const checkConnectionStatus = async () => {
      const connected = await checkConnection();
      setIsConnected(connected);

      // Get IP address from base URL
      const baseUrl = getBaseUrl();
      if (baseUrl) {
        const ip = baseUrl.replace("http://", "").split(":")[0];
        setIpAddress(ip);
      }
    };

    checkConnectionStatus();
    // Set up interval to check connection status
    const interval = setInterval(checkConnectionStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleDirection = async (
    direction: "up" | "down" | "left" | "right"
  ) => {
    console.log("Direction:", direction, "Throttle:", throttleValue);

    // Only send commands if we're connected
    if (isConnected) {
      const response = await sendCommand(direction, throttleValue);
      if (!response.success) {
        console.log("Command failed:", response.message);
        Alert.alert("Command Failed", response.message);
      }
    } else {
      Alert.alert("Not Connected", "Please connect to a robot first");
    }
  };

  const handleStop = async () => {
    console.log("Stop");
    if (isConnected) {
      await sendCommand("stop", 0);
    }
  };

  const handleThrottle = (value: number) => {
    setThrottleValue(value);
    console.log("Throttle:", value);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.topContent}>
          <ThemedText style={styles.title}>RC Land Drone Control</ThemedText>

          {/* Connection status indicator */}
          <ThemedView style={styles.statusBar}>
            <ThemedText
              style={[
                styles.statusText,
                isConnected ? styles.connectedText : styles.disconnectedText,
              ]}
            >
              Status: {isConnected ? "Connected" : "Disconnected"}
            </ThemedText>
            {ipAddress && (
              <ThemedText style={styles.ipText}>IP: {ipAddress}</ThemedText>
            )}
          </ThemedView>

          <VideoFeed />
        </ThemedView>
        <ThemedView style={styles.controls}>
          <DPad
            onDirectionPress={handleDirection}
            onStopPress={handleStop}
            throttleValue={throttleValue}
          />
          <Throttle onThrottleChange={handleThrottle} />
        </ThemedView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff", // Or use your theme color
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 80, // Increased from 40 to 80
  },
  topContent: {
    gap: 20,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    padding: 20,
    marginTop: "auto", // This pushes the controls to the bottom
    paddingBottom: 40, // Add some padding from the bottom edge
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  statusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  statusText: {
    fontSize: 14,
  },
  connectedText: {
    color: "#4CAF50", // Green for connected
  },
  disconnectedText: {
    color: "#F44336", // Red for disconnected
  },
  ipText: {
    fontSize: 14,
    color: "#555",
  },
});
