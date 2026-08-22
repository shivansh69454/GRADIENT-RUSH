# Pastel Color Theme Update

## Overview
The entire website has been updated from an indigo/purple color scheme to a beautiful pastel color scheme with green backgrounds and diverse accent colors.

## Color Palette

### Primary Background Colors
- **Light Mode**: `#E8F5E9` (Light Green)
- **Dark Mode**: `#1B2E1F` (Dark Green)

### Page Backgrounds
- **Gradient**: `from-green-50 via-emerald-50 to-teal-50`
- **Dark Gradient**: `from-green-900/20 via-emerald-900/20 to-teal-900/20`

### Accent Colors by Component

#### Header & Navigation
- **Logo**: `from-rose-400 via-pink-400 to-fuchsia-400`
- **Active Links**: `bg-rose-100` with `text-rose-600`
- **Hover**: `bg-green-100`

#### Task Panel
- **XP Badge**: `from-sky-400 via-blue-400 to-violet-400`
- **Progress Bar**: `from-sky-400 via-blue-400 to-violet-400`
- **Cards**: `bg-green-50` with `border-green-200`

#### Quote Panel
- **Background**: `from-lavender-100 to-pink-100`
- **Border**: `border-lavender-300`
- **Icon**: `from-rose-400 via-pink-400 to-fuchsia-400`
- **Text**: `text-fuchsia-600`

#### Weekly Expenses
- **Card Background**: `bg-green-50` with `border-green-200`
- **Week Total**: `from-rose-100 to-pink-100` with `border-rose-300`
- **Month Total**: `from-emerald-100 to-teal-100` with `border-emerald-300`

#### Budget Overview (Amount Left Panel)
- **Card Background**: `bg-green-50` with `border-green-200`
- **Budget Card**: `from-lavender-100 to-purple-100` with `border-lavender-300`
- **Spent Card**: `from-red-100 to-orange-100` with `border-red-300`
- **Daily Budget**: `from-emerald-100 to-teal-100` with `border-emerald-300`

#### Buttons & Actions
- **Primary**: `from-sky-400 via-blue-400 to-violet-400`
- **Hover**: `from-sky-500 via-blue-500 to-violet-500`
- **Delete**: Red variants
- **Success**: Green/Emerald variants

#### AI Mentor (Unique Identity)
- **Container**: `from-cyan-50 via-teal-50 to-emerald-50`
- **Border**: `border-cyan-200`
- **User Messages**: `from-orange-500 to-amber-500`
- **AI Messages**: `from-cyan-500 to-teal-500`

## Components Updated

### Core UI Components
- ✅ Header.tsx - Green background, rose/pink/fuchsia accents
- ✅ StatCard.tsx - Green background cards
- ✅ TaskPanel.tsx - Sky/blue/violet accents
- ✅ QuotePanel.tsx - Lavender/pink theme
- ✅ DailyExpenseTracker.tsx - Sky accents
- ✅ WeeklyExpenseChart.tsx - Rose and emerald totals
- ✅ AmountLeftPanel.tsx - Lavender budget, emerald daily
- ✅ FloatingMentor.tsx - Sky/blue/violet button
- ✅ AIMentorChat.tsx - Cyan/teal unique theme

### Pages
- ✅ Dashboard - Green gradient background
- ✅ Courses - Green gradient background
- ✅ Advisors - Green gradient background
- ✅ AI Mentor - Green gradient background
- ✅ Shopping - Green gradient background
- ✅ Import Expense - Green gradient background

### Layout Files
- ✅ dashboard/layout.tsx
- ✅ mentor/layout.tsx
- ✅ courses/layout.tsx
- ✅ ads/layout.tsx
- ✅ shopping/layout.tsx
- ✅ import-expense/layout.tsx

### Global Styles
- ✅ globals.css - Green background variables
- ✅ glass-card utility - Green tinted glass effect

## Color Replacement Summary

### Replaced Colors
- `indigo-*` → `sky-*` / `blue-*` / `lavender-*`
- `purple-*` → `violet-*` / `pink-*` / `fuchsia-*`
- White/Gray backgrounds → `green-50` / `emerald-50`

### Unique Color Assignments
- **Level Display**: Rose/Pink/Fuchsia
- **Tasks**: Sky/Blue/Violet
- **Quote**: Lavender/Pink/Fuchsia
- **Budget**: Lavender/Purple
- **Expenses**: Rose/Pink + Emerald/Teal
- **AI Chat**: Cyan/Teal (completely unique)

## Visual Identity

The new pastel color scheme provides:
1. **Soft, Pleasant Aesthetics** - Easy on the eyes with pastel shades
2. **Clear Visual Hierarchy** - Different features use distinct color families
3. **Consistent Green Base** - All pages share green/emerald/teal backgrounds
4. **Diverse Accents** - Each component type has its own color personality
5. **Accessible Contrast** - Maintains readability in both light and dark modes

## Dark Mode Support
All pastel colors have been adapted for dark mode with:
- Reduced opacity backgrounds (e.g., `green-900/20`)
- Lighter text variants (e.g., `sky-400` instead of `sky-600`)
- Darker borders for subtle contrast
