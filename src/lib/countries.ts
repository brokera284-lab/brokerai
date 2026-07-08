export interface CountryConfig {
  code: string;
  name: string;
  currency: string;
  symbol: string;
  flag: string;
  rate: number; // 1 EGP = rate in target currency
}

export const COUNTRIES: CountryConfig[] = [
  { code: "EG", name: "Egypt", currency: "EGP", symbol: "EGP", flag: "🇪🇬", rate: 1 },
  { code: "AE", name: "United Arab Emirates", currency: "AED", symbol: "AED", flag: "🇦🇪", rate: 0.075 },
  { code: "SA", name: "Saudi Arabia", currency: "SAR", symbol: "SAR", flag: "🇸🇦", rate: 0.077 },
  { code: "US", name: "United States", currency: "USD", symbol: "$", flag: "🇺🇸", rate: 0.021 },
  { code: "GB", name: "United Kingdom", currency: "GBP", symbol: "£", flag: "🇬🇧", rate: 0.016 },
];

export function autoDetectCountry(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz.includes("Cairo") || tz.includes("Africa/Cairo")) return "EG";
    if (tz.includes("Dubai") || tz.includes("Asia/Dubai") || tz.includes("Abu_Dhabi")) return "AE";
    if (tz.includes("Riyadh") || tz.includes("Asia/Riyadh") || tz.includes("Qatar") || tz.includes("Kuwait")) return "SA";
    if (tz.includes("London") || tz.includes("Europe/London") || tz.includes("GMT") || tz.includes("BST") || tz.includes("Dublin")) return "GB";
    if (tz.includes("America") || tz.includes("US/") || tz.includes("Pacific/") || tz.includes("Eastern/") || tz.includes("Central/") || tz.includes("Mountain/")) return "US";
  } catch (e) {
    // ignore
  }
  return "EG"; // Default fallback
}
