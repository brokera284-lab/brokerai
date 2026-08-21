export interface CountryConfig {
  code: string;
  name: string;
  currency: string;
  symbol: string;
  flag: string;
  rate: number; // 1 EGP = rate in target currency
}

export const COUNTRIES: CountryConfig[] = [
  { code: "EG", name: "Egypt", currency: "EGP", symbol: "EGP", flag: "🇪🇬", rate: 1 }
];

export function autoDetectCountry(): string {
  return "EG"; // Default fallback is always Egypt
}
