import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AdminEvent, UserEntry, SlotStats, AvailabilityStatus, DEFAULT_TIME_SLOTS } from '../types';
import { getAdminEventById, getUserEntriesForEvent } from '../services/scheduleService';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import { formatDate } from '../utils/dateUtils';
import { getDatesInRange } from '../utils/dateUtils';

const AdminEventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<AdminEvent | null>(null);
  const [userEntries, setUserEntries] = useState<UserEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimelineDate, setSelectedTimelineDate] = useState<string | null>(null);

  const fetchEventDetails = useCallback(async () => {
    if (!eventId) return;
    setIsLoading(true);
    setError(null);
    try {
      const fetchedEvent = await getAdminEventById(eventId);
      if (!fetchedEvent) {
        setError("イベントが見つかりません。");
        setIsLoading(false);
        return;
      }
      setEvent(fetchedEvent);
      const fetchedEntries = await getUserEntriesForEvent(eventId);
      setUserEntries(fetchedEntries);
      // Set default timeline date to the first day of the event
      if (fetchedEvent.startDate && getDatesInRange(fetchedEvent.startDate, fetchedEvent.endDate).length > 0) {
        setSelectedTimelineDate(getDatesInRange(fetchedEvent.startDate, fetchedEvent.endDate)[0]);
      }

    } catch (err) {
      console.error("Failed to fetch event details:", err);
      setError("詳細の読み込みに失敗しました。");
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEventDetails();
  }, [fetchEventDetails]);

  const availabilityStats = useMemo((): SlotStats[] => {
    if (!event) return [];
    const stats: SlotStats[] = [];
    const dates = getDatesInRange(event.startDate, event.endDate);

    dates.forEach(date => {
      DEFAULT_TIME_SLOTS.forEach(slot => {
        let availableCount = 0;
        let maybeCount = 0;
        let unavailableCount = 0;
        userEntries.forEach(entry => {
          const daily = entry.availabilities.find(da => da.date === date);
          if (daily) {
            const slotAvailability = daily.slots.find(sa => sa.slotId === slot.id);
            if (slotAvailability?.status === AvailabilityStatus.AVAILABLE) availableCount++;
            else if (slotAvailability?.status === AvailabilityStatus.MAYBE) maybeCount++;
            else if (slotAvailability?.status === AvailabilityStatus.UNAVAILABLE) unavailableCount++;
          }
        });
        stats.push({
          date,
          slotId: slot.id,
          slotLabel: slot.label,
          availableCount,
          maybeCount,
          unavailableCount,
          totalEntries: userEntries.length
        });
      });
    });
    // Sort by most available (⚪), then most maybe (△), then by date
    return stats.sort((a, b) => {
      if (b.availableCount !== a.availableCount) return b.availableCount - a.availableCount;
      if (b.maybeCount !== a.maybeCount) return b.maybeCount - a.maybeCount;
      if (a.date !== b.date) return new Date(a.date).getTime() - new Date(b.date).getTime();
      return a.slotId.localeCompare(b.slotId);
    });
  }, [event, userEntries]);

  const timelineData = useMemo(() => {
    if (!selectedTimelineDate || userEntries.length === 0) return [];
    return userEntries.map(entry => {
      const daily = entry.availabilities.find(da => da.date === selectedTimelineDate);
      return {
        userName: entry.name,
        slots: DEFAULT_TIME_SLOTS.map(ts => {
          const slotAvailability = daily?.slots.find(s => s.slotId === ts.id);
          return {
            slotId: ts.id,
            status: slotAvailability?.status,
            reasons: slotAvailability?.reasons || []
          };
        })
      };
    });
  }, [selectedTimelineDate, userEntries]);
  
  const eventDates = useMemo(() => {
    if (!event) return [];
    return getDatesInRange(event.startDate, event.endDate);
  }, [event]);

  const handleGoToSchedulePage = () => {
    if (eventId) {
      navigate(`/schedule/${eventId}`);
    }
  };


  if (isLoading) {
    return <LoadingSpinner text="イベント詳細を読み込んでいます..." colorScheme="blue" />;
  }

  if (error) {
    return <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
  }

  if (!event) {
    return <div className="text-center text-slate-600">イベント情報が見つかりません。</div>;
  }

  const getStatusColor = (status: AvailabilityStatus | null | undefined) => {
    if (status === AvailabilityStatus.AVAILABLE) return 'bg-green-200 text-green-800';
    if (status === AvailabilityStatus.MAYBE) return 'bg-yellow-200 text-yellow-800';
    if (status === AvailabilityStatus.UNAVAILABLE) return 'bg-red-200 text-red-800';
    return 'bg-slate-100 text-slate-500';
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start">
            <div className="mb-4 sm:mb-0">
                <h1 className="text-3xl font-bold text-theme-blue-700 mb-1">{event.eventName}</h1>
                <p className="text-slate-600">期間: {formatDate(event.startDate)} 〜 {formatDate(event.endDate)}</p>
                <p className="text-sm text-slate-500">参加登録者数: {userEntries.length}名</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                <Button onClick={handleGoToSchedulePage} variant="primary" colorScheme="blue" size="sm" className="w-full sm:w-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    調整ページを開く
                </Button>
                <Link to="/admin" className="w-full sm:w-auto">
                    <Button variant="secondary" size="sm" className="w-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                        </svg>
                        ダッシュボードへ戻る
                    </Button>
                </Link>
            </div>
        </div>
      </div>

      {/* Availability Summary Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-theme-blue-700 mb-4">出欠状況サマリー</h2>
        {userEntries.length === 0 ? (
             <p className="text-slate-500">まだ参加者の登録がありません。</p>
        ) : availabilityStats.length === 0 ? (
            <p className="text-slate-500">集計データがありません。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">日時</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">時間帯</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">⚪ (可能)</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">△ (要調整)</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">× (不可)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {availabilityStats.map((stat, index) => (
                  <tr key={`${stat.date}-${stat.slotId}-${index}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{formatDate(stat.date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{stat.slotLabel}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 font-semibold text-center">{stat.availableCount}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-yellow-600 font-semibold text-center">{stat.maybeCount}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600 font-semibold text-center">{stat.unavailableCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Timeline Section */}
      {userEntries.length > 0 && eventDates.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-theme-blue-700 mb-4">タイムライン生成</h2>
          <div className="mb-4">
            <label htmlFor="timelineDate" className="block text-sm font-medium text-slate-700 mb-1">表示する日付を選択:</label>
            <select
              id="timelineDate"
              value={selectedTimelineDate || ''}
              onChange={(e) => setSelectedTimelineDate(e.target.value)}
              className="w-full sm:w-auto p-2 border border-slate-300 rounded-md focus:ring-theme-blue-500 focus:border-theme-blue-500"
            >
              {eventDates.map(date => (
                <option key={date} value={date}>{formatDate(date)}</option>
              ))}
            </select>
          </div>

          {selectedTimelineDate && timelineData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 border border-slate-200">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider border-r border-slate-200">参加者名</th>
                    {DEFAULT_TIME_SLOTS.map(slot => (
                      <th key={slot.id} className="px-3 py-3 text-center text-xs font-medium text-slate-600 uppercase tracking-wider border-r border-slate-200 last:border-r-0">{slot.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {timelineData.map((entry, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-theme-blue-700 border-r border-slate-200">{entry.userName}</td>
                      {entry.slots.map(slot => (
                        <td key={slot.slotId} className={`px-3 py-3 whitespace-nowrap text-center text-sm border-r border-slate-200 last:border-r-0 ${getStatusColor(slot.status)}`}>
                          {slot.status === AvailabilityStatus.AVAILABLE ? '⚪ 可' : ''}
                          {slot.status === AvailabilityStatus.MAYBE ? `△ (${slot.reasons.join(', ') || '要調整'})` : ''}
                          {slot.status === AvailabilityStatus.UNAVAILABLE ? '× 不可' : ''}
                          {!slot.status ? '-' : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : selectedTimelineDate && timelineData.length === 0 ? (
             <p className="text-slate-500 mt-4">選択された日付のタイムラインデータはありません (参加者未登録または全員未入力)。</p>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default AdminEventDetailPage;