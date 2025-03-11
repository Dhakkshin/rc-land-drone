#!/usr/bin/env python3
import http.server
import socketserver
import threading
import time
import os
import signal
import subprocess
import sys

# Global camera process that we'll keep alive
camera_process = None
frame_buffer = b''
frame_lock = threading.Lock()

class StreamingHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        global camera_process, frame_buffer
        
        if self.path == '/stream' or self.path.startswith('/stream?'):
            self.send_response(200)
            self.send_header('Age', '0')
            self.send_header('Cache-Control', 'no-cache, private')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Access-Control-Allow-Origin', '*')  # Allow cross-origin requests
            self.send_header('Content-Type', 'multipart/x-mixed-replace; boundary=FRAME')
            self.end_headers()
            
            try:
                while True:
                    # Get the latest frame from the buffer
                    with frame_lock:
                        if frame_buffer:
                            # Write the frame with proper headers
                            self.wfile.write(b'--FRAME\r\n')
                            self.send_header('Content-Type', 'image/jpeg')
                            self.send_header('Content-Length', str(len(frame_buffer)))
                            self.end_headers()
                            self.wfile.write(frame_buffer)
                            self.wfile.write(b'\r\n')
                            
                    # Add a short delay to prevent CPU overload
                    time.sleep(0.03)
            except BrokenPipeError:
                print("Client disconnected - normal behavior")
            except Exception as e:
                print(f"Streaming error: {e}")
                
        elif self.path == '/':
            # Serve a simple status page with embedded test viewer
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            
            self.wfile.write(b"""
            <html>
                <head>
                    <title>Raspberry Pi Camera Server</title>
                    <style>
                        body { font-family: Arial; margin: 20px; text-align: center; }
                        h1 { color: #333; }
                        .viewer { 
                            max-width: 640px; 
                            margin: 0 auto;
                            border: 1px solid #ccc;
                            background: #f0f0f0;
                            padding: 10px;
                        }
                        img { max-width: 100%; border: 1px solid #333; }
                    </style>
                </head>
                <body>
                    <h1>Raspberry Pi Camera Server</h1>
                    <div class="viewer">
                        <p>Live Camera Feed:</p>
                        <img src="/stream" />
                    </div>
                </body>
            </html>
            """)
        else:
            self.send_response(404)
            self.end_headers()

def capture_frames():
    """Continuously capture frames in a separate thread"""
    global camera_process, frame_buffer
    
    while True:
        try:
            # Start the camera if not running
            if camera_process is None or camera_process.poll() is not None:
                print("Starting camera capture...")
                # Use libcamera-vid to generate MJPEG frames
                cmd = ['libcamera-vid', 
                       '--width', '640', 
                       '--height', '480', 
                       '--framerate', '15',  # Lower framerate for stability
                       '--codec', 'mjpeg',
                       '--inline',
                       '--output', '-']
                
                camera_process = subprocess.Popen(cmd, stdout=subprocess.PIPE)
                
            # Read frame data - we need to detect JPEG boundaries
            jpg_start = b'\xff\xd8'  # JPEG start marker
            jpg_end = b'\xff\xd9'    # JPEG end marker
            
            buffer = b''
            start_idx = -1
            
            # Read data in chunks
            chunk = camera_process.stdout.read(1024)
            if not chunk:  # End of stream
                print("Camera process ended, restarting...")
                camera_process = None
                time.sleep(1)  # Wait before restart
                continue
                
            buffer += chunk
            
            # Look for complete JPEG frames
            while True:
                if start_idx == -1:
                    # Find the start of a JPEG
                    start_idx = buffer.find(jpg_start)
                    if start_idx == -1:
                        # No start marker found, get more data
                        buffer = buffer[-10:]  # Keep a small tail in case the marker is split
                        break
                
                # Look for end marker after the start marker
                end_idx = buffer.find(jpg_end, start_idx)
                if end_idx == -1:
                    # No end marker yet, get more data
                    chunk = camera_process.stdout.read(1024)
                    if not chunk:  # End of stream
                        break
                    buffer += chunk
                    continue
                
                # We have a complete frame
                frame = buffer[start_idx:end_idx+2]  # Include the end marker
                
                # Update the shared frame buffer
                with frame_lock:
                    frame_buffer = frame
                
                # Remove the processed frame from buffer
                buffer = buffer[end_idx+2:]
                start_idx = -1  # Look for next frame
        
        except Exception as e:
            print(f"Frame capture error: {e}")
            if camera_process:
                try:
                    camera_process.terminate()
                except:
                    pass
                camera_process = None
            time.sleep(1)  # Wait before restart

def cleanup(signum, frame):
    """Clean up on exit"""
    global camera_process
    if camera_process:
        camera_process.terminate()
    sys.exit(0)

# Set up signal handlers for clean exit
signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

# Start frame capture thread
threading.Thread(target=capture_frames, daemon=True).start()

# Start HTTP server
port = 8080
httpd = socketserver.ThreadingTCPServer(('', port), StreamingHandler)
httpd.daemon_threads = True  # Allow server to exit with daemon threads
print(f"Server started at http://0.0.0.0:{port}")

try:
    httpd.serve_forever()
except KeyboardInterrupt:
    cleanup(None, None)
