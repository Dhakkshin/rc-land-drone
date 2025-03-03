import { StyleSheet, View, PanResponder, Animated } from "react-native";
import { useRef, useState } from "react";
import { ThemedText } from "./ThemedText";

interface ThrottleProps {
  onThrottleChange: (value: number) => void;
}

export function Throttle({ onThrottleChange }: ThrottleProps) {
  const [throttleHeight] = useState(200);
  const [percentage, setPercentage] = useState(0);
  const trackRef = useRef<View>(null);
  const throttlePosition = useRef(
    new Animated.Value(throttleHeight - 40)
  ).current;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (event, gestureState) => {
      trackRef.current?.measure((x, y, width, height, pageX, pageY) => {
        const touchY = event.nativeEvent.pageY - pageY;
        const newPosition = Math.max(0, Math.min(throttleHeight - 40, touchY));
        throttlePosition.setValue(newPosition);

        // Invert percentage calculation (0 at bottom, 100 at top)
        const newPercentage = Math.round(
          ((throttleHeight - 40 - newPosition) / (throttleHeight - 40)) * 100
        );
        const boundedPercentage = Math.max(0, Math.min(100, newPercentage));
        setPercentage(boundedPercentage);
        onThrottleChange(boundedPercentage / 100);
      });
    },
    // Removed auto-return to zero feature
  });

  return (
    <View style={styles.container}>
      <ThemedText style={styles.percentage}>{percentage}%</ThemedText>
      <View ref={trackRef} style={[styles.track, { height: throttleHeight }]}>
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.handle,
            {
              transform: [
                {
                  translateY: throttlePosition,
                },
              ],
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
  },
  track: {
    width: 40,
    backgroundColor: "#e0e0e0",
    borderRadius: 20,
    position: "relative",
  },
  handle: {
    width: 40,
    height: 40,
    backgroundColor: "#2196F3",
    borderRadius: 20,
    position: "absolute",
    top: 0,
  },
  percentage: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
});
