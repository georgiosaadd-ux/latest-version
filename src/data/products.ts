// products.ts

import datingAgeManipulatorsImage from '../assets/images/Dating-in-the-Age-of-Manipulators.png';
import trappedInHisGameImage from '../assets/images/Trapped-in-his-game.png';
import gaslightingUnmaskedImage from '../assets/images/Gaslighting-Unmasked.png';
import loveBombedLeftImage from '../assets/images/Love-Bombed-&-Left.png';
import whyAttractToxicImage from '../assets/images/Why-Do-I-Attract-Toxic-Men.png';
import mrAlmostImage from '../assets/images/Mr-Almost.png';
import loveVsLustImage from '../assets/images/Love-vs-Lust.png';
import charmerTrapImage from '../assets/images/The-Charmer-Trap.png';

import { EBook, Bundle } from '../types';

// Placeholder images for Self Empowering category (replace with real covers)
const silentGirlSyndromeImage =
  'https://images.pexels.com/photos/3762800/pexels-photo-3762800.jpeg?auto=compress&cs=tinysrgb&w=400';
const girlNeverFeltEnoughImage =
  'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400';
const tooKindToSurviveImage =
  'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=400';
const comparisonTrapImage =
  'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400';

export const ebooks: EBook[] = [
  // =========================
  // Manipulation & Toxic Relationships (LIVE)
  // =========================
  {
    id: 'dating-age-manipulators',
    title: 'Dating in the Age of Manipulators',
    subtitle: 'Red Flags You Cannot Ignore',
    category: 'Manipulation & Toxic Relationships',
    price: 42,
    rating: 5.0,
    reviewCount: 675,
    description: 'Navigate modern dating with confidence and clarity.',
    badges: ['Best Seller', 'Reader Favorite'],
    takeaways: [
      'Spot manipulation in first conversations',
      'Trust red flags over potential',
      'Navigate modern dating dangers',
      'Protect your energy and time',
      'Choose men who choose you clearly'
    ],
    cover: datingAgeManipulatorsImage,
    pages: 92,
    audioMinutes: 25
  },
  {
    id: 'trapped-in-his-game',
    title: 'Trapped in His Game',
    subtitle: 'Spotting Manipulation Before It Destroys You',
    category: 'Manipulation & Toxic Relationships',
    price: 42,
    rating: 5.0,
    reviewCount: 433,
    description: 'See the patterns, protect your peace.',
    badges: [],
    takeaways: [
      'Recognize gaslighting tactics before they take hold',
      'Understand love-bombing and why it feels so good',
      'Learn the difference between care and control',
      'Build confidence to trust your own reality',
      'Create boundaries that actually protect you'
    ],
    cover: trappedInHisGameImage,
    pages: 85,
    audioMinutes: 22
  },
  {
    id: 'love-vs-lust',
    title: 'Love vs Lust',
    subtitle: 'Chemistry Without Blindness',
    category: 'Manipulation & Toxic Relationships',
    price: 34,
    rating: 5.0,
    reviewCount: 406,
    description: 'Tell obsession from connection. Choose what actually loves you back.',
    badges: [],
    takeaways: [
      'Spot when desire is disguising disrespect',
      'Read early signals that passion is one-sided',
      'Balance chemistry with character so you stop self-sabotage',
      'Build standards that keep you out of situationships',
      'Choose partners who choose you with clarity'
    ],
    cover: loveVsLustImage,
    pages: 68,
    audioMinutes: 18
  },
  {
    id: 'love-bombed-left',
    title: 'Love-Bombed & Left',
    subtitle: 'Break the Cycle of Emotional Highs and Crashes',
    category: 'Manipulation & Toxic Relationships',
    price: 39,
    rating: 5.0,
    reviewCount: 325,
    description: 'Stop getting swept up in intensity that ends in silence.',
    badges: [],
    takeaways: [
      'Decode love-bombing vs. real intimacy',
      'Avoid the attention-withdrawal trap',
      'Build self-soothing that doesn’t depend on him',
      'Stop confusing anxiety with attraction',
      'Choose stability that still excites you'
    ],
    cover: loveBombedLeftImage,
    pages: 76,
    audioMinutes: 20
  },
  {
    id: 'gaslighting-unmasked',
    title: 'Gaslighting Unmasked',
    subtitle: 'Reclaim Your Reality',
    category: 'Manipulation & Toxic Relationships',
    price: 14,
    rating: 5,
    reviewCount: 250,
    description: 'End the confusion, reclaim your reality.',
    badges: [],
    takeaways: [
      'Identify gaslighting in real-time conversations',
      'Stop questioning your own memory and perception',
      'Rebuild trust in your instincts',
      'Document patterns to see clearly',
      'Respond with confidence, not defense'
    ],
    cover: gaslightingUnmaskedImage,
    pages: 72,
    audioMinutes: 18
  },
  {
    id: 'mr-almost',
    title: 'Mr. Almost',
    subtitle: "Stop Waiting for Someone Who Won't Choose You",
    category: 'Manipulation & Toxic Relationships',
    price: 15,
    rating: 4.9,
    reviewCount: 174,
    description: 'Stop waiting for someone who will not choose you.',
    badges: [],
    takeaways: [
      'Recognize almost-relationships',
      'Stop making excuses for inconsistency',
      'Understand why some men keep you waiting',
      'Choose clarity over comfort',
      'Walk away from maybe'
    ],
    cover: mrAlmostImage,
    pages: 64,
    audioMinutes: 17
  },
  {
    id: 'why-attract-toxic',
    title: 'Why Do I Attract Toxic Men?',
    subtitle: 'Breaking Harmful Patterns',
    category: 'Manipulation & Toxic Relationships',
    price: 15,
    rating: 5.0,
    reviewCount: 342,
    description: 'Stop the pattern that keeps hurting you.',
    badges: [],
    takeaways: [
      'Understand your attraction patterns',
      'Heal childhood wounds that draw toxicity',
      'Recognize red flags in the first conversation',
      'Build self-worth that repels manipulation',
      'Attract healthy, secure relationships'
    ],
    cover: whyAttractToxicImage,
    pages: 58,
    audioMinutes: 16
  },

  // =========================
  // Self Empowering (COMING SOON — not selectable for bundles)
  // =========================
  {
    id: 'silent-girl-syndrome',
    title: 'Silent Girl Syndrome',
    subtitle: 'Find Your Voice in Rooms That Scare You',
    category: 'Self Empowering',
    price: 38,
    comingSoon: true,
    description: 'From trembling to taking up space.',
    badges: [],
    takeaways: [
      'Reduce social anxiety in real moments',
      'Use micro-bravery to build confidence daily',
      'Speak up without shaking',
      'Set gentle boundaries that stick',
      'Own the room without being the loudest'
    ],
    cover: silentGirlSyndromeImage,
    pages: 70,
    audioMinutes: 19
  },
  {
    id: 'girl-never-felt-enough',
    title: 'The Girl Who Never Felt Enough',
    subtitle: 'End the War With Your Reflection',
    category: 'Self Empowering',
    price: 36,
    comingSoon: true,
    description: 'Heal the “not enough” story for good.',
    badges: [],
    takeaways: [
      'Stop feeding the comparison spiral',
      'Rewire perfectionism into progress',
      'Build self-respect rituals',
      'Set goals that aren’t punishment',
      'Become your own safe place'
    ],
    cover: girlNeverFeltEnoughImage,
    pages: 74,
    audioMinutes: 19
  },
  {
    id: 'too-kind-to-survive',
    title: 'Too Kind to Survive',
    subtitle: 'The Power of No and Protecting Your Peace',
    category: 'Self Empowering',
    price: 40,
    comingSoon: true,
    description:
      'I Broke Myself to Please Others, Until I Learned the Power of No',
    badges: [],
    takeaways: [
      'Learn to say no without guilt or explanation',
      'Set boundaries that protect your energy and time',
      'Stop sacrificing yourself for others\' comfort',
      'Understand the difference between kindness and self-destruction',
      'Reclaim your power through healthy boundaries'
    ],
    cover: tooKindToSurviveImage,
    pages: 88,
    audioMinutes: 23
  },
  {
    id: 'comparison-trap',
    title: 'The Girl Who Changed Her Bloodline',
    subtitle: 'See Your Own Light, Stop Dimming It',
    category: 'Self Empowering',
    price: 34,
    comingSoon: true,
    description: 'Break comparison, discover power.',
    badges: [],
    takeaways: [
      'Break free from the comparison cycle that steals your joy',
      'Recognize your unique strengths and gifts',
      'Stop measuring your worth against others\' highlight reels',
      'Transform jealousy into inspiration and growth',
      'Celebrate your journey without needing to compete'
    ],
    cover: comparisonTrapImage,
    pages: 66,
    audioMinutes: 17
  }
];

