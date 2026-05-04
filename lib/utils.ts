import type { Expense, Income, Category } from './types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// Works for both Expense[] and Income[]
export function getCurrentMonthTotal(items: Array<{ date: string; amount: number }>): number {
  const now = new Date();
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return items
    .filter(e => e.date.startsWith(prefix))
    .reduce((sum, e) => sum + e.amount, 0);
}

export function getTotalByCategory(expenses: Expense[]): Partial<Record<Category, number>> {
  const totals: Partial<Record<Category, number>> = {};
  for (const exp of expenses) {
    totals[exp.category] = (totals[exp.category] ?? 0) + exp.amount;
  }
  return totals;
}

export function getMonthlyData(expenses: Expense[], count = 6): { label: string; amount: number }[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const amount = expenses
      .filter(e => e.date.startsWith(prefix))
      .reduce((sum, e) => sum + e.amount, 0);
    return { label, amount };
  });
}

export function getMonthlyGroupedData(
  expenses: Array<{ date: string; amount: number }>,
  income: Array<{ date: string; amount: number }>,
  count = 6,
): { label: string; expenses: number; income: number }[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    return {
      label,
      expenses: expenses.filter(e => e.date.startsWith(prefix)).reduce((s, e) => s + e.amount, 0),
      income: income.filter(e => e.date.startsWith(prefix)).reduce((s, e) => s + e.amount, 0),
    };
  });
}
