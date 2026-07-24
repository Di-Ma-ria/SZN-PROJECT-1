import express from 'express';


import { getLocationFromIP, getCurrencySymbol } from '../utils/getLocation.js';

import { convertFromNGN, getExchangeRates } from '../utils/convertCurrency.js';

import { getSupportedLanguages } from '../utils/translations.js';

const locationRoutes = express.Router();

// GET USER LOCATION FROM IP
locationRoutes.get('/', async (req, res, next) => {
  try {
    const ip = req.ip
    || req.headers['x-forwarded-for']?.split(',')[0].trim()
    || req.socket.remoteAddress
    || '127.0.0.1';

    const location = await getLocationFromIP(ip);

    return res.status(200).json({
      success: true,
      data:    location,
    });
  } catch (error) {
    next(error);
  }
});

// CONVERT PRICE FROM NGN TO ANY CURRENCY

locationRoutes.get('/convert', async (req, res, next) => {
  try {
    const { amount, currency = 'NGN' } = req.query;

    if (!amount || isNaN(Number(amount))) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid amount',
      });
    }

    const upperCurrency = currency.trim().toUpperCase();

    const result = await convertFromNGN(Number(amount), upperCurrency);

    return res.status(200).json({
      success: true,
      data:    result,
    });
  } catch (error) {
    next(error);
  }
});


// GET ALL EXCHANGE RATES FROM NGN

locationRoutes.get('/rates', async (req, res, next) => {
  try {
    const rates = await getExchangeRates();

    if (!rates) {
      return res.status(503).json({
        success: false,
        message: 'Exchange rates temporarily unavailable',
      });
    }

    const commonCurrencies = [
      'USD', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR',
      'CAD', 'AUD', 'CNY', 'JPY', 'INR', 'AED',
      'SAR', 'BRL', 'MXN', 'SGD', 'XOF', 'XAF',
      'TZS', 'UGX', 'RWF', 'EGP', 'MAD', 'ETB',
    ];

    const filteredRates = {};
    commonCurrencies.forEach(currency => {
      if (rates[currency]) {
        filteredRates[currency] = {
          rate:   rates[currency],
          symbol: getCurrencySymbol(currency),
        };
      }
    });

    return res.status(200).json({
      success: true,
      base:    'NGN',
      symbol:  '₦',
      rates:   filteredRates,
    });
  } catch (error) {
    next(error);
  }
});


// GET SUPPORTED LANGUAGES

locationRoutes.get('/languages', (req, res, next) => {
  try {
    const languages = getSupportedLanguages();

    return res.status(200).json({
      success: true,
      total:   languages.length,
      data:    languages,
    });
  } catch (error) {
    next(error);
  }
});

export default locationRoutes;