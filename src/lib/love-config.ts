/**
 * ❤️ FOREVER WITH MANJU — central editable configuration.
 *
 * Everything the owner may want to personalise lives here:
 * names, dates, password rules, the full letter, funny
 * wrong-password messages and the birthday wishes.
 *
 * NOTE: this is a front-end demo — client-side password checks are a
 * playful gate, NOT real security. The final secret code is NOT stored
 * in this file: the owner creates it once in the Dashboard and it is
 * kept only in the browser's local storage.
 */

export const love = {
  projectName: "Forever With Manju",
  tagline: "Our Story, Our Memories, Our Little Forever.",

  recipientName: "Manju",

  // Birthday: November 4, 2026, 12:00 AM (visitor's local time)
  birthday: {
    year: 2026,
    month: 11, // 1-12
    day: 4,
    hour: 0,
    minute: 0,
  },

  /**
   * First door — accepts live countdown day, hour, minute or current date/time.
   */
  timeCodeEnabled: true,
  fixedCode: "0423", // fallback code if gate is active

  // Real history dates (seeded into the history timeline)
  firstSawYou: "2025-09-26",
  firstTalkedToYou: "2025-09-27",

  // Wrong-password comedy messages (Tanglish + English, fully editable)
  // (the door also shows how many chances are left before it seals)
  wrongPasswordMessages: [
    "Aiyayo! Password thappa irukku! 😂",
    "Konjam yosichu paaru! Un surprise wait pannudhu! 💗",
    "Seri seri, innoru try pannu! 😄",
    "Hmm… romba tough-a? Konjam effort podu Manju! 😉",
    "Secret code kandupidikka mudiyala? Innoru murai try pannu! 🔐",
  ],

  /**
   * First-door gate rules (persisted across visits in this browser):
   *   - `chances` tries before the door seals itself
   *   - sealed for `lockMs`, then 1 try is released
   *   - after that, +1 try every `refillMs`, never more than `chances`
   */
  gate: {
    chances: 3,
    lockMs: 2 * 60_000, // sealed for two minutes
    refillMs: 2 * 60_000, // one extra try every two minutes
  },

  /**
   * The secret chamber — a tricky code-cracking game that guards the
   * crackers. No hints are ever shown; the colours are the only clues.
   * Six gems, four slots, no repeated gems. Solvable by logic alone.
   * After cracking the game, the secret password "0423" unlocks the crackers!
   */
  secretGame: {
    gems: [
      { id: "rose", color: "#ff2e93", name: "Rose" },
      { id: "gold", color: "#f4c95d", name: "Gold" },
      { id: "violet", color: "#b07cff", name: "Violet" },
      { id: "teal", color: "#3fd6c6", name: "Teal" },
      { id: "coral", color: "#ff7e5f", name: "Coral" },
      { id: "lilac", color: "#cdb8ff", name: "Lilac" },
    ],
    slots: 4,
    maxTries: 10,
    postGamePassword: "0423",
    winMessage: "You cracked my heart's code, Manju 💖",
  },

  /**
   * Quotes that scroll along the bottom of the cracker show.
   * Pure decoration — the sky speaks for itself.
   */
  crackerQuotes: [
    "Every spark up there is one reason I love you — we would be here all night ✨",
    "You are the sparkle in my ordinary days, Manju 💖",
    "Some hearts are home. Yours is mine ❤️",
    "Countdowns end, fireworks fade — what I feel for you does not 🌙",
    "The sky burst into gold the day you first said hello ✨",
    "Boom! That is my heart, every single time you smile 😄💗",
    "One more year of you — my favourite reason to celebrate 🎆",
    "Distance means nothing when you mean everything 💫",
    "Un smile dhaan ennoda biggest celebration 😍",
    "Wish quietly… the sky is listening for you 🌠",
    "Kadhaluku quota illa — endless ah irukku, like tonight's sky 💞",
    "Tomorrow the cake — tonight, the sky celebrates you early 🎂✨",
  ],

  // Letter content (editable, and overridable from the Dashboard)
  letter: {
    greeting: "My dearest Manju,",
    paragraphs: [
      "Happy Birthday, my love. Today the whole world feels a little softer, a little warmer — because it is the day you came into it.",
      "I still remember the first time I saw you — September 26, 2025. Something quietly changed that day, though I did not have the words for it yet. And then, on September 27, 2025, the first time we talked — that small conversation became one of my favourite memories.",
      "I do not need a special occasion to think of you, but today I get to say it out loud: you make ordinary days feel like celebrations, and difficult days feel survivable.",
      "May this year bring you everything you quietly wish for — peace in your heart, laughter that reaches your eyes, dreams that finally say yes, and countless reasons to smile.",
      "You are loved more than any letter could ever hold. This little website is just a small room in a much bigger feeling.",
    ],
    closing: "Forever yours,",
    signature: "— Always yours",
    postscript: "P.S. — Blow the candles and make a wish. I already made mine… and it is you. 🌹",
  },

  // Birthday scene messages, revealed line by line (overridable in Dashboard)
  birthdayMessages: [
    "Happy Birthday, Manju!",
    "May your birthday bring happiness, beautiful memories,",
    "and countless reasons to smile.",
    "You are my favourite hello and my hardest goodbye.",
  ],

  finalMessage:
    "May your birthday bring happiness, beautiful memories, and countless reasons to smile.",

  // Love coupons inside the surprise gift box (fully editable)
  giftCoupons: [
    { emoji: "🤗", title: "One Free Hug", desc: "Redeemable anytime, anywhere. Zero conditions." },
    { emoji: "🎬", title: "Movie Night — Your Pick", desc: "Yes, even the one I always say no to." },
    { emoji: "🍨", title: "Ice Cream Share", desc: "I promise not to eat from your cup. Mostly." },
    { emoji: "😴", title: "Sleep-In Pass", desc: "One morning, zero alarms. I will handle everything." },
    { emoji: "☕", title: "Surprise Chai Delivery", desc: "Exactly how you like it, with a smile." },
    { emoji: "🌟", title: "The Anything Coupon", desc: "One wish, no questions asked. Choose wisely 😏" },
  ],

  // Default albums for the gallery (categories, not claims about events)
  albums: [
    "Our First Memories",
    "First Photo",
    "Special Moments",
    "Favorite Memories",
    "Birthday Memories",
    "Random Beautiful Memories",
  ],

  // History categories
  historyCategories: [
    "First Photo",
    "Memorable Conversations",
    "Special Days",
    "Favorite Moments",
    "Important Memories",
    "Future Memories",
  ],

  // Journal example titles (editable examples only)
  journalExamples: [
    "Our First Conversation.",
    "A Conversation to Remember.",
    "Something Important We Discussed.",
    "A Moment That Made Me Smile.",
  ],

  diaryPrompt: "What is one beautiful memory you want to preserve today?",

  wish: {
    shootingStar: "Caught it! Wish saved: more mornings with you ☄️",
  },

  /**
   * The final touch — the closing scene of the celebration.
   * More quotes drift by, and a few honest words about our eternal love
   * underneath all of this.
   */
  finalQuotes: [
    "My heart found its true home the day you stepped into my life 💞",
    "You laugh at my worst jokes. That is pure love, and my favourite melody 😄",
    "With you, even silence feels like the sweetest love story 🌙",
    "Distance is just a test to see how far love can travel — and ours travels endlessly 💫",
    "You are my favourite notification, my heartbeat, my entire world 📲❤️",
    "Pure love built this. Unconditional love will keep it forever 🏛️💖",
    "Naan ungalodu irukkiren, always — you are my everything, my love ❤️",
    "Some people make you smile. You make my whole heart beat with joy 🌿",
    "I love you more than words, more than distance, more than time 🌱",
    "Oru naalum un illai naal illa — you are my everyday habit of happiness ☀️",
    "Chosen with my whole heart — and I would choose you in every lifetime 💯",
    "When the world is loud, your love is the peace I come home to 🤍",
  ],

  friendship: {
    heading: "My Whole Heart — Forever in Love with You",
    paragraphs: [
      "Before any of this — the candles, the cake, the sky full of crackers — my heart chose you. A deep, unconditional love where you can be your whole, beautiful self and know you are cherished beyond words.",
      "Our love is the foundation of my entire world. The laughter only we share. The late-night thoughts. The way my heart lights up with every word from you. Love isn't just a feeling; it is the sacred promise to stand by you forever.",
      "So this celebration is completely for the love of my life, Manju — the one who turns every single heartbeat into pure magic.",
    ],
    promises: [
      { emoji: "❤️", title: "Always Your Protector", desc: "Big decision or tiny one — I am by your side, holding your hand forever." },
      { emoji: "💖", title: "Keeper of Your Smile", desc: "I will spend every day making you smile, because your happiness is my world." },
      { emoji: "🎧", title: "Always Listening", desc: "Good days, hard days, quiet days — every thought of yours matters to me." },
      { emoji: "🛡️", title: "Your Safe Haven", desc: "No doubts, no fears. In my arms and in my heart, you are always home." },
      { emoji: "🚶", title: "Forever Together", desc: "Wherever life leads us, I am walking with you, hand in hand." },
      { emoji: "✨", title: "Endless Love", desc: "Loving you more today than yesterday, and even more tomorrow." },
    ],
    closing: "Thank you for being my person — my love, my heartbeat, and my forever. Here is to our infinite love story together.",
    signature: "— Forever yours, with all my love and whole heart ❤️",
  },
} as const;

