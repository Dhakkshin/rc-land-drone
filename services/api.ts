// services/api.ts
import axios from "axios";

let BASE_URL = "http://192.168.1.102:5000";
let isConnected = false;

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const connectToDrone = async (
  ipAddress: string
): Promise<ApiResponse> => {
  try {
    // Set the base URL with the IP address
    BASE_URL = `http://${ipAddress}:5000`;

    // Test the connection
    const response = await axios.get(`${BASE_URL}/api/status`);

    if (
      response.data &&
      (response.data.status === "connected" || response.data.status === "demo")
    ) {
      isConnected = true;
      return {
        success: true,
        message: `Connected to robot at ${ipAddress}`,
        data: response.data,
      };
    } else {
      return {
        success: false,
        message: "Connection test failed. Robot is not responding correctly.",
      };
    }
  } catch (error) {
    console.error("Connection error:", error);
    return {
      success: false,
      message:
        "Failed to connect. Please check the IP address and ensure the server is running.",
    };
  }
};

export const sendCommand = async (
  direction: string,
  speed: number
): Promise<ApiResponse> => {
  if (!isConnected || !BASE_URL) {
    return {
      success: false,
      message: "Not connected to a robot. Please connect first.",
    };
  }

  // Map direction to command format expected by the server
  let command = "";
  switch (direction) {
    case "up":
      command = "F"; // Forward
      break;
    case "down":
      command = "B"; // Backward
      break;
    case "left":
      command = "L"; // Left
      break;
    case "right":
      command = "R"; // Right
      break;
    case "stop":
      command = "S"; // Stop
      break;
    default:
      command = "S"; // Default to stop for safety
  }

  try {
    // Format the command with the speed value (0-255)
    const speedValue = Math.floor(speed * 255);
    const formattedCommand = `${command}${speedValue}`;

    const response = await axios.post(`${BASE_URL}/api/command`, {
      command: formattedCommand,
    });

    return {
      success: true,
      message: "Command sent successfully",
      data: response.data,
    };
  } catch (error) {
    console.error("Command error:", error);
    return {
      success: false,
      message: "Failed to send command to the robot.",
    };
  }
};

export const checkConnection = async (): Promise<boolean> => {
  if (!BASE_URL) return false;

  try {
    const response = await axios.get(`${BASE_URL}/api/status`);
    isConnected =
      response.data &&
      (response.data.status === "connected" || response.data.status === "demo");
    return isConnected;
  } catch (error) {
    isConnected = false;
    return false;
  }
};

export const getConnectionStatus = (): boolean => {
  return isConnected;
};

export const getBaseUrl = (): string => {
  return BASE_URL;
};
