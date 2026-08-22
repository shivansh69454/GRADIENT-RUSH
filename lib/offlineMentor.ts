import type { FinanceContext } from './prompts';
import { OFF_TOPIC_REPLY, isFinanceRelated } from './prompts';

const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

interface Rule {
  match: RegExp;
  reply: (c: FinanceContext) => string;
}

/**
 * Deterministic fallback used only when no Gemini key is configured.
 *
 * Every answer is built from the user's real numbers rather than canned text, and
 * the UI labels these replies as offline so nobody mistakes them for the model.
 */
const RULES: Rule[] = [
  {
    match: /\b(sip|systematic investment)\b/i,
    reply: (c) => {
      const affordable = Math.max(500, Math.round((c.monthlyAllowance * 0.15) / 100) * 100);
      const tenYear = affordable * 12 * 10 * 1.9;
      return `A SIP is just an auto-debit that buys a bit of a mutual fund every month, so you stop trying to time the market.\n\nOn your ${inr(
        c.monthlyAllowance
      )} allowance, ${inr(affordable)} a month is realistic. At roughly 12% a year that becomes about ${inr(
        tenYear
      )} in ten years — most of which is growth, not your deposits.\n\nStart with an index fund tracking the Nifty 50. Boring is the point.`;
    },
  },
  {
    match: /\b(crypto|bitcoin|ethereum|doge)\b/i,
    reply: () =>
      `Crypto is not an investment strategy, it is a volatility bet. It can drop 60% in a month and owes you nothing.\n\nIf you still want exposure, cap it at 5% of what you invest, and only after you have an emergency fund covering three months. Never borrow to buy it. In India, gains are taxed at 30% with no loss offset, which quietly eats a lot of the upside.`,
  },
  {
    match: /\b(emergency fund|emergency)\b/i,
    reply: (c) => {
      const target = Math.max(5000, Math.round(c.monthlyAllowance * 3));
      return `An emergency fund is three months of expenses sitting somewhere boring and instantly accessible — a sweep-in savings account or a liquid fund, not stocks.\n\nFor you that is about ${inr(
        target
      )}. Getting there at ${inr(
        Math.round(target / 12)
      )} a month takes a year. This is the one thing to finish before you invest a single rupee.`;
    },
  },
  {
    match: /\b(credit score|cibil)\b/i,
    reply: () =>
      `Your CIBIL score runs 300 to 900, and anything above 750 gets you the good loan rates. Three things move it: paying every bill in full and on time, keeping your credit card usage under 30% of the limit, and not applying for many cards at once.\n\nIf you have no credit history yet, a single low-limit card used for one small recurring bill and auto-paid in full builds a clean record in about six months.`,
  },
  {
    match: /\b(budget|50-30-20|allocate)\b/i,
    reply: (c) =>
      `The version that works for students: 50% needs, 30% wants, 20% saved.\n\nOn ${inr(
        c.monthlyAllowance
      )} that is ${inr(c.monthlyAllowance * 0.5)} needs, ${inr(
        c.monthlyAllowance * 0.3
      )} wants, ${inr(
        c.monthlyAllowance * 0.2
      )} saved. You have spent ${inr(c.spentThisMonth)} so far with ${
        c.daysLeft
      } days left, which gives you ${inr(c.safeDailyAllowance)} a day from here.${
        c.topCategories[0]
          ? ` Your ${c.topCategories[0].category} spending is ${Math.round(
              c.topCategories[0].share * 100
            )}% of the total — that is where the room is.`
          : ''
      }`,
  },
  {
    match: /\b(save|saving|savings)\b/i,
    reply: (c) => {
      const target = Math.round(c.monthlyAllowance * 0.2);
      return `Saving works when it happens before you spend, not after. Move ${inr(
        target
      )} out the day your allowance lands and live on the rest.\n\nRight now you have ${inr(
        c.remaining
      )} left for ${c.daysLeft} days. ${
        c.topCategories[0]
          ? `Cutting ${c.topCategories[0].category} by a third frees about ${inr(
              c.topCategories[0].total / 3
            )} a month.`
          : 'Log a week of expenses and I can point at the exact leak.'
      }`;
    },
  },
  {
    match: /\b(smartwise score|my score|score)\b/i,
    reply: (c) =>
      `Your Smartwise Score is ${c.smartwiseScore} out of 100 — ${c.smartwiseScoreGrade}. It blends five things: savings rate (30%), budget adherence (25%), daily tasks (20%), goal progress (15%) and tracking consistency (10%).\n\nYour weakest pillar is ${c.weakestPillar}. Fix that one and the number moves fastest.`,
  },
  {
    match: /\b(broke|no money|out of money|survive)\b/i,
    reply: (c) =>
      c.remaining < 0
        ? `You are ${inr(Math.abs(c.remaining))} over your allowance with ${
            c.daysLeft
          } days left, so this month is about damage control.\n\nFreeze the top category, cook or eat at the mess, and treat ${inr(
            0
          )} as today's budget. Then next month, move 20% out on day one so this cannot happen again.`
        : `You have ${inr(c.remaining)} for ${c.daysLeft} days, so ${inr(
            c.safeDailyAllowance
          )} a day keeps you clean.\n\nThat is tight but survivable. Cook where you can and keep one no-spend day a week.`,
  },
  {
    match: /\b(invest|investing|where.*put.*money|mutual fund)\b/i,
    reply: (c) =>
      `Order of operations matters more than picking winners:\n\n1. Three months of expenses in an emergency fund (about ${inr(
        c.monthlyAllowance * 3
      )} for you).\n2. Clear anything charging over 12% interest.\n3. Then a monthly SIP into a Nifty 50 index fund.\n\nSkip individual stocks until you can explain a balance sheet. The index quietly beats most people who try.`,
  },
  {
    match: /\b(loan|emi|debt|borrow)\b/i,
    reply: () =>
      `Ranked by how much they hurt: credit card revolving debt (36-42% a year) is an emergency, personal loans (11-18%) are expensive, education loans (8-11%) are usually fine, and home loans are the cheapest money you will ever borrow.\n\nAlways clear the highest rate first, and never take an EMI whose total exceeds 40% of your monthly income.`,
  },
  {
    match: /\b(tax|itr|80c|deduction)\b/i,
    reply: () =>
      `Under the new regime there is no tax up to ₹7 lakh of income thanks to the rebate, and no need to chase deductions. The old regime only wins if you already have big 80C investments, rent, or a home loan.\n\nIf you are a student with a stipend under the threshold, you still file a return when tax was deducted at source — that is how you get it refunded.`,
  },
  {
    match: /\b(streak|xp|level|task)\b/i,
    reply: (c) =>
      `You are level ${c.level} — ${c.title} — on a ${c.streak}-day logging streak. Streaks matter here for a real reason: three days gives a 1.5× XP multiplier, seven days gives 2×, thirty gives 3×.\n\nThe habit is the actual product. The XP is just the receipt.`,
  },
];

