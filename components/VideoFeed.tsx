import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";

export function VideoFeed() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Stream URL - replace with your Raspberry Pi's IP
  const streamUrl = "http://192.168.1.102:8080";

  // This HTML implementation handles stream reconnection directly in JS
  // which is more reliable than having React Native manage it
  const streamHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { 
            width: 100%; height: 100%; 
            background: #000;
            overflow: hidden;
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
            position: relative;
          }
          #stream {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }
          #status {
            position: absolute;
            bottom: 10px;
            left: 10px;
            background: rgba(0,0,0,0.5);
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            opacity: 0;
            transition: opacity 0.5s;
          }
          .show { opacity: 1 !important; }
        </style>
      </head>
      <body>
        <div id="stream-container">
          <img id="stream" 
               src="${streamUrl}/stream?nocache=${Date.now()}" 
               onerror="onStreamError()" 
               onload="onStreamLoaded()" />
          <div id="status">Connecting...</div>
        </div>
        
        <script>
          let reconnectAttempts = 0;
          let reconnectTimeout = null;
          let statusTimeout = null;
          const statusEl = document.getElementById('status');
          const streamEl = document.getElementById('stream');
          
          function showStatus(message, duration = 3000) {
            statusEl.textContent = message;
            statusEl.classList.add('show');
            
            clearTimeout(statusTimeout);
            statusTimeout = setTimeout(() => {
              statusEl.classList.remove('show');
            }, duration);
          }
          
          function onStreamLoaded() {
            reconnectAttempts = 0;
            window.ReactNativeWebView.postMessage('connected');
            showStatus('Connected');
            
            // Check if image is actually loaded properly
            if (streamEl.naturalWidth > 0) {
              showStatus('Stream active');
            }
          }
          
          function onStreamError() {
            reconnectAttempts++;
            window.ReactNativeWebView.postMessage('error');
            showStatus('Connection error - retrying...', 10000);
            
            // Clear any existing reconnect timers
            clearTimeout(reconnectTimeout);
            
            // Calculate backoff time
            const delay = Math.min(reconnectAttempts * 1000, 5000);
            
            // Set up reconnection with backoff
            reconnectTimeout = setTimeout(() => {
              showStatus('Reconnecting...');
              window.ReactNativeWebView.postMessage('reconnecting');
              // Force reload with cache busting
              streamEl.src = "${streamUrl}/stream?nocache=" + Date.now();
            }, delay);
          }
          
          // Initial status
          showStatus('Connecting...', 10000);
          
          // Check stream health periodically
          setInterval(() => {
            if (streamEl.naturalWidth === 0 && isConnected) {
              // Stream is broken but we think it's connected
              onStreamError();
            }
          }, 5000);
          
          // Tell React we're initialized
          window.ReactNativeWebView.postMessage('initialized');
        </script>
      </body>
    </html>
  `;

  const handleRetry = () => {
    setIsLoading(true);
    setRetryCount((prev) => prev + 1);
  };

  return (
    <View style={styles.container}>
      <WebView
        key={`webview-${retryCount}`}
        source={{ html: streamHtml }}
        style={styles.webView}
        onMessage={(event) => {
          const { data } = event.nativeEvent;
          if (data === "connected") {
            setIsConnected(true);
            setIsLoading(false);
          } else if (data === "error") {
            setIsConnected(false);
            if (!isLoading) {
              setIsLoading(true);
            }
          } else if (data === "reconnecting") {
            setIsLoading(true);
          } else if (data === "initialized") {
            console.log("WebView initialized");
          }
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        startInLoadingState={false}
        originWhitelist={["*"]}
        scalesPageToFit={Platform.OS === "android"}
        scrollEnabled={false}
        bounces={false}
        cacheEnabled={false}
        incognito={true}
      />

      {isLoading && (
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>
            {isConnected ? "Reconnecting..." : "Connecting to camera..."}
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.refreshButton} onPress={handleRetry}>
        <Text style={styles.buttonText}>↻</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  webView: {
    flex: 1,
    backgroundColor: "#000",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    padding: 20,
  },
  refreshButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 24,
  },
});
