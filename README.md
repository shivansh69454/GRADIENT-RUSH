# 🪙 FinWise – Gamified Financial Mentor
> **Turning financial anxiety into a game you can win.**  
> Learn, save, and level up your money skills — one XP at a time.

**FinWise** is a **Next.js 14** web app that helps students and first-time earners build financial discipline through **AI mentorship**, **gamified savings**, and **real expense tracking**.  
Inspired by the *Solo Leveling System*, every healthy money habit earns XP and unlocks new levels — making finance *fun, rewarding, and habit-forming*.

---

## 🌍 Live Demo
🔗 **[https://finwise.vercel.app](https://finwise-7s4q.vercel.app/onboarding)**  
🎥 **1-Minute Demo Video:** *Add Loom / YouTube link here*
---

## 🚀 Version 2.0 – Major Dashboard Redesign
### What’s New
- ✅ Real-time expense tracking with categories  
- ✅ Stock-market watchlist  
- ✅ Budget overview with daily spending alerts  
- ✅ Integrated AI Mentor on dashboard  
- ✅ Persistent data across sessions  

📘 See `QUICK_START.md` for setup guide  
📗 See `DASHBOARD_REDESIGN.md` for detailed architecture  

---

## 💡 Overview
> 70 % of first-time earners struggle to manage money — FinWise turns financial learning into an experience that feels like leveling up in a game.

FinWise combines **AI guidance**, **automation**, and **gamification** to help users form lasting financial habits.  
It teaches finance through *action, not theory.*

---

## 🧩 Core MVP Features

### 🎮 1. Gamification System (100 Levels)
- Earn **50 XP per daily task**, **1000 XP = 1 Level**
- Titles evolve: *Finance Beginner → Financial Master*
- Unlock rewards:
  - Lv 1–20 → 5 % goal discount  
  - Lv 81–100 → 25 % goal discount  

---

### 👋 2. Smooth Onboarding
3-step signup: **Name → Age → Monthly Allowance**  
Simple gradient UI with progress bar and local storage.  
Accessible (WCAG compliant) design for readability and inclusivity.  

---

### ✅ 3. Daily Financial Tasks
6 AI-generated daily challenges such as “Track today’s spend” or “Add ₹100 to emergency fund.”  
Earn XP on completion, resets daily at midnight.

---

### 💸 4. Expense Tracker
- Add, edit, and delete expenses  
- Auto-saved locally  
- Categories: Food, Transport, Shopping, Entertainment, Other  
- Real-time totals and history  

---

### 📊 5. Weekly & Monthly Overview
Weekly resets (every Monday)  
Auto-visualization of monthly totals and overspending patterns.  

---

### 📈 6. Stock Market Watchlist
Add/remove stocks by symbol  
Simulated real-time price tracking (TCS, INFY, RELIANCE default)  
Color-coded performance indicators  

---

### 💰 7. Budget Overview
- Circular progress chart for budget health  
- Alerts:  
  - 🟢 Under 80 % budget  
  - 🟠 80–100 %  
  - 🔴 Over budget  

---

### 🤖 8. AI Mentor Chat
- Embedded mentor answers finance questions like “How do I start a SIP?”  
- Persistent chat history with timestamps  
- Personalized guidance using contextual prompts  

---

### 🧮 9. Finance Calculators
Includes:
- EMI Calculator  
- SIP Return Estimator  
- Compound Interest Visualizer  

---

## 💼 Learn & Earn + Advisory Marketplace

### 🎓 Educator Platform
- Verified educators/advisors (ACBI-approved) can list paid or free courses.  
- Learners earn XP as they learn.  
- Transparent verification for advisor credibility.

### 🧑‍🏫 Advisory Packages *(NEW)*
Users can purchase **advisory packages** directly from listed experts.  
Each package covers topics like:
- Stock Market Fundamentals  
- Portfolio Building  
- Long-Term Wealth Creation  

**Payment options:** Google Pay, cards, or wallet.

---

## 🧾 Splitter – Group Expense Sharing *(NEW)*
Create groups with friends or roommates.  
When one person spends, the expense splits evenly among members.  
- Reminders for pending payments or dues  
- Dashboard shows “You Owe” and “You Get” status  
- Real-time sync for accountability  

---

## 🛒 Smart Price Tracker *(NEW)*
Never overpay again.  
- Paste any **Amazon link** and set a **target price**  
- FinWise tracks the product price in real time  
- When the price hits target, users get:
  - In-app pop-up notification  
  - Optional WhatsApp/email alert  
- Encourages **smart shopping and savings behavior**  

---

## ⚙️ Upcoming & Advanced Features
- 🔗 **WhatsApp Bot:** Scan bills → auto-add expenses (OCR + parser)  
- 📬 **Transaction Sync:** Extract SMS/email data to auto-update dashboard  
- ☁️ **Database Integration (MongoDB):** Full persistence & cross-device sync  
- 📉 **Live Financial Insights:** Market API profit/loss visualization  

---

## 🌍 Impact & Vision
> “We don’t just track money — we teach people how to master it.”

FinWise promotes **financial inclusion and literacy** through gamification and AI.  
Its mission: help the next generation become financially confident and disciplined.

---

## 🧭 Judge Walkthrough (2–5 Minutes)
1. Complete onboarding → enter Name, Age, Allowance  
2. Add a few expenses → see real-time updates  
3. Chat with AI Mentor → ask “How do I start a SIP?”  
4. Add a saving goal → XP increases instantly  
5. Test Price Tracker → paste Amazon link + set target  
6. Try Splitter → add group & share expense  
7. Explore “Learn & Earn” → check advisor packages  

---

## 🧑‍💻 Tech Stack & Dev Notes
- **Framework:** Next.js 14 + Tailwind CSS  
- **Storage:** Local-first (ready for MongoDB)  
- **AI Mentor:** Mock endpoint (expandable to OpenAI/Gemini APIs)  
- **Deployment:** Optimized for Vercel  
- **Offline-first:** Core features run without backend  
- Modular hooks for APIs, DB, and third-party integrations  

---

## 🏁 Summary
FinWise is **not just a finance tracker — it’s a behavioral mentor.**  
It transforms money management into an **interactive journey** powered by **AI, education, and automation**.  
**Built for young earners. Designed for real impact.**

---
