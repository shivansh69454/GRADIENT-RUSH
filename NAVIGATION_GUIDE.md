# 🧭 FinWise Navigation Guide

## How to Access All New Features

### 🏠 Main Pages (Available from Header)
1. **Dashboard** - `/dashboard`
   - Main hub with all panels
   - FloatingMentor button (bottom-right)
   - Auto-completing tasks
   - Expense splitter with persistence

2. **Courses** - `/courses`
   - Free and paid courses
   - Level-based discounts displayed
   - FloatingMentor button (bottom-right)
   - Auto-completes tasks on course completion

3. **AI Mentor** - `/mentor`
   - Full-page AI chat
   - Can answer ANY question (not just finance)

### 🆕 New Pages (Manual Navigation)

1. **Import Expenses** - Type in browser: `http://localhost:3001/import-expense`
   - Paste UPI/SMS messages
   - Auto-extract and import expenses

2. **Ads & Promotions** - Type in browser: `http://localhost:3001/ads`
   - View SEBI-registered advisors
   - Compare subscription plans
   - Filter by advisor type

3. **Smart Shopping** - Type in browser: `http://localhost:3001/shopping`
   - Compare prices across platforms
   - Search for products
   - Find best deals

4. **Become Educator** - Type in browser: `http://localhost:3001/become-educator`
   - Apply to teach on FinWise
   - Fill contact form
   - Submit application

### 💡 Feature Locations

#### Level-Based Discounts 💰
- **See Your Discount:** Top-right of header (appears at level 20+)
- **Use Discount:** Courses page → Paid Courses section
- **Discount Tiers:**
  - Level 20-39: 5% OFF
  - Level 40-59: 10% OFF
  - Level 60-79: 15% OFF
  - Level 80-99: 20% OFF
  - Level 100+: 25% OFF

#### Floating AI Mentor 🤖
- **Location:** Bottom-right corner
- **Available On:** Dashboard, Courses pages
- **Click:** Opens chat popup
- **Ask:** Any question (finance, general knowledge, etc.)

#### Auto-Complete Tasks ✅
- **How to Trigger:**
  1. Complete a course → "Complete Daily Challenge" auto-checks
  2. Add an expense → "Track Expense" auto-checks
  3. XP awarded automatically
- **Where to See:** Dashboard → Task Panel

#### Price Alerts 🔔
- **Location:** Dashboard → Smart Wishlist panel
- **How to Use:**
  1. Add item with target price
  2. Click "🔄 Refresh Prices"
  3. If price ≤ target → Green alert banner appears
  4. Email notification simulation shown

#### Expense Persistence 💾
- **How It Works:** Create expense group → Add expenses → Delete group
- **Result:** Expenses remain in daily tracker
- **Where to See:** Dashboard → Daily Expense Tracker

#### UPI Import 📱
- **Navigate To:** `/import-expense`
- **Steps:**
  1. Copy UPI SMS from phone
  2. Paste in textarea
  3. Click "Parse Messages"
  4. Review parsed expenses
  5. Click "Import to Tracker"
  6. Auto-redirects to dashboard

#### Shopping Comparison 🛒
- **Navigate To:** `/shopping`
- **Steps:**
  1. Enter product name (e.g., "milk", "bread")
  2. Click "Search"
  3. Compare prices across Blinkit, Zepto, Flipkart
  4. Best price highlighted with green checkmark

#### Financial Advisors 📊
- **Navigate To:** `/ads`
- **Features:**
  - Filter by type (All, Investment Advisor, Trader, Portfolio Manager)
  - View P&L statements (3 months)
  - Compare monthly vs annual pricing
  - See SEBI verification

#### Educator Application 🎓
- **Navigate To:** `/become-educator`
- **Required Fields:**
  - Full Name
  - Email
  - Phone (10 digits)
  - Area of Expertise
  - Description (min 50 characters)
- **Result:** Success page with next steps

### 🎮 Quick Actions

| Want to... | Do this... |
|------------|-----------|
| See my discount | Look at top-right of header |
| Ask AI anything | Click floating button (bottom-right) |
| Import SMS expenses | Go to `/import-expense` |
| Compare product prices | Go to `/shopping` |
| See SEBI advisors | Go to `/ads` |
| Apply as educator | Go to `/become-educator` |
| Get price alerts | Add wishlist items, click refresh |
| Auto-complete tasks | Just complete courses or add expenses! |
| Keep group expenses | Delete group - expenses auto-saved |

### 📱 Mobile Tips
- All pages are responsive
- Floating mentor button scaled for mobile
- Forms optimized for mobile input
- Swipe-friendly interfaces

### 🌙 Dark Mode
- All features support dark mode
- Toggle in header
- Automatic theme persistence

---

## 🎯 Testing Checklist

- [ ] Navigate to all 4 new pages
- [ ] Check discount badge in header (need level 20+)
- [ ] Click floating mentor on dashboard and courses
- [ ] Complete a course to see auto-task completion
- [ ] Add expense to see auto-task completion
- [ ] Create expense group, add expenses, delete group, verify expenses persist
- [ ] Add wishlist item, refresh prices, see alert if price meets target
- [ ] Import expenses via UPI page
- [ ] Search products on shopping page
- [ ] Filter advisors on ads page
- [ ] Submit educator application

Enjoy your enhanced FinWise experience! 🚀
