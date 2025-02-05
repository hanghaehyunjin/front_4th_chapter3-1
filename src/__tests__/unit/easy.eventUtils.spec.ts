import { Event } from '../../types';
import { getFilteredEvents } from '../../utils/eventUtils';

describe('getFilteredEvents', () => {
  const mockEvents: Event[] = [
    {
      id: '1',
      title: '점심 약속',
      date: '2024-07-02',
      startTime: '12:30',
      endTime: '13:30',
      description: '동료와 점심 식사',
      location: '회사 근처 식당',
      category: '개인',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 1,
    },
    {
      id: '2',
      title: '프로젝트 마감',
      date: '2024-07-03',
      startTime: '09:00',
      endTime: '18:00',
      description: '분기별 프로젝트 마감',
      location: '사무실',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 1,
    },
    {
      id: '3',
      title: '생일 파티',
      date: '2024-07-28',
      startTime: '19:00',
      endTime: '22:00',
      description: '친구 생일 축하',
      location: '친구 집',
      category: '개인',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 1,
    },
    {
      id: '4',
      title: '이벤트 1',
      date: '2024-07-31',
      startTime: '10:00',
      endTime: '11:00',
      description: '주간 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 1,
    },
    {
      id: '5',
      title: '이벤트 2',
      date: '2024-07-22',
      startTime: '18:00',
      endTime: '19:00',
      description: '주간 운동',
      location: '헬스장',
      category: '개인',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 1,
    },
  ];

  it("검색어 '이벤트 2'에 맞는 이벤트만 반환한다", () => {
    const date = new Date(2024, 6, 1);
    const searchTerm = '이벤트 2';
    const result = getFilteredEvents(mockEvents, searchTerm, date, 'month');

    expect(result).toEqual([
      {
        id: '5',
        title: '이벤트 2',
        date: '2024-07-22',
        startTime: '18:00',
        endTime: '19:00',
        description: '주간 운동',
        location: '헬스장',
        category: '개인',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 1,
      },
    ]);
  });

  it('주간 뷰에서 2024-07-01 주의 이벤트만 반환한다', () => {
    const date = new Date(2024, 6, 1);
    const searchTerm = '';
    const result = getFilteredEvents(mockEvents, searchTerm, date, 'week');

    expect(result).toEqual([
      {
        id: '1',
        title: '점심 약속',
        date: '2024-07-02',
        startTime: '12:30',
        endTime: '13:30',
        description: '동료와 점심 식사',
        location: '회사 근처 식당',
        category: '개인',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 1,
      },
      {
        id: '2',
        title: '프로젝트 마감',
        date: '2024-07-03',
        startTime: '09:00',
        endTime: '18:00',
        description: '분기별 프로젝트 마감',
        location: '사무실',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 1,
      },
    ]);
  });

  it('월간 뷰에서 2024년 7월의 모든 이벤트를 반환한다', () => {
    const date = new Date(2024, 6, 1);
    const searchTerm = '';
    const result = getFilteredEvents(mockEvents, searchTerm, date, 'month');

    expect(result).toEqual(mockEvents);
  });

  it("검색어 '이벤트'와 주간 뷰 필터링을 동시에 적용한다", () => {
    const date = new Date(2024, 6, 22);
    const searchTerm = '이벤트';
    const result = getFilteredEvents(mockEvents, searchTerm, date, 'week');

    expect(result).toEqual([
      {
        id: '5',
        title: '이벤트 2',
        date: '2024-07-22',
        startTime: '18:00',
        endTime: '19:00',
        description: '주간 운동',
        location: '헬스장',
        category: '개인',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 1,
      },
    ]);
  });

  it('검색어가 없을 때 모든 이벤트를 반환한다', () => {
    const date = new Date(2024, 6, 1);
    const searchTerm = '';
    const result = getFilteredEvents(mockEvents, searchTerm, date, 'month');

    expect(result).toEqual(mockEvents);
  });

  it('검색어가 대소문자를 구분하지 않고 작동한다', () => {
    const date = new Date(2024, 6, 31);
    const searchTerm = '회의실 a';
    const result = getFilteredEvents(mockEvents, searchTerm, date, 'week');

    expect(result).toEqual([
      {
        id: '4',
        title: '이벤트 1',
        date: '2024-07-31',
        startTime: '10:00',
        endTime: '11:00',
        description: '주간 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 1,
      },
    ]);
  });

  it('2024년 7월에 속한 이벤트를 올바르게 필터링한다', () => {
    const mockData: Event[] = [
      {
        id: '1',
        title: '점심 약속',
        date: '2024-07-02',
        startTime: '12:30',
        endTime: '13:30',
        description: '동료와 점심 식사',
        location: '회사 근처 식당',
        category: '개인',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 1,
      },
      {
        id: '121212121-b4a4-47b3-b959-25171d49371f',
        title: '새로운 이벤트',
        date: '2024-08-02',
        startTime: '18:00',
        endTime: '19:00',
        description: '주간 운동',
        location: '헬스장',
        category: '개인',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 1,
      },
    ];
    const date = new Date(2024, 6, 31);
    const searchTerm = '';
    const result = getFilteredEvents(mockData, searchTerm, date, 'month');

    expect(result).toEqual(mockData.filter((mock) => mock.date < '2024-08-01'));
  });

  it('빈 이벤트 리스트에 대해 빈 배열을 반환한다', () => {
    const date = new Date(2024, 9, 31);
    const searchTerm = '';
    const result = getFilteredEvents([], searchTerm, date, 'month');

    expect(result).toEqual([]);
  });
});
