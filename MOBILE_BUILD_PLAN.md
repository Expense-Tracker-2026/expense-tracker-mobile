# Mobile App Plan: Expense Tracker (React Native + Expo)

## Context
The existing Next.js expense tracker at `~/Documents/Claude Code/Expense Tracker App/expense-tracker/` needs a mobile companion app for Android and iOS, connecting to the same Firebase project and offering all the same features.

---

## Recommendation: React Native + Expo (not Flutter)

**Why React Native wins for this specific codebase:**

| Factor | React Native | Flutter |
|---|---|---|
| Code reuse from web | ~65% (all lib/, hooks/, contexts/) | 0% (Dart rewrite) |
| Language | TypeScript — already used | Dart — new language to learn |
| Firebase SDK | Same JS SDK, identical API calls | Dart SDK, different query patterns |
| taxUtils.ts, types.ts, categories.ts | Copy verbatim | Full rewrite in Dart |
| Hooks (useExpenses, etc.) | Remove `'use client'`, paste in | Full rewrite |
| Custom SVG charts | react-native-svg uses same Path logic | fl_chart — different API |

Flutter is the better choice only when starting from zero with no existing TypeScript logic. Here you have 9 hooks, 11 lib files, and all contexts already written — React Native lets you reuse all of it.

---

## Files to Copy From Web App (Zero Changes Needed)

These files from the web app work in React Native without modification (just remove `'use client'` from hooks):

- `lib/types.ts` — All TypeScript interfaces
- `lib/categories.ts` — 28 expense categories
- `lib/incomeCategories.ts` — 6 income categories
- `lib/currency.ts` — 25 currencies
- `lib/taxUtils.ts` — Australian tax calculations (pure TypeScript)
- `lib/taxCategories.ts` — ATO D1-D15 codes
- `lib/utils.ts` — Copy minus `exportToCSV`/`exportCombinedReport` (browser-only)
- `hooks/useExpenses.ts` — Remove `'use client'`
- `hooks/useIncome.ts` — Remove `'use client'`
- `hooks/useAccounts.ts` — Remove `'use client'`
- `hooks/useBudgets.ts` — Remove `'use client'`
- `hooks/useSavingsGoals.ts` — Remove `'use client'`
- `hooks/useFamilyMembers.ts` — Remove `'use client'`
- `hooks/useUserProfile.ts` — Remove `'use client'`
- `hooks/useCustomTaxCategories.ts` — Remove `'use client'`
- `contexts/FamilyContext.tsx` — Copy verbatim

**Files to adapt (small changes only):**
- `contexts/AuthContext.tsx` — Replace `signInWithPopup` → `GoogleSignin.signIn()` + `signInWithCredential`
- `contexts/CurrencyContext.tsx` — Replace `localStorage` → `expo-secure-store`
- `hooks/useExchangeRate.ts` — Call `open.er-api.com` directly (no Next.js proxy)
- `lib/attachmentStorage.ts` — Replace `File` constructor with `fetch(uri).then(r => r.blob())`

---

## Phased Build Plan

| Phase | Focus | Duration |
|---|---|---|
| 1 | Setup + Firebase Auth + Tab shell | Week 1 |
| 2 | Expenses CRUD + Income CRUD | Week 2 |
| 3 | Accounts + Budgets + Savings | Week 3 |
| 4 | Dashboard + Charts | Week 4 |
| 5 | Tax screen + File attachments | Week 5 |
| 6 | Profile + Family + Polish | Week 6 |

---

## Verification
- Add expense on web → verify it appears on mobile via onSnapshot
- Add income on mobile → verify it appears on web
- Test Google Sign-In on both iOS and Android
- Test file attachment upload/download on device camera
- Test tax screen FY selector and ATO deduction calculations

---

## The Claude Code Prompt

Copy and paste the following prompt into Claude Code CLI from inside a new empty directory where you want the mobile app created.

---

