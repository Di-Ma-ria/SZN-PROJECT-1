import axios from 'axios';


const RATES_URL = process.env.EXCHANGE_RATES_URL || 'https://open.er-api.com/v6/latest/NGN';


//Cache exchange rates for 1 hour 
let ratesCache     = null;
let ratesCacheTime = null;
let inFlight = null;
const CACHE_TTL    = 60 * 60 * 1000;

//Fetch exchange rates
export const getExchangeRates = async () => {

  const now = Date.now();

  //return cached rates if still fresh
  if(ratesCache && ratesCacheTime && now - ratesCacheTime < CACHE_TTL) {
    return ratesCache;
  }

if(inFlight) return inFlight;

inFlight = (async () => {
  try{
    const response = await axios.get(RATES_URL, {timeout: 5000});
 const rates = response.data.rates || response.data.conversion_rates;
 if(!rates) throw new Error('Unexpected payload from exchange rate provider');

    ratesCache     = rates;
    ratesCacheTime = Date.now();
    console.log('💱 Exchange rates updated');
    return ratesCache;

  } catch (error) {
    console.error('Exchange rate fetch failed:', error.message);


    if (ratesCache) {
      console.warn('Serving stale exchange rates');
    return ratesCache;
    }
    return null;
  } finally {
    inFlight = null;
  }
}) ();

return inFlight;
};

// Currency format config
const currencyFormats = {
  NGN: { symbol: '₦',    position: 'before', decimals: 0 },
  USD: { symbol: '$',    position: 'before', decimals: 2 },
  GBP: { symbol: '£',    position: 'before', decimals: 2 },
  EUR: { symbol: '€',    position: 'before', decimals: 2 },
  GHS: { symbol: '₵',    position: 'before', decimals: 2 },
  KES: { symbol: 'KSh',  position: 'before', decimals: 2 },
  ZAR: { symbol: 'R',    position: 'before', decimals: 2 },
  CAD: { symbol: 'C$',   position: 'before', decimals: 2 },
  AUD: { symbol: 'A$',   position: 'before', decimals: 2 },
  CNY: { symbol: '¥',    position: 'before', decimals: 2 },
  JPY: { symbol: '¥',    position: 'before', decimals: 0 },
  KRW: { symbol: '₩',    position: 'before', decimals: 0 },
  INR: { symbol: '₹',    position: 'before', decimals: 2 },
  AED: { symbol: 'AED ', position: 'before', decimals: 2 },
  SAR: { symbol: 'SAR ', position: 'before', decimals: 2 },
  TRY: { symbol: '₺',    position: 'before', decimals: 2 },
  BRL: { symbol: 'R$',   position: 'before', decimals: 2 },
  MXN: { symbol: '$',    position: 'before', decimals: 2 },
  SGD: { symbol: 'S$',   position: 'before', decimals: 2 },
  XOF: { symbol: 'CFA',  position: 'after',  decimals: 0 },
  XAF: { symbol: 'CFA',  position: 'after',  decimals: 0 },
};

//Format currency with symbol

export const getCurrencySymbol = (currency) => {
  return currencyFormats[currency]?.symbol || currency;
};

export const formatCurrency = (amount, currency) => {
  const format = currencyFormats[currency] || {
    symbol: currency, position: 'before', decimals: 2,
  };

  const formatted = Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: format.decimals,
    maximumFractionDigits: format.decimals,
  });

  return format.position === 'before'
    ? `${format.symbol}${formatted}`
    : `${formatted} ${format.symbol}`;
};

//Convert from NGN to target currency
export const convertFromNGN = async (amountInNGN, targetCurrency) => {

  const target = typeof targetCurrency === 'string'
  ? targetCurrency.trim().toUpperCase() 
  :'NGN';

  if(!target  || target === 'NGN') {
    return {
      original:  amountInNGN,
      amount:    amountInNGN,
      currency:  'NGN',
      rate:      1,
      formatted: formatCurrency(amountInNGN, 'NGN'),
    };
  }

  try {
    const rates = await getExchangeRates();

    if (!rates || !rates[target]) {
      //unknown currency , degrade to NGN rather than crashing
      return {
        original:  amountInNGN,
        amount:    amountInNGN,
        currency:  'NGN',
        rate:      1,
        formatted: formatCurrency(amountInNGN, 'NGN'),
      };
    }

    const rate   = rates[target];
    const amount = Number((amountInNGN * rate).toFixed(2));

    return {
      original:  amountInNGN,
      amount,
      currency:  targetCurrency,
      rate,
      formatted: formatCurrency(amount, targetCurrency),
    };
  } catch (error) {
    console.error('Currency conversion failed:', error.message);
    return {
      original:  amountInNGN,
      amount:    amountInNGN,
      currency:  'NGN',
      rate:      1,
      formatted: formatCurrency(amountInNGN, 'NGN'),
    };
  }
};