import { StyleSheet, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { sendCommand } from "@/services/api";

interface DPadProps {
  onDirectionPress: (direction: "up" | "down" | "left" | "right") => void;
  onStopPress?: () => void;
  throttleValue?: number;
}

export function DPad({
  onDirectionPress,
  onStopPress,
  throttleValue = 0,
}: DPadProps) {
  // Function to handle stop button press
  const handleStop = () => {
    if (onStopPress) {
      onStopPress();
    }
    sendCommand("stop", 0).catch((error) => {
      console.error("Failed to send stop command:", error);
    });
  };

  // Handle direction button press
  const handleDirectionPress = (
    direction: "up" | "down" | "left" | "right"
  ) => {
    onDirectionPress(direction);
  };

  // Handle direction button release - automatically stop
  const handleDirectionRelease = () => {
    sendCommand("stop", 0).catch((error) => {
      console.error("Failed to send stop command:", error);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.spacer} />
        <Pressable
          onPressIn={() => handleDirectionPress("up")}
          onPressOut={handleDirectionRelease}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-up" size={24} color="white" />
        </Pressable>
        <View style={styles.spacer} />
      </View>
      <View style={styles.row}>
        <Pressable
          onPressIn={() => handleDirectionPress("left")}
          onPressOut={handleDirectionRelease}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </Pressable>
        <Pressable
          onPress={handleStop}
          style={({ pressed }) => [
            styles.centerButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="stop" size={24} color="white" />
        </Pressable>
        <Pressable
          onPressIn={() => handleDirectionPress("right")}
          onPressOut={handleDirectionRelease}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-forward" size={24} color="white" />
        </Pressable>
      </View>
      <View style={styles.row}>
        <View style={styles.spacer} />
        <Pressable
          onPressIn={() => handleDirectionPress("down")}
          onPressOut={handleDirectionRelease}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
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
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  button: {
    width: 60,
    height: 60,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
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
    backgroundColor: "#F44336", // Red for stop button
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
});
