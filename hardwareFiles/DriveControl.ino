// Motor pin definitions
const int MOTOR_A1 = 5;  // Motor A Forward
const int MOTOR_A2 = 3;  // Motor A Backward
const int MOTOR_B1 = 6;  // Motor B Forward 
const int MOTOR_B2 = 11; // Motor B Backward
const int IR_Sensor_Back=7; //Backup IR Sensor
const int IR_Sensor_Cliff=8; //Cliff IR Sensor

String command;         // For storing serial input

void setup() {
 // Set motor pins as outputs
 pinMode(MOTOR_A1, OUTPUT);
 pinMode(MOTOR_A2, OUTPUT);
 pinMode(MOTOR_B1, OUTPUT);
 pinMode(MOTOR_B2, OUTPUT);
 pinMode(IR_Sensor_Back, INPUT);
 pinMode(IR_Sensor_Cliff, INPUT);
 
 Serial.begin(9600); // Start serial communication
 Serial.println("Motor Control Ready");
 Serial.println("IR Sensor Initialised");
 Serial.println("Commands: F (Forward), B (Backward), L (Left), R (Right), S (Stop)");
 Serial.println("Speed (0-255) after command. Example: F255");
}

int check_cliff(){
  int ir_cliff=digitalRead(IR_Sensor_Cliff);

  if(!ir_cliff){
    Serial.println("Cliff Detected");
    stop();
    return 1;
  }
}

int check_backup(){
  int ir_back=digitalRead(IR_Sensor_Back);

  if(ir_back){
    Serial.println("Objected at the back Detected");
    stop();
    return 1;
  }
}

void loop() {
 // Check if serial data is available
 if (Serial.available() > 0) {
   command = Serial.readStringUntil('\n'); // Read until newline
   executeCommand(command);
 }
}

// Execute motor commands based on serial input
void executeCommand(String command) {
 char direction = command.charAt(0);  // First character is direction
 int speed = command.substring(1).toInt(); // Rest is speed value
 
 // Limit speed between 0-255
 speed = constrain(speed, 0, 255);
 
 switch(direction) {
   case 'F':
   case 'f':
     forward(speed);
     Serial.println("Moving Forward at speed: " + String(speed));
     break;
     
   case 'B':
   case 'b':
     backward(speed);
     Serial.println("Moving Backward at speed: " + String(speed));
     break;
     
   case 'L':
   case 'l':
     turnLeft(speed);
     Serial.println("Turning Left at speed: " + String(speed));
     break;
     
   case 'R':
   case 'r':
     turnRight(speed);
     Serial.println("Turning Right at speed: " + String(speed));
     break;
     
   case 'S':
   case 's':
     stop();
     Serial.println("Stopped");
     break;

   case 'O':
   case '0':
     Serial.println("Online");
     break;
     
   default:
     Serial.println("Invalid command");
 }
}

// Motor control functions
void forward(int speed) {
 analogWrite(MOTOR_A1, speed);
 analogWrite(MOTOR_A2, 0);
 analogWrite(MOTOR_B1, speed);
 analogWrite(MOTOR_B2, 0);
}

void backward(int speed) {
 analogWrite(MOTOR_A1, 0);
 analogWrite(MOTOR_A2, speed);
 analogWrite(MOTOR_B1, 0);
 analogWrite(MOTOR_B2, speed);
}

void turnLeft(int speed) {
 analogWrite(MOTOR_A1, 0);
 analogWrite(MOTOR_A2, speed);
 analogWrite(MOTOR_B1, speed);
 analogWrite(MOTOR_B2, 0);
}

void turnRight(int speed) {
 analogWrite(MOTOR_A1, speed);
 analogWrite(MOTOR_A2, 0);
 analogWrite(MOTOR_B1, 0);
 analogWrite(MOTOR_B2, speed);
}

void stop() {
 analogWrite(MOTOR_A1, 0);
 analogWrite(MOTOR_A2, 0);
 analogWrite(MOTOR_B1, 0);
 analogWrite(MOTOR_B2, 0);
}
