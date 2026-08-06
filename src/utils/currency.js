const CURRENCY_CONFIG = {
  BRL: {
    symbol: 'R$',
    decimals: 2,
    thousandsSeparator: '.',
    decimalSeparator: ','
  },
  CNY: {
    symbol: '¥',
    decimals: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  USD: {
    symbol: '$',
    decimals: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  EUR: {
    symbol: '€',
    decimals: 2,
    thousandsSeparator: '.',
    decimalSeparator: ','
  },
  JPY: {
    symbol: '¥',
    decimals: 0,
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  INR: {
    symbol: '₹',
    decimals: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  BDT: {
    symbol: '৳',
    decimals: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  PHP: {
    symbol: '₱',
    decimals: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  IDR: {
    symbol: 'Rp',
    decimals: 2,
    thousandsSeparator: '.',
    decimalSeparator: ','
  },
  PKR: {
    symbol: '₨',
    decimals: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  NGN: {
    symbol: '₦',
    decimals: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  VND: {
    symbol: '₫',
    decimals: 0,
    thousandsSeparator: '.',
    decimalSeparator: ','
  },
  THB: {
    symbol: '฿',
    decimals: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
};

const DEFAULT_CURRENCY = 'BRL';

export const getCurrencyConfig = (currency) => {
  return CURRENCY_CONFIG[currency] || CURRENCY_CONFIG[DEFAULT_CURRENCY];
};

export const getCurrencySymbol = (currency) => {
  return getCurrencyConfig(currency).symbol;
};

export const getCurrencyDecimals = (currency) => {
  return getCurrencyConfig(currency).decimals;
};

export const formatCurrency = (amount, currency = DEFAULT_CURRENCY, showSymbol = true) => {
  const config = getCurrencyConfig(currency);
  const num = Number(amount) || 0;

  const formatted = num.toLocaleString('pt-BR', {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals
  });

  if (config.thousandsSeparator !== '.' || config.decimalSeparator !== ',') {
    return showSymbol
      ? `${config.symbol} ${formatted.replace(/\./g, 'TEMP').replace(/,/g, config.decimalSeparator).replace(/TEMP/g, config.thousandsSeparator)}`
      : formatted.replace(/\./g, 'TEMP').replace(/,/g, config.decimalSeparator).replace(/TEMP/g, config.thousandsSeparator);
  }

  return showSymbol ? `${config.symbol} ${formatted}` : formatted;
};

export const parseCurrency = (str, currency = DEFAULT_CURRENCY) => {
  const config = getCurrencyConfig(currency);
  if (!str || typeof str !== 'string') return 0;

  const cleaned = str
    .replace(config.symbol, '')
    .replace(/\s/g, '')
    .replace(new RegExp(`\\${config.thousandsSeparator}`, 'g'), '')
    .replace(new RegExp(`\\${config.decimalSeparator}`), '.');

  const result = parseFloat(cleaned);
  return isNaN(result) ? 0 : result;
};

export const formatCurrencyWithUnit = (value, currency = DEFAULT_CURRENCY) => {
  const config = getCurrencyConfig(currency);
  const num = Number(value) || 0;

  if (num >= 100000000) {
    const formatted = (num / 100000000).toLocaleString('pt-BR', { 
      minimumFractionDigits: config.decimals, 
      maximumFractionDigits: config.decimals 
    });
    return `${config.symbol}${formatted}亿`;
  } else if (num >= 10000) {
    const formatted = (num / 10000).toLocaleString('pt-BR', { 
      minimumFractionDigits: config.decimals, 
      maximumFractionDigits: config.decimals 
    });
    return `${config.symbol}${formatted}万`;
  }
  return `${config.symbol}${num.toLocaleString('pt-BR', { 
    minimumFractionDigits: config.decimals, 
    maximumFractionDigits: config.decimals 
  })}`;
};