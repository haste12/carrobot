export const ARDUINO_FILENAME = "hasti.ino";

export const ARDUINO_CODE = `/*
  ============================================================================
   hasti.ino  —  Hasti's autonomous obstacle-avoiding car
  ============================================================================
   Board   : Arduino UNO
   Driver  : L298N (ENA/ENB jumpers removed -> PWM speed control)
             Channel A = rear drive motor (forward / backward)
             Channel B = front steering motor (spring-return, NOT a servo)
   Sensors : 3x HC-SR04 — front, front-left (~45°), front-right (~45°)
   Power   : 2x 18650 (7.4 V) -> L298N, common GND

   Modes   : STARTUP -> FORWARD -> BRAKE -> REVERSE -> TURN -> FORWARD
   Note    : In FORWARD the speed fades smoothly from cruise to slow
             between SLOW_CM and STOP_CM.
  ============================================================================
*/

// ============================================================================
//  PINS  (layout for Hasti's car — change here if your wiring is different)
//        Motors on the digital side, sensors on A0..A5 (used as digital pins).
// ============================================================================
const uint8_t PIN_NOT_SET = 255;   // marker for an unused/unset pin

// --- L298N channel A : rear DRIVE motor ---
const uint8_t PIN_ENA = 5;    // PWM pin required (UNO: 3, 5, 6, 9, 10, 11)
const uint8_t PIN_IN1 = 7;
const uint8_t PIN_IN2 = 8;

// --- L298N channel B : front STEERING motor ---
const uint8_t PIN_ENB = 6;    // PWM pin required (UNO: 3, 5, 6, 9, 10, 11)
const uint8_t PIN_IN3 = 9;
const uint8_t PIN_IN4 = 4;

// --- HC-SR04 sensors ---
const uint8_t PIN_TRIG_FRONT = A0;
const uint8_t PIN_ECHO_FRONT = A1;
const uint8_t PIN_TRIG_LEFT  = A2;
const uint8_t PIN_ECHO_LEFT  = A3;
const uint8_t PIN_TRIG_RIGHT = A4;
const uint8_t PIN_ECHO_RIGHT = A5;


// ============================================================================
//  TUNING
// ============================================================================

// ---- Motor power (0-255) ----
const uint8_t CRUISE_SPEED       = 250;  // open-road speed
const uint8_t SLOW_SPEED         = 150;  // lowest forward speed (also used in TURN)
const uint8_t REVERSE_SPEED      = 200;  // back-up speed after the kick
const uint8_t STEER_POWER        = 200;  // full steering lock
const uint8_t GENTLE_STEER_POWER = 150;  // (extra) soft correction away from side walls

// ---- Distances (cm) ----
const uint16_t STOP_CM          = 50;   // brake below this
const uint16_t SLOW_CM          = 100;  // start slowing below this
const uint16_t SIDE_CM          = 40;   // side wall "too close"
const uint16_t CLEAR_CM         = 85;   // front clear enough to finish TURN (> STOP_CM)
const uint16_t STARTUP_CLEAR_CM = 85;   // front clear enough to start

// ---- Timing (ms) ----
const uint32_t STARTUP_DELAY_MS        = 2000;  // idle after power-on
const uint32_t STARTUP_CLEAR_MS        = 1000;  // front clear this long before first move
const uint32_t KICK_MS                 = 120;   // full-power pulse
const uint32_t BRAKE_TOTAL_MS          = 280;   // kick + hard brake
const uint32_t REVERSE_MS              = 550;   // normal back-up time
const uint32_t REVERSE_NARROW_EXTRA_MS = 250;   // (extra) both sides narrow
const uint32_t REVERSE_RETRY_EXTRA_MS  = 400;   // (extra) after MAX_RETRIES in a row
const uint32_t SHIFT_PAUSE_MS          = 60;    // (extra) brake between reverse and forward
const uint32_t TURN_MIN_MS             = 350;
const uint32_t TURN_MAX_MS             = 1200;
const uint8_t  MAX_RETRIES             = 4;
const uint32_t RETRY_RESET_MS          = 1500;  // (extra) good FORWARD run resets the counter

// ---- Direction fixes ----
const bool DRIVE_INVERT = false;   // true if "forward" drives backward
const bool STEER_INVERT = false;   // true if "left" steers right

// ---- Sensors ----
const uint16_t MAX_RANGE_CM    = 200;
const uint32_t ECHO_TIMEOUT_US = (uint32_t)MAX_RANGE_CM * 58UL + 400UL;   // ~12 ms
const uint8_t  SENSOR_GAP_MS   = 5;    // anti cross-talk pause
const uint8_t  MISSES_FOR_FREE = 2;    // "no echo" this many times in a row = free space

// ---- Debug ----
const uint32_t DEBUG_INTERVAL_MS = 250;

// ---- Sanity checks ----
static_assert(CLEAR_CM > STOP_CM,         "CLEAR_CM must be greater than STOP_CM");
static_assert(SLOW_CM > STOP_CM,          "SLOW_CM must be greater than STOP_CM");
static_assert(STARTUP_CLEAR_CM > STOP_CM, "STARTUP_CLEAR_CM must be greater than STOP_CM");
static_assert(MAX_RANGE_CM > CLEAR_CM,    "MAX_RANGE_CM must be greater than CLEAR_CM");
static_assert(CRUISE_SPEED >= SLOW_SPEED, "CRUISE_SPEED must be >= SLOW_SPEED");
static_assert(BRAKE_TOTAL_MS >= KICK_MS,  "BRAKE_TOTAL_MS must be >= KICK_MS");
static_assert(REVERSE_MS > KICK_MS,       "REVERSE_MS must be > KICK_MS");
static_assert(TURN_MAX_MS >= TURN_MIN_MS, "TURN_MAX_MS must be >= TURN_MIN_MS");
static_assert(MISSES_FOR_FREE >= 1,       "MISSES_FOR_FREE must be at least 1");


// ============================================================================
//  STATE
// ============================================================================
enum Mode : uint8_t { M_STARTUP, M_FORWARD, M_BRAKE, M_REVERSE, M_TURN };

// Steering directions
const int8_t DIR_LEFT   = -1;
const int8_t DIR_CENTER =  0;
const int8_t DIR_RIGHT  =  1;

// Sensor slots
const uint8_t EYE_FRONT = 0;
const uint8_t EYE_LEFT  = 1;
const uint8_t EYE_RIGHT = 2;

struct Eye {
  uint8_t  trig;
  uint8_t  echo;
  uint16_t cm;       // last accepted distance (starts at 0 = "blocked")
  uint8_t  misses;   // consecutive no-echo readings
};

Eye eyes[3] = {
  { PIN_TRIG_FRONT, PIN_ECHO_FRONT, 0, 0 },
  { PIN_TRIG_LEFT,  PIN_ECHO_LEFT,  0, 0 },
  { PIN_TRIG_RIGHT, PIN_ECHO_RIGHT, 0, 0 }
};

Mode     mode          = M_STARTUP;
uint32_t modeSince     = 0;          // millis() when the mode started
bool     clearing      = false;      // STARTUP: front is currently clear
uint32_t clearStart    = 0;          // STARTUP: when it became clear
int8_t   escapeDir     = DIR_RIGHT;  // side with more space
int8_t   prevEscapeDir = DIR_LEFT;   // for alternating on a tie
uint8_t  attempts      = 0;          // escape attempts in a row
uint32_t backupTime    = REVERSE_MS; // reverse time for this attempt
uint8_t  nextSideEye   = EYE_LEFT;   // side sensor to read next


// ============================================================================
//  MOTORS
// ============================================================================

// Rear motor: -255..255 (+ forward, - backward, 0 coast)
void drive(int power) {
  power = constrain(power, -255, 255);
  if (DRIVE_INVERT) power = -power;

  digitalWrite(PIN_IN1, power > 0 ? HIGH : LOW);
  digitalWrite(PIN_IN2, power < 0 ? HIGH : LOW);
  analogWrite(PIN_ENA, power >= 0 ? power : -power);
}

// Rear motor hard brake (both inputs HIGH, enable full on)
void brake() {
  digitalWrite(PIN_IN1, HIGH);
  digitalWrite(PIN_IN2, HIGH);
  analogWrite(PIN_ENA, 255);
}

// Steering: DIR_LEFT / DIR_RIGHT with power, DIR_CENTER = released (spring centers)
void steer(int8_t dir, uint8_t power) {
  if (STEER_INVERT) dir = (int8_t)(-dir);
  if (dir == DIR_CENTER) power = 0;

  digitalWrite(PIN_IN3, (power > 0 && dir < 0) ? HIGH : LOW);
  digitalWrite(PIN_IN4, (power > 0 && dir > 0) ? HIGH : LOW);
  analogWrite(PIN_ENB, power);
}

void halt() {
  drive(0);
  steer(DIR_CENTER, 0);
}

// Forward speed that fades from CRUISE (at SLOW_CM) down to SLOW (at STOP_CM)
uint8_t forwardSpeed(uint16_t frontCm) {
  if (frontCm >= SLOW_CM) return CRUISE_SPEED;
  if (frontCm <= STOP_CM) return SLOW_SPEED;
  const uint32_t span  = SLOW_CM - STOP_CM;
  const uint32_t extra = (uint32_t)(CRUISE_SPEED - SLOW_SPEED) * (frontCm - STOP_CM) / span;
  return (uint8_t)(SLOW_SPEED + extra);
}


// ============================================================================
//  SENSORS
// ============================================================================

// One ping; blocks for at most ECHO_TIMEOUT_US.
void pingEye(uint8_t i) {
  Eye &e = eyes[i];
  unsigned long us = 0;

  // ECHO still HIGH = sensor busy with an earlier unanswered ping -> skip, count a miss
  if (digitalRead(e.echo) == LOW) {
    digitalWrite(e.trig, LOW);
    delayMicroseconds(2);
    digitalWrite(e.trig, HIGH);
    delayMicroseconds(10);
    digitalWrite(e.trig, LOW);
    us = pulseIn(e.echo, HIGH, ECHO_TIMEOUT_US);
  }

  if (us > 0) {                                   // real echo -> use now
    const unsigned long cm = us / 58UL;
    e.cm = (cm > MAX_RANGE_CM) ? MAX_RANGE_CM : (uint16_t)cm;
    e.misses = 0;
  } else {                                        // no echo -> free only after N misses
    if (e.misses < 255) e.misses++;
    if (e.misses >= MISSES_FOR_FREE) e.cm = MAX_RANGE_CM;
  }
}

void pingNextSide() {
  pingEye(nextSideEye);
  nextSideEye = (nextSideEye == EYE_LEFT) ? EYE_RIGHT : EYE_LEFT;
}


// ============================================================================
//  STATE MACHINE
// ============================================================================

void setMode(Mode m) {
  mode = m;
  modeSince = millis();
}

void beginBrake() {
  if (attempts < 255) attempts++;
  steer(DIR_CENTER, 0);
  drive(-255);                  // reverse kick starts immediately
  setMode(M_BRAKE);
}

void pickEscapeDir() {
  const uint16_t l = eyes[EYE_LEFT].cm;
  const uint16_t r = eyes[EYE_RIGHT].cm;
  if (l > r)      escapeDir = DIR_LEFT;
  else if (r > l) escapeDir = DIR_RIGHT;
  else            escapeDir = (int8_t)(-prevEscapeDir);   // tie -> alternate
  prevEscapeDir = escapeDir;
}

void beginReverse() {
  backupTime = REVERSE_MS;
  if (eyes[EYE_LEFT].cm < SIDE_CM && eyes[EYE_RIGHT].cm < SIDE_CM) backupTime += REVERSE_NARROW_EXTRA_MS;
  if (attempts >= MAX_RETRIES) backupTime += REVERSE_RETRY_EXTRA_MS;
  setMode(M_REVERSE);
}

void updateMode() {
  const uint32_t now   = millis();
  const uint32_t inMode = now - modeSince;
  const uint16_t front = eyes[EYE_FRONT].cm;
  const uint16_t left  = eyes[EYE_LEFT].cm;
  const uint16_t right = eyes[EYE_RIGHT].cm;

  switch (mode) {

    case M_STARTUP:                       // wait 2 s, then 1 s of continuously clear front
      halt();
      if (inMode < STARTUP_DELAY_MS) break;
      if (front < STARTUP_CLEAR_CM) {
        clearing = false;
      } else if (!clearing) {
        clearing = true;
        clearStart = now;
      } else if (now - clearStart >= STARTUP_CLEAR_MS) {
        attempts = 0;
        setMode(M_FORWARD);
      }
      break;

    case M_FORWARD:                       // cruise, fade speed, avoid side walls
      if (front < STOP_CM) { beginBrake(); break; }
      if (attempts > 0 && inMode >= RETRY_RESET_MS) attempts = 0;

      drive(forwardSpeed(front));
      if (left < SIDE_CM && left <= right) steer(DIR_RIGHT, GENTLE_STEER_POWER);
      else if (right < SIDE_CM)            steer(DIR_LEFT,  GENTLE_STEER_POWER);
      else                                 steer(DIR_CENTER, 0);
      break;

    case M_BRAKE:                         // kick, hard brake, then choose side
      steer(DIR_CENTER, 0);
      if (inMode < KICK_MS)             drive(-255);
      else if (inMode < BRAKE_TOTAL_MS) brake();
      else { pickEscapeDir(); beginReverse(); }
      break;

    case M_REVERSE:                       // wheels opposite the escape side
      steer((int8_t)(-escapeDir), STEER_POWER);
      if (inMode < KICK_MS)                          drive(-255);
      else if (inMode < backupTime)                  drive(-(int)REVERSE_SPEED);
      else if (inMode < backupTime + SHIFT_PAUSE_MS) brake();
      else                                           setMode(M_TURN);
      break;

    case M_TURN:                          // creep toward the escape side
      if (front < STOP_CM) { beginBrake(); break; }
      steer(escapeDir, STEER_POWER);
      drive(SLOW_SPEED);
      if ((inMode >= TURN_MIN_MS && front >= CLEAR_CM) || inMode >= TURN_MAX_MS) setMode(M_FORWARD);
      break;
  }
}


// ============================================================================
//  DEBUG
// ============================================================================

const __FlashStringHelper *modeTag(Mode m) {
  switch (m) {
    case M_STARTUP: return F("[WAIT]");
    case M_FORWARD: return F("[FWD ]");
    case M_BRAKE:   return F("[BRK ]");
    case M_REVERSE: return F("[REV ]");
    case M_TURN:    return F("[TURN]");
  }
  return F("[ ?? ]");
}

void debugPrint() {
  static uint32_t lastMs = 0;
  const uint32_t now = millis();
  if (now - lastMs < DEBUG_INTERVAL_MS) return;
  lastMs = now;
  if (Serial.availableForWrite() < 48) return;   // never wait on Serial

  Serial.print(modeTag(mode));
  Serial.print(F(" L="));
  Serial.print(eyes[EYE_LEFT].cm);
  Serial.print(F(" F="));
  Serial.print(eyes[EYE_FRONT].cm);
  Serial.print(F(" R="));
  Serial.print(eyes[EYE_RIGHT].cm);
  Serial.print(F(" esc="));
  Serial.print(escapeDir < 0 ? 'L' : 'R');
  Serial.print(F(" n="));
  Serial.println(attempts);
}


// ============================================================================
//  SETUP
// ============================================================================

bool checkPins() {
  const uint8_t pins[] = {
    PIN_ENA, PIN_IN1, PIN_IN2, PIN_ENB, PIN_IN3, PIN_IN4,
    PIN_TRIG_FRONT, PIN_ECHO_FRONT, PIN_TRIG_LEFT, PIN_ECHO_LEFT,
    PIN_TRIG_RIGHT, PIN_ECHO_RIGHT
  };
  const char *const names[] = {
    "ENA", "IN1", "IN2", "ENB", "IN3", "IN4",
    "TRIG_FRONT", "ECHO_FRONT", "TRIG_LEFT", "ECHO_LEFT",
    "TRIG_RIGHT", "ECHO_RIGHT"
  };
  const uint8_t n = sizeof(pins) / sizeof(pins[0]);
  bool ok = true;

  for (uint8_t i = 0; i < n; i++) {
    if (pins[i] == PIN_NOT_SET) {
      Serial.print(F("Pin not set: PIN_")); Serial.println(names[i]);
      ok = false;
      continue;
    }
    if (pins[i] <= 1) {
      Serial.print(F("Pin 0/1 is Serial, do not use: PIN_")); Serial.println(names[i]);
      ok = false;
    }
    for (uint8_t j = i + 1; j < n; j++) {
      if (pins[i] == pins[j]) {
        Serial.print(F("Duplicate pin: PIN_")); Serial.print(names[i]);
        Serial.print(F(" = PIN_"));             Serial.println(names[j]);
        ok = false;
      }
    }
  }
#ifdef digitalPinHasPWM
  if (!digitalPinHasPWM(PIN_ENA)) { Serial.println(F("PIN_ENA is not a PWM pin")); ok = false; }
  if (!digitalPinHasPWM(PIN_ENB)) { Serial.println(F("PIN_ENB is not a PWM pin")); ok = false; }
#endif
  return ok;
}

void setup() {
  Serial.begin(115200);
  Serial.println(F("\\n=== Hasti's car ==="));

  if (!checkPins()) {
    Serial.println(F("Fix the PINS section. Motors disabled."));
    while (true) delay(1000);
  }

  const uint8_t outputs[] = { PIN_ENA, PIN_IN1, PIN_IN2, PIN_ENB, PIN_IN3, PIN_IN4 };
  for (uint8_t p : outputs) pinMode(p, OUTPUT);

  for (uint8_t i = 0; i < 3; i++) {
    pinMode(eyes[i].trig, OUTPUT);
    digitalWrite(eyes[i].trig, LOW);
    pinMode(eyes[i].echo, INPUT);
  }

  halt();
  setMode(M_STARTUP);
  Serial.println(F("Waiting 2 s, then for a clear front for 1 s..."));
}


// ============================================================================
//  LOOP  (front every loop, sides take turns; worst case ~35 ms per loop)
// ============================================================================
void loop() {
  pingEye(EYE_FRONT);
  updateMode();            // react right after the front reading
  delay(SENSOR_GAP_MS);

  pingNextSide();
  delay(SENSOR_GAP_MS);

  debugPrint();
}
`;
