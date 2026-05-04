export interface TaxDeductionCategoryDef {
  value: string;
  label: string;
  code: string;
  description: string;
  isCustom?: boolean;
}

export const TAX_DEDUCTION_CATEGORIES: TaxDeductionCategoryDef[] = [
  {
    value: 'Work-Related Car',
    label: 'Work-Related Car Expenses',
    code: 'D1',
    description: 'Car expenses for work travel (not home to work)',
  },
  {
    value: 'Work-Related Travel',
    label: 'Work-Related Travel',
    code: 'D2',
    description: 'Flights, accommodation, meals for work travel',
  },
  {
    value: 'Work-Related Clothing',
    label: 'Work-Related Clothing & Laundry',
    code: 'D3',
    description: 'Uniforms, protective clothing, occupation-specific attire',
  },
  {
    value: 'Work-Related Education',
    label: 'Work-Related Self-Education',
    code: 'D4',
    description: 'Courses, books, and fees directly related to your current job',
  },
  {
    value: 'Home Office',
    label: 'Home Office Expenses',
    code: 'D5',
    description: 'Running costs for working from home (ATO fixed rate method)',
  },
  {
    value: 'Tools & Equipment',
    label: 'Tools & Equipment',
    code: 'D5',
    description: 'Tools, devices, and equipment used for work',
  },
  {
    value: 'Other Work-Related',
    label: 'Other Work-Related Expenses',
    code: 'D5',
    description: 'Union fees, subscriptions, mobile phone (work portion)',
  },
  {
    value: 'Investment Expenses',
    label: 'Investment & Interest Expenses',
    code: 'D7/D8',
    description: 'Interest on investment loans, account fees, advice fees',
  },
  {
    value: 'Gifts & Donations',
    label: 'Gifts & Donations',
    code: 'D9',
    description: 'Donations to DGR-endorsed charities',
  },
  {
    value: 'Tax Affairs',
    label: 'Cost of Managing Tax Affairs',
    code: 'D10',
    description: 'Tax agent fees, tax software, ATO interest charges',
  },
  {
    value: 'Income Protection Insurance',
    label: 'Income Protection Insurance',
    code: 'IT1',
    description: 'Premiums for income protection insurance outside super',
  },
];

export function generateCategoryCode(label: string, existingCodes: string[] = []): string {
  const words = label.trim().split(/\s+/);
  let base = words.length > 1
    ? words.map(w => w[0]?.toUpperCase() ?? '').join('').slice(0, 3)
    : label.trim().slice(0, 3).toUpperCase();
  if (!base) base = 'C';
  if (!existingCodes.includes(base)) return base;
  let i = 2;
  while (existingCodes.includes(`${base}${i}`)) i++;
  return `${base}${i}`;
}

export function getTaxCategoryDef(
  value: string,
  customCategories: TaxDeductionCategoryDef[] = [],
): TaxDeductionCategoryDef | undefined {
  return (
    TAX_DEDUCTION_CATEGORIES.find(c => c.value === value) ??
    customCategories.find(c => c.value === value)
  );
}
