export const CIRCLE_NAME = "Saigon Circle";
export const CONTRIBUTION_VND = 1_000_000;
export const MEMBER_COUNT = 6;
export const CYCLE_NUMBERS = [1, 3, 4] as const;

export function cycleMetadata(number: number) {
  if (!CYCLE_NUMBERS.includes(number as (typeof CYCLE_NUMBERS)[number])) {
    throw new Error("Unknown cycle");
  }
  return {
    id: `cycle-${number}`,
    number,
    recordId: `payout-c${number}`,
    amountVnd: CONTRIBUTION_VND * MEMBER_COUNT,
    beneficiary: number === 4 ? "Bao" : "Minh",
    beneficiaryUsername: number === 4 ? "bao" : "minh",
    releaseRole: `hui-c${number}-winner`,
  };
}
