/* ------------------------------ Materials ------------------------------ */

export interface MaterialItem {
  id: string;
  index: string;
  name: string;
  image: string;
  role: string;
  desc: string;
}

export const MATERIALS: MaterialItem[] = [
  {
    id: "body",
    index: "01",
    name: "4×4 Robot Car Body",
    image: "/images/components/4-wheel-Robot.jpg",
    role: "Chassis Platform",
    desc: "The structural foundation of the build — a four-wheel-drive robotic chassis carrying every module, sensor and the drivetrain.",
  },
  {
    id: "motors",
    index: "02",
    name: "DC Motors",
    image: "/images/components/Motor.jpg",
    role: "Propulsion",
    desc: "Motor is used to move the car. One motor drives each corner of the 4×4 drivetrain, delivering the torque the robot needs to patrol.",
  },
  {
    id: "l298n",
    index: "03",
    name: "L298N Motor Driver",
    image: "/images/components/Module motor.jpg",
    role: "Power Control",
    desc: "L298N Module is used to control the speed of the motor. It translates low-power Arduino signals into high-current drive for all four motors.",
  },
  {
    id: "arduino",
    index: "04",
    name: "Arduino UNO",
    image: "/images/components/Arduino_Uno.jpg",
    role: "Central Processor",
    desc: "Arduino UNO is used to control the car. Every sensor reading and motor command passes through this single board.",
  },
  {
    id: "ultrasonic",
    index: "05",
    name: "Ultrasonic Sensors ×3",
    image: "/images/components/Ultrasonic.jpg",
    role: "Obstacle Detection",
    desc: "Ultrasonic sensor is used to detect the obstacle. Three units cover the front, left and right sectors of the vehicle.",
  },
  {
    id: "wires",
    index: "06",
    name: "Jumper Wires",
    image: "/images/components/Jumper wire.jpg",
    role: "Signal Wiring",
    desc: "Jumper wires are used to connect the components of the car — the nervous system linking every sensor and module to the UNO.",
  },
  {
    id: "switch",
    index: "07",
    name: "Power Switch",
    image: "/images/components/Switch.jpg",
    role: "Power Management",
    desc: "Switch is used to turn on and off the car — a single control point for the robot's power rail.",
  },
];

/* ------------------------------ Team ------------------------------ */

export interface TeamMember {
  name: string;
  role: "Supervisor" | "Student";
  initials: string;
}

export const TEAM: TeamMember[] = [
  { name: "Dr Muhammad Tahir", role: "Supervisor", initials: "MT" },
  { name: "Haste Mohsin", role: "Student", initials: "HM" },
  { name: "Paiwand Peshawa", role: "Student", initials: "PP" },
];

/* ------------------------------ How it works ------------------------------ */

export interface ProcessStep {
  index: string;
  title: string;
  desc: string;
}

export const PROCESS_STEPS: ProcessStep[] = [
  {
    index: "01",
    title: "Sensors Ping",
    desc: "The front HC-SR04 fires every loop while the left and right eyes take turns behind a 5 ms anti-crosstalk gap.",
  },
  {
    index: "02",
    title: "Range Picture",
    desc: "Echo return times become centimetre distances. Two missed echoes in a row are required before open space is trusted.",
  },
  {
    index: "03",
    title: "Arduino Decides",
    desc: "The five-state machine watches the ranges — FORWARD fades speed smoothly, and anything under 50 cm triggers a brake.",
  },
  {
    index: "04",
    title: "Escape Picked",
    desc: "Left and right ranges are compared and the steering motor takes full lock toward the wider side — ties alternate.",
  },
  {
    index: "05",
    title: "Reverse & Turn",
    desc: "A timed back-up with counter-steer, then a creeping turn until the front eye reads clear again.",
  },
  {
    index: "06",
    title: "Loop Repeats",
    desc: "Sense, decide, act — the whole cycle runs in about 35 ms, dozens of times per second.",
  },
];
