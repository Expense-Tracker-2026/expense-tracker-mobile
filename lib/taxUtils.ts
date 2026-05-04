import type { Income, Expense, TaxDeductionCategory } from './types';
import { TAX_DEDUCTION_CATEGORIES } from './taxCategories';

export function getCurrentFinancialYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-indexed
  // AU FY: July 1 – June 30
  if (month >= 7) return `${year}-${String(year + 1).slice(2)}`;
  return `${year - 1}-${String(year).slice(2)}`;
}

export function getFinancialYearRange(fy: string): { start: Date; end: Date } {
  const [startYearStr] = fy.split('-');
  const startYear = parseInt(startYearStr, 10);
  return {
    start: new Date(startYear, 6, 1),     // July 1 00:00:00
    end:   new Date(startYear + 1, 6, 1), // July 1 of next year (exclusive upper bound)
  };
}

export function financialYearLabel(fy: string): string {
  const [y1, y2] = fy.split('-');
  return `FY ${y1}–${y2}`;
}

export function getAllFinancialYears(income: Income[], expenses: Expense[]): string[] {
  const fySet = new Set<string>();
  const current = getCurrentFinancialYear();
  fySet.add(current);

  function addDate(dateStr: string) {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const fy = month >= 7 ? `${year}-${String(year + 1).slice(2)}` : `${year - 1}-${String(year).slice(2)}`;
    fySet.add(fy);
  }

  income.forEach(i => addDate(i.date));
  expenses.forEach(e => addDate(e.date));

  return Array.from(fySet).sort().reverse();
}

export function filterByFinancialYear<T extends { date: string }>(items: T[], fy: string): T[] {
  const { start, end } = getFinancialYearRange(fy);
  return items.filter(item => {
    const d = new Date(item.date);
    return d >= start && d < end;
  });
}

export interface MonthlyIncomeSummary {
  month: string;  // "2024-07"
  label: string;  // "Jul 2024"
  gross: number;
  taxWithheld: number;
  superannuation: number;
  netPay: number;
  otherIncome: number;
}

export interface DeductibleByCategoryRow {
  category: TaxDeductionCategory;
  code: string;
  count: number;
  totalAmount: number;
  deductibleAmount: number;
}

export interface TaxSummary {
  grossIncome: number;
  taxWithheld: number;
  superannuation: number;
  netIncome: number;
  otherIncome: number;
  totalIncome: number;
  totalDeductibleExpenses: number;
  deductibleByCategory: DeductibleByCategoryRow[];
  incomeByMonth: MonthlyIncomeSummary[];
  deductibleExpenses: Expense[];
}

export function calculateTaxSummary(income: Income[], expenses: Expense[], fy: string): TaxSummary {
  const fyIncome = filterByFinancialYear(income, fy);
  const fyExpenses = filterByFinancialYear(expenses, fy);

  // Income aggregation
  let grossIncome = 0;
  let taxWithheld = 0;
  let superannuation = 0;
  let otherIncome = 0;

  const monthMap = new Map<string, MonthlyIncomeSummary>();

  fyIncome.forEach(inc => {
    const d = new Date(inc.date);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = d.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' });

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, { month: monthKey, label: monthLabel, gross: 0, taxWithheld: 0, superannuation: 0, netPay: 0, otherIncome: 0 });
    }
    const row = monthMap.get(monthKey)!;

    if (inc.grossAmount) {
      const g = inc.grossAmount;
      const t = inc.taxWithheld ?? 0;
      const s = inc.superannuation ?? 0;
      grossIncome += g;
      taxWithheld += t;
      superannuation += s;
      row.gross += g;
      row.taxWithheld += t;
      row.superannuation += s;
      row.netPay += inc.amount;
    } else {
      otherIncome += inc.amount;
      row.otherIncome += inc.amount;
    }
  });

  // Deductible expenses aggregation
  const deductibleExpenses = fyExpenses.filter(e => e.isTaxDeductible);

  const catMap = new Map<TaxDeductionCategory, DeductibleByCategoryRow>();

  deductibleExpenses.forEach(e => {
    const cat = e.taxDeductionCategory ?? 'Other Work-Related';
    const pct = e.deductiblePercentage ?? 100;
    const deductible = Math.round(e.amount * pct) / 100;

    if (!catMap.has(cat)) {
      const def = TAX_DEDUCTION_CATEGORIES.find(d => d.value === cat);
      catMap.set(cat, { category: cat, code: def?.code ?? 'D5', count: 0, totalAmount: 0, deductibleAmount: 0 });
    }
    const row = catMap.get(cat)!;
    row.count += 1;
    row.totalAmount += e.amount;
    row.deductibleAmount += deductible;
  });

  const totalDeductibleExpenses = Array.from(catMap.values()).reduce((sum, r) => sum + r.deductibleAmount, 0);

  const incomeByMonth = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);

  return {
    grossIncome,
    taxWithheld,
    superannuation,
    netIncome: grossIncome - taxWithheld,
    otherIncome,
    totalIncome: grossIncome - taxWithheld + otherIncome,
    totalDeductibleExpenses,
    deductibleByCategory: Array.from(catMap.values()).sort((a, b) => b.deductibleAmount - a.deductibleAmount),
    incomeByMonth,
    deductibleExpenses,
  };
}
