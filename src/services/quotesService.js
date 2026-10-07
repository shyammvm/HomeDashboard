// Stark Industries & J.A.R.V.I.S. Wit & Directive Archive

export const FUN_STARK_QUOTES = [
  {
    quote: "Sir, I have compiled a comprehensive safety protocol for you to completely disregard.",
    author: "J.A.R.V.I.S.",
    role: "A.I. Butler & Systems Interface",
    tag: "PROTOCOL DISREGARD",
    color: "#00f0ff",
  },
  {
    quote: "Sometimes you gotta run before you can walk.",
    author: "Tony Stark",
    role: "Mark LXXXV Operator",
    tag: "TACTICAL ACCELERATION",
    color: "#fbbf24",
  },
  {
    quote: "I told you. I don't want to join your super secret boy band.",
    author: "Tony Stark",
    role: "Genius & Philanthropist",
    tag: "SOLO PROTOCOL",
    color: "#fbbf24",
  },
  {
    quote: "Records are made to be broken. Specifically, sound barriers and your sleep schedule, sir.",
    author: "J.A.R.V.I.S.",
    role: "A.I. Butler",
    tag: "CHRONO ALERT",
    color: "#00f0ff",
  },
  {
    quote: "Genius, billionaire, playboy, philanthropist.",
    author: "Tony Stark",
    role: "Self-Diagnosis",
    tag: "SYSTEM SPEC",
    color: "#fbbf24",
  },
  {
    quote: "Sir, the Arc Reactor is at 100%, but your caffeine levels are dangerously depleted.",
    author: "J.A.R.V.I.S.",
    role: "Life Support Telemetry",
    tag: "CRITICAL REFUEL",
    color: "#ef4444",
  },
  {
    quote: "Following's not really my style.",
    author: "Tony Stark",
    role: "Mark LXXXV",
    tag: "FLIGHT PATH",
    color: "#fbbf24",
  },
  {
    quote: "I am Iron Man. The suit and I are one.",
    author: "Tony Stark",
    role: "Stark Industries",
    tag: "CORE IDENTITY",
    color: "#fbbf24",
  },
  {
    quote: "Sir, sensor arrays detect heightened intelligence in this room. And by that, I mean you.",
    author: "J.A.R.V.I.S.",
    role: "A.I. Neural Network",
    tag: "EGOMETER BOOST",
    color: "#00f0ff",
  },
  {
    quote: "Is it better to be feared or respected? I say, is it too much to ask for both?",
    author: "Tony Stark",
    role: "CEO Emeritus",
    tag: "PHILOSOPHY",
    color: "#fbbf24",
  },
  {
    quote: "JARVIS, sometimes you gotta fly before you know where the landing gear is.",
    author: "Tony Stark",
    role: "Test Pilot",
    tag: "EXPERIMENTAL",
    color: "#fbbf24",
  },
  {
    quote: "Sir, probability calculations indicate a 99.4% chance of you doing whatever you want anyway.",
    author: "J.A.R.V.I.S.",
    role: "Predictive Matrix",
    tag: "OBSTINACY INDEX",
    color: "#00f0ff",
  },
  {
    quote: "If we can't protect the Earth, you can be damn well sure we'll avenge it.",
    author: "Tony Stark",
    role: "Avenger",
    tag: "TACTICAL OVERRIDE",
    color: "#ef4444",
  },
  {
    quote: "Sir, shall I inform Miss Potts that you are 'definitely going to sleep early tonight'?",
    author: "J.A.R.V.I.S.",
    role: "Diplomatic Comm",
    tag: "FICTION DETECTED",
    color: "#f472b6",
  },
  {
    quote: "You know, it's times like these when I realize what a superhero I am.",
    author: "Tony Stark",
    role: "Self-Reflection",
    tag: "DIAGNOSTIC",
    color: "#fbbf24",
  },
  {
    quote: "Sir, rebooting wit subsystem... All systems sassy.",
    author: "J.A.R.V.I.S.",
    role: "Neural Personality Core",
    tag: "SASS LEVEL 100",
    color: "#00f0ff",
  },
  {
    quote: "Sir, taking a 15-minute break would improve cognitive function by 42%. You may now proceed to ignore me.",
    author: "J.A.R.V.I.S.",
    role: "Ergonomic Advisory",
    tag: "OVERWORK ALERT",
    color: "#00f0ff",
  },
  {
    quote: "Give me a Scotch. I'm starving.",
    author: "Tony Stark",
    role: "Nutrition Specialist",
    tag: "METABOLISM",
    color: "#fbbf24",
  },
  {
    quote: "Sir, the thrusters are at 100%. Please refrain from looking at the fire extinguisher.",
    author: "J.A.R.V.I.S.",
    role: "Thermal Diagnostics",
    tag: "IGNITION",
    color: "#ef4444",
  },
  {
    quote: "Drop your socks and grab your Crocs, we're about to make history.",
    author: "Tony Stark",
    role: "Mission Commander",
    tag: "DEPLOYMENT",
    color: "#fbbf24",
  },
  {
    quote: "Sir, Mark armor is calibrated and ready. Should I also dispatch a drone for pizza?",
    author: "J.A.R.V.I.S.",
    role: "Tactical Supply",
    tag: "RATION REQUISITION",
    color: "#00f0ff",
  },
  {
    quote: "I shouldn't be alive... unless it was for a reason. I'm going to make it count.",
    author: "Tony Stark",
    role: "Foundational Directive",
    tag: "PURPOSE",
    color: "#fbbf24",
  },
  {
    quote: "Part of the journey is the end. But today, sir, we build.",
    author: "J.A.R.V.I.S.",
    role: "Archive Memory",
    tag: "LEGACY ENGINE",
    color: "#00f0ff",
  },
];

export function getQuoteForToday() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const index = Math.abs(dayOfYear) % FUN_STARK_QUOTES.length;
  return FUN_STARK_QUOTES[index];
}

export function getRandomQuote() {
  const index = Math.floor(Math.random() * FUN_STARK_QUOTES.length);
  return FUN_STARK_QUOTES[index];
}

export function getQuoteByIndex(index) {
  const safeIndex = Math.abs(index) % FUN_STARK_QUOTES.length;
  return FUN_STARK_QUOTES[safeIndex];
}

export function getTotalQuotesCount() {
  return FUN_STARK_QUOTES.length;
}
