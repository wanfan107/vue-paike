import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const CURRENCY_TIMEZONE_MAP = {
  BRL: 'America/Sao_Paulo',
  INR: 'Asia/Kolkata',
  BDT: 'Asia/Dhaka',
  CNY: 'Asia/Shanghai',
  USD: 'America/New_York',
};

const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

export const getTimezone = (currency) => {
  const currencyValue = typeof currency === 'object' && currency !== null && 'value' in currency ? currency.value : currency;
  return CURRENCY_TIMEZONE_MAP[currencyValue?.toUpperCase()] || DEFAULT_TIMEZONE;
};

export const getNow = (currency) => {
  return dayjs().tz(getTimezone(currency));
};

export const getToday = (currency) => {
  return dayjs().tz(getTimezone(currency)).startOf('day');
};

export const getYesterday = (currency) => {
  return dayjs().tz(getTimezone(currency)).subtract(1, 'day').startOf('day');
};

export const formatDate = (date, currency) => {
  return dayjs(date).tz(getTimezone(currency)).format('YYYY-MM-DD');
};

export const formatDateTime = (date, currency) => {
  return dayjs(date).tz(getTimezone(currency)).format('YYYY-MM-DD HH:mm:ss');
};

export const getDateRange = (days, currency) => {
  const now = dayjs().tz(getTimezone(currency));
  const end = now.endOf('day');
  const start = now.subtract(days, 'day').startOf('day');
  return {
    start: start.format('YYYY-MM-DD'),
    end: end.format('YYYY-MM-DD')
  };
};

export const getMonthRange = (months, currency) => {
  const now = dayjs().tz(getTimezone(currency));
  const end = now.endOf('month');
  const start = now.subtract(months, 'month').startOf('month');
  return {
    start: start.format('YYYY-MM-DD'),
    end: end.format('YYYY-MM-DD')
  };
};

export const getLastMonth = (currency) => {
  const now = dayjs().tz(getTimezone(currency));
  const start = now.subtract(1, 'month').startOf('month');
  const end = now.subtract(1, 'month').endOf('month');
  return {
    start: start.format('YYYY-MM-DD'),
    end: end.format('YYYY-MM-DD')
  };
};

export const getThisYearToLastMonth = (currency) => {
  const now = dayjs().tz(getTimezone(currency));
  const start = now.startOf('year');
  const end = now.subtract(1, 'month').endOf('month');
  return {
    start: start.format('YYYY-MM-DD'),
    end: end.format('YYYY-MM-DD')
  };
};

export const isToday = (date, currency) => {
  const tzDate = dayjs(date).tz(getTimezone(currency));
  const today = dayjs().tz(getTimezone(currency));
  return tzDate.isSame(today, 'day');
};

export const isFuture = (date, currency) => {
  const tzDate = dayjs(date).tz(getTimezone(currency));
  const today = dayjs().tz(getTimezone(currency)).startOf('day');
  return tzDate.isAfter(today);
};

export const disabledFutureDate = (time, currency) => {
  const timezone = getTimezone(currency);
  const today = dayjs().tz(timezone).format('YYYY-MM-DD');
  const selected = dayjs(time).format('YYYY-MM-DD');
  return selected > today;
};

export const disabledCurrentMonth = (time, currency) => {
  const timezone = getTimezone(currency);
  const currentMonth = dayjs().tz(timezone).format('YYYY-MM');
  const selectedMonth = dayjs(time).format('YYYY-MM');
  return selectedMonth > currentMonth;
};

export const getTimezoneOffset = (currency) => {
  const timezone = getTimezone(currency);
  const now = dayjs().tz(timezone);
  const utcNow = dayjs().utc();
  return (now.utcOffset() / 60);
};