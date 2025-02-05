import { Event } from '../../types';
import { createNotificationMessage, getUpcomingEvents } from '../../utils/notificationUtils';

describe('getUpcomingEvents', () => {
  const sampleEvents: Event[] = [
    {
      id: '1',
      title: '회의',
      date: '2024-07-01',
      startTime: '14:00',
      endTime: '15:00',
      description: '팀 미팅',
      location: '회의실',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 30,
    },
    {
      id: '2',
      title: '점심 약속',
      date: '2024-07-01',
      startTime: '12:00',
      endTime: '13:00',
      description: '동료와 점심',
      location: '식당',
      category: '개인',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 15,
    },
  ];

  it('알림 시간이 정확히 도래한 이벤트를 반환한다', () => {
    const now = new Date('2024-07-01T13:30:00');
    const result = getUpcomingEvents(sampleEvents, now, []);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
    expect(result[0].title).toBe('회의');
  });

  it('이미 알림이 간 이벤트는 제외한다', () => {
    const now = new Date('2024-07-01T13:30:00');
    const notifiedEvents = ['1'];

    const result = getUpcomingEvents(sampleEvents, now, notifiedEvents);

    expect(result).toHaveLength(0);
  });

  it('알림 시간이 아직 도래하지 않은 이벤트는 반환하지 않는다', () => {
    const now = new Date('2024-07-01T13:20:00');
    const result = getUpcomingEvents(sampleEvents, now, []);

    expect(result).toHaveLength(0);
  });

  it('알림 시간이 지난 이벤트는 반환하지 않는다', () => {
    const now = new Date('2024-07-01T14:10:00');
    const result = getUpcomingEvents(sampleEvents, now, []);

    expect(result).toHaveLength(0);
  });
});

describe('createNotificationMessage', () => {
  it('올바른 알림 메시지를 생성해야 한다', () => {
    const event: Event = {
      id: '1',
      title: '팀 미팅',
      date: '2024-07-01',
      startTime: '14:00',
      endTime: '15:00',
      description: '월간 팀 미팅',
      location: '회의실',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 30,
    };

    const message = createNotificationMessage(event);
    expect(message).toBe('30분 후 팀 미팅 일정이 시작됩니다.');
  });
});