```
You are building a React Native (Expo) mobile app that is the mobile companion to an existing Next.js expense tracker. The mobile app MUST connect to the EXACT SAME Firebase project and Firestore collections as the web app. Do not create any new Firebase project or collections.

## EXISTING WEB APP LOCATION
The web app lives at: /Users/avishka/Documents/Claude Code/Expense Tracker App/expense-tracker/

You MUST read and reuse these files from the web app before writing any mobile code:
- lib/types.ts — All TypeScript interfaces (Expense, Income, Account, Budget, SavingsGoal, FamilyMember, UserProfile, AttachmentMeta, SubscriptionTier, all form data types, filter types)
- lib/categories.ts — 28 expense categories with CATEGORY_ICONS, CATEGORIES, getCategoryConfig()
- lib/incomeCategories.ts — 6 income categories with INCOME_CATEGORY_ICONS, INCOME_CATEGORIES, getIncomeCategoryConfig()
- lib/currency.ts — CURRENCIES array with 25 currencies (code, name, symbol)
- lib/taxUtils.ts — Australian tax calculations: getCurrentFinancialYear(), getFinancialYearRange(), getAllFinancialYears(), filterByFinancialYear(), calculateTaxSummary() — copy verbatim, pure TypeScript with no browser dependencies
- lib/taxCategories.ts — TAX_DEDUCTION_CATEGORIES array (ATO D1-D15 codes), generateCategoryCode(), getTaxCategoryDef()
- lib/utils.ts — Copy these functions: formatCurrency(), formatDate(), generateId(), getCurrentMonthTotal(), getTotalByCategory(), getMonthlyData(), getMonthlyGroupedData(). Do NOT copy exportToCSV() or exportCombinedReport() (browser-only)
- hooks/useExpenses.ts — Firestore hook with onSnapshot, addExpense, updateExpense, deleteExpense + account balance adjustment
- hooks/useIncome.ts — Firestore hook with addIncome, updateIncome, deleteIncome
- hooks/useAccounts.ts — Firestore hook with addAccount, updateAccount, deleteAccount, adjustBalance, computed net worth fields
- hooks/useBudgets.ts — Firestore hook with addBudget, updateBudget, deleteBudget
- hooks/useSavingsGoals.ts — Firestore hook with addGoal, updateGoal, deleteGoal
- hooks/useFamilyMembers.ts — Firestore hook with addMember, updateMember, deleteMember
- hooks/useUserProfile.ts — Firestore hook with saveProfile, subscriptionTier field
- hooks/useCustomTaxCategories.ts — Firestore hook for user-defined ATO deduction categories
- hooks/useExchangeRate.ts — Adapt to call open.er-api.com/v6/latest/{base} directly (no Next.js proxy on mobile)
- contexts/AuthContext.tsx — Keep AuthContextValue interface identical, adapt signInGoogle to use GoogleSignin package instead of signInWithPopup
- contexts/FamilyContext.tsx — Copy verbatim
- contexts/CurrencyContext.tsx — Replace localStorage with expo-secure-store

## FIREBASE CONFIGURATION
Read the Firebase config values from:
/Users/avishka/Documents/Claude Code/Expense Tracker App/expense-tracker/.env.local

Keys to read:
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID

Create src/lib/firebase.ts with identical config. If .env.local is not readable, ask the user to provide these values before proceeding.

## FIRESTORE DATA STRUCTURE
All user data is stored under: users/{userId}/

Collections:
- users/{userId} — UserProfile document
- users/{userId}/expenses — ordered by date desc
- users/{userId}/income — ordered by date desc
- users/{userId}/accounts
- users/{userId}/budgets
- users/{userId}/savingsGoals
- users/{userId}/familyMembers
- users/{userId}/customTaxCategories

Firebase Storage: users/{userId}/attachments/{key}

## SETUP

1. Initialize Expo project:
   npx create-expo-app@latest expense-tracker-mobile --template expo-template-blank-typescript
   cd expense-tracker-mobile

2. Install dependencies:
   npx expo install expo-router expo-secure-store expo-image-picker expo-document-picker expo-file-system expo-sharing expo-local-authentication expo-notifications expo-web-browser react-native-gesture-handler react-native-reanimated react-native-safe-area-context react-native-screens react-native-svg firebase @react-native-google-signin/google-signin nativewind tailwindcss @react-native-community/datetimepicker

3. Configure app.json:
   - bundleIdentifier: "com.yourname.expensetracker"
   - package: "com.yourname.expensetracker"
   - scheme: "expensetracker"
   - Enable plugins: expo-router, expo-secure-store, expo-image-picker, expo-document-picker, expo-local-authentication, expo-notifications

4. Configure NativeWind:
   - tailwind.config.js with content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"]
   - babel.config.js plugin: "nativewind/babel"

5. Configure Google Sign-In:
   - iOS: Add GoogleService-Info.plist from Firebase Console > Project Settings > iOS app
   - Android: Add google-services.json from Firebase Console > Project Settings > Android app
   - Configure webClientId from Firebase Console OAuth settings

## PROJECT STRUCTURE

expense-tracker-mobile/
  app/
    _layout.tsx
    (auth)/
      _layout.tsx
      login.tsx
      register.tsx
    (app)/
      _layout.tsx          — Tab navigator: Dashboard, Expenses, Income, Savings, Budgets, Tax, Accounts, Profile
      index.tsx            — Dashboard
      expenses.tsx
      income.tsx
      savings.tsx
      budgets.tsx
      tax.tsx
      accounts.tsx
      investments.tsx
      tools.tsx
      profile.tsx
      family.tsx
      subscription.tsx
  components/
    ui/
      Button.tsx, Card.tsx, Badge.tsx, FormField.tsx, Modal.tsx (bottom sheet),
      LoadingSpinner.tsx, EmptyState.tsx, Avatar.tsx, SwipeableRow.tsx, TagInput.tsx
    charts/
      CategoryDonutChart.tsx  — Port from web using react-native-svg Path
      MonthlyBarChart.tsx     — Port from web using react-native-svg
    forms/
      ExpenseForm.tsx, IncomeForm.tsx, AccountForm.tsx, BudgetForm.tsx,
      SavingsGoalForm.tsx, FamilyMemberForm.tsx, AttachmentPicker.tsx
    dashboard/
      SummaryCards.tsx, SavingsRate.tsx, BudgetAlerts.tsx, RecentTransactions.tsx
  lib/                     — Copied from web app (see above)
  hooks/                   — Copied from web app (remove 'use client')
  contexts/                — Adapted from web app

## KEY SCREEN REQUIREMENTS

### Login Screen
- Email/password inputs, Sign In button
- Google Sign In button (@react-native-google-signin/google-signin)
- Link to Register, inline error messages, loading spinner during auth

### Dashboard
- Gradient header (violet #6D28D9 → indigo #4F46E5) with greeting and date
- SummaryCards: This Month Expenses, Income, Net Balance, Net Worth
- MonthlyBarChart (last 6 months, income vs expenses)
- CategoryDonutChart (expense breakdown)
- SavingsRate component
- Budget alerts (categories at 80%+ of limit)
- Recent Expenses (last 5) + Recent Income (last 5)
- FAB with quick-add: Add Expense / Add Income
- Pull-to-refresh

### Expenses Screen
- Filter bar: search, category picker, tag filter, date range, sort
- FlatList with SwipeableRow (swipe left = delete, swipe right = edit)
- Total filtered amount in header
- "Add Expense" button → ExpenseForm bottom sheet modal

### ExpenseForm (most complex — build this first)
All fields from web ExpenseFormModal:
- Date picker (DateTimePicker)
- Amount + currency selector (25 currencies) + live conversion preview
- Category picker (28 categories with emojis from CATEGORY_ICONS)
- Tax Deductible toggle → when on, show:
  - ATO Category picker (TAX_DEDUCTION_CATEGORIES + custom + "Add new")
  - Inline "Add new custom category" form
  - Deductible Portion: preset buttons 25%/50%/75%/100% + custom % + bidirectional amount sync
  - Employer/Company input with suggestions
  - Reason for Deduction (multiline)
- Account selector (optional, shows balance impact preview)
- Family Member selector (only when isFamilyEnabled from FamilyContext)
- Description (multiline)
- Tags (TagInput component)
- AttachmentPicker (camera / photo library / document)

### IncomeForm
- Date, Amount + currency, Category (6 income types)
- PAYG Salary Breakdown toggle → Gross Amount, Tax Withheld, Super, Net Pay (auto-calculated)
- Employer input, Account selector, Family Member selector, Description, Tags, Attachment

### Tax Screen
- Financial Year selector
- Member tabs (Combined / per member when isFamilyEnabled)
- Summary cards: Gross Income, Tax Withheld, Super, Total Deductions, Net Take-Home
- Monthly Income Breakdown: horizontal-scrollable table (Month, Gross, Tax, Super, Net, Other)
- Deductions by ATO Category: list with progress bars
- All Deductible Expenses: horizontal-scrollable table
- Export for Tax Agent button: generate CSV via expo-file-system, share via expo-sharing
- Custom ATO Category management

### Accounts Screen
- Net worth display (accessible + including super)
- Account cards by type with color swatch, name, institution, balance
- Add/edit account modal with type picker, color picker

### Profile Screen
- Avatar (initials + gradient), display name, email, provider badge
- Stats grid: expenses logged, income entries, totals
- Personal Info form: name, phone, occupation, DOB, country, bio, avatar color picker
- Security (email provider): Change Password, Change Email
- Subscription section
- Family Management section (diamond+ only)
- Danger Zone: Delete Account with "DELETE" text confirmation + password

## COMPONENT PATTERNS

### Colors
- Primary: #7C3AED (violet-600)
- Secondary: #4F46E5 (indigo-600)
- Success: #059669 (emerald-600)
- Danger: #DC2626 (red-600)
- Warning: #D97706 (amber-600)
- Nav background gradient: #0F172A → #1A1033
- Card: white with #F8FAFC border

### Forms
- Open as bottom sheet modals (slide up, max 90% screen height)
- Inline validation errors below each field
- DateTimePicker for dates, keyboardType="decimal-pad" for amounts

### Charts (react-native-svg)
- CategoryDonutChart: port arc path math from web, use react-native-svg Path component, SVG viewBox="0 0 200 200"
- MonthlyBarChart: port bar height calculations, side-by-side income (emerald) + expense (violet) bars, SVG viewBox="0 0 300 150"

### Attachment Handling
- expo-image-picker for camera + photo library
- expo-document-picker for PDFs/docs
- Upload: fetch(uri).then(r => r.blob()) → uploadBytes() to Firebase Storage
- Store AttachmentMeta {key, name, size, type, uploadedAt} in Firestore document
- Download: getDownloadURL → expo-web-browser.openBrowserAsync()

### Currency Storage
Replace localStorage in CurrencyContext:
  await SecureStore.setItemAsync('preferred-currency', code);
  const saved = await SecureStore.getItemAsync('preferred-currency');

### Exchange Rate
Call directly (no Next.js proxy on mobile):
  fetch(`https://open.er-api.com/v6/latest/${base}`)
