// // One-time setup
// useEffect(() => {
//   addDebugMessage("VideoFeed component mounted");

//   return () => {
//     addDebugMessage("VideoFeed component unmounted");
//   };
// }, []); // Log HTML creation in a useEffect to avoid infinite loop
// useEffect(() => {
//   const cacheBuster = `?cacheBuster=${Date.now()}-${retryCount}`;
//   addDebugMessage(`Creating HTML with URL: ${streamUrl}${cacheBuster}`);
// }, [retryCount, streamUrl]); // Get status info
// const getStatusColor = () => {
//   if (hasError) return "#ff4d4d"; // Red
//   if (isLoading) return "#ffaa00"; // Yellow
//   return "#4caf50"; // Green
// };

// const getStatusText = () => {
//   if (hasError) return "Disconnected";
//   if (isLoading) return "Connecting...";
//   return "Live Feed";
// };
import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  ScrollView,
} from "react-native";
import { ThemedText } from "./ThemedText";
import { WebView } from "react-native-webview";

export function VideoFeed() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(true); // Set to true for debugging
  const [connectionStartTime, setConnectionStartTime] = useState<number | null>(
    null
  );

  // Stream URL
  const streamUrl = "http://192.168.1.102:8080";

  // Reference to WebView
  const webViewRef = useRef<WebView>(null);

  // Add debug message with timestamp
  const addDebugMessage = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const newMessage = `${timestamp}: ${message}`;
    console.log(`DEBUG: ${newMessage}`);
    setDebugInfo((prev) => [newMessage, ...prev].slice(0, 20)); // Keep last 20 messages
  };

  // HTML content that properly handles MJPEG streams
  const getHtmlContent = () => {
    // Add a random parameter to avoid caching issues
    const cacheBuster = `?cacheBuster=${Date.now()}-${retryCount}`;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { 
              width: 100%; 
              height: 100%; 
              overflow: hidden; 
              background-color: #000000;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            #stream-container {
              width: 100%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              overflow: hidden;
            }
            #stream {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }
            .hidden { display: none; }
            #error {
              color: #ff4d4d;
              font-family: system-ui, -apple-system, sans-serif;
              text-align: center;
              padding: 20px;
              display: none;
            }
            #loading {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              background-color: rgba(0,0,0,0.7);
              color: white;
              font-family: system-ui, -apple-system, sans-serif;
            }
            #debug {
              position: absolute;
              bottom: 10px;
              left: 10px;
              right: 10px;
              color: yellow;
              font-family: monospace;
              font-size: 10px;
              z-index: 1000;
              background-color: rgba(0,0,0,0.7);
              padding: 5px;
              border-radius: 5px;
              max-height: 100px;
              overflow-y: auto;
            }
          </style>
        </head>
        <body>
          <div id="stream-container">
            <img id="stream" src="${streamUrl}${cacheBuster}" />
            <div id="error">Failed to connect to camera stream</div>
            <div id="loading">
              <div>Connecting...</div>
            </div>
          </div>
          
          <div id="debug"></div>

          <script>
            // Flag to track if we've already sent the loading message
            let loadingMessageSent = false;
            let errorMessageSent = false;
            let connectionAttempt = 1;
            
            const streamImg = document.getElementById('stream');
            const loadingElement = document.getElementById('loading');
            const errorElement = document.getElementById('error');
            const debugElement = document.getElementById('debug');
            let connectionTimeout;
            let reconnectTimeout;
            let isConnected = false;
            
            // Debug log function
            function debugLog(message) {
              const timestamp = new Date().toLocaleTimeString();
              const logMessage = timestamp + ': ' + message;
              console.log(logMessage);
              
              const newLine = document.createElement('div');
              newLine.textContent = logMessage;
              debugElement.insertBefore(newLine, debugElement.firstChild);
              
              // Limit to 10 messages
              while (debugElement.children.length > 10) {
                debugElement.removeChild(debugElement.lastChild);
              }
              
              // Send to React Native (only important messages)
              window.ReactNativeWebView.postMessage('debug:' + logMessage);
            }
            
            // Send loading message only once
            if (!loadingMessageSent) {
              debugLog('Initializing stream connection (attempt ' + connectionAttempt + ')');
              window.ReactNativeWebView.postMessage('loading');
              loadingMessageSent = true;
            }
            
            // Handle successful connection
            streamImg.onload = function() {
              debugLog('Stream loaded successfully');
              clearTimeout(connectionTimeout);
              loadingElement.style.display = 'none';
              errorElement.style.display = 'none';
              streamImg.style.display = 'block';
              isConnected = true;
              window.ReactNativeWebView.postMessage('connected');
            };
            
            // Handle connection error
            streamImg.onerror = function(e) {
              const errorMsg = e && e.message ? e.message : 'Unknown error';
              debugLog('Stream error: ' + errorMsg);
              loadingElement.style.display = 'none';
              errorElement.style.display = 'block';
              streamImg.style.display = 'none';
              isConnected = false;
              
              // Only send error message once
              if (!errorMessageSent) {
                window.ReactNativeWebView.postMessage('error');
                errorMessageSent = true;
              }
              
              // Try to reconnect every 5 seconds, but limit number of reconnect attempts
              debugLog('Will attempt reconnection in 5 seconds');
              clearTimeout(reconnectTimeout);
              if (connectionAttempt < 5) {
                reconnectTimeout = setTimeout(reconnect, 5000);
              } else {
                debugLog('Maximum reconnection attempts reached');
              }
            };
            
            // Set a timeout to detect if connection is taking too long
            debugLog('Setting connection timeout (10s)');
            connectionTimeout = setTimeout(function() {
              if (!isConnected) {
                debugLog('Connection timed out after 10s');
                streamImg.onerror(new Error('Connection timeout'));
              }
            }, 10000);
            
            // Function to attempt reconnection
            function reconnect() {
              connectionAttempt++;
              debugLog('Attempting to reconnect to stream (attempt ' + connectionAttempt + ')');
              loadingElement.style.display = 'flex';
              errorElement.style.display = 'none';
              // Add timestamp to force refresh
              const timestamp = new Date().getTime();
              const newSrc = "${streamUrl}${cacheBuster}&reconnect=" + timestamp;
              debugLog('New stream URL: ' + newSrc);
              streamImg.src = newSrc;
              window.ReactNativeWebView.postMessage('reconnecting');
            }
            
            // Check if image is actually an MJPEG stream
            setTimeout(function() {
              if (streamImg.naturalWidth === 0) {
                debugLog('Warning: Image has no width, might not be loading correctly');
              } else {
                debugLog('Image has dimensions: ' + streamImg.naturalWidth + 'x' + streamImg.naturalHeight);
              }
              
              // Test if we can fetch the URL directly
              fetch('${streamUrl}', { method: 'HEAD' })
                .then(response => {
                  debugLog('Fetch test: ' + response.status + ' ' + response.statusText);
                  debugLog('Content-Type: ' + response.headers.get('content-type'));
                })
                .catch(err => {
                  debugLog('Fetch test failed: ' + err.message);
                });
            }, 2000);
            
            // Handle visibility changes
            document.addEventListener('visibilitychange', function() {
              debugLog('Visibility changed: ' + document.visibilityState);
              if (document.visibilityState === 'visible' && !isConnected) {
                reconnect();
              }
            });
            
            // Force reconnect when orientation changes
            window.addEventListener('orientationchange', function() {
              debugLog('Orientation changed');
              if (!isConnected) {
                setTimeout(reconnect, 500);
              }
            });
          </script>
        </body>
      </html>
    `;
  };

  // Handle messages from WebView with load throttling
  const handleMessage = (event: any) => {
    const message = event.nativeEvent.data;

    // Check if it's a debug message
    if (message.startsWith("debug:")) {
      addDebugMessage(`WebView: ${message.substring(6)}`);
      return;
    }

    // Prevent excessive logging of the same message
    addDebugMessage(`Received message from WebView: ${message}`);

    switch (message) {
      case "loading":
        // Only update state if we're not already loading to prevent loops
        if (!isLoading) {
          setIsLoading(true);
          setHasError(false);
          setConnectionStartTime(Date.now());
        }
        break;
      case "connected":
        {
          setIsLoading(false);
          setHasError(false);
          const connectTime = connectionStartTime
            ? (Date.now() - connectionStartTime) / 1000
            : 0;
          addDebugMessage(`Connected in ${connectTime.toFixed(1)}s`);
        }
        break;
      case "error":
        if (!hasError) {
          // Only update if state would change
          setIsLoading(false);
          setHasError(true);
          addDebugMessage("Connection failed");
        }
        break;
      case "reconnecting":
        setIsLoading(true);
        setHasError(false);
        addDebugMessage("Attempting to reconnect");
        setConnectionStartTime(Date.now());
        break;
    }
  };

  // Manual retry function
  const handleRetry = () => {
    addDebugMessage("Manual retry initiated");
    setRetryCount((prev) => prev + 1);
    setIsLoading(true);
    setHasError(false);
    setConnectionStartTime(Date.now());

    webViewRef.current?.reload();
  };

  // Test direct fetch to stream URL
  useEffect(() => {
    const testStreamUrl = async () => {
      try {
        addDebugMessage(`Testing direct fetch to ${streamUrl}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(streamUrl, {
          method: "HEAD",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        addDebugMessage(
          `Fetch response: ${response.status} ${response.statusText}`
        );

        // Check content type
        const contentType =
          response.headers.get("content-type") ?? "not specified";
        addDebugMessage(`Content-Type: ${contentType}`);

        if (contentType.includes("multipart/x-mixed-replace")) {
          addDebugMessage("✅ Confirmed MJPEG stream format");
        } else {
          addDebugMessage(
            `⚠️ Not an MJPEG stream. Content type: ${contentType}`
          );
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        const isTimeout = error instanceof Error && error.name === "AbortError";

        if (isTimeout) {
          addDebugMessage("❌ Fetch test timed out after 5s");
        } else {
          addDebugMessage(`❌ Fetch test error: ${errorMessage}`);
        }
      }
    };

    testStreamUrl();
  }, [streamUrl, retryCount]);

  // Get status info
  const getStatusColor = () => {
    if (hasError) return "#ff4d4d"; // Red
    if (isLoading) return "#ffaa00"; // Yellow
    return "#4caf50"; // Green
  };

  const getStatusText = () => {
    if (hasError) return "Disconnected";
    if (isLoading) return "Connecting...";
    return "Live Feed";
  };

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        <WebView
          key={`webview-${retryCount}`} // Add key to force re-creation on retry
          ref={webViewRef}
          originWhitelist={["*"]}
          source={{ html: getHtmlContent() }}
          style={styles.webView}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          mixedContentMode="always"
          cacheEnabled={false}
          // Hide the loading view since we have our own
          startInLoadingState={false}
          // Prevent user scrolling/zooming
          scrollEnabled={false}
          bounces={false}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            addDebugMessage(`WebView error: ${nativeEvent.description}`);
            setHasError(true);
            setIsLoading(false);
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            addDebugMessage(`HTTP Error: ${nativeEvent.statusCode}`);
          }}
        />
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.statusBar}>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: getStatusColor() },
            ]}
          />
          <ThemedText style={styles.statusText}>{getStatusText()}</ThemedText>
        </View>

        {hasError && (
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <ThemedText style={styles.retryText}>Retry Connection</ThemedText>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.debugButton}
          onPress={() => {
            // Force direct URL check
            addDebugMessage(`Trying direct URL test of: ${streamUrl}`);
            fetch(streamUrl, { method: "HEAD" })
              .then((response) => {
                addDebugMessage(
                  `Direct URL response: ${response.status} ${response.statusText}`
                );
                const contentType =
                  response.headers.get("content-type") ?? "not specified";
                addDebugMessage(`Content-Type: ${contentType}`);
              })
              .catch((error) => {
                addDebugMessage(`Direct fetch failed: ${error.message}`);
              });

            setShowDebug(!showDebug);
          }}
        >
          <ThemedText style={styles.debugButtonText}>
            {showDebug ? "Hide Debug" : "Show Debug"}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {isLoading && !hasError && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <ThemedText style={styles.loadingText}>
            Connecting to drone camera...
          </ThemedText>
        </View>
      )}

      {showDebug && (
        <View style={styles.debugPanel}>
          <ScrollView style={styles.debugScroll}>
            {debugInfo.map((message, i) => (
              <Text key={`debug-${i}`} style={styles.debugText}>
                {message}
              </Text>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  videoContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  webView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  controlsContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  statusBar: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
  retryButton: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  retryText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    zIndex: 5,
  },
  loadingText: {
    color: "#ffffff",
    marginTop: 10,
    fontSize: 16,
  },
  debugPanel: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 5,
    padding: 5,
    maxHeight: 150,
    zIndex: 100,
  },
  debugScroll: {
    flex: 1,
  },
  debugText: {
    color: "#ffff00",
    fontFamily: "monospace",
    fontSize: 10,
    marginVertical: 1,
  },
  debugButton: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  debugButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
});
