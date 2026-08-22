# FinWise Testing Guide

## 🧪 How to Test All Features

### Prerequisites
✅ Server is running: `npm run dev`  
✅ Browser open at: http://localhost:3000

---

## 1️⃣ Test Theme Toggle (Dark/Light Mode)

**Steps:**
1. Look at the top-right corner of the header
2. You should see a **sun icon** (because default theme is dark)
3. Click the sun icon
4. **Expected Result**: 
   - Icon changes to a moon 🌙
   - Entire app switches to light mode
   - Background becomes white/light gray
   - Text becomes dark
5. Click again to switch back
6. **Expected Result**: App returns to dark mode

**Persistence Test:**
1. Switch to light mode
2. Refresh the page (F5)
3. **Expected Result**: App stays in light mode (saved to localStorage)

---

## 2️⃣ Test Dashboard Components

### Level Display
**What to check:**
- Shows "Level 3" badge
- Shows "1750 XP" 
- Progress bar is partially filled
- Shows "XP to Level 4" text
- Level badge has gradient purple/indigo color

### Budget Tracker
**What to check:**
- Budget: ₹20,000
- Spent: ₹5,095 (rent 3500 + food 95 + shopping 1500)
- Remaining: ₹14,905
- Progress bar is filled ~25%
- Progress bar is green (under 70%)

### Transaction List
**What to check:**
- Shows 4 transactions
- Each has correct emoji icon (🏠 🍽️ 💰 🛍️)
- Debits are red, Credits are green
- Dates are formatted correctly
- Amounts are in ₹ (Indian Rupees)

---

## 3️⃣ Test Daily Challenge

**Initial State:**
1. Purple/indigo gradient card
2. Shows "+100 XP" badge
3. Button says "Completed! Claim XP"
4. Button is white with indigo text

**Test XP Award:**
1. Click "Completed! Claim XP" button
2. **Expected Results**:
   - Button becomes disabled and grayed out
   - Button text changes to "✓ Completed!"
   - User XP increases from 1750 → 1850
   - Progress bar updates to show new XP
   - Quick Stats shows updated XP: 1850 XP
   - Level remains at 3 (need 3001 XP for Level 4)

**Verify Button Disabled:**
1. Try clicking the button again
2. **Expected Result**: Nothing happens (button is disabled)

---

## 4️⃣ Test AI Chat Mentor

**Navigate to Chat:**
1. Click "AI Mentor" in the navigation
2. Should redirect to `/mentor` page

**Test Initial Message:**
- First message from FinBuddy should be visible
- Says: "Hello! I am FinBuddy..."

**Test Keyword: SIP**
1. Type: "What is SIP?"
2. Click "Send"
3. **Expected Result**: 
   - Message appears in chat
   - Loading dots show briefly
   - FinBuddy responds with detailed SIP explanation
   - Mentions benefits (Rupee Cost Averaging, etc.)

**Test Keyword: Coffee**
1. Type: "I spend too much on coffee"
2. Click "Send"
3. **Expected Result**:
   - FinBuddy gives gamified nudge
   - Mentions "gain 50 XP" 
   - Encourages skipping coffee and investing

**Test General Query**
1. Type: "How to save money?"
2. Click "Send"
3. **Expected Result**:
   - FinBuddy provides saving tips
   - Lists 5 strategies

**Test Voice Input (Mock)**
1. Click the microphone icon
2. **Expected Result**: Alert saying "Voice input feature coming soon!"

---

## 5️⃣ Test Responsive Design

**Desktop (> 1024px):**
- Dashboard shows 2 columns (left: 2/3, right: 1/3)
- Navigation shows all links

**Tablet (768px - 1024px):**
- Dashboard becomes single column
- Cards stack vertically

**Mobile (< 768px):**
- Single column layout
- Text sizes adjust
- Touch-friendly buttons

**To Test:** Resize browser window or use DevTools responsive mode (F12 → Toggle Device Toolbar)

---

## 6️⃣ Test Navigation

**Home Route (`/`):**
1. Go to: http://localhost:3000
2. **Expected Result**: Automatically redirects to `/dashboard`

**Dashboard Route (`/dashboard`):**
1. Click "Dashboard" in navigation
2. Shows main dashboard with all widgets

**Mentor Route (`/mentor`):**
1. Click "AI Mentor" in navigation
2. Shows chat interface

**Logo Click:**
1. Click the "FinWise" logo
2. **Expected Result**: Returns to dashboard

---

## 7️⃣ Test Edge Cases

### XP Calculation
**Test Level Boundaries:**
- Current: 1750 XP = Level 3 ✓
- After challenge: 1850 XP = Still Level 3 ✓
- Need: 3001 XP for Level 4

### Budget Warnings
**To test yellow warning (70%):**
- Current spending is 25% (green) ✓
- Would need ₹14,000+ spent for yellow

**To test red warning (90%):**
- Would need ₹18,000+ spent for red

### Empty States
- Chat has initial message (never truly empty) ✓
- Transaction list has 4 items ✓

---

## 8️⃣ Browser Console Check

**Open DevTools (F12) → Console Tab**

**Expected:**
- ✅ No red errors
- ✅ No warnings about hooks
- ✅ May see info about Next.js telemetry (safe to ignore)
- ✅ No "useTheme must be used within ThemeProvider" error

---

## ✅ Success Criteria

All features should work without:
- ❌ React errors in console
- ❌ Page crashes or blank screens
- ❌ Failed API calls
- ❌ Broken styling
- ❌ Non-responsive elements

If all tests pass → **FinWise MVP is working perfectly!** 🎉

---

## 🐛 Troubleshooting

**If something doesn't work:**

1. **Refresh the page** (F5)
2. **Hard refresh** (Ctrl + F5)
3. **Clear cache** and refresh
4. **Restart server**: 
   - Press Ctrl+C in terminal
   - Run `npm run dev` again
5. **Check terminal** for any error messages

---

**Happy Testing! 🚀**
