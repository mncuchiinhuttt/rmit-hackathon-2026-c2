import { ApiError } from "@/lib/server/api-errors";
import { CYCLE_NUMBERS, cycleMetadata } from "@/features/circle/model";

export function parseRecordId(value: unknown): string {
  if (typeof value !== "string" || !CYCLE_NUMBERS.some((number) => cycleMetadata(number).recordId === value)) {
    throw new ApiError(400, "invalid_record_id", "Choose a seeded payout record.");
  }
  return value;
}

export function recordIdFromQuery(request: Request): string {
  const params = new URL(request.url).searchParams;
  const values = params.getAll("recordId");
  if (values.length !== 1 || [...params.keys()].some((key) => key !== "recordId")) {
    throw new ApiError(400, "invalid_record_id", "Provide one seeded payout recordId.");
  }
  return parseRecordId(values[0]);
}
