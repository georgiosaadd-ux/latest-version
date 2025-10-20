import datingAgeManipulatorsImage from '../assets/images/Dating-in-the-Age-of-Manipulators.png';
import trappedInHisGameImage from '../assets/images/Trapped-in-his-game.png';
import gaslightingUnmaskedImage from '../assets/images/Gaslighting-Unmasked.png';
import loveBombedLeftImage from '../assets/images/Love-Bombed-&-Left.png';
import whyAttractToxicImage from '../assets/images/Why-Do-I-Attract-Toxic-Men.png';
import mrAlmostImage from '../assets/images/Mr-Almost.png';
import loveVsLustImage from '../assets/images/Love-vs-Lust.png';
import charmerTrapImage from '../assets/images/The-Charmer-Trap.png';

// Placeholder images for Self Empowering category - replace with actual covers
const silentGirlSyndromeImage = 'https://images.pexels.com/photos/3762800/pexels-photo-3762800.jpeg?auto=compress&cs=tinysrgb&w=400';
const girlNeverFeltEnoughImage = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400';
const tooKindToSurviveImage = 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=400';
const comparisonTrapImage = 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400';

import { EBook, Bundle } from '../types';

export const ebooks: EBook[] = [
  // Manipulation & Toxic Relationships
  {
    id: 'trapped-in-his-game',
    title: 'Trapped in His Game',
    subtitle: 'Spotting Manipulation Before It Destroys You',
    category: 'Manipulation & Toxic Relationships',
    price: 42,
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
    id: 'gaslighting-unmasked',
    title: 'Gaslighting Unmasked',
    subtitle: 'Reclaim Your Reality',
    category: 'Manipulation & Toxic Relationships',
    price: 34,
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
    id: 'love-bombed-left',
    title: 'Love-Bombed & Left',
    subtitle: 'Breaking the Narcissist Cycle',
    category: 'Manipulation & Toxic Relationships',
    price: 36,
    description: 'Break the narcissist cycle for good.',
    badges: [],
    takeaways: [
      'Understand why love-bombing feels so intense',
      'Recognize the devalue and discard pattern',
      'Break the trauma bond that keeps you hooked',
      'Heal from narcissistic abuse',
      'Prevent falling for it again'
    ],
    cover: loveBombedLeftImage,
    pages: 68,
    audioMinutes: 19
  },
  {
    id: 'why-attract-toxic',
    title: 'Why Do I Attract Toxic Men?',
    subtitle: 'Breaking Harmful Patterns',
    category: 'Manipulation & Toxic Relationships',
    price: 39,
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
  
  // Dating & Red Flags
  {
    id: 'dating-age-manipulators',
    title: 'Dating in the Age of Manipulators',
    subtitle: 'Red Flags You Cannot Ignore',
    category: 'Dating & Red Flags',
    price: 42,
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
    id: 'mr-almost',
    title: 'Mr. Almost',
    subtitle: 'Stop Waiting for Someone Who Won\'t Choose You',
    category: 'Dating & Red Flags',
    price: 39,
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
    id: 'love-vs-lust',
    title: 'Love vs. Lust',
    subtitle: 'Know the Difference, Protect Your Heart',
    category: 'Dating & Red Flags',
    price: 36,
    description: 'Know the difference, protect your heart.',
    badges: [],
    takeaways: [
      'Understand the difference between love and lust',
      'Stop mistaking intensity for love',
      'Recognize when you\'re being used',
      'Build emotional connection before physical',
      'Date with your mind, not just your heart'
    ],
    cover: loveVsLustImage,
    pages: 48,
    audioMinutes: 15
  },
  {
    id: 'charmer-trap',
    title: 'The Charmer Trap',
    subtitle: 'When Attractive Hides Dangerous',
    category: 'Dating & Red Flags',
    price: 36,
    description: 'When attractive hides dangerous, stay safe.',
    badges: [],
    takeaways: [
      'See past charm to character',
      'Understand why charmers target you',
      'Protect yourself from smooth talkers',
      'Trust actions over words',
      'Choose substance over style'
    ],
    cover: charmerTrapImage,
    pages: 76,
    },
  
  // Self Empowering
    {
      id: 'silent-girl-syndrome',
      title: 'Silent Girl Syndrome',
      subtitle: 'From Shaking Voice to Owning Every Room',
      category: 'Self Empowering',
      price: 38,
        comingSoon: true,  // ADD THIS LINE
      description: 'I Couldn\'t Speak Without Shaking, Now I Own Every Room',
      badges: [],
      takeaways: [
        'Overcome the fear of speaking up in any situation',
        'Build unshakeable confidence from the inside out',
        'Transform anxiety into authentic presence',
        'Master the art of commanding respect without aggression',
        'Find your voice and use it powerfully'
      ],
      cover: silentGirlSyndromeImage,
      pages: 82,
      audioMinutes: 21
    },
    {
      id: 'girl-never-felt-enough',
      title: 'The Girl Who Never Felt Enough',
      subtitle: 'Stop Seeking Validation, Start Being Whole',
      category: 'Self Empowering',
      price: 36,
        comingSoon: true,  // ADD THIS LINE
      description: 'I Looked for Validation in Everyone',
      badges: [],
      takeaways: [
        'Break free from the endless need for approval',
        'Discover your inherent worth beyond others\' opinions',
        'Stop people-pleasing and start self-honoring',
        'Build internal validation that never wavers',
        'Become whole without needing external confirmation'
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
        comingSoon: true,  // ADD THIS LINE
      description: 'I Broke Myself to Please Others, Until I Learned the Power of No',
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
        comingSoon: true,  // ADD THIS LINE
      description: 'Jealous of Her, Blind to Me',
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
].flat();

export const bundles: Bundle[] = [
  {
    id: 'manipulation-recovery',
    title: 'Manipulation Recovery Bundle',
    description: 'Complete toolkit for recognizing and recovering from manipulation',
    price: 81, // 42 + 39 + 36 - 36 (cheapest)
    originalPrice: 117, // 42 + 39 + 36
    savings: 36, // cheapest book price
    ebookIds: ['trapped-in-his-game', 'why-attract-toxic', 'love-bombed-left'],
    ebooks: []
  },
  {
    id: 'dating-red-flags',
    title: 'Dating Red Flags Bundle',
    description: 'Navigate modern dating safely and confidently',
    price: 81, // 42 + 39 + 36 - 36 (cheapest)
    originalPrice: 117, // 42 + 39 + 36
    savings: 36, // cheapest book price
    ebookIds: ['dating-age-manipulators', 'mr-almost', 'charmer-trap'],
    ebooks: []
  },
  {
    id: 'self-empowering',
    title: 'Self Empowering Bundle',
    description: 'Complete toolkit for building unshakeable confidence and self-worth',
    price: 81, // 40 + 38 + 36 - 34 (cheapest)
    originalPrice: 148, // 40 + 38 + 36 + 34
    savings: 34, // cheapest book price
    ebookIds: ['too-kind-to-survive', 'silent-girl-syndrome', 'girl-never-felt-enough'],
    ebooks: []
  }
];

// Populate bundle ebooks
bundles.forEach(bundle => {
  bundle.ebooks = bundle.ebookIds.map(id => ebooks.find(ebook => ebook.id === id)).filter(Boolean) as EBook[];
});

export const activeCategories = [
  'Manipulation & Toxic Relationships',
  'Dating & Red Flags',
  'Self Empowering'
];