export interface CurrencyDef {
  code: string;
  name: string;
  symbol: string;
}

export const CURRENCIES: CurrencyDef[] = [
  { code: 'USD', name: 'US Dollar',           symbol: '$'   },
  { code: 'AUD', name: 'Australian Dollar',   symbol: 'A$'  },
  { code: 'EUR', name: 'Euro',                symbol: '€'   },
  { code: 'GBP', name: 'British Pound',       symbol: '£'   },
  { code: 'CAD', name: 'Canadian Dollar',     symbol: 'C$'  },
  { code: 'NZD', name: 'New Zealand Dollar',  symbol: 'NZ$' },
  { code: 'SGD', name: 'Singapore Dollar',    symbol: 'S$'  },
  { code: 'JPY', name: 'Japanese Yen',        symbol: '¥'   },
  { code: 'CNY', name: 'Chinese Yuan',        symbol: '¥'   },
  { code: 'HKD', name: 'Hong Kong Dollar',    symbol: 'HK$' },
  { code: 'INR', name: 'Indian Rupee',        symbol: '₹'   },
  { code: 'IDR', name: 'Indonesian Rupiah',   symbol: 'Rp'  },
  { code: 'MYR', name: 'Malaysian Ringgit',   symbol: 'RM'  },
  { code: 'PHP', name: 'Philippine Peso',     symbol: '₱'   },
  { code: 'THB', name: 'Thai Baht',           symbol: '฿'   },
  { code: 'KRW', name: 'South Korean Won',    symbol: '₩'   },
  { code: 'CHF', name: 'Swiss Franc',         symbol: 'Fr'  },
  { code: 'AED', name: 'UAE Dirham',          symbol: 'AED' },
  { code: 'SAR', name: 'Saudi Riyal',         symbol: 'SR'  },
  { code: 'ZAR', name: 'South African Rand',  symbol: 'R'   },
  { code: 'BRL', name: 'Brazilian Real',      symbol: 'R$'  },
  { code: 'MXN', name: 'Mexican Peso',        symbol: 'MX$' },
  { code: 'PKR', name: 'Pakistani Rupee',     symbol: '₨'   },
  { code: 'LKR', name: 'Sri Lankan Rupee',    symbol: '₨'   },
  { code: 'BDT', name: 'Bangladeshi Taka',    symbol: '৳'   },
];
