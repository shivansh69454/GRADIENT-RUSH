import { NextRequest, NextResponse } from 'next/server';

/**
 * Mock AI Chat Endpoint
 * Simulates OpenAI/Gemini API responses based on keywords
 */
export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message' },
        { status: 400 }
      );
    }

    const lowercaseMessage = message.toLowerCase();
    let response = '';

    // Mock AI responses based on keywords
    if (lowercaseMessage.includes('sip')) {
      response = `A Systematic Investment Plan (SIP) is a smart way to invest in mutual funds. It allows you to invest a fixed amount regularly (monthly, quarterly, etc.) instead of investing a lump sum.

Benefits of SIP:
• Rupee Cost Averaging: Reduces impact of market volatility
• Disciplined Investing: Builds a habit of regular investment
• Power of Compounding: Your returns generate more returns
• Flexibility: Start with as little as ₹500 per month

Would you like to know more about how to start a SIP?`;
    } else if (lowercaseMessage.includes('coffee')) {
      response = `☕ You're spending too much on coffee! 

💡 Financial Tip: Skip one cup and invest ₹100 instead. Over a year, that's ₹36,500 saved!

🎮 Gamification Reward: Complete this challenge to gain 50 XP and level up your financial wisdom!

Small changes lead to big savings. Ready to take the challenge?`;
    } else if (lowercaseMessage.includes('budget')) {
      response = `Creating a budget is essential for financial health! Here's a simple 50-30-20 rule:

• 50% - Needs (rent, food, utilities)
• 30% - Wants (entertainment, dining out)
• 20% - Savings & Investments

Track your spending regularly and adjust as needed. Would you like help setting up your budget?`;
    } else if (lowercaseMessage.includes('save') || lowercaseMessage.includes('saving')) {
      response = `Great question! Here are some saving tips:

1. Set specific goals (emergency fund, vacation, etc.)
2. Automate your savings
3. Cut unnecessary subscriptions
4. Use the 24-hour rule before big purchases
5. Invest regularly through SIP

Remember: Pay yourself first! Save before you spend.`;
    } else if (lowercaseMessage.includes('invest') || lowercaseMessage.includes('investment')) {
      response = `Investment is key to wealth building! Here are some beginner-friendly options:

• SIP in Mutual Funds: Low risk, diversified
• PPF (Public Provident Fund): Tax-free, government-backed
• Fixed Deposits: Safe, guaranteed returns
• Index Funds: Market-linked, low cost

Start small, stay consistent, and let compounding work its magic! 📈`;
    } else {
      response = `I am FinBuddy, your AI financial mentor! 🤖

I can help you with:
• Understanding financial concepts (like SIP, mutual funds)
• Budgeting tips and strategies
• Investment guidance
• Saving money challenges
• Financial goal planning

Ask me anything about finance, and I'll help you become financially wise!`;
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
