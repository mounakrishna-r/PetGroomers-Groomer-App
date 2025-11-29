
export const CURRENCY_MAP: Record<string, { symbol: string; locale: string; code: string }> = {
  IN: { symbol: '₹', locale: 'en-IN', code: 'IN' },
  US: { symbol: '$', locale: 'en-US', code: 'US' },
  GB: { symbol: '£', locale: 'en-GB', code: 'GB' },
  CA: { symbol: 'CA$', locale: 'en-CA', code: 'CA' },
  AU: { symbol: 'A$', locale: 'en-AU', code: 'AU' },
  AE: { symbol: 'د.إ', locale: 'ar-AE', code: 'AE' },
  CN: { symbol: '¥', locale: 'zh-CN', code: 'CN' },
  JP: { symbol: '¥', locale: 'ja-JP', code: 'JP' },
  SG: { symbol: 'S$', locale: 'en-SG', code: 'SG' },
  MY: { symbol: 'RM', locale: 'ms-MY', code: 'MY' },
  DE: { symbol: '€', locale: 'de-DE', code: 'DE' },
  FR: { symbol: '€', locale: 'fr-FR', code: 'FR' },
  IT: { symbol: '€', locale: 'it-IT', code: 'IT' },
  ES: { symbol: '€', locale: 'es-ES', code: 'ES' },
  BR: { symbol: 'R$', locale: 'pt-BR', code: 'BR' },
  KR: { symbol: '₩', locale: 'ko-KR', code: 'KR' },
  MX: { symbol: 'MX$', locale: 'es-MX', code: 'MX' },
  NO: { symbol: 'kr', locale: 'nb-NO', code: 'NO' },
  SE: { symbol: 'kr', locale: 'sv-SE', code: 'SE' },
  TH: { symbol: '฿', locale: 'th-TH', code: 'TH' },
  ZA: { symbol: 'R', locale: 'en-ZA', code: 'ZA' },
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
  
  // Ensure countryCode is a string and uppercase, default to 'IN'
  const code = countryCode ? countryCode.toUpperCase() : 'IN';
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
  } catch (error) {
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
