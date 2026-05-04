import type { IncomeCategory } from './types';

export interface IncomeCategoryConfig {
  name: IncomeCategory;
  color: string;
  bgClass: string;
  textClass: string;
}

export const INCOME_CATEGORIES: IncomeCategoryConfig[] = [
  { name: 'Salary',      color: '#10b981', bgClass: 'bg-emerald-100', textClass: 'text-emerald-700' },
  { name: 'Freelance',   color: '#6366f1', bgClass: 'bg-indigo-100',  textClass: 'text-indigo-700'  },
  { name: 'Business',    color: '#f59e0b', bgClass: 'bg-amber-100',   textClass: 'text-amber-700'   },
  { name: 'Investments', color: '#3b82f6', bgClass: 'bg-blue-100',    textClass: 'text-blue-700'    },
  { name: 'Gift',        color: '#ec4899', bgClass: 'bg-pink-100',    textClass: 'text-pink-700'    },
  { name: 'Other',       color: '#6b7280', bgClass: 'bg-gray-100',    textClass: 'text-gray-600'    },
];

export const INCOME_CATEGORY_NAMES: IncomeCategory[] = [
  'Salary', 'Freelance', 'Business', 'Investments', 'Gift', 'Other',
];

export const INCOME_CATEGORY_ICONS: Record<IncomeCategory, string> = {
  Salary:      '💼',
  Freelance:   '💻',
  Business:    '🏢',
  Investments: '📈',
  Gift:        '🎁',
  Other:       '💰',
};

export function getIncomeCategoryConfig(category: IncomeCategory): IncomeCategoryConfig {
  return INCOME_CATEGORIES.find(c => c.name === category) ?? INCOME_CATEGORIES[5];
}
