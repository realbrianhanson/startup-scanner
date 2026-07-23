// Single source of truth for public product facts shared by Landing and Pricing.
// Keep this narrow: only facts that appear in public marketing copy.

export const PRODUCT_FACTS = {
  reportSectionCount: 15,
  reportTimeCopy: "typically 2–3 minutes",
  reportTimeShort: "typically 2–3 min",
  proPriceMonthly: 29,
  proTrialDays: 7,
  free: {
    monthlyCredits: 15,
    includedStandardReports: 1,
    includedChatMessages: 10,
  },
  pro: {
    monthlyCredits: 100,
    includedPremiumReports: 5,
    includedChatMessages: 40,
  },
  credits: {
    standardReport: 5,
    premiumReport: 12,
    chatMessage: 1,
  },
} as const;
