import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminEvent, UserEntry, DailyAvailability, SlotAvailability, AvailabilityStatus, MaybeReason, DEFAULT_TIME_SLOTS } from '../types';
import { getAdminEventById, getUserEntriesForEvent, addUserEntry, updateUserEntry, getUserEntryById, initializeAvailabilities } from '../services/scheduleService';
import Button from '../components/Button';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import AvailabilitySelector from '../components/AvailabilitySelector';
import CheckboxGroup from '../components/CheckboxGroup';
import { formatDate, formatDateTime } from '../utils/dateUtils';

const UserSchedulePage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<AdminEvent | null>(null);
  const [userEntries, setUserEntries] = useState<UserEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<Partial<UserEntry> & { availabilities: DailyAvailability[] } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unfilledSlots, setUnfilledSlots] = useState<Set<string>>(new Set());
  const [newEntryDraft, setNewEntryDraft] = useState<Partial<UserEntry> & { availabilities: DailyAvailability[] } | null>(null);


  const fetchEventData = useCallback(async () => {
    if (!eventId) return;
    setIsLoading(true);
    setError(null);
    try {
      const fetchedEvent = await getAdminEventById(eventId);
      if (!fetchedEvent) {
        setError("指定されたイベントが見つかりません。");
        setIsLoading(false);
        return;
      }
      setEvent(fetchedEvent);
      const fetchedEntries = await getUserEntriesForEvent(eventId);
      setUserEntries(fetchedEntries.sort((a,b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime()));
    } catch (err) {
      console.error("Failed to fetch event data:", err);
      setError("データの読み込みに失敗しました。");
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEventData();
  }, [fetchEventData]);

  useEffect(() => {
    if (currentEntry && !isEditing) {
      setNewEntryDraft(currentEntry);
    }
  }, [currentEntry, isEditing]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormError(null);
    setUnfilledSlots(new Set());
  };

  const openNewEntryModal = () => {
    if (!event) return;
    
    const entryData = newEntryDraft || {
      name: '',
      availabilities: initializeAvailabilities(event.startDate, event.endDate),
      comment: '',
    };
    
    setCurrentEntry(entryData);
    setIsEditing(false);
    setFormError(null);
    setUnfilledSlots(new Set());
    setIsModalOpen(true);
  };

  const openEditEntryModal = async (entryToEdit: UserEntry) => {
    if (!event || !entryToEdit.id) return;
    // Ensure availabilities cover the full event range, populating from existing if available
    const fullAvailabilities = initializeAvailabilities(event.startDate, event.endDate);
    const updatedAvailabilities = fullAvailabilities.map(daily => {
        const existingDaily = entryToEdit.availabilities.find(ea => ea.date === daily.date);
        return existingDaily ? {
            ...daily,
            slots: daily.slots.map(slot => {
                const existingSlot = existingDaily.slots.find(es => es.slotId === slot.slotId);
                return existingSlot || slot;
            })
        } : daily;
    });

    setCurrentEntry({ ...entryToEdit, availabilities: updatedAvailabilities, comment: entryToEdit.comment || '' });
    setIsEditing(true);
    setFormError(null);
    setUnfilledSlots(new Set());
    setIsModalOpen(true);
  };
  
  const handleNameChange = (name: string) => {
    if (currentEntry) {
      setCurrentEntry({ ...currentEntry, name });
    }
  };

  const handleCommentChange = (comment: string) => {
    if (currentEntry) {
      setCurrentEntry({ ...currentEntry, comment });
    }
  };

  const handleAvailabilityChange = (date: string, slotId: string, status: AvailabilityStatus) => {
    if (unfilledSlots.has(`${date}-${slotId}`)) {
      const newUnfilled = new Set(unfilledSlots);
      newUnfilled.delete(`${date}-${slotId}`);
      setUnfilledSlots(newUnfilled);
    }

    if (currentEntry) {
      const updatedAvailabilities = currentEntry.availabilities.map(da => {
        if (da.date === date) {
          return {
            ...da,
            slots: da.slots.map(s => {
              if (s.slotId === slotId) {
                const newStatus = s.status === status ? null : status;
                // If changing to not-Maybe, clear reasons
                const reasons = newStatus === AvailabilityStatus.MAYBE ? s.reasons : [];
                const otherReasonComment = newStatus === AvailabilityStatus.MAYBE ? s.otherReasonComment : '';
                return { ...s, status: newStatus, reasons, otherReasonComment };
              }
              return s;
            }),
          };
        }
        return da;
      });
      setCurrentEntry({ ...currentEntry, availabilities: updatedAvailabilities });
    }
  };

  const handleOtherReasonChange = (date: string, slotId: string, comment: string) => {
    if (currentEntry) {
      const updatedAvailabilities = currentEntry.availabilities.map(da => {
        if (da.date === date) {
          return {
            ...da,
            slots: da.slots.map(s => {
              if (s.slotId === slotId) {
                return { ...s, otherReasonComment: comment };
              }
              return s;
            }),
          };
        }
        return da;
      });
      setCurrentEntry({ ...currentEntry, availabilities: updatedAvailabilities });
    }
  };

  const handleReasonChange = (date: string, slotId: string, reason: MaybeReason, checked: boolean) => {
    if (currentEntry) {
      const updatedAvailabilities = currentEntry.availabilities.map(da => {
        if (da.date === date) {
          return {
            ...da,
            slots: da.slots.map(s => {
              if (s.slotId === slotId) {
                const newReasons = checked
                  ? [...(s.reasons || []), reason]
                  : (s.reasons || []).filter(r => r !== reason);

                // If "Other" is unchecked, clear the comment
                const otherReasonComment = newReasons.includes(MaybeReason.OTHER) ? s.otherReasonComment : '';

                return { ...s, reasons: newReasons, otherReasonComment };
              }
              return s;
            }),
          };
        }
        return da;
      });
      setCurrentEntry({ ...currentEntry, availabilities: updatedAvailabilities });
    }
  };

  const handleSubmit = async () => {
    if (!currentEntry || !currentEntry.name?.trim() || !eventId) {
      setFormError("名前を入力してください。");
      return;
    }

    // Validate all slots are filled and collect unfilled ones
    const unfilled: string[] = [];
    currentEntry.availabilities.forEach(daily => {
      daily.slots.forEach(slot => {
        if (slot.status === null) {
          unfilled.push(`${daily.date}-${slot.slotId}`);
        }
      });
    });

    if (unfilled.length > 0) {
      setUnfilledSlots(new Set(unfilled));
      setFormError("未入力の項目があります。赤くマークされた箇所をすべて選択してください。");
      return;
    }

    setFormError(null);
    setUnfilledSlots(new Set());
    setIsSubmitting(true);
    try {
      if (isEditing && currentEntry.id) {
        await updateUserEntry(eventId, currentEntry.id, { name: currentEntry.name, availabilities: currentEntry.availabilities, comment: currentEntry.comment });
      } else {
        await addUserEntry(eventId, { name: currentEntry.name, availabilities: currentEntry.availabilities, comment: currentEntry.comment });
        setNewEntryDraft(null); // Clear draft after successful submission
      }
      handleCloseModal();
      setCurrentEntry(null);
      await fetchEventData(); // Refresh entries
    } catch (err) {
      console.error("Failed to save entry:", err);
      setFormError("登録に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };


  if (isLoading) {
    return <LoadingSpinner text="イベント情報を読み込んでいます..." colorScheme="pink" />;
  }

  if (error) {
    return <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
  }

  if (!event) {
    return <div className="text-center text-slate-600">イベント情報が見つかりません。</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-theme-pink-700 mb-2">{event.eventName}</h1>
        <p className="text-slate-600">期間: {formatDate(event.startDate)} 〜 {formatDate(event.endDate)}</p>
        <p className="text-sm text-slate-500 mt-1">以下の日程について、ご都合をお知らせください。</p>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-slate-700">現在の回答状況</h2>
        <Button onClick={openNewEntryModal} variant="success" size="md" colorScheme="pink">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          新規追加
        </Button>
      </div>

      {userEntries.length === 0 ? (
        <div className="text-center text-slate-500 bg-slate-50 p-6 rounded-lg shadow">
            <p>まだ回答がありません。「新規追加」からあなたの予定を登録してください。</p>
        </div>
      ) : (
        <div className="space-y-4">
          {userEntries.map(entry => (
            <div key={entry.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
              <div>
                <p className="text-lg font-semibold text-theme-pink-600">{entry.name}</p>
                <p className="text-xs text-slate-500">最終更新: {formatDateTime(entry.lastUpdatedAt)}</p>
              </div>
              <Button onClick={() => openEditEntryModal(entry)} variant="secondary" size="sm" colorScheme="pink">編集</Button>
            </div>
          ))}
        </div>
      )}
      
      {/* "管理者ページへ戻る" ボタンは削除されました */}

      {currentEntry && (
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={isEditing ? "予定を編集" : "予定を新規追加"} size="xl">
          <div className="space-y-4">
            {formError && <p className="text-red-500 text-sm bg-red-100 p-2 rounded-md">{formError}</p>}
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-slate-700 mb-1">名前</label>
              <input
                type="text"
                id="userName"
                value={currentEntry.name || ''}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-theme-pink-500 focus:border-theme-pink-500"
                placeholder="あなたの名前"
              />
            </div>
            
            <div className="space-y-6 max-h-[50vh] overflow-y-scroll p-1 pr-2">
              {currentEntry.availabilities.map(dailyAvail => (
                <div key={dailyAvail.date} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                  <h4 className="text-lg font-semibold text-slate-700 mb-3">{formatDate(dailyAvail.date)}</h4>
                  <div className="space-y-4">
                    {dailyAvail.slots.map(slotAvail => {
                      const timeSlot = DEFAULT_TIME_SLOTS.find(ts => ts.id === slotAvail.slotId);
                      if (!timeSlot) return null;
                      
                      const isUnfilled = unfilledSlots.has(`${dailyAvail.date}-${slotAvail.slotId}`);

                      return (
                        <div key={slotAvail.slotId} className={`p-3 border-l-4 bg-white rounded-r-md transition-colors duration-300 ${isUnfilled ? 'border-red-400 bg-red-50 shadow-inner' : 'border-theme-pink-300'}`}>
                          <p className="font-medium text-slate-600 mb-2">{timeSlot.label}</p>
                          <AvailabilitySelector
                            selectedStatus={slotAvail.status}
                            onChange={(status) => handleAvailabilityChange(dailyAvail.date, slotAvail.slotId, status)}
                          />
                          {slotAvail.status === AvailabilityStatus.MAYBE && (
                            <CheckboxGroup
                              title="理由 (複数選択可):"
                              selectedReasons={slotAvail.reasons}
                              onChange={(reason, checked) => handleReasonChange(dailyAvail.date, slotAvail.slotId, reason, checked)}
                              otherReasonComment={slotAvail.otherReasonComment}
                              onOtherReasonCommentChange={(comment) => handleOtherReasonChange(dailyAvail.date, slotAvail.slotId, comment)}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className='mt-4'>
                <label htmlFor="comment" className="block text-sm font-medium text-slate-700 mb-1">コメント (任意)</label>
                <textarea
                  id="comment"
                  value={currentEntry.comment || ''}
                  onChange={(e) => handleCommentChange(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-theme-pink-500 focus:border-theme-pink-500"
                  rows={3}
                  placeholder="その他補足事項があればご記入ください。"
                />
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200 mt-4">
              <Button onClick={handleCloseModal} variant="secondary" disabled={isSubmitting} colorScheme="pink">キャンセル</Button>
              <Button onClick={handleSubmit} variant="primary" isLoading={isSubmitting} disabled={isSubmitting} colorScheme="pink">
                {isEditing ? "更新" : "送信"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserSchedulePage;