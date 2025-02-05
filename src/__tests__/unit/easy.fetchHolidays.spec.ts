import { fetchHolidays } from '../../apis/fetchHolidays';

describe('fetchHolidays', () => {
  it('주어진 월의 공휴일만 반환한다', () => {
    const date = new Date(2024, 4, 1);
    const result = fetchHolidays(date);

    expect(result).toEqual({ '2024-05-05': '어린이날' });
  });

  it('공휴일이 없는 월에 대해 빈 객체를 반환한다', () => {
    const date = new Date(2024, 6, 1);
    const result = fetchHolidays(date);

    expect(result).toEqual({});
  });

  it('여러 공휴일이 있는 월에 대해 모든 공휴일을 반환한다', () => {
    const date = new Date(2024, 8, 1);
    const result = fetchHolidays(date);

    expect(result).toEqual({ '2024-09-16': '추석', '2024-09-17': '추석', '2024-09-18': '추석' });
  });
});