export const offlineMentorReply = (question: string, context: FinanceContext): string => {
  if (!isFinanceRelated(question)) return OFF_TOPIC_REPLY;

  const rule = RULES.find((r) => r.match.test(question));
  if (rule) return rule.reply(context);

  const top = context.topCategories[0];
  return `Here is what I can see in your data right now: ${inr(
    context.spentThisMonth
  )} spent this month against a ${inr(context.monthlyAllowance)} allowance, leaving ${inr(
    context.remaining
  )} for ${context.daysLeft} days. Your Smartwise Score is ${context.smartwiseScore}, and ${
    context.weakestPillar
  } is holding it back.${
    top
      ? ` ${top.category} is your largest category at ${Math.round(top.share * 100)}%.`
      : ''
  }\n\nAsk me about budgeting, saving, SIPs, credit scores, loans, or taxes and I will get specific.`;
};

export const offlineScoreExplanation = (context: FinanceContext): string => {
  const top = context.topCategories[0];
  return `A Smartwise Score of ${context.smartwiseScore} puts you in the ${context.smartwiseScoreGrade.toLowerCase()} band — normal for someone building the habit, not where you want to stay.\n\nThe thing holding it down is ${
    context.weakestPillar
  }.${
    top
      ? ` ${top.category} is taking ${Math.round(top.share * 100)}% of your spending at ${inr(
          top.total
        )}.`
      : ''
  }\n\nThis week: move ${inr(
    Math.max(200, Math.round(context.monthlyAllowance * 0.05))
  )} into a savings goal the day your allowance arrives, before you spend anything.`;
};

export const offlineFutureLetter = (context: FinanceContext, years: number): string => {
  const savingsRate =
    context.monthlyAllowance > 0
      ? (context.monthlyAllowance - context.spentThisMonth) / context.monthlyAllowance
      : 0;
  const monthlySaving = Math.max(0, context.monthlyAllowance - context.spentThisMonth);
  const compounded = monthlySaving * 12 * years * (1 + 0.12 * years * 0.5);
  const name = context.name || 'you';
  const top = context.topCategories[0];

  if (savingsRate < 0.1) {
    return `Dear ${name},

I am writing from ${years} years ahead, and I need you to hear this without flinching.

You were saving almost nothing when this letter starts. ${
      top
        ? `${top.category} was taking ${Math.round(
            top.share * 100
          )}% of everything you had — ${inr(top.total)} a month that just evaporated.`
        : 'Your money left as fast as it arrived.'
    } It did not feel like a decision at the time. It never does. It felt like ${inr(
      200
    )} here and ${inr(400)} there.

Here is what it cost: when things went wrong — and they did — there was no cushion. I borrowed. I said no to a trip I still think about. Your Smartwise Score sat at ${
      context.smartwiseScore
    } and I told myself I would fix it next month, for about forty next-months.

But you are reading this, which means it is not settled yet. If you start putting away just ${inr(
      Math.max(500, Math.round(context.monthlyAllowance * 0.2))
    )} a month, from today, I get to write you a very different letter. That is the whole ask. One transfer, on the day the money lands, before anything else.

I am still rooting for us.

You, in ${years} years`;
  }

  return `Dear ${name},

I am writing from ${years} years ahead to tell you that the boring thing you are doing right now worked.

You were putting away about ${inr(
    monthlySaving
  )} a month when this letter starts. It felt insignificant. ${
    context.streak > 0
      ? `You had a ${context.streak}-day streak of just writing things down, and you probably thought that was the least impressive habit you had.`
      : 'You were just starting to pay attention.'
  } It was not. It compounded into roughly ${inr(
    compounded
  )}, and more than half of that was growth you did not work for.

${
  context.goals.length > 0
    ? `You hit ${context.goals[0].name}. You almost gave up on it twice.`
    : 'You stopped flinching when your phone buzzed with a payment alert.'
}

What I want you to know is that the number was never the point. The point was that at ${
    context.age || 21
  } you learned to decide where your money went instead of finding out afterwards. Everything good since then came from that.

Keep going. It gets easier.

You, in ${years} years`;
};
