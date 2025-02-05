import { Event } from '../../types';
import {
  fillZero,
  formatDate,
  formatMonth,
  formatWeek,
  getDaysInMonth,
  getEventsForDay,
  getWeekDates,
  getWeeksAtMonth,
  isDateInRange,
} from '../../utils/dateUtils';

describe('getDaysInMonth', () => {
  it('1월은 31일을 반환한다', () => {
    expect(getDaysInMonth(2025, 1)).toBe(31);
  });

  it('4월은 30일을 반환한다', () => {
    expect(getDaysInMonth(2024, 4)).toBe(30);
  });

  it('윤년의 2월은 29일을 반환한다', () => {
    expect(getDaysInMonth(2024, 2)).toBe(29);
  });

  it('평년의 2월은 28일을 반환한다', () => {
    expect(getDaysInMonth(2023, 2)).toBe(28);
  });

  it('월이 0일 때, 이전 해의 12월 일수를 반환한다', () => {
    expect(getDaysInMonth(2024, 0)).toBe(31);
  });

  it('월이 13일 때, 다음 해의 1월 일수를 반환한다', () => {
    expect(getDaysInMonth(2024, 13)).toBe(31);
  });
});

const getFormattedWeekDates = (date: Date) => {
  return getWeekDates(date).map((resultDate) => resultDate.toISOString().slice(0, 10));
};

describe('getWeekDates', () => {
  it('주중의 날짜(수요일)에 대해 올바른 주의 날짜들을 반환한다', () => {
    const date = new Date(2024, 9, 1);
    const result = getFormattedWeekDates(date);

    expect(result).toEqual([
      '2024-09-29',
      '2024-09-30',
      '2024-10-01',
      '2024-10-02',
      '2024-10-03',
      '2024-10-04',
      '2024-10-05',
    ]);
  });

  it('주의 시작(월요일)에 대해 올바른 주의 날짜들을 반환한다', () => {
    const date = new Date(2024, 9, 7);
    const result = getFormattedWeekDates(date);

    expect(result).toEqual([
      '2024-10-06',
      '2024-10-07',
      '2024-10-08',
      '2024-10-09',
      '2024-10-10',
      '2024-10-11',
      '2024-10-12',
    ]);
  });

  it('주의 끝(일요일)에 대해 올바른 주의 날짜들을 반환한다', () => {
    const date = new Date(2024, 9, 13);
    const result = getFormattedWeekDates(date);

    expect(result).toEqual([
      '2024-10-13',
      '2024-10-14',
      '2024-10-15',
      '2024-10-16',
      '2024-10-17',
      '2024-10-18',
      '2024-10-19',
    ]);
  });

  it('연도를 넘어가는 주의 날짜를 정확히 처리한다 (연말)', () => {
    const date = new Date(2024, 11, 31);
    const result = getFormattedWeekDates(date);

    expect(result).toEqual([
      '2024-12-29',
      '2024-12-30',
      '2024-12-31',
      '2025-01-01',
      '2025-01-02',
      '2025-01-03',
      '2025-01-04',
    ]);
  });

  it('연도를 넘어가는 주의 날짜를 정확히 처리한다 (연초)', () => {
    const date = new Date(2025, 0, 1);
    const result = getFormattedWeekDates(date);

    expect(result).toEqual([
      '2024-12-29',
      '2024-12-30',
      '2024-12-31',
      '2025-01-01',
      '2025-01-02',
      '2025-01-03',
      '2025-01-04',
    ]);
  });

  it('윤년의 2월 29일을 포함한 주를 올바르게 처리한다', () => {
    const date = new Date(2024, 1, 29);
    const result = getFormattedWeekDates(date);

    expect(result).toEqual([
      '2024-02-25',
      '2024-02-26',
      '2024-02-27',
      '2024-02-28',
      '2024-02-29',
      '2024-03-01',
      '2024-03-02',
    ]);
  });

  it('월의 마지막 날짜를 포함한 주를 올바르게 처리한다', () => {
    const date = new Date(2024, 8, 30);
    const result = getFormattedWeekDates(date);

    expect(result).toEqual([
      '2024-09-29',
      '2024-09-30',
      '2024-10-01',
      '2024-10-02',
      '2024-10-03',
      '2024-10-04',
      '2024-10-05',
    ]);
  });
});

