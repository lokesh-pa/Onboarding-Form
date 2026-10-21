/**
 * Utility functions for Contingent Workforce Billing Losses and Soft Saves calculations
 * Uses strict Business Days (Monday-Friday) logic throughout.
 */

export interface ParsedRate {
  dailyRate: number;
  currency: string;
  formattedDailyRate: string;
}

export interface RequestFinancialMetrics {
  dailyRate: number;
  currency: string;
  formattedDailyRate: string;
  businessDaysLapsed: number;
  isRejected: boolean;
  isEarlyOnboarding: boolean;
  earlyBusinessDays: number;
  billingLoss: number; // 0 for SLA met or early onboarding, positive for loss
  formattedBillingLoss: string;
  efficiencyGain: number; // positive financial gain for completing onboarding ahead of schedule
  formattedEfficiencyGain: string;
  workingDaysBetweenOnboardAndBillingStart: number;
  softSaves: number;
  formattedSoftSaves: string;
  slaStatusText: string;
  calculationExplanation: string;
}

/**
 * Parses any rate string into a standard daily rate and currency.
 * Handles explicit daily rates ($600/day, €650/day), hourly rates ($75/hr * 8 hrs),
 * or numeric inputs. Default currency is '$'.
 */
export function parseDailyRate(rateStr?: string): ParsedRate {
  if (!rateStr || typeof rateStr !== 'string') {
    return { dailyRate: 600, currency: '$', formattedDailyRate: '$600/day' };
  }

  // Detect currency symbol
  let currency = '$';
  if (rateStr.includes('€') || rateStr.toUpperCase().includes('EUR')) {
    currency = '€';
  } else if (rateStr.includes('£') || rateStr.toUpperCase().includes('GBP')) {
    currency = '£';
  } else if (rateStr.includes('₹') || rateStr.toUpperCase().includes('INR')) {
    currency = '₹';
  } else if (rateStr.includes('$') || rateStr.toUpperCase().includes('USD')) {
    currency = '$';
  }

  // Extract first floating/decimal number
  const match = rateStr.match(/[\d,.]+/);
  if (!match) {
    return { dailyRate: 600, currency, formattedDailyRate: `${currency}600/day` };
  }

  const numericVal = parseFloat(match[0].replace(/,/g, ''));
  if (isNaN(numericVal) || numericVal <= 0) {
    return { dailyRate: 600, currency, formattedDailyRate: `${currency}600/day` };
  }

  // If rate contains /hr or /hour, convert standard 8-hour workday to daily rate
  const lower = rateStr.toLowerCase();
  let dailyRate = numericVal;
  if (
    lower.includes('/hr') ||
    lower.includes('per hr') ||
    lower.includes('/hour') ||
    lower.includes('per hour') ||
    (numericVal < 200 && !lower.includes('/day') && !lower.includes('day'))
  ) {
    dailyRate = numericVal * 8;
  }

  return {
    dailyRate,
    currency,
    formattedDailyRate: `${currency}${dailyRate.toLocaleString('en-US')}/day`
  };
}

/**
 * Parses date string safely to midnight of local date (avoiding UTC offset jumps)
 */
