/**
 * Currency utilities for formatting prices based on country code
 */

export const CURRENCY_MAP: Record<string, { symbol: string; locale: string; code: string }> = {
  IN: { symbol: '₹', locale: 'en-IN', code: 'INR' },
  US: { symbol: '$', locale: 'en-US', code: 'USD' },
  GB: { symbol: '£', locale: 'en-GB', code: 'GBP' },
  CA: { symbol: 'CA$', locale: 'en-CA', code: 'CAD' },
  AU: { symbol: 'A$', locale: 'en-AU', code: 'AUD' },
  EU: { symbol: '€', locale: 'en-EU', code: 'EUR' },
  AE: { symbol: 'AED', locale: 'en-AE', code: 'AED' },
};

/**
 * Get currency symbol from country code
 */
export function getCurrencySymbol(countryCode: string): string {
  return CURRENCY_MAP[countryCode?.toUpperCase()]?.symbol || '$';
}

/**
 * Get currency code (ISO 4217) from country code
 */
export function getCurrencyCode(countryCode: string): string {
  return CURRENCY_MAP[countryCode?.toUpperCase()]?.code || 'USD';
}

/**
 * Get locale for formatting from country code
 */
export function getCurrencyLocale(countryCode: string): string {
  return CURRENCY_MAP[countryCode?.toUpperCase()]?.locale || 'en-US';
}

/**
 * Format price with currency symbol based on country code
 */
export function formatPrice(amount: number | null | undefined, countryCode?: string): string {
  if (amount == null) return '-';
  
  const code = countryCode?.toUpperCase() || 'IN'; // Default to India
  const currency = CURRENCY_MAP[code];
  
  if (!currency) {
    return `$${amount.toFixed(2)}`;
  }

  // Format with proper locale
  try {
    return `${currency.symbol}${amount.toLocaleString(currency.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  } catch {
    // Fallback if locale formatting fails
    return `${currency.symbol}${amount.toFixed(2)}`;
  }
}

/**
 * Format price for display in list (compact format)
 */
export function formatPriceCompact(amount: number | null | undefined, countryCode?: string): string {
  if (amount == null) return '-';
  
  const symbol = getCurrencySymbol(countryCode || 'IN');
  
  if (amount >= 1000) {
    return `${symbol}${(amount / 1000).toFixed(1)}k`;
  }
  
  return `${symbol}${Math.round(amount)}`;
}
