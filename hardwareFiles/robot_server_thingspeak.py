#!/usr/bin/env python3
import serial
import time
import threading
import requests
from datetime import datetime
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

# Set up serial connection to Arduino
# You may need to adjust the port and baud rate to match your setup
# Common Raspberry Pi serial ports: /dev/ttyACM0, /dev/ttyUSB0
serial_port = '/dev/ttyUSB0'  
baud_rate = 9600

# ADDED: ThingSpeak Configuration
THINGSPEAK_API_KEY = "AI8CHLFS0GP61AC2"  # Replace with your actual API key
THINGSPEAK_UPDATE_INTERVAL = 1  # Seconds between updates (15s minimum for free accounts)

# ADDED: Global variables to track robot state
robot_state = {
    "direction": "S",  # Stopped
    "speed": 128,      # Default mid-speed
    "timestamp": datetime.now().isoformat(),
    "voltage": 0,      # Battery voltage or other sensor data
    "connection_status": "disconnected"
}

try:
    ser = serial.Serial(serial_port, baud_rate, timeout=1)
    print(f"Connected to Arduino on {serial_port}")
    time.sleep(2)  # Allow time for Arduino to reset after serial connection
    robot_state["connection_status"] = "connected"  # ADDED
except Exception as e:
    print(f"Error connecting to Arduino: {e}")
    print("Running in demo mode - commands will be printed but not sent")
    ser = None
    robot_state["connection_status"] = "demo"  # ADDED

# ADDED: Function to update ThingSpeak
# Update the ThingSpeak function with these improvements:

def update_thingspeak():
    """Send robot data to ThingSpeak with improved error handling"""
    global robot_state
    
    # Convert direction to numeric value for easier charting
    direction_map = {"F": 1, "B": 2, "L": 3, "R": 4, "S": 0}
    direction_value = direction_map.get(robot_state["direction"], 0)
    
    # Ensure all values are numeric and properly formatted
    try:
        speed = int(robot_state["speed"])
    except (ValueError, TypeError):
        speed = 0
        
    try:
        voltage = float(robot_state["voltage"])
    except (ValueError, TypeError):
        voltage = 0.0
    
    connection_status = 1 if robot_state["connection_status"] == "connected" else 0
    
    # Prepare data payload with explicit numeric values
    params = {
        "api_key": THINGSPEAK_API_KEY,
        "field1": direction_value,
        "field2": speed,
        "field3": voltage,
        "field4": connection_status
    }
    
    try:
        # Add verbose logging to diagnose the issue
        print(f"Sending to ThingSpeak: {params}")
        
        # Use a session for better connection handling
        session = requests.Session()
        response = session.post("https://api.thingspeak.com/update", data=params, timeout=10)
        
        # Get the actual response content
        result = response.text.strip()
        print(f"ThingSpeak response: {response.status_code}, Entry: '{result}'")
        
        # Check if the result is a positive number (successful entry)
        if result.isdigit() and int(result) > 0:
            print(f"Successfully logged entry #{result} to ThingSpeak")
            return True
        else:
            print(f"ThingSpeak error: Got entry number {result}")
            
            # Check for rate limiting
            if "15" in response.headers.get('X-Rate-Limit-Remaining', ''):
                print("Possible rate limiting - ThingSpeak requires 15s between updates")
                
            return False
            
    except Exception as e:
        print(f"Error updating ThingSpeak: {e}")
        return False
        
# ADDED: ThingSpeak background updater thread
def thingspeak_updater():
    while True:
        update_thingspeak()
        time.sleep(THINGSPEAK_UPDATE_INTERVAL)

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/command', methods=['POST'])
def send_command():
    global robot_state  # ADDED
    data = request.get_json()
    if not data or 'command' not in data:
        return jsonify({'status': 'error', 'message': 'No command provided'}), 400
    
    command = data['command']
    
    # ADDED: Update robot state
    if len(command) >= 1:
        robot_state["direction"] = command[0]
        if len(command) > 1:
            try:
                robot_state["speed"] = int(command[1:])
            except ValueError:
                pass
    
    robot_state["timestamp"] = datetime.now().isoformat()
    
    # Send command to Arduino
    if ser:
        try:
            # Add newline to ensure Arduino reads the command
            ser.write(f"{command}\n".encode())
            # Wait for response from Arduino
            time.sleep(0.1)
            response = ser.readline().decode().strip()
            
            # ADDED: Check if response contains voltage or other sensor data
            if ":" in response:
                parts = response.split(":")
                if len(parts) >= 2 and parts[0] == "V":
                    try:
                        robot_state["voltage"] = float(parts[1])
                    except ValueError:
                        pass
            
            return jsonify({'status': 'success', 'response': response})
        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e)}), 500
    else:
        # Demo mode - just print the command
        print(f"Would send command: {command}")
        return jsonify({'status': 'demo', 'message': f'Demo mode: {command}'}), 200

