
export enum AvailabilityStatus {
  AVAILABLE = '⚪',
  MAYBE = '△',
  UNAVAILABLE = '×',
}

export const ALL_AVAILABILITY_STATUSES: AvailabilityStatus[] = [
  AvailabilityStatus.AVAILABLE,
  AvailabilityStatus.MAYBE,
  AvailabilityStatus.UNAVAILABLE,
];

export enum MaybeReason {
  PARTIALLY_AVAILABLE = '一部の時間帯 OK',
  NEEDS_ADJUSTMENT = '調整が必要',
  OTHER = 'その他',
}

export const ALL_MAYBE_REASONS: MaybeReason[] = [
  MaybeReason.PARTIALLY_AVAILABLE,
  MaybeReason.NEEDS_ADJUSTMENT,
  MaybeReason.OTHER,
];

export interface TimeSlot {
  id: string; // 'AM' or 'PM'
  label: string; // "9:00-14:00" or "14:00-20:00"
}

export const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { id: 'AM', label: '9:00 - 14:00' },
  { id: 'PM', label: '14:00 - 20:00' },
];

export interface SlotAvailability {
  slotId: string; // 'AM' or 'PM'
  status: AvailabilityStatus | null;
  reasons: MaybeReason[]; // Use an array for multiple checks
}

export interface DailyAvailability {
  date: string; // YYYY-MM-DD
  slots: SlotAvailability[];
}

export interface UserEntry {
  id: string;
  eventId: string;
  name: string;
  availabilities: DailyAvailability[];
  lastUpdatedAt: string; // ISO date string
}

export interface AdminEvent {
  id: string;
  eventName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  createdAt: string; // ISO date string
}

export interface SlotStats {
  date: string;
  slotId: string;
  slotLabel: string;
  availableCount: number;
  maybeCount: number;
  unavailableCount: number;
  totalEntries: number;
}
    