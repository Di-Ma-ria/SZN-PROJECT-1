import axios from 'axios';

// Currency by country code
const currencies = {
  NG: 'NGN', GH: 'GHS', KE: 'KES', ZA: 'ZAR',
  TZ: 'TZS', UG: 'UGX', RW: 'RWF', ET: 'ETB',
  SN: 'XOF', CI: 'XOF', CM: 'XAF', MA: 'MAD',
  EG: 'EGP', TN: 'TND', ZM: 'ZMW', MZ: 'MZN',
  AO: 'AOA', BJ: 'XOF', BF: 'XOF', ML: 'XOF',
  GB: 'GBP', FR: 'EUR', DE: 'EUR', IT: 'EUR',
  ES: 'EUR', PT: 'EUR', NL: 'EUR', BE: 'EUR',
  AT: 'EUR', IE: 'EUR', FI: 'EUR', GR: 'EUR',
  CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK',
  PL: 'PLN', RU: 'RUB', UA: 'UAH', CZ: 'CZK',
  US: 'USD', CA: 'CAD', MX: 'MXN', BR: 'BRL',
  AR: 'ARS', CO: 'COP', CL: 'CLP', PE: 'PEN',
  CN: 'CNY', JP: 'JPY', KR: 'KRW', IN: 'INR',
  SG: 'SGD', HK: 'HKD', TW: 'TWD', TH: 'THB',
  MY: 'MYR', ID: 'IDR', PH: 'PHP', VN: 'VND',
  PK: 'PKR', BD: 'BDT', LK: 'LKR',
  AE: 'AED', SA: 'SAR', QA: 'QAR', KW: 'KWD',
  BH: 'BHD', OM: 'OMR', IL: 'ILS', TR: 'TRY',
  AU: 'AUD', NZ: 'NZD',
};

// Language by country code 
const languages = {
  NG: 'en', US: 'en', GB: 'en', CA: 'en',
  AU: 'en', NZ: 'en', GH: 'en', KE: 'en',
  ZA: 'en', TZ: 'en', UG: 'en', RW: 'en',
  ZM: 'en', SG: 'en', PH: 'en',
  FR: 'fr', BE: 'fr', SN: 'fr', CI: 'fr',
  CM: 'fr', ML: 'fr', BF: 'fr', BJ: 'fr',
  TN: 'fr', MA: 'fr', CD: 'fr',
  ES: 'es', MX: 'es', AR: 'es', CO: 'es',
  CL: 'es', PE: 'es',
  PT: 'pt', BR: 'pt', AO: 'pt', MZ: 'pt',
  SA: 'ar', EG: 'ar', AE: 'ar', QA: 'ar',
  KW: 'ar', BH: 'ar', OM: 'ar',
  CN: 'zh', TW: 'zh', HK: 'zh',
  JP: 'ja', KR: 'ko', IN: 'hi',
  TH: 'th', VN: 'vi', ID: 'id',
  MY: 'ms', PK: 'ur', BD: 'bn',
  DE: 'de', AT: 'de', IT: 'it',
  NL: 'nl', RU: 'ru', PL: 'pl',
  TR: 'tr', SE: 'sv', NO: 'no',
  DK: 'da', FI: 'fi', GR: 'el',
  IL: 'he', UA: 'uk',
};

// Currency symbols 
const symbols = {
  NGN: '₦',   USD: '$',    GBP: '£',   EUR: '€',
  GHS: '₵',   KES: 'KSh',  ZAR: 'R',   CAD: 'C$',
  AUD: 'A$',  CNY: '¥',    JPY: '¥',   KRW: '₩',
  INR: '₹',   AED: 'AED',  SAR: 'SAR', QAR: 'QAR',
  TRY: '₺',   BRL: 'R$',   MXN: '$',   SGD: 'S$',
  HKD: 'HK$', TWD: 'NT$',  THB: '฿',   VND: '₫',
  IDR: 'Rp',  PHP: '₱',    MYR: 'RM',  PKR: '₨',
  XOF: 'CFA', XAF: 'CFA',  MAD: 'MAD', EGP: 'E£',
  TZS: 'TSh', UGX: 'USh',  RWF: 'RF',  ETB: 'Br',
  CHF: 'Fr',  SEK: 'kr',   NOK: 'kr',  DKK: 'kr',
  PLN: 'zł',  RUB: '₽',    UAH: '₴',   CZK: 'Kč',
  NZD: 'NZ$', ZMW: 'ZK',   ILS: '₪',   KWD: 'KD',
};

//Language names 
export const languageNames = {
  en: 'English',   fr: 'Français',  es: 'Español',
  pt: 'Português', ar: 'العربية',   zh: '中文',
  ja: '日本語',     ko: '한국어',     hi: 'हिन्दी',
  de: 'Deutsch',   it: 'Italiano',  nl: 'Nederlands',
  ru: 'Русский',   uk: 'Українська', pl: 'Polski',
  tr: 'Türkçe',   th: 'ไทย',       vi: 'Tiếng Việt',
  id: 'Bahasa Indonesia', ms: 'Bahasa Melayu',
  sv: 'Svenska',  no: 'Norsk',     da: 'Dansk',
  fi: 'Suomi',    el: 'Ελληνικά',  he: 'עברית',
  ur: 'اردو',     bn: 'বাংলা',
};

// Convert country code to flag emoji
const getFlagEmoji = (countryCode) => {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  return countryCode
    .toUpperCase()
    .split('')
    .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
};

// Get currency symbol
export const getCurrencySymbol = (currency) => symbols[currency] || currency;

//Default location 
const defaultLocation = {
  country:        'Nigeria',
  countryCode:    'NG',
  city:           'Lagos',
  currency:       'NGN',
  currencySymbol: '₦',
  language:       'en',
  languageName:   'English',
  timezone:       'Africa/Lagos',
  flag:           '🇳🇬',
  isDefault:      true,
};

//  Get location from IP
export const getLocationFromIP = async (ip) => {
  try {
    if (
      !ip ||
      ip === '127.0.0.1' ||
      ip === '::1' ||
      ip === '::ffff:127.0.0.1' ||
      ip.startsWith('192.168.') ||
      ip.startsWith('10.')
    ) {
      return { ...defaultLocation, isDefault: true };
    }

    const response = await axios.get(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,city,timezone`,
      { timeout: 3000 }
    );

    if (response.data.status !== 'success') {
      return defaultLocation;
    }

    const { country, countryCode, city, timezone } = response.data;
    const currency = currencies[countryCode] || 'NGN';
    const language = languages[countryCode]  || 'en';

    return {
      country,
      countryCode,
      city,
      currency,
      currencySymbol: symbols[currency] || currency,
      language,
      languageName:   languageNames[language] || 'English',
      timezone,
      flag:           getFlagEmoji(countryCode),
      isDefault:      false,
    };
  } catch (error) {
    console.error('Location detection failed:', error.message);
    return defaultLocation;
  }
};