export function parseDateToLocal(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-').map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }
  const d = new Date(trimmed);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/**
 * Calculates strict business days (Monday-Friday) between two dates.
 * Excludes Saturdays and Sundays.
 * - Same business day returns 0.
 * - Friday to Monday returns 1 business day.
 */
export function calculateBusinessDaysBetween(startDateStr?: string, endDateStr?: string): number {
  const start = parseDateToLocal(startDateStr);
  const end = parseDateToLocal(endDateStr);
  if (!start || !end) return 0;
  if (end <= start) return 0;

  let businessDays = 0;
  const cur = new Date(start);
  // Count business days strictly after start date up to end date (inclusive)
  cur.setDate(cur.getDate() + 1);

  while (cur <= end) {
    const day = cur.getDay(); // 0 is Sunday, 6 is Saturday
    if (day !== 0 && day !== 6) {
      businessDays++;
    }
    cur.setDate(cur.getDate() + 1);
  }

  return businessDays;
}

/**
 * Backward compatible alias for business days lapsed
 */
export function calculateDaysLapsed(receivedDateStr: string, completedDateStr?: string): number {
  return calculateBusinessDaysBetween(receivedDateStr, completedDateStr || new Date().toISOString());
}

/**
 * Backward compatible alias for working days between two dates
 */
export function calculateWorkingDaysBetween(startDateStr: string, endDateStr: string): number {
  return calculateBusinessDaysBetween(startDateStr, endDateStr);
}

/**
 * Standard billing loss calculation
 */
export function calculateBillingLoss(dailyRate: number, daysLapsed: number): number {
  if (daysLapsed <= 0 || dailyRate <= 0) return 0;
  return Math.round(dailyRate * daysLapsed);
}

/**
 * Soft Saves = Daily Rate * Working Days between onboarding date & billing start date
 */
export function calculateSoftSaves(dailyRate: number, workingDays: number): number {
  if (workingDays <= 0 || dailyRate <= 0) return 0;
  return Math.round(dailyRate * workingDays);
}

/**
 * Formats currency with commas, symbol, and handles negative losses cleanly (e.g. -$1,200)
 */
export function formatCurrencyAmount(amount: number, currency: string = '$'): string {
  if (amount < 0) {
    return `-${currency}${Math.abs(amount).toLocaleString('en-US')}`;
  }
  return `${currency}${amount.toLocaleString('en-US')}`;
}

/**
 * Comprehensive financial metric calculation for an Onboarding or Rejected request.
 * Implements:
 * 1. Business days only (Monday-Friday).
 * 2. Rejected requests: If Manager/PMO takes > 1 business day to reject, that delay is recorded as loss.
 * 3. Early onboarding (Efficiency Gain): If vendor submits before onboarding date and manager onboards
 *    before onboarding date, efficiency gain is recorded (+Daily Rate * working days ahead) as a positive save.
 * 4. Soft Saves: Daily Rate * working days between onboarding date & billing start date.
 */
export function calculateRequestFinancials(req: {
  status: string;
  createdAt: string;
  updatedAt: string;
  type: string;
  details: {
    billingRateWithCurrency?: string;
    joiningDateInAB?: string;
    billingStartDate?: string;
  };
}): RequestFinancialMetrics {
  const { dailyRate, currency, formattedDailyRate } = parseDailyRate(req.details.billingRateWithCurrency);
  const isOffboarding = req.type === 'offboarding';
  const isRejected = req.status === 'rejected';
  const isOnboarded = req.status === 'onboarded';

  if (isOffboarding) {
    return {
      dailyRate,
      currency,
      formattedDailyRate,
      businessDaysLapsed: 0,
      isRejected: false,
      isEarlyOnboarding: false,
      earlyBusinessDays: 0,
      billingLoss: 0,
      formattedBillingLoss: 'NA',
      efficiencyGain: 0,
      formattedEfficiencyGain: 'NA',
      workingDaysBetweenOnboardAndBillingStart: 0,
      softSaves: 0,
      formattedSoftSaves: 'NA',
      slaStatusText: 'Offboarding Request (Financial Metrics NA)',
      calculationExplanation: 'Billing losses and efficiency gains only apply to Onboarding requests.'
    };
  }

  // 1. REJECTED REQUEST CASE
  // Rule: If Manager/PMO takes more than 1 business day to reject, show that as loss.
  if (isRejected) {
    const businessDaysToReject = calculateBusinessDaysBetween(req.createdAt, req.updatedAt);
    if (businessDaysToReject <= 1) {
      return {
        dailyRate,
        currency,
        formattedDailyRate,
        businessDaysLapsed: businessDaysToReject,
        isRejected: true,
        isEarlyOnboarding: false,
        earlyBusinessDays: 0,
        billingLoss: 0,
        formattedBillingLoss: formatCurrencyAmount(0, currency),
        efficiencyGain: 0,
        formattedEfficiencyGain: formatCurrencyAmount(0, currency),
        workingDaysBetweenOnboardAndBillingStart: 0,
        softSaves: 0,
        formattedSoftSaves: formatCurrencyAmount(0, currency),
        slaStatusText: 'Rejected within 1 business day ($0 Loss)',
        calculationExplanation: `Request was rejected within 1 business day (${businessDaysToReject}d). No billing loss incurred.`
      };
    } else {
      const excessDays = businessDaysToReject - 1;
      const billingLoss = Math.round(dailyRate * excessDays);
      return {
        dailyRate,
        currency,
        formattedDailyRate,
        businessDaysLapsed: businessDaysToReject,
        isRejected: true,
        isEarlyOnboarding: false,
        earlyBusinessDays: 0,
        billingLoss,
        formattedBillingLoss: formatCurrencyAmount(billingLoss, currency),
        efficiencyGain: 0,
        formattedEfficiencyGain: formatCurrencyAmount(0, currency),
        workingDaysBetweenOnboardAndBillingStart: 0,
        softSaves: 0,
        formattedSoftSaves: formatCurrencyAmount(0, currency),
        slaStatusText: `Rejected late (${businessDaysToReject} business days, ${excessDays}d excess loss)`,
        calculationExplanation: `Manager/PMO took ${businessDaysToReject} business days to reject (>1 business day allowed SLA). ${excessDays} excess day(s) × ${currency}${dailyRate}/day = ${currency}${billingLoss.toLocaleString()}.`
      };
    }
  }

  // 2. COMPLETED ONBOARDING CASE
  if (isOnboarded) {
    const formReceivedDate = parseDateToLocal(req.createdAt);
    const joiningDate = parseDateToLocal(req.details.joiningDateInAB);
    const completedDate = parseDateToLocal(req.updatedAt);

    // Efficiency Gain (early onboarding ahead of planned joining date):
    // If vendor submits before onboarding start date AND manager onboards before onboarding date
    if (formReceivedDate && joiningDate && completedDate && formReceivedDate < joiningDate && completedDate < joiningDate) {
      const earlyBusinessDays = calculateBusinessDaysBetween(req.updatedAt, req.details.joiningDateInAB);
      if (earlyBusinessDays > 0) {
        const efficiencyGain = Math.round(dailyRate * earlyBusinessDays);
        const workingDaysToBilling = calculateBusinessDaysBetween(req.details.joiningDateInAB, req.details.billingStartDate);
        const softSaves = calculateSoftSaves(dailyRate, workingDaysToBilling);

        return {
          dailyRate,
          currency,
          formattedDailyRate,
          businessDaysLapsed: 0,
          isRejected: false,
          isEarlyOnboarding: true,
          earlyBusinessDays,
          billingLoss: 0,
          formattedBillingLoss: '$0',
          efficiencyGain,
          formattedEfficiencyGain: `+${currency}${efficiencyGain.toLocaleString('en-US')}`,
          workingDaysBetweenOnboardAndBillingStart: workingDaysToBilling,
          softSaves,
          formattedSoftSaves: formatCurrencyAmount(softSaves, currency),
          slaStatusText: `Efficiency Gain (${earlyBusinessDays} business days ahead of joining date)`,
          calculationExplanation: `Efficiency Gain realized: Vendor submitted early and manager completed onboarding ${earlyBusinessDays} business days before planned joining date (${currency}${dailyRate} × ${earlyBusinessDays}d = +${currency}${efficiencyGain.toLocaleString()}).`
        };
      }
    }

    // Normal completed onboarding
    const businessDaysLapsed = calculateBusinessDaysBetween(req.createdAt, req.updatedAt);
    const billingLoss = calculateBillingLoss(dailyRate, businessDaysLapsed);
    const workingDaysToBilling = calculateBusinessDaysBetween(req.details.joiningDateInAB, req.details.billingStartDate);
    const softSaves = calculateSoftSaves(dailyRate, workingDaysToBilling);

    return {
      dailyRate,
      currency,
      formattedDailyRate,
      businessDaysLapsed,
      isRejected: false,
      isEarlyOnboarding: false,
      earlyBusinessDays: 0,
      billingLoss,
      formattedBillingLoss: formatCurrencyAmount(billingLoss, currency),
      efficiencyGain: 0,
      formattedEfficiencyGain: '$0',
      workingDaysBetweenOnboardAndBillingStart: workingDaysToBilling,
      softSaves,
      formattedSoftSaves: formatCurrencyAmount(softSaves, currency),
      slaStatusText: businessDaysLapsed === 0 ? 'Same-Day SLA Met ($0 Loss)' : `SLA Breached (${businessDaysLapsed} business days lapsed)`,
      calculationExplanation: businessDaysLapsed === 0
        ? 'Dossier approved and onboarding completed on the same business day as form receipt.'
        : `${businessDaysLapsed} business days lapsed between form receipt and completion × ${currency}${dailyRate}/day.`
    };
  }

  // 3. IN-PROGRESS ONBOARDING CASE
  const businessDaysLapsed = calculateBusinessDaysBetween(req.createdAt, new Date().toISOString());
  const billingLoss = calculateBillingLoss(dailyRate, businessDaysLapsed);
  const workingDaysToBilling = calculateBusinessDaysBetween(req.details.joiningDateInAB, req.details.billingStartDate);
  const softSaves = calculateSoftSaves(dailyRate, workingDaysToBilling);

  return {
    dailyRate,
    currency,
    formattedDailyRate,
    businessDaysLapsed,
    isRejected: false,
    isEarlyOnboarding: false,
    earlyBusinessDays: 0,
    billingLoss,
    formattedBillingLoss: formatCurrencyAmount(billingLoss, currency),
    efficiencyGain: 0,
    formattedEfficiencyGain: '$0',
    workingDaysBetweenOnboardAndBillingStart: workingDaysToBilling,
    softSaves,
    formattedSoftSaves: formatCurrencyAmount(softSaves, currency),
    slaStatusText: businessDaysLapsed === 0 ? 'Same-Day SLA In Progress ($0 Loss)' : `${businessDaysLapsed} business days in review (${businessDaysLapsed}d loss)`,
    calculationExplanation: businessDaysLapsed === 0
      ? 'Form received today. Active same-day onboarding SLA in progress.'
      : `${businessDaysLapsed} business days in review since form receipt × ${currency}${dailyRate}/day.`
  };
}

export interface OnboardingDateGapCheck {
  hasPolicyReminder: boolean;
  scenario: 1 | 2 | null;
  gapDays: number | null;
  supplierMessage: string;
  internalFlagMessage: string;
}

/**
 * Checks policy compliance between onboarding date (joiningDateInAB) and billingStartDate:
 * 1. New Demand: If gap < 7 days -> Supplier advisory & Manager/PMO flag
 * 2. Replacement: If gap < 30 days -> Supplier advisory & Manager/PMO flag
 */
export function checkOnboardingDateGap(
  demandType?: string,
  joiningDateStr?: string,
  billingDateStr?: string
): OnboardingDateGapCheck {
  if (!joiningDateStr || !billingDateStr) {
    return {
      hasPolicyReminder: false,
      scenario: null,
      gapDays: null,
      supplierMessage: '',
      internalFlagMessage: ''
    };
  }

  const dOnb = parseDateToLocal(joiningDateStr);
  const dBill = parseDateToLocal(billingDateStr);

  if (!dOnb || !dBill) {
    return {
      hasPolicyReminder: false,
      scenario: null,
      gapDays: null,
      supplierMessage: '',
      internalFlagMessage: ''
    };
  }

  // Gap in calendar days between billing start date and onboarding date
  const gapDays = Math.round((dBill.getTime() - dOnb.getTime()) / (1000 * 60 * 60 * 24));

  const isNewDemand = demandType === 'New Demand' || !demandType;
  const isReplacement = demandType === 'Replacement';

  // Scenario 1: New Demand with gap < 7 days
  if (isNewDemand && gapDays < 7) {
    return {
      hasPolicyReminder: true,
      scenario: 1,
      gapDays,
      supplierMessage: 'Billing start date seems very close to onboarding date, please check if this is correct',
      internalFlagMessage: 'Please check if billing start date is captured correctly'
    };
  }

  // Scenario 2: Replacement with gap < 30 days
  if (isReplacement && gapDays < 30) {
    return {
      hasPolicyReminder: true,
      scenario: 2,
      gapDays,
      supplierMessage: 'For replacement cases, please ensure non-billable transition is captured as per agreement while setting billing start date',
      internalFlagMessage: 'Please ensure non-billable Knowledge transition is captured while setting billing start date for replacement resources'
    };
  }

  return {
    hasPolicyReminder: false,
    scenario: null,
    gapDays,
    supplierMessage: '',
    internalFlagMessage: ''
  };
}
