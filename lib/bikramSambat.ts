// Bikram Sambat (BS) conversion utility for Nepali calendar
// Supports accurate conversion from Gregorian (AD) to Bikram Sambat (BS)

export interface NepaliDate {
  year: number;
  month: number; // 1 to 12
  day: number;
  monthName: string;
  monthNameDevanagari: string;
  dayName: string;
  formatted: string;
}

export const NEPALI_MONTHS = [
  { name: 'Baisakh', devanagari: 'बैशाख' },
  { name: 'Jestha', devanagari: 'जेठ' },
  { name: 'Ashadh', devanagari: 'असार' },
  { name: 'Shrawan', devanagari: 'साउन' },
  { name: 'Bhadra', devanagari: 'भदौ' },
  { name: 'Ashwin', devanagari: 'असोज' },
  { name: 'Kartik', devanagari: 'कात्तिक' },
  { name: 'Mangsir', devanagari: 'मंसिर' },
  { name: 'Poush', devanagari: 'पुस' },
  { name: 'Magh', devanagari: 'माघ' },
  { name: 'Falgun', devanagari: 'फागुन' },
  { name: 'Chaitra', devanagari: 'चैत' },
];

export const NEPALI_DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

// Number of days in each Nepali month from BS 2075 to 2090
// Format: [year, [12 month day counts], gregorianStartDateOfBaisakh1 (month-1, day, year)]
interface BSYearData {
  bsYear: number;
  daysInMonth: number[];
  baisakh1Gregorian: [number, number, number]; // [year, month0Indexed, day]
}

const BS_CALENDAR_DATA: BSYearData[] = [
  { bsYear: 2075, daysInMonth: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30], baisakh1Gregorian: [2018, 3, 14] },
  { bsYear: 2076, daysInMonth: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30], baisakh1Gregorian: [2019, 3, 14] },
  { bsYear: 2077, daysInMonth: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31], baisakh1Gregorian: [2020, 3, 13] },
  { bsYear: 2078, daysInMonth: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30], baisakh1Gregorian: [2021, 3, 14] },
  { bsYear: 2079, daysInMonth: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], baisakh1Gregorian: [2022, 3, 14] },
  { bsYear: 2080, daysInMonth: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30], baisakh1Gregorian: [2023, 3, 14] },
  { bsYear: 2081, daysInMonth: [31, 31, 32, 32, 31, 30, 30, 30, 29, 30, 29, 31], baisakh1Gregorian: [2024, 3, 13] },
  { bsYear: 2082, daysInMonth: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], baisakh1Gregorian: [2025, 3, 14] },
  { bsYear: 2083, daysInMonth: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], baisakh1Gregorian: [2026, 3, 14] },
  { bsYear: 2084, daysInMonth: [31, 31, 32, 31, 32, 30, 30, 30, 29, 30, 29, 31], baisakh1Gregorian: [2027, 3, 14] },
  { bsYear: 2085, daysInMonth: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31], baisakh1Gregorian: [2028, 3, 13] },
  { bsYear: 2086, daysInMonth: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31], baisakh1Gregorian: [2029, 3, 14] },
  { bsYear: 2087, daysInMonth: [31, 31, 32, 31, 31, 31, 30, 30, 29, 30, 29, 31], baisakh1Gregorian: [2030, 3, 14] },
  { bsYear: 2088, daysInMonth: [31, 31, 32, 32, 31, 30, 30, 30, 29, 30, 29, 31], baisakh1Gregorian: [2031, 3, 14] },
  { bsYear: 2089, daysInMonth: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31], baisakh1Gregorian: [2032, 3, 13] },
  { bsYear: 2090, daysInMonth: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31], baisakh1Gregorian: [2033, 3, 14] },
];

/**
 * Converts a Gregorian Date object to Bikram Sambat (BS) date
 */
export function getNepaliDate(date: Date = new Date()): NepaliDate {
  const dayName = NEPALI_DAYS[date.getDay()];
  const currentTimestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  // Search in calendar data
  for (let i = 0; i < BS_CALENDAR_DATA.length; i++) {
    const entry = BS_CALENDAR_DATA[i];
    const [bYear, bMonth, bDay] = entry.baisakh1Gregorian;
    const baisakh1Timestamp = new Date(bYear, bMonth, bDay).getTime();

    // Check if current date falls within this BS year
    const nextEntry = BS_CALENDAR_DATA[i + 1];
    let nextBaisakh1Timestamp = nextEntry 
      ? new Date(nextEntry.baisakh1Gregorian[0], nextEntry.baisakh1Gregorian[1], nextEntry.baisakh1Gregorian[2]).getTime()
      : baisakh1Timestamp + 365 * 86400000;

    if (currentTimestamp >= baisakh1Timestamp && currentTimestamp < nextBaisakh1Timestamp) {
      let diffDays = Math.round((currentTimestamp - baisakh1Timestamp) / 86400000);
      let monthIndex = 0;

      while (monthIndex < 12 && diffDays >= entry.daysInMonth[monthIndex]) {
        diffDays -= entry.daysInMonth[monthIndex];
        monthIndex++;
      }

      const day = diffDays + 1;
      const monthNumber = monthIndex + 1;
      const monthMeta = NEPALI_MONTHS[monthIndex];

      return {
        year: entry.bsYear,
        month: monthNumber,
        day,
        monthName: monthMeta.name,
        monthNameDevanagari: monthMeta.devanagari,
        dayName,
        formatted: `${day} ${monthMeta.name} ${entry.bsYear} BS`,
      };
    }
  }

  // Fallback approximation if outside explicit table range (e.g. BS = AD + 56.7 years)
  const approxBSYear = date.getFullYear() + (date.getMonth() >= 3 && date.getDate() >= 14 ? 57 : 56);
  const approxMonthIndex = (date.getMonth() + 8) % 12;
  const approxMonth = NEPALI_MONTHS[approxMonthIndex];
  const day = date.getDate();

  return {
    year: approxBSYear,
    month: approxMonthIndex + 1,
    day,
    monthName: approxMonth.name,
    monthNameDevanagari: approxMonth.devanagari,
    dayName,
    formatted: `${day} ${approxMonth.name} ${approxBSYear} BS`,
  };
}

/**
 * Format Gregorian date as e.g. "Thursday, 3 September 2026 AD"
 */
export function formatGregorianDate(date: Date = new Date()): string {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const year = date.getFullYear();

  return `${dayName}, ${day} ${month} ${year} AD`;
}
