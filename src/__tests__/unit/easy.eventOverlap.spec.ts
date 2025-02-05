import { Event } from '../../types';
import {
  convertEventToDateRange,
  findOverlappingEvents,
  isOverlapping,
  parseDateTime,
} from '../../utils/eventOverlap';

describe('parseDateTime', () => {
  it('2024-07-01 14:30을 정확한 Date 객체로 변환한다', () => {
    const date = '2024-07-01';
    const time = '14:30';
    const result = parseDateTime(date, time).toISOString();

    expect(result).toBe('2024-07-01T14:30:00.000Z');
  });

  it('잘못된 날짜 형식에 대해 Invalid Date를 반환한다', () => {
    const date = '2024-0710';
    const time = '14:30';
    const result = parseDateTime(date, time);

    expect(result.toString()).toBe('Invalid Date');
  });

  it('잘못된 시간 형식에 대해 Invalid Date를 반환한다', () => {
    const date = '2024-07-10';
    const time = '14::::30';
    const result = parseDateTime(date, time);

    expect(result.toString()).toBe('Invalid Date');
  });

  it('날짜 문자열이 비어있을 때 Invalid Date를 반환한다', () => {
    const date = '';
    const time = '14::::30';
    const result = parseDateTime(date, time);

    expect(result.toString()).toBe('Invalid Date');
  });
});

describe('convertEventToDateRange', () => {
  it('일반적인 이벤트를 올바른 시작 및 종료 시간을 가진 객체로 변환한다', () => {
    const mockEvent: Event = {
      id: '1',
      title: '기존 회의',
      date: '2024-10-01',
      startTime: '09:30',
      endTime: '18:30',
      description: '기존 팀 미팅',
      location: '회의실 B',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    };

    const result = convertEventToDateRange(mockEvent);

    expect(result.start.toISOString()).toBe('2024-10-01T09:30:00.000Z');
    expect(result.end.toISOString()).toBe('2024-10-01T18:30:00.000Z');
  });

  it('잘못된 날짜 형식의 이벤트에 대해 Invalid Date를 반환한다', () => {
    const mockEvent: Event = {
      id: '1',
      title: '기존 회의',
      date: '2024-1001',
      startTime: '09:30',
      endTime: '18:30',
      description: '기존 팀 미팅',
      location: '회의실 B',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    };

    const result = convertEventToDateRange(mockEvent);

    expect(result.start.toString()).toBe('Invalid Date');
    expect(result.end.toString()).toBe('Invalid Date');
  });

  it('잘못된 시간 형식의 이벤트에 대해 Invalid Date를 반환한다', () => {
    const mockEvent: Event = {
      id: '1',
      title: '기존 회의',
      date: '2024-10-01',
      startTime: '09::::::::::30',
      endTime: '18::::::::::30',
      description: '기존 팀 미팅',
      location: '회의실 B',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    };

    const result = convertEventToDateRange(mockEvent);

    expect(result.start.toString()).toBe('Invalid Date');
    expect(result.end.toString()).toBe('Invalid Date');
  });
});

describe('isOverlapping', () => {
  it('두 이벤트가 겹치는 경우 true를 반환한다', () => {
    const mockEvents: Event[] = [
      {
        id: '1',
        title: '기존 회의',
        date: '2024-10-01',
        startTime: '09:30',
        endTime: '18:30',
        description: '기존 팀 미팅',
        location: '회의실 B',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
      {
        id: '2',
        title: '새로운 회의',
        date: '2024-10-01',
        startTime: '09:30',
        endTime: '18:30',
        description: '새로운 팀 미팅',
        location: '회의실 C',
        category: '업무분담',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
    ];

    const result = isOverlapping(mockEvents[0], mockEvents[1]);

    expect(result).toBe(true);
  });

  it('두 이벤트가 겹치지 않는 경우 false를 반환한다', () => {
    const mockEvents: Event[] = [
      {
        id: '1',
        title: '기존 회의',
        date: '2024-10-01',
        startTime: '09:30',
        endTime: '12:30',
        description: '기존 팀 미팅',
        location: '회의실 B',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
      {
        id: '2',
        title: '새로운 회의',
        date: '2024-10-01',
        startTime: '13:30',
        endTime: '18:30',
        description: '새로운 팀 미팅',
        location: '회의실 C',
        category: '업무분담',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
    ];

    const result = isOverlapping(mockEvents[0], mockEvents[1]);

    expect(result).toBe(false);
  });
});

describe('findOverlappingEvents', () => {
  const mockEvents: Event[] = [
    {
      id: '1',
      title: '기존 회의',
      date: '2024-10-01',
      startTime: '09:30',
      endTime: '12:30',
      description: '기존 팀 미팅',
      location: '회의실 B',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    },
    {
      id: '2',
      title: '새로운 회의',
      date: '2024-10-01',
      startTime: '13:30',
      endTime: '18:30',
      description: '새로운 팀 미팅',
      location: '회의실 C',
      category: '업무분담',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    },
  ];

  it('새 이벤트와 겹치는 모든 이벤트를 반환한다', () => {
    const newEvent: Event = {
      id: '3',
      title: '새로운 회의3333',
      date: '2024-10-01',
      startTime: '13:30',
      endTime: '18:30',
      description: '새로운 팀 미팅',
      location: '회의실 C',
      category: '업무분담',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    };

    const result = findOverlappingEvents(newEvent, mockEvents);

    expect(result).toEqual([
      {
        id: '2',
        title: '새로운 회의',
        date: '2024-10-01',
        startTime: '13:30',
        endTime: '18:30',
        description: '새로운 팀 미팅',
        location: '회의실 C',
        category: '업무분담',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
    ]);
  });

  it('겹치는 이벤트가 없으면 빈 배열을 반환한다', () => {
    const newEvent: Event = {
      id: '4',
      title: '프론트 회의',
      date: '2024-10-01',
      startTime: '19:30',
      endTime: '20:30',
      description: '프론트 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    };

    const result = findOverlappingEvents(newEvent, mockEvents);

    expect(result).toEqual([]);
  });
});