@app.route('/api/status', methods=['GET'])
def get_status():
    global robot_state  # ADDED
    if ser:
        try:
            ser.write("O\n".encode())  # Send online check command
            time.sleep(0.1)
            response = ser.readline().decode().strip()
            robot_state["connection_status"] = "connected"  # ADDED
            return jsonify({'status': 'connected', 'response': response})
        except Exception as e:
            robot_state["connection_status"] = "disconnected"  # ADDED
            return jsonify({'status': 'error', 'message': str(e)}), 500
    else:
        robot_state["connection_status"] = "demo"  # ADDED
        return jsonify({'status': 'demo', 'message': 'Running in demo mode'}), 200

# ADDED: New ThingSpeak endpoints
@app.route('/api/thingspeak/update', methods=['GET'])
def manual_thingspeak_update():
    """Manually trigger ThingSpeak update"""
    success = update_thingspeak()
    return jsonify({
        'status': 'success' if success else 'error',
        'message': 'ThingSpeak updated' if success else 'Failed to update ThingSpeak'
    })

# ADDED: Endpoint to get ThingSpeak information
@app.route('/api/thingspeak/info', methods=['GET'])
def get_thingspeak_info():
    """Return ThingSpeak configuration information"""
    # Safely generate a channel ID from the API key if possible
    if '-' in THINGSPEAK_API_KEY:
        channel_id = THINGSPEAK_API_KEY.split('-')[0]
    else:
        channel_id = "unknown"
        
    return jsonify({
        'channel_id': channel_id,
        'update_interval': THINGSPEAK_UPDATE_INTERVAL,
        'thingspeak_url': f"https://thingspeak.com/channels/{channel_id}",
        'fields': {
            'field1': 'Direction (0=Stop, 1=Forward, 2=Back, 3=Left, 4=Right)',
            'field2': 'Speed (0-255)',
            'field3': 'Voltage',
            'field4': 'Connection Status (0=Disconnected, 1=Connected)'
        }
    })

# ADDED: Endpoint to get current robot state
@app.route('/api/robot/state', methods=['GET'])
def get_robot_state():
    """Return the current robot state"""
    return jsonify(robot_state)

