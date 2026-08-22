import type { ForecastBand, ForecastResult } from '@/types';

/**
 * Monte Carlo forecasting for savings goals.
 *
 * A single "you'll get there in 18 months" line is a lie: it assumes every month
 * looks like the average one. This runs the user's actual saving pace and its
 * observed month-to-month volatility forward a thousand times and reports the
 * spread, so the answer becomes "72% of futures make it" instead.
 *
 * The generator is seeded, so the same inputs always produce the same numbers.
 * A forecast that flickers each render is not one anybody would trust.
 */

/** Small, fast, well-distributed PRNG. Deterministic for a given seed. */
const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Box-Muller transform: two uniforms in, one standard normal out. */
const normal = (rand: () => number): number => {
  let u = 0;
  let v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

const percentile = (sorted: number[], p: number): number => {
  if (sorted.length === 0) return 0;
  const index = (sorted.length - 1) * p;
  const low = Math.floor(index);
  const high = Math.ceil(index);
  if (low === high) return sorted[low];
  return sorted[low] + (sorted[high] - sorted[low]) * (index - low);
};

export interface ForecastInput {
  /** Money already put aside towards the target. */
  startingAmount: number;
  target: number;
  /** Mean monthly contribution, from observed behaviour. */
  monthlySavings: number;
  /** Standard deviation of that monthly contribution. */
  savingsVolatility: number;
  months: number;
  /** 0 for a savings account under the mattress, 0.12 for equity. */
  annualReturn: number;
  /** Annual standard deviation of returns. Equity in India sits near 0.18. */
  returnVolatility: number;
  runs?: number;
  seed?: number;
}

export const runForecast = ({
  startingAmount,
  target,
  monthlySavings,
  savingsVolatility,
  months,
  annualReturn,
  returnVolatility,
  runs = 1000,
  seed = 20260823,
}: ForecastInput): ForecastResult => {
  const horizon = Math.max(1, Math.round(months));
  const rand = mulberry32(seed);

  const monthlyReturn = annualReturn / 12;
  const monthlyReturnSigma = returnVolatility / Math.sqrt(12);

  // balances[m] holds every run's balance at month m, for percentile slicing.
  const balances: number[][] = Array.from({ length: horizon + 1 }, () => []);
  const hitMonths: number[] = [];
  let successes = 0;

  for (let run = 0; run < runs; run += 1) {
    let balance = startingAmount;
    let hitAt: number | null = null;
    balances[0].push(balance);

    for (let month = 1; month <= horizon; month += 1) {
      // A bad month can mean saving nothing, but never un-saving.
      const contribution = Math.max(0, monthlySavings + normal(rand) * savingsVolatility);
      const growth = monthlyReturn + normal(rand) * monthlyReturnSigma;

      balance = balance * (1 + growth) + contribution;
      balances[month].push(balance);

      if (hitAt === null && balance >= target) hitAt = month;
    }

    if (hitAt !== null) {
      successes += 1;
      hitMonths.push(hitAt);
    }
  }

  const bands: ForecastBand[] = balances.map((column, month) => {
    const sorted = [...column].sort((a, b) => a - b);
    return {
      month,
      p10: percentile(sorted, 0.1),
      p50: percentile(sorted, 0.5),
      p90: percentile(sorted, 0.9),
    };
  });

  const sortedHits = hitMonths.sort((a, b) => a - b);
  const final = bands[bands.length - 1];

  return {
    runs,
    probability: successes / runs,
    bands,
    // Only meaningful when a majority actually arrive.
    medianMonth: sortedHits.length > runs / 2 ? Math.round(percentile(sortedHits, 0.5)) : null,
    finalP10: final.p10,
    finalP50: final.p50,
    finalP90: final.p90,
    hasEnoughData: monthlySavings > 0 || startingAmount > 0,
  };
};

/** Plain-language read on the odds, so the number lands emotionally. */
export const verdictFor = (
  probability: number
): { label: string; tone: 'positive' | 'warning' | 'negative'; blurb: string } => {
  if (probability >= 0.85)
    return {
      label: 'On track',
      tone: 'positive',
      blurb: 'Almost every version of the next few months gets you there. Keep doing exactly this.',
    };
  if (probability >= 0.6)
    return {
      label: 'Likely',
      tone: 'positive',
      blurb: 'Most futures make it, but a couple of bad months would cost you the deadline.',
    };
  if (probability >= 0.35)
    return {
      label: 'Coin flip',
      tone: 'warning',
      blurb: 'This goal is riding on luck right now. A small, boring increase fixes that.',
    };
  if (probability >= 0.12)
    return {
      label: 'Unlikely',
      tone: 'warning',
      blurb: 'Only a lucky run of months gets you there. Move the date or the amount.',
    };
  return {
    label: 'Out of reach',
    tone: 'negative',
    blurb: 'At this pace the target does not arrive. Change the plan rather than hoping.',
  };
};

/**
 * Smallest extra monthly amount that lifts the odds to `desired`.
 * Returns null when even a large top-up cannot get there in time.
 */
export const requiredBoost = (
  input: ForecastInput,
  desired = 0.85,
  step = 100,
  maxBoost = 20000
): number | null => {
  for (let boost = 0; boost <= maxBoost; boost += step) {
    const { probability } = runForecast({
      ...input,
      monthlySavings: input.monthlySavings + boost,
      // A coarser run is plenty for a search loop and keeps this instant.
      runs: 300,
    });
    if (probability >= desired) return boost;
  }
  return null;
};

export const ASSET_PRESETS = [
  {
    key: 'savings',
    label: 'Savings account',
    annualReturn: 0.035,
    returnVolatility: 0.005,
    note: '3.5% · effectively no risk',
  },
  {
    key: 'fd',
    label: 'Fixed deposit',
    annualReturn: 0.07,
    returnVolatility: 0.01,
    note: '7% · locked in, predictable',
  },
  {
    key: 'index',
    label: 'Index fund SIP',
    annualReturn: 0.12,
    returnVolatility: 0.18,
    note: '12% average · swings a lot year to year',
  },
] as const;

export type AssetKey = (typeof ASSET_PRESETS)[number]['key'];
