export interface Lesson {
  title: string;
  body: string;
}

export interface Course {
  id: string;
  title: string;
  summary: string;
  emoji: string;
  minutes: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  xp: number;
  lessons: Lesson[];
  /** Real question with a real answer, checked before XP is awarded. */
  quiz: { question: string; options: string[]; answerIndex: number; explanation: string };
}

export const COURSES: Course[] = [
  {
    id: 'budget-basics',
    title: 'Where your money actually goes',
    summary: 'Build a budget that survives contact with real life.',
    emoji: '🧮',
    minutes: 6,
    level: 'Beginner',
    xp: 150,
    lessons: [
      {
        title: 'Track before you cut',
        body: 'You cannot budget what you have not measured. Log every rupee for two weeks without changing your behaviour at all. Most people discover 20-30% of their spending is invisible to them — small, frequent, forgettable purchases that add up to more than their rent.',
      },
      {
        title: 'The 50/30/20 split',
        body: 'Half your money to needs (rent, food, transport, phone), 30% to wants (eating out, subscriptions, clothes), 20% to savings. On a ₹10,000 allowance that is ₹5,000, ₹3,000 and ₹2,000. Adjust the ratios if your rent is high, but never let savings hit zero.',
      },
      {
        title: 'Pay yourself first',
        body: 'Move your savings out on the day money arrives, not at the end of the month. Whatever is left in your account will get spent — this is not a character flaw, it is how everyone works. Automate the transfer and live on the remainder.',
      },
    ],
    quiz: {
      question: 'You get ₹12,000 a month. Under 50/30/20, how much should you save?',
      options: ['₹1,200', '₹2,400', '₹3,600', '₹6,000'],
      answerIndex: 1,
      explanation: '20% of ₹12,000 is ₹2,400. Move it out the day the money lands.',
    },
  },
  {
    id: 'compounding',
    title: 'Compounding, properly explained',
    summary: 'Why starting at 20 beats investing twice as much at 30.',
    emoji: '📈',
    minutes: 7,
    level: 'Beginner',
    xp: 180,
    lessons: [
      {
        title: 'Growth on growth',
        body: 'Simple interest pays you on your deposit. Compound interest pays you on your deposit plus all the interest it has already earned. Over one year the difference is trivial. Over twenty years it is everything — most of your final balance will be growth you never deposited.',
      },
      {
        title: 'The cost of waiting',
        body: '₹2,000 a month from age 20 to 60 at 12% becomes roughly ₹2.3 crore. Start at 30 instead and the same ₹2,000 gets you about ₹70 lakh. Ten years of delay cost you two-thirds of the outcome, even though you only skipped ₹2.4 lakh of deposits.',
      },
      {
        title: 'Rule of 72',
        body: 'Divide 72 by your annual return to find how many years your money takes to double. At 12%, that is six years. At 6%, twelve years. This single piece of arithmetic tells you why the gap between a savings account and an index fund is not small.',
      },
    ],
    quiz: {
      question: 'At a 9% annual return, roughly how long does your money take to double?',
      options: ['4 years', '8 years', '12 years', '20 years'],
      answerIndex: 1,
      explanation: '72 ÷ 9 = 8 years. The Rule of 72 gets you close enough for mental maths.',
    },
  },
  {
    id: 'sip-index',
    title: 'Your first SIP',
    summary: 'From zero to a running monthly investment.',
    emoji: '🎯',
    minutes: 8,
    level: 'Beginner',
    xp: 200,
    lessons: [
      {
        title: 'What a SIP actually is',
        body: 'A Systematic Investment Plan is nothing more than an auto-debit that buys units of a mutual fund on a fixed date each month. It is not a product you can be sold — it is a schedule. The fund matters; the SIP is just the delivery mechanism.',
      },
      {
        title: 'Why index funds first',
        body: 'An index fund buys every company in an index, like the Nifty 50, in proportion. It charges 0.1-0.2% a year instead of 1.5-2%, and over ten years most actively managed funds fail to beat it after fees. For a first investment, the boring choice is the correct one.',
      },
      {
        title: 'Order of operations',
        body: 'Emergency fund covering three months of expenses. Then clear any debt above 12% interest. Then start the SIP. Investing before you have a cushion means selling at the worst possible moment when something breaks.',
      },
    ],
    quiz: {
      question: 'What should you build before starting to invest?',
      options: [
        'A stock watchlist',
        'A three-month emergency fund',
        'A credit card',
        'A demat account with margin',
      ],
      answerIndex: 1,
      explanation:
        'Without a cushion, the first emergency forces you to sell your investments at a loss.',
    },
  },
  {
    id: 'credit-score',
    title: 'Credit scores without the mystery',
    summary: 'Build a 750+ CIBIL score from nothing.',
    emoji: '💳',
    minutes: 6,
    level: 'Intermediate',
    xp: 170,
    lessons: [
      {
        title: 'What the number means',
        body: 'CIBIL scores run 300 to 900. Above 750 gets you the advertised interest rates; below 650 gets you rejected or charged a premium. It is not a measure of wealth — it is a measure of whether you repay on time.',
      },
      {
        title: 'The five inputs',
        body: 'Payment history matters most: one missed EMI can cost 50-70 points. Then credit utilisation — keep card spending under 30% of the limit. Then the age of your accounts, your mix of loan types, and how often you apply for new credit.',
      },
      {
        title: 'Starting from zero',
        body: 'No history is not the same as good history. Get one low-limit card, put a single small recurring bill on it, and set up auto-pay for the full statement amount. Six months of that builds a clean file. Never pay only the minimum — that is how the 40% annual interest starts.',
      },
    ],
    quiz: {
      question: 'You have a ₹50,000 credit limit. What is the most you should typically spend on it?',
      options: ['₹5,000', '₹15,000', '₹35,000', 'The full ₹50,000'],
      answerIndex: 1,
      explanation:
        'Staying under 30% utilisation (₹15,000) keeps your score healthy even if you pay in full.',
    },
  },
  {
    id: 'tax-basics',
    title: 'Tax for your first salary',
    summary: 'Regimes, slabs, TDS, and getting your refund.',
    emoji: '🧾',
    minutes: 9,
    level: 'Intermediate',
    xp: 190,
    lessons: [
      {
        title: 'Old regime vs new',
        body: 'The new regime has lower rates but almost no deductions, and a rebate means no tax up to ₹7 lakh of income. The old regime lets you claim 80C investments, rent, and home loan interest. If you are early in your career with few deductions, the new regime almost always wins.',
      },
      {
        title: 'TDS and why you file',
        body: 'Employers and banks deduct tax at source before paying you. If too much was deducted — common with internships and stipends — the only way to get it back is to file a return. Filing is free on the income tax portal and takes under an hour.',
      },
      {
        title: '80C, if you use the old regime',
        body: 'Up to ₹1.5 lakh a year across EPF, PPF, ELSS funds, life insurance premiums and tuition fees. ELSS has the shortest lock-in at three years and is equity-backed. Do not buy insurance purely for the deduction — the returns are poor.',
      },
    ],
    quiz: {
      question: 'Too much TDS was deducted from your stipend. How do you get it back?',
      options: [
        'Email your employer',
        'File an income tax return',
        'You cannot get it back',
        'Open a PPF account',
      ],
      answerIndex: 1,
      explanation: 'Excess TDS is refunded only when you file a return and claim it.',
    },
  },
  {
    id: 'scams',
    title: 'Spotting money scams',
    summary: 'The patterns behind every financial fraud in India.',
    emoji: '🛡️',
    minutes: 5,
    level: 'Beginner',
    xp: 140,
    lessons: [
      {
        title: 'Guaranteed returns are the tell',
        body: 'No legitimate investment guarantees a return above a fixed deposit. If someone promises 2% a month, 30% a year, or "assured doubling", the money is coming from new investors, not profits. That is a Ponzi scheme by definition.',
      },
      {
        title: 'UPI requests are not payments',
        body: 'Nobody needs your UPI PIN to send you money. If someone asks you to enter a PIN, scan a QR, or approve a "collect request" to receive a refund or prize, they are pulling money from your account, not pushing it in.',
      },
      {
        title: 'Verify the licence',
        body: 'Investment advisers must be SEBI-registered and the number is public. Check it on the SEBI website before paying anyone for tips. Anyone in a Telegram group promising intraday calls for a fee is almost certainly unregistered.',
      },
    ],
    quiz: {
      question: 'Someone says you won a refund and asks you to enter your UPI PIN. What is happening?',
      options: [
        'A normal refund process',
        'They are debiting your account',
        'A bank verification step',
        'A KYC requirement',
      ],
      answerIndex: 1,
      explanation:
        'A PIN is only ever needed to send money. Receiving money never requires your PIN.',
    },
  },
];
