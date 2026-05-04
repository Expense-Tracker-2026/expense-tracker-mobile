// ── Subscriptions ────────────────────────────────────────

export type SubscriptionTier = 'free' | 'diamond' | 'platinum';

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, { label: string; color: string; emoji: string }> = {
  free:     { label: 'Free',     color: '#6B7280', emoji: '🆓' },
  diamond:  { label: 'Diamond',  color: '#3B82F6', emoji: '💎' },
  platinum: { label: 'Platinum', color: '#8B5CF6', emoji: '🏆' },
};

// ── Family Members ────────────────────────────────────────

export type FamilyRelationship = 'Self' | 'Spouse/Partner' | 'Child' | 'Parent' | 'Sibling' | 'Other';

export interface FamilyMember {
  id: string;
  name: string;
  phone?: string;
  relationship?: FamilyRelationship;
  dateOfBirth?: string;
  avatarColor: string;
  createdAt: string;
  updatedAt: string;
}

// ── Attachments ────────────────────────────────────────

export interface AttachmentMeta {
  key: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

// ── Accounts ────────────────────────────────────────────

export type AccountType = 'checking' | 'savings' | 'investment' | 'super' | 'cash' | 'credit' | 'loan';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  institution?: string;
  color: string;
  notes?: string;
  memberId?: string; // undefined = primary user, 'joint' = shared, otherwise FamilyMember.id
  createdAt: string;
  updatedAt: string;
}

// ── Savings Goals ────────────────────────────────────────

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  color: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Budgets ──────────────────────────────────────────────

export interface Budget {
  id: string;
  category: Category;
  monthlyLimit: number;
  createdAt: string;
  updatedAt: string;
}

// Built-in ATO deduction category values — custom user-defined categories are plain strings
export type TaxDeductionCategory = string;

export type Category =
  | 'Business'
  | 'Childcare'
  | 'Eating Out'
  | 'Education'
  | 'Entertainment'
  | 'Fees & Interest'
  | 'Gifts & Donations'
  | 'Groceries'
  | 'Health & Medical'
  | 'Home'
  | 'Home Loan'
  | 'Insurance'
  | 'Internet'
  | 'Investments'
  | 'Personal Care'
  | 'Pets'
  | 'Phone'
  | 'Professional Services'
  | 'Shares'
  | 'Shopping'
  | 'Sport & Fitness'
  | 'Super Contributions'
  | 'Tax'
  | 'Transfers'
  | 'Travel & Holidays'
  | 'Utilities'
  | 'Vehicle & Transport'
  | 'Other';

export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: Category;
  description: string;
  tags?: string[];
  attachment?: AttachmentMeta;
  accountId?: string;
  isTaxDeductible?: boolean;
  taxDeductionCategory?: TaxDeductionCategory;
  deductiblePercentage?: number;
  taxRelatedEmployer?: string;
  taxDeductionReason?: string;
  memberId?: string; // undefined = family/shared, otherwise FamilyMember.id
  createdAt: string;
}

export interface ExpenseFormData {
  date: string;
  amount: string;
  category: Category;
  description: string;
  tags: string[];
  attachment?: AttachmentMeta;
  accountId?: string;
  isTaxDeductible?: boolean;
  taxDeductionCategory?: TaxDeductionCategory;
  deductiblePercentage?: number;
  taxRelatedEmployer?: string;
  taxDeductionReason?: string;
  memberId?: string;
}

export interface FilterState {
  search: string;
  category: Category | 'All';
  tag: string;
  dateFrom: string;
  dateTo: string;
  sortBy: 'date' | 'amount';
  sortOrder: 'asc' | 'desc';
}

// ── Income ──────────────────────────────────────────────

export type IncomeCategory = 'Salary' | 'Freelance' | 'Business' | 'Investments' | 'Gift' | 'Other';

export interface Income {
  id: string;
  date: string;
  amount: number;
  category: IncomeCategory;
  description: string;
  tags?: string[];
  attachment?: AttachmentMeta;
  accountId?: string;
  employer?: string;
  grossAmount?: number;
  taxWithheld?: number;
  superannuation?: number;
  memberId?: string; // undefined = family/shared, otherwise FamilyMember.id
  createdAt: string;
}

export interface IncomeFormData {
  date: string;
  amount: string;
  category: IncomeCategory;
  description: string;
  tags: string[];
  attachment?: AttachmentMeta;
  accountId?: string;
  employer?: string;
  grossAmount?: string;
  taxWithheld?: string;
  superannuation?: string;
  memberId?: string;
}

export interface IncomeFilterState {
  search: string;
  category: IncomeCategory | 'All';
  tag: string;
  dateFrom: string;
  dateTo: string;
  sortBy: 'date' | 'amount';
  sortOrder: 'asc' | 'desc';
}
