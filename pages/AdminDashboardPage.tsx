
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AdminEvent } from '../types';
import { getAdminEvents, createAdminEvent } from '../services/scheduleService';
import Button from '../components/Button';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate } from '../utils/dateUtils';

const AdminDashboardPage: React.FC = () => {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedEvents = await getAdminEvents();
      setEvents(fetchedEvents.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError("イベントの読み込みに失敗しました。");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleCreateEvent = async () => {
    if (!newEventName.trim() || !newStartDate || !newEndDate) {
      setFormError("すべてのフィールドを入力してください。");
      return;
    }
    if (new Date(newStartDate) > new Date(newEndDate)) {
      setFormError("開始日は終了日より前に設定してください。");
      return;
    }
    setFormError(null);
    setIsLoading(true); // Use a local loading state for form submission
    try {
      await createAdminEvent({ eventName: newEventName, startDate: newStartDate, endDate: newEndDate });
      setIsModalOpen(false);
      setNewEventName('');
      setNewStartDate('');
      setNewEndDate('');
      await fetchEvents(); // Re-fetch events
    } catch (err) {
      console.error("Failed to create event:", err);
      setFormError("イベントの作成に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareEvent = (eventId: string) => {
    const url = `${window.location.origin}${window.location.pathname}#/schedule/${eventId}`;
    navigator.clipboard.writeText(url)
      .then(() => alert(`共有URLがクリップボードにコピーされました:\n${url}`))
      .catch(err => alert(`URLのコピーに失敗しました: ${err}`));
  };

  if (isLoading && events.length === 0) { // Show main page loader only on initial load
    return <LoadingSpinner text="イベントを読み込んでいます..." />;
  }

  if (error) {
    return <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
  }
  
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-theme-blue-700">管理者ダッシュボード</h1>
        <Button onClick={() => setIsModalOpen(true)} variant="primary" colorScheme="blue" size="md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          新規イベント作成
        </Button>
      </div>

      {events.length === 0 && !isLoading ? (
        <div className="text-center text-slate-600 bg-slate-50 p-8 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">イベントがありません</h2>
          <p>「新規イベント作成」ボタンから新しい日程調整イベントを作成しましょう。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <div key={event.id} className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-semibold text-theme-blue-600 mb-2 truncate">{event.eventName}</h2>
                <p className="text-sm text-slate-500 mb-1">
                  期間: {formatDate(event.startDate)} 〜 {formatDate(event.endDate)}
                </p>
                <p className="text-xs text-slate-400 mb-4">作成日: {formatDate(event.createdAt.split('T')[0])}</p>
              </div>
              <div className="mt-auto space-y-2">
                <Button onClick={() => handleShareEvent(event.id)} variant="secondary" size="sm" className="w-full">
                  共有URLコピー
                </Button>
                <Link to={`/schedule/${event.id}`} className="w-full">
                  <Button variant="primary" colorScheme="pink" size="sm" className="w-full" icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  }>
                    調整ページを開く
                  </Button>
                </Link>
                <Link to={`/admin/event/${event.id}`} className="w-full">
                  <Button variant="primary" colorScheme="blue" size="sm" className="w-full">
                    詳細確認
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="新規イベント作成">
        <div className="space-y-4">
          {formError && <p className="text-red-500 text-sm bg-red-100 p-2 rounded-md">{formError}</p>}
          <div>
            <label htmlFor="eventName" className="block text-sm font-medium text-slate-700 mb-1">イベント名</label>
            <input
              type="text"
              id="eventName"
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-theme-blue-500 focus:border-theme-blue-500"
              placeholder="例: 夏合宿の日程調整"
            />
          </div>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 mb-1">開始日</label>
            <input
              type="date"
              id="startDate"
              value={newStartDate}
              min={today}
              onChange={(e) => setNewStartDate(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-theme-blue-500 focus:border-theme-blue-500"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 mb-1">終了日</label>
            <input
              type="date"
              id="endDate"
              value={newEndDate}
              min={newStartDate || today}
              onChange={(e) => setNewEndDate(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-theme-blue-500 focus:border-theme-blue-500"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <Button onClick={() => setIsModalOpen(false)} variant="secondary" disabled={isLoading}>キャンセル</Button>
            <Button onClick={handleCreateEvent} variant="primary" colorScheme="blue" isLoading={isLoading} disabled={isLoading}>作成</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDashboardPage;