Keep the same 1-hour module-level cache pattern from the web hook.

## WHAT NOT TO BUILD (web-only, skip on mobile)
- document.createElement for CSV export → use expo-file-system + expo-sharing
- Drag-and-drop file upload → use native pickers
- signInWithPopup → use GoogleSignin package
- localStorage → use expo-secure-store
- Next.js routing → use expo-router

## BUILD ORDER
Execute in this order, verify each step works before continuing:

1. Initialize Expo project + install all dependencies
2. Read Firebase config from web app .env.local → create src/lib/firebase.ts
3. Copy all lib/ files from web app (types, categories, currency, taxUtils, taxCategories, utils, incomeCategories)
4. Copy all hooks/ files (remove 'use client' from each)
5. Adapt AuthContext (Google sign-in), FamilyContext (copy verbatim), CurrencyContext (SecureStore)
6. Build auth screens (Login, Register)
7. Build tab navigator shell with placeholder screens
8. Verify Firebase auth + Firestore onSnapshot works (read one collection, log to console)
9. Build shared UI components (Button, Card, Badge, Modal, FormField, SwipeableRow, TagInput, Avatar, LoadingSpinner, EmptyState)
10. Build ExpenseForm (most complex form — get right before others)
11. Build Expenses screen with list + CRUD
12. Build IncomeForm + Income screen
13. Build Dashboard with SummaryCards + Charts
14. Build Accounts, Budgets, Savings screens
15. Build Tax screen (calculateTaxSummary from taxUtils.ts handles all logic)
16. Wire up AttachmentPicker with Firebase Storage
17. Build Profile screen
18. Build Family, Subscription, Tools, Investments screens
19. Add pull-to-refresh, empty states, loading skeletons to all screens
20. End-to-end test: add expense on web → verify on mobile; add income on mobile → verify on web

## QUALITY REQUIREMENTS
- TypeScript strict mode, no `any` types
- All Firestore writes must match exact document shape in lib/types.ts
- Use onSnapshot for all data (not getDocs) — real-time sync is required
- Handle loading states (skeleton/spinner) and empty states on all screens
- Handle Firestore errors with user-visible messages
- Offline support is automatic (Firestore JS SDK has offline persistence by default)
```