describe('getWeeksAtMonth', () => {
  it('2024년 7월의 모든 주 정보를 반환해야 한다', () => {
    const date = new Date(2024, 6, 1);
    const result = getWeeksAtMonth(date);

    expect(result).toEqual([
      [null, 1, 2, 3, 4, 5, 6],
      [7, 8, 9, 10, 11, 12, 13],
      [14, 15, 16, 17, 18, 19, 20],
      [21, 22, 23, 24, 25, 26, 27],
      [28, 29, 30, 31, null, null, null],
    ]);
  });
});

describe('getEventsForDay', () => {
  const mockEvents: Event[] = [
    {
      id: '1',
      title: '기존 회의',
      date: '2024-10-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '기존 팀 미팅',
      location: '회의실 B',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    },
  ];

  it('특정 날짜(1일)에 해당하는 이벤트만 정확히 반환한다', () => {
    const result = getEventsForDay(mockEvents, 1);

    expect(result).toEqual([
      {
        id: '1',
        title: '기존 회의',
        date: '2024-10-01',
        startTime: '09:00',
        endTime: '10:00',
        description: '기존 팀 미팅',
        location: '회의실 B',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
    ]);
  });

  it('해당 날짜에 이벤트가 없을 경우 빈 배열을 반환한다', () => {
    const result = getEventsForDay(mockEvents, 2);
    expect(result).toEqual([]);
  });

  it('날짜가 0일 경우 빈 배열을 반환한다', () => {
    const result = getEventsForDay(mockEvents, 0);
    expect(result).toEqual([]);
  });

  it('날짜가 32일 이상인 경우 빈 배열을 반환한다', () => {
    const result = getEventsForDay(mockEvents, 33);
    expect(result).toEqual([]);
  });
});

describe('formatWeek', () => {
  it('월의 중간 날짜에 대해 올바른 주 정보를 반환한다', () => {
    const date = new Date(2024, 9, 15);
    const result = formatWeek(date);

    expect(result).toBe('2024년 10월 3주');
  });

  it('월의 첫 주에 대해 올바른 주 정보를 반환한다', () => {
    const date = new Date(2024, 9, 1);
    const result = formatWeek(date);

    expect(result).toBe('2024년 10월 1주');
  });

  it('월의 마지막 주에 대해 올바른 주 정보를 반환한다', () => {
    const date = new Date(2024, 9, 30);
    const result = formatWeek(date);

    expect(result).toBe('2024년 10월 5주');
  });

  it('연도가 바뀌는 주에 대해 올바른 주 정보를 반환한다', () => {
    const date = new Date(2024, 11, 31);
    const result = formatWeek(date);

    expect(result).toBe('2025년 1월 1주');
  });

  it('윤년 2월의 마지막 주에 대해 올바른 주 정보를 반환한다', () => {
    const date = new Date(2024, 1, 29);
    const result = formatWeek(date);

    expect(result).toBe('2024년 2월 5주');
  });

  it('평년 2월의 마지막 주에 대해 올바른 주 정보를 반환한다', () => {
    const date = new Date(2023, 1, 28);
    const result = formatWeek(date);

    expect(result).toBe('2023년 3월 1주');
  });
});

describe('formatMonth', () => {
  it("2024년 7월 10일을 '2024년 7월'로 반환한다", () => {
    const date = new Date(2024, 6, 10);
    const result = formatMonth(date);

    expect(result).toBe('2024년 7월');
  });
});

describe('isDateInRange', () => {
  const rangeStart = new Date(2024, 6, 1);
  const rangeEnd = new Date(2024, 6, 31);

  it('범위 내의 날짜 2024-07-10에 대해 true를 반환한다', () => {
    const date = new Date(2024, 6, 10);
    const result = isDateInRange(date, rangeStart, rangeEnd);

    expect(result).toBe(true);
  });

  it('범위의 시작일 2024-07-01에 대해 true를 반환한다', () => {
    const date = new Date(2024, 6, 1);
    const result = isDateInRange(date, rangeStart, rangeEnd);

    expect(result).toBe(true);
  });

  it('범위의 종료일 2024-07-31에 대해 true를 반환한다', () => {
    const date = new Date(2024, 6, 31);
    const result = isDateInRange(date, rangeStart, rangeEnd);

    expect(result).toBe(true);
  });

  it('범위 이전의 날짜 2024-06-30에 대해 false를 반환한다', () => {
    const date = new Date(2024, 5, 30);
    const result = isDateInRange(date, rangeStart, rangeEnd);

    expect(result).toBe(false);
  });

  it('범위 이후의 날짜 2024-08-01에 대해 false를 반환한다', () => {
    const date = new Date(2024, 7, 1);
    const result = isDateInRange(date, rangeStart, rangeEnd);

    expect(result).toBe(false);
  });

  it('시작일이 종료일보다 늦은 경우 모든 날짜에 대해 false를 반환한다', () => {
    const invalidStart = new Date(2024, 7, 1);
    const invalidEnd = new Date(2024, 6, 31);
    const date = new Date(2024, 6, 15);

    const result = isDateInRange(date, invalidStart, invalidEnd);
    expect(result).toBe(false);
  });
});

describe('fillZero', () => {
  test("5를 2자리로 변환하면 '05'를 반환한다", () => {
    const result = fillZero(5, 2);
    expect(result).toBe('05');
  });

  test("10을 2자리로 변환하면 '10'을 반환한다", () => {
    const result = fillZero(10, 2);
    expect(result).toBe('10');
  });

  test("3을 3자리로 변환하면 '003'을 반환한다", () => {
    const result = fillZero(3, 3);
    expect(result).toBe('003');
  });

  test("100을 2자리로 변환하면 '100'을 반환한다", () => {
    const result = fillZero(100, 2);
    expect(result).toBe('100');
  });

  test("0을 2자리로 변환하면 '00'을 반환한다", () => {
    const result = fillZero(0, 2);
    expect(result).toBe('00');
  });

  test("1을 5자리로 변환하면 '00001'을 반환한다", () => {
    const result = fillZero(1, 5);
    expect(result).toBe('00001');
  });

  test("소수점이 있는 3.14를 5자리로 변환하면 '03.14'를 반환한다", () => {
    const result = fillZero(3.14, 5);
    expect(result).toBe('03.14');
  });

  test('size 파라미터를 생략하면 기본값 2를 사용한다', () => {
    const result = fillZero(10);
    expect(result).toBe('10');
  });

  test('value가 지정된 size보다 큰 자릿수를 가지면 원래 값을 그대로 반환한다', () => {
    const result = fillZero(10000, 2);
    expect(result).toBe('10000');
  });
});

describe('formatDate', () => {
  it('날짜를 YYYY-MM-DD 형식으로 포맷팅한다', () => {
    const date = new Date(2024, 9, 1);
    const result = formatDate(date);

    expect(result).toBe('2024-10-01');
  });

  it('day 파라미터가 제공되면 해당 일자로 포맷팅한다', () => {
    const date = new Date(2024, 9, 1);
    const result = formatDate(date, 4);

    expect(result).toBe('2024-10-04');
  });

  it('월이 한 자리 수일 때 앞에 0을 붙여 포맷팅한다', () => {
    const date = new Date(2024, 4, 1);
    const result = formatDate(date);

    expect(result).toBe('2024-05-01');
  });

  it('일이 한 자리 수일 때 앞에 0을 붙여 포맷팅한다', () => {
    const date = new Date(2024, 9, 1);
    const result = formatDate(date);

    expect(result).toBe('2024-10-01');
  });
});
