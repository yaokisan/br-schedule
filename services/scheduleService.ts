import { supabase } from '../utils/supabaseClient';
import { AdminEvent, UserEntry, DailyAvailability, DEFAULT_TIME_SLOTS } from '../types';
import { getDatesInRange } from '../utils/dateUtils';

// テーブル行型
interface AdminEventRow {
  id: string;
  event_name: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

interface UserEntryRow {
  id: string;
  event_id: string;
  name: string;
  availabilities: DailyAvailability[];
  last_updated_at: string;
}

// --- 変換ヘルパー ---
const rowToAdminEvent = (row: AdminEventRow): AdminEvent => ({
  id: row.id,
  eventName: row.event_name,
  startDate: row.start_date,
  endDate: row.end_date,
  createdAt: row.created_at,
});

const rowToUserEntry = (row: UserEntryRow): UserEntry => ({
  id: row.id,
  eventId: row.event_id,
  name: row.name,
  availabilities: row.availabilities,
  lastUpdatedAt: row.last_updated_at,
});

// --- Admin Event Functions ---

export const getAdminEvents = async (): Promise<AdminEvent[]> => {
  const { data, error } = await supabase
    .from<AdminEventRow>('admin_events')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToAdminEvent);
};

export const createAdminEvent = async (
  eventData: Omit<AdminEvent, 'id' | 'createdAt'>,
): Promise<AdminEvent> => {
  const { data, error } = await supabase
    .from<AdminEventRow>('admin_events')
    .insert(
      {
        event_name: eventData.eventName,
        start_date: eventData.startDate,
        end_date: eventData.endDate,
      },
      { defaultToNull: false },
    )
    .select()
    .single();
  if (error) throw error;
  return rowToAdminEvent(data);
};

export const getAdminEventById = async (eventId: string): Promise<AdminEvent | null> => {
  const { data, error } = await supabase
    .from<AdminEventRow>('admin_events')
    .select('*')
    .eq('id', eventId)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw error;
  }
  return data ? rowToAdminEvent(data) : null;
};

// --- User Entry Functions ---

export const getUserEntriesForEvent = async (eventId: string): Promise<UserEntry[]> => {
  const { data, error } = await supabase
    .from<UserEntryRow>('user_entries')
    .select('*')
    .eq('event_id', eventId);
  if (error) throw error;
  return (data || []).map(rowToUserEntry);
};

export const getUserEntryById = async (
  eventId: string,
  entryId: string,
): Promise<UserEntry | null> => {
  const { data, error } = await supabase
    .from<UserEntryRow>('user_entries')
    .select('*')
    .eq('event_id', eventId)
    .eq('id', entryId)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data ? rowToUserEntry(data) : null;
};

export const addUserEntry = async (
  eventId: string,
  entryData: Omit<UserEntry, 'id' | 'lastUpdatedAt' | 'eventId'>,
): Promise<UserEntry> => {
  const { data, error } = await supabase
    .from<UserEntryRow>('user_entries')
    .insert(
      {
        event_id: eventId,
        name: entryData.name,
        availabilities: entryData.availabilities,
      },
      { defaultToNull: false },
    )
    .select()
    .single();
  if (error) throw error;
  return rowToUserEntry(data);
};

export const updateUserEntry = async (
  eventId: string,
  entryId: string,
  updates: Partial<Omit<UserEntry, 'id' | 'eventId'>>,
): Promise<UserEntry | null> => {
  const payload: Partial<UserEntryRow> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.availabilities !== undefined) payload.availabilities = updates.availabilities as any;

  const { data, error } = await supabase
    .from<UserEntryRow>('user_entries')
    .update(payload)
    .eq('event_id', eventId)
    .eq('id', entryId)
    .select()
    .single();
  if (error) throw error;
  return data ? rowToUserEntry(data) : null;
};

export const deleteUserEntry = async (eventId: string, entryId: string): Promise<boolean> => {
  const { error, count } = await supabase
    .from<UserEntryRow>('user_entries')
    .delete({ count: 'exact' })
    .eq('event_id', eventId)
    .eq('id', entryId);
  if (error) throw error;
  return (count || 0) > 0;
};

// --- Utility for initializing availability ---
export const initializeAvailabilities = (
  startDate: string,
  endDate: string,
): DailyAvailability[] => {
  const dates = getDatesInRange(startDate, endDate);
  return dates.map((date) => ({
    date,
    slots: DEFAULT_TIME_SLOTS.map((slot) => ({
      slotId: slot.id,
      status: null,
      reasons: [],
    })),
  }));
};
    