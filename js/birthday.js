// Birthday & Age Calculation Engine

const MARATHI_MONTHS = [
  'जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून',
  'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'
];

const ZODIAC_SIGNS = [
  { name: 'मकर (Capricorn)', icon: '♑', start: [1, 1], end: [1, 19] },
  { name: 'कुंभ (Aquarius)', icon: '♒', start: [1, 20], end: [2, 18] },
  { name: 'मीन (Pisces)', icon: '♓', start: [2, 19], end: [3, 20] },
  { name: 'मेष (Aries)', icon: '♈', start: [3, 21], end: [4, 19] },
  { name: 'वृषभ (Taurus)', icon: '♉', start: [4, 20], end: [5, 20] },
  { name: 'मिथुन (Gemini)', icon: '♊', start: [5, 21], end: [6, 20] },
  { name: 'कर्क (Cancer)', icon: '♋', start: [6, 21], end: [7, 22] },
  { name: 'सिंह (Leo)', icon: '♌', start: [7, 23], end: [8, 22] },
  { name: 'कन्या (Virgo)', icon: '♍', start: [8, 23], end: [9, 22] },
  { name: 'तुळ (Libra)', icon: '♎', start: [9, 23], end: [10, 22] },
  { name: 'वृश्चिक (Scorpio)', icon: '♏', start: [10, 23], end: [11, 21] },
  { name: 'धनु (Sagittarius)', icon: '♐', start: [11, 22], end: [12, 21] },
  { name: 'मकर (Capricorn)', icon: '♑', start: [12, 22], end: [12, 31] }
];

export function getZodiacSign(month, day) {
  for (const z of ZODIAC_SIGNS) {
    const [sm, sd] = z.start;
    const [em, ed] = z.end;
    if ((month === sm && day >= sd) || (month === em && day <= ed)) {
      return z;
    }
  }
  return { name: 'सामान्य', icon: '✨' };
}

export function formatMarathiDate(dobString) {
  if (!dobString) return '';
  const parts = dobString.split('-');
  if (parts.length !== 3) return dobString;
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return `${day} ${MARATHI_MONTHS[monthIdx] || ''} ${year}`;
}

export function formatShortDate(dobString) {
  if (!dobString) return '';
  const parts = dobString.split('-');
  if (parts.length !== 3) return dobString;
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return `${day} ${MARATHI_MONTHS[monthIdx] || ''}`;
}

export function calculateBirthdayInfo(dobString, referenceDate = new Date()) {
  if (!dobString) {
    return {
      isValid: false,
      daysRemaining: 999,
      currentAge: 0,
      turningAge: 0,
      status: 'upcoming',
      nextBirthdayDate: null,
      zodiac: { name: '', icon: '' }
    };
  }

  const parts = dobString.split('-');
  const birthYear = parseInt(parts[0], 10);
  const birthMonth = parseInt(parts[1], 10) - 1; // 0-indexed
  const birthDay = parseInt(parts[2], 10);

  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const currentYear = today.getFullYear();

  // Handle leap year for Feb 29
  let bDayThisYear = birthDay;
  if (birthMonth === 1 && birthDay === 29) {
    const isLeapThisYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || (currentYear % 400 === 0);
    if (!isLeapThisYear) bDayThisYear = 28;
  }

  let thisYearBirthday = new Date(currentYear, birthMonth, bDayThisYear);
  let nextBirthdayYear = currentYear;

  // Compare dates
  if (thisYearBirthday.getTime() < today.getTime()) {
    // Already passed this year, next birthday is next year
    nextBirthdayYear = currentYear + 1;
    let bDayNextYear = birthDay;
    if (birthMonth === 1 && birthDay === 29) {
      const isLeapNextYear = (nextBirthdayYear % 4 === 0 && nextBirthdayYear % 100 !== 0) || (nextBirthdayYear % 400 === 0);
      if (!isLeapNextYear) bDayNextYear = 28;
    }
    thisYearBirthday = new Date(nextBirthdayYear, birthMonth, bDayNextYear);
  }

  // Calculate days remaining
  const oneDayMs = 1000 * 60 * 60 * 24;
  const diffTime = thisYearBirthday.getTime() - today.getTime();
  const daysRemaining = Math.round(diffTime / oneDayMs);

  // Age calculation
  let currentAge = currentYear - birthYear;
  // If birthday hasn't happened yet this year, currentAge is 1 less
  const hasBirthdayOccurredThisYear = (today.getMonth() > birthMonth) || 
    (today.getMonth() === birthMonth && today.getDate() >= birthDay);

  if (!hasBirthdayOccurredThisYear) {
    currentAge = currentAge - 1;
  }
  if (currentAge < 0) currentAge = 0;

  const turningAge = (daysRemaining === 0) ? currentAge : (currentAge + 1);

  // Status classification
  let status = 'upcoming';
  if (daysRemaining === 0) {
    status = 'today';
  } else if (daysRemaining === 1) {
    status = 'tomorrow';
  } else if (birthMonth === today.getMonth() && thisYearBirthday.getFullYear() === currentYear) {
    status = 'this_month';
  }

  const zodiac = getZodiacSign(birthMonth + 1, birthDay);

  return {
    isValid: true,
    birthYear,
    birthMonth,
    birthDay,
    daysRemaining,
    currentAge,
    turningAge,
    status,
    nextBirthdayDate: thisYearBirthday,
    zodiac
  };
}