if __name__ == '__main__':
    # Create templates directory and HTML file if they don't exist
    import os
    if not os.path.exists('templates'):
        os.makedirs('templates')
    
    # Create a basic HTML interface
    with open('templates/index.html', 'w') as f:
        f.write('''
<!DOCTYPE html>
<html>
<head>
    <title>Robot Control</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            margin: 0;
            padding: 20px;
        }
        .control-panel {
            max-width: 500px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ccc;
            border-radius: 10px;
            background: #f9f9f9;
        }
        .direction-controls {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            grid-template-rows: 1fr 1fr 1fr;
            gap: 10px;
            margin-bottom: 20px;
        }
        .control-btn {
            padding: 20px;
            font-size: 18px;
            border-radius: 5px;
            border: 1px solid #ddd;
            background: #fff;
            cursor: pointer;
        }
        .control-btn:active {
            background: #eee;
        }
        .speed-control {
            margin-bottom: 20px;
        }
        .response {
            min-height: 50px;
            border: 1px solid #ddd;
            padding: 10px;
            margin-top: 20px;
            text-align: left;
            background: #fff;
        }
        .status {
            padding: 5px;
            border-radius: 5px;
            display: inline-block;
            margin-bottom: 10px;
        }
        .connected {
            background: #d4edda;
            color: #155724;
        }
        .disconnected {
            background: #f8d7da;
            color: #721c24;
        }
        /* ADDED: ThingSpeak section */
        .thingspeak-info {
            margin-top: 20px;
            padding: 10px;
            background: #e9ecef;
            border-radius: 5px;
            text-align: left;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <h1>Robot Control Panel</h1>
    
    <div class="control-panel">
        <div id="statusIndicator" class="status disconnected">Disconnected</div>
        
        <div class="direction-controls">
            <button class="control-btn" style="grid-column: 1; grid-row: 1;" onclick="sendCommand('L')">?</button>
            <button class="control-btn" style="grid-column: 2; grid-row: 1;" onclick="sendCommand('F')">?</button>
            <button class="control-btn" style="grid-column: 3; grid-row: 1;" onclick="sendCommand('R')">?</button>
            
            <button class="control-btn" style="grid-column: 1; grid-row: 2;" onclick="sendCommand('L')">?</button>
            <button class="control-btn" style="grid-column: 2; grid-row: 2;" onclick="sendCommand('S')">?</button>
            <button class="control-btn" style="grid-column: 3; grid-row: 2;" onclick="sendCommand('R')">?</button>
            
            <button class="control-btn" style="grid-column: 1; grid-row: 3;" onclick="sendCommand('L')">?</button>
            <button class="control-btn" style="grid-column: 2; grid-row: 3;" onclick="sendCommand('B')">?</button>
            <button class="control-btn" style="grid-column: 3; grid-row: 3;" onclick="sendCommand('R')">?</button>
        </div>
        
        <div class="speed-control">
            <label for="speedSlider">Speed: <span id="speedValue">128</span></label>
            <input type="range" id="speedSlider" min="0" max="255" value="128" oninput="updateSpeed(this.value)">
        </div>
        
        <div class="response" id="responseArea">Response will appear here...</div>
        
        <!-- ADDED: ThingSpeak information section -->
        <div class="thingspeak-info" id="thingspeakInfo">
            ThingSpeak data logging active. <a href="#" id="thingspeakLink" target="_blank">View on ThingSpeak</a>
            <div><button onclick="updateThingSpeak()">Force ThingSpeak Update</button></div>
        </div>
    </div>
    
    <script>
        let currentSpeed = 128;
        
        function updateSpeed(speed) {
            currentSpeed = speed;
            document.getElementById('speedValue').textContent = speed;
        }
        
        function sendCommand(direction) {
            const command = direction + currentSpeed;
            
            fetch('/api/command', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ command: command }),
            })
            .then(response => response.json())
            .then(data => {
                document.getElementById('responseArea').textContent = 
                    `Command: ${command}\nResponse: ${JSON.stringify(data)}`;
            })
            .catch((error) => {
                document.getElementById('responseArea').textContent = 
                    `Error: ${error}`;
            });
        }
        
        // ADDED: Function to manually update ThingSpeak
        function updateThingSpeak() {
            fetch('/api/thingspeak/update')
                .then(response => response.json())
                .then(data => {
                    alert(data.message);
                })
                .catch(error => {
                    alert('Error updating ThingSpeak: ' + error);
                });
        }
        
        // ADDED: Get ThingSpeak info
        function getThingSpeakInfo() {
            fetch('/api/thingspeak/info')
                .then(response => response.json())
                .then(data => {
                    const link = document.getElementById('thingspeakLink');
                    link.href = data.thingspeak_url;
                })
                .catch(error => {
                    console.error('Error getting ThingSpeak info:', error);
                });
        }
        
        // Check connection status periodically
        function checkStatus() {
            fetch('/api/status')
            .then(response => response.json())
            .then(data => {
                const statusElement = document.getElementById('statusIndicator');
                if (data.status === 'connected') {
                    statusElement.textContent = 'Connected';
                    statusElement.className = 'status connected';
                } else {
                    statusElement.textContent = data.status === 'demo' ? 'Demo Mode' : 'Disconnected';
                    statusElement.className = 'status disconnected';
                }
            })
            .catch(() => {
                const statusElement = document.getElementById('statusIndicator');
                statusElement.textContent = 'Disconnected';
                statusElement.className = 'status disconnected';
            });
        }
        
        // Check status immediately and then every 5 seconds
        checkStatus();
        setInterval(checkStatus, 5000);
        
        // ADDED: Get ThingSpeak info on load
        getThingSpeakInfo();
        
        // Add keyboard controls
        document.addEventListener('keydown', function(event) {
            switch(event.key) {
                case 'ArrowUp':
                    sendCommand('F');
                    break;
                case 'ArrowDown':
                    sendCommand('B');
                    break;
                case 'ArrowLeft':
                    sendCommand('L');
                    break;
                case 'ArrowRight':
                    sendCommand('R');
                    break;
                case ' ':  // Space bar
                    sendCommand('S');
                    break;
            }
        });
    </script>
</body>
</html>
        ''')
    
    # ADDED: Start ThingSpeak background updater thread
    print(f"Starting ThingSpeak logger with API key: {THINGSPEAK_API_KEY}")
    print(f"Data will be updated every {THINGSPEAK_UPDATE_INTERVAL} seconds")
    thingspeak_thread = threading.Thread(target=thingspeak_updater, daemon=True)
    thingspeak_thread.start()
    
    # Run the server on all network interfaces
    app.run(host='0.0.0.0', port=5000, debug=True)