// ------------------------------------------------------
// Helper exports
// ------------------------------------------------------

// Live-only list you should pass into <CustomBundle /> to exclude drafts
export const ebooksSelectable: EBook[] = ebooks.filter(e => !e.comingSoon);

// Categories you surface on the site
export const activeCategories = [
  'Manipulation & Toxic Relationships',
  'Self Empowering'
];

// ------------------------------------------------------
// Predefined bundles (populate with LIVE ebooks only)
// ------------------------------------------------------
export const bundles: Bundle[] = [
  {
    id: 'manipulation-recovery',
    title: 'Manipulation Recovery Bundle',
    description: 'Complete toolkit for recognizing and recovering from manipulation',
    price: 0,
    originalPrice: 0,
    savings: 0,
    // IMPORTANT: use EBOOK IDs here, not titles
    ebookIds: ['trapped-in-his-game', 'love-vs-lust', 'dating-age-manipulators'],
    ebooks: []
  }
];

// Populate bundle.ebooks with LIVE books only
bundles.forEach(bundle => {
  bundle.ebooks = bundle.ebookIds
    .map(id => ebooks.find(e => e.id === id))
    .filter((e): e is NonNullable<typeof e> => !!e && !e.comingSoon);
});

// ------------------------------------------------------
// Dynamic pricing engine
// Strategy: 'cheapest-free' | 'percent-off' | 'flat-off'
// ------------------------------------------------------
type BundlePricingMode = 'cheapest-free' | 'percent-off' | 'flat-off';

const BUNDLE_PRICING_MODE: BundlePricingMode = 'cheapest-free';
const BUNDLE_PERCENT_OFF = 0.30; // used if 'percent-off'
const BUNDLE_FLAT_OFF = 20;      // used if 'flat-off'

// pretty money
const roundMoney = (n: number) => Math.max(0, Math.round(n));

bundles.forEach(bundle => {
  const prices = bundle.ebooks.map(e => e.price ?? 0);
  const original = prices.reduce((a, b) => a + b, 0);

  if (prices.length === 0) {
    bundle.originalPrice = 0;
    bundle.savings = 0;
    bundle.price = 0;
    return;
  }

  let savings = 0;
  switch (BUNDLE_PRICING_MODE) {
    case 'cheapest-free': {
      const cheapest = Math.min(...prices);
      savings = cheapest;
      break;
    }
    case 'percent-off': {
      savings = original * BUNDLE_PERCENT_OFF;
      break;
    }
    case 'flat-off': {
      savings = Math.min(BUNDLE_FLAT_OFF, original);
      break;
    }
  }

  bundle.originalPrice = roundMoney(original);
  bundle.savings = roundMoney(savings);
  bundle.price = roundMoney(original - savings);
});
