import { act, renderHook } from '@testing-library/react';

import { useNotifications } from '../../hooks/useNotifications.ts';
import { Event } from '../../types.ts';
import { formatDate } from '../../utils/dateUtils.ts';
import { parseHM } from '../utils.ts';

const mockEvent: Event[] = [
  {
    id: '1',
    title: '팀 회의',
    date: formatDate(new Date('2024-10-01')),
    startTime: parseHM(new Date('2024-10-01T10:00:00').getTime()),
    endTime: parseHM(new Date('2024-10-01T11:00:00').getTime()),
    description: '주간 팀 미팅',
    location: '회의실 A',
    category: '업무',
    repeat: { type: 'none', interval: 2 },
    notificationTime: 2,
  },
];

it('초기 상태에서는 알림이 없어야 한다', async () => {
  const { result } = await act(() => renderHook(() => useNotifications(mockEvent)));

  expect(result.current.notifications).toEqual([]);
});

it('지정된 시간이 된 경우 알림이 새롭게 생성되어 추가된다', async () => {
  vi.useFakeTimers();
  const testDate = new Date('2024-10-01T09:58:00');
  vi.setSystemTime(testDate);

  const closestEvent: Event[] = [
    {
      id: '1',
      title: '곧 시작될 회의',
      date: formatDate(testDate),
      startTime: parseHM(new Date('2024-10-01T10:00:00').getTime()),
      endTime: parseHM(new Date('2024-10-01T11:00:00').getTime()),
      notificationTime: 2,
      category: '업무',
      description: '테스트 회의',
      location: '회의실',
      repeat: { type: 'none', interval: 0 },
    },
  ];

  const { result } = await act(() => renderHook(() => useNotifications(closestEvent)));
  expect(result.current.notifications).toHaveLength(0);

  await act(async () => {
    vi.advanceTimersByTime(1000);
  });

  expect(result.current.notifications).toHaveLength(1);

  vi.restoreAllMocks();
});

it('index를 기준으로 알림을 적절하게 제거할 수 있다', async () => {
  const { result } = await act(() => renderHook(() => useNotifications(mockEvent)));

  await act(async () => {
    result.current.setNotifications([
      { id: '1', message: '알림1' },
      { id: '2', message: '알림2' },
      { id: '3', message: '알림3' },
    ]);
  });

  await act(async () => {
    result.current.removeNotification(1);
  });

  expect(result.current.notifications.length).toBe(2);
  expect(result.current.notifications[0].message).toBe('알림1');
  expect(result.current.notifications[1].message).toBe('알림3');
});

it('이미 알림이 발생한 이벤트에 대해서는 중복 알림이 발생하지 않아야 한다', async () => {
  vi.useFakeTimers();
  const testDate = new Date('2024-10-01T09:58:00');
  vi.setSystemTime(testDate);

  const closestEvent: Event[] = [
    {
      id: '1',
      title: '곧 시작될 회의',
      date: formatDate(testDate),
      startTime: parseHM(new Date('2024-10-01T10:00:00').getTime()),
      endTime: parseHM(new Date('2024-10-01T11:00:00').getTime()),
      notificationTime: 2,
      category: '업무',
      description: '테스트 회의',
      location: '회의실',
      repeat: { type: 'none', interval: 0 },
    },
  ];

  const { result } = await act(() => renderHook(() => useNotifications(closestEvent)));

  await act(async () => {
    vi.advanceTimersByTime(1000);
  });

  const initialNotificationCount = result.current.notifications.length;
  const initialNotifiedEventsCount = result.current.notifiedEvents.length;

  await act(async () => {
    vi.advanceTimersByTime(1000);
  });

  expect(result.current.notifications.length).toBe(initialNotificationCount);
  expect(result.current.notifiedEvents.length).toBe(initialNotifiedEventsCount);

  vi.restoreAllMocks();
});