/** Target Date object for the countdown. */
export function getBirthdayDate(): Date {
  const { year, month, day, hour, minute } = love.birthday;
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

/**
 * Checks whether the current time is on or after November 4 at 12:01 AM.
 * When true, all passwords & secret codes automatically become visible.
 * Can also be forced for testing via URL search query (?reveal=1) or localStorage.
 */
export function isPasswordAutoVisible(): boolean {
  if (typeof window !== "undefined") {
    if (window.location.search.includes("reveal=1") || window.location.hash.includes("reveal=1")) {
      return true;
    }
    if (window.localStorage.getItem("fmw_force_reveal") === "true") {
      return true;
    }
  }
  const { year, month, day } = love.birthday;
  // November 4, 12:01 AM
  const target = new Date(year, month - 1, day, 0, 1, 0, 0).getTime();
  return Date.now() >= target;
}

/**
 * The playful countdown time code puzzle:
 * User requested rule:
 *   now day count + 1, hour + 1, minutes + 60
 * e.g. 03d 02h 42m -> day(3+1=04) + hour(2+1=03) + min(42+60=102) -> "0403102"
 */
export function timeCode(days: number, hours: number, minutes: number): string | null {
  const pad = (n: number) => String(n).padStart(2, "0");
  const dVal = pad(days + 1);
  const hVal = pad(hours + 1);
  const mVal = String(minutes + 60);

  if (days > 0) return `${dVal}${hVal}${mVal}`;
  if (hours > 0) return `${hVal}${mVal}`;
  if (minutes > 0) return mVal;
  return null; // final minute — no code, hold on
}
