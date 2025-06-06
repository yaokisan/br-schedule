
export function getDatesInRange(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  // Ensure dates are parsed in UTC to avoid timezone off-by-one issues with YYYY-MM-DD
  const startDate = new Date(startDateStr + 'T00:00:00Z');
  const endDate = new Date(endDateStr + 'T00:00:00Z');

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    console.error("Invalid date format for range generation:", startDateStr, endDateStr);
    return [];
  }
  
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }
  return dates;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00Z'); // Assuming YYYY-MM-DD, treat as UTC
  return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
}

export function formatTime(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}
    