export const TC99M_HALF_LIFE_MINUTES = 360.4;

// Times are entered as wall-clock HH:MM with no date, so an interval that
// actually crosses midnight (e.g. cal 23:00, injection 01:00) is indistinguishable
// from a same-day interval of nearly 24 hours. Anything beyond this many minutes
// is implausible for a ~6 hour half-life tracer and is flagged rather than
// presented as a reliable figure.
export const IMPLAUSIBLE_INTERVAL_MINUTES = 720;

// Upper bound on an entered activity. Far above any real clinical dose, but
// finite, so a runaway or mistyped value cannot reach the calculation.
export const MAX_ACTIVITY = 100000;

export interface CalcInput {
  actualAmount: number;
  calMinutes: number;
  injectionMinutes: number;
}

export interface CalcResult {
  dose: number;
  minutesDifference: number;
  isLater: boolean;
  decayFactor: number;
  intervalImplausible: boolean;
}

export function timeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const cleaned = timeStr.trim();

  const match = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

export function minutesToTime(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function calculateDecay(input: CalcInput): CalcResult {
  const minutesDifference = Math.abs(input.injectionMinutes - input.calMinutes);
  const isLater = input.injectionMinutes > input.calMinutes;
  const decayFactor = Math.pow(0.5, minutesDifference / TC99M_HALF_LIFE_MINUTES);

  let dose: number;
  if (isLater) {
    dose = input.actualAmount * decayFactor;
  } else {
    dose = input.actualAmount / decayFactor;
  }

  return {
    dose,
    minutesDifference,
    isLater,
    decayFactor,
    intervalImplausible: minutesDifference > IMPLAUSIBLE_INTERVAL_MINUTES,
  };
}

export function formatDose(dose: number): string {
  return dose.toFixed(1);
}
