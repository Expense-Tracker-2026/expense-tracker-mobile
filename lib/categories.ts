import type { Category } from './types';

export interface CategoryConfig {
  name: Category;
  color: string;
  bgClass: string;
  textClass: string;
}

export const CATEGORIES: CategoryConfig[] = [
  { name: 'Business',              color: '#14b8a6', bgClass: 'bg-teal-100',    textClass: 'text-teal-700'    },
  { name: 'Childcare',             color: '#fb7185', bgClass: 'bg-rose-100',    textClass: 'text-rose-700'    },
  { name: 'Eating Out',            color: '#f97316', bgClass: 'bg-orange-100',  textClass: 'text-orange-700'  },
  { name: 'Education',             color: '#3b82f6', bgClass: 'bg-blue-100',    textClass: 'text-blue-700'    },
  { name: 'Entertainment',         color: '#8b5cf6', bgClass: 'bg-violet-100',  textClass: 'text-violet-700'  },
  { name: 'Fees & Interest',       color: '#dc2626', bgClass: 'bg-red-100',     textClass: 'text-red-700'     },
  { name: 'Gifts & Donations',     color: '#ec4899', bgClass: 'bg-pink-100',    textClass: 'text-pink-700'    },
  { name: 'Groceries',             color: '#84cc16', bgClass: 'bg-lime-100',    textClass: 'text-lime-700'    },
  { name: 'Health & Medical',      color: '#10b981', bgClass: 'bg-emerald-100', textClass: 'text-emerald-700' },
  { name: 'Home',                  color: '#d97706', bgClass: 'bg-amber-100',   textClass: 'text-amber-700'   },
  { name: 'Home Loan',             color: '#ca8a04', bgClass: 'bg-yellow-100',  textClass: 'text-yellow-700'  },
  { name: 'Insurance',             color: '#64748b', bgClass: 'bg-slate-100',   textClass: 'text-slate-700'   },
  { name: 'Internet',              color: '#0ea5e9', bgClass: 'bg-sky-100',     textClass: 'text-sky-700'     },
  { name: 'Investments',           color: '#16a34a', bgClass: 'bg-green-100',   textClass: 'text-green-700'   },
  { name: 'Personal Care',         color: '#a855f7', bgClass: 'bg-purple-100',  textClass: 'text-purple-700'  },
  { name: 'Pets',                  color: '#f59e0b', bgClass: 'bg-amber-100',   textClass: 'text-amber-600'   },
  { name: 'Phone',                 color: '#60a5fa', bgClass: 'bg-blue-100',    textClass: 'text-blue-600'    },
  { name: 'Professional Services', color: '#6366f1', bgClass: 'bg-indigo-100',  textClass: 'text-indigo-700'  },
  { name: 'Shares',                color: '#047857', bgClass: 'bg-emerald-100', textClass: 'text-emerald-800' },
  { name: 'Shopping',              color: '#f472b6', bgClass: 'bg-pink-100',    textClass: 'text-pink-600'    },
  { name: 'Sport & Fitness',       color: '#06b6d4', bgClass: 'bg-cyan-100',    textClass: 'text-cyan-700'    },
  { name: 'Super Contributions',   color: '#4f46e5', bgClass: 'bg-indigo-100',  textClass: 'text-indigo-800'  },
  { name: 'Tax',                   color: '#ef4444', bgClass: 'bg-red-100',     textClass: 'text-red-600'     },
  { name: 'Transfers',             color: '#9ca3af', bgClass: 'bg-gray-100',    textClass: 'text-gray-600'    },
  { name: 'Travel & Holidays',     color: '#0284c7', bgClass: 'bg-sky-100',     textClass: 'text-sky-800'     },
  { name: 'Utilities',             color: '#ea580c', bgClass: 'bg-orange-100',  textClass: 'text-orange-800'  },
  { name: 'Vehicle & Transport',   color: '#1d4ed8', bgClass: 'bg-blue-100',    textClass: 'text-blue-800'    },
  { name: 'Other',                 color: '#6b7280', bgClass: 'bg-gray-100',    textClass: 'text-gray-500'    },
];

export const CATEGORY_NAMES: Category[] = CATEGORIES.map(c => c.name);

export const CATEGORY_ICONS: Record<Category, string> = {
  'Business':              '💼',
  'Childcare':             '👶',
  'Eating Out':            '🍽️',
  'Education':             '🎓',
  'Entertainment':         '🎮',
  'Fees & Interest':       '💳',
  'Gifts & Donations':     '🎁',
  'Groceries':             '🛒',
  'Health & Medical':      '🏥',
  'Home':                  '🏠',
  'Home Loan':             '🏦',
  'Insurance':             '🛡️',
  'Internet':              '🌐',
  'Investments':           '📈',
  'Personal Care':         '💆',
  'Pets':                  '🐾',
  'Phone':                 '📱',
  'Professional Services': '🤝',
  'Shares':                '📊',
  'Shopping':              '🛍️',
  'Sport & Fitness':       '🏋️',
  'Super Contributions':   '💰',
  'Tax':                   '📋',
  'Transfers':             '💸',
  'Travel & Holidays':     '✈️',
  'Utilities':             '💡',
  'Vehicle & Transport':   '🚗',
  'Other':                 '📦',
};

export function getCategoryConfig(category: Category): CategoryConfig {
  return CATEGORIES.find(c => c.name === category) ?? CATEGORIES[CATEGORIES.length - 1];
}
