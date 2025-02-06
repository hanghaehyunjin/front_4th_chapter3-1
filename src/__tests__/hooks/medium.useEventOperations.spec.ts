import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerUpdating,
} from '../../__mocks__/handlersUtils.ts';
import { useEventOperations } from '../../hooks/useEventOperations.ts';
import { server } from '../../setupTests.ts';
import { Event } from '../../types.ts';

// ? Medium: 아래 toastFn과 mock과 이 fn은 무엇을 해줄까요?
const toastFn = vi.fn();

vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => toastFn,
  };
});

beforeAll(() => {
  server.listen();
});

it('저장되어있는 초기 이벤트 데이터를 적절하게 불러온다', async () => {
  const { result } = await act(() => renderHook(() => useEventOperations(false)));

  expect(result.current.events).toEqual([
    {
      id: '1',
      title: '기존 회의',
      date: '2024-10-15',
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

it('정의된 이벤트 정보를 기준으로 적절하게 저장이 된다', async () => {
  const { result } = await act(() => renderHook(() => useEventOperations(false)));
  setupMockHandlerCreation();

  const newEvent: Omit<Event, 'id'> = {
    title: '새로운 회의',
    date: '2024-10-15',
    startTime: '14:00',
    endTime: '15:00',
    description: '새로운 팀 미팅',
    location: '회의실 A',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  };

  await act(async () => {
    await result.current.saveEvent(newEvent);
  });

  await act(async () => {
    await result.current.fetchEvents();
  });

  const savedEvent = result.current.events.find((event) => event.title === '새로운 회의');

  expect(savedEvent).toBeTruthy();
});

it("새로 정의된 'title', 'endTime' 기준으로 적절하게 일정이 업데이트 된다", async () => {
  setupMockHandlerUpdating();

  const { result } = await act(() => renderHook(() => useEventOperations(true)));

  const eventUpdate: Event = {
    id: '1',
    title: '업데이트된 회의',
    endTime: '11:30',
    date: '2024-10-15',
    startTime: '09:00',
    description: '기존 팀 미팅',
    location: '회의실 B',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  };

  await act(async () => {
    await result.current.saveEvent(eventUpdate);
  });

  const updatedEvent = result.current.events.find((event) => event.id === '1');

  expect(updatedEvent).toEqual(
    expect.objectContaining({
      id: '1',
      title: '업데이트된 회의',
      endTime: '11:30',
      date: '2024-10-15',
      startTime: '09:00',
      description: '기존 팀 미팅',
      location: '회의실 B',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    })
  );

  expect(toastFn).toHaveBeenCalledWith(
    expect.objectContaining({
      title: '일정이 수정되었습니다.',
      status: 'success',
    })
  );
});

it('존재하는 이벤트 삭제 시 에러없이 아이템이 삭제된다.', async () => {
  setupMockHandlerDeletion();

  const { result } = await act(() => renderHook(() => useEventOperations(false)));

  await act(async () => {
    await result.current.deleteEvent('1');
  });

  expect(result.current.events.length).toBe(0);

  expect(toastFn).toHaveBeenCalledWith(
    expect.objectContaining({
      title: '일정이 삭제되었습니다.',
      status: 'info',
    })
  );
});

it("이벤트 로딩 실패 시 '이벤트 로딩 실패'라는 텍스트와 함께 에러 토스트가 표시되어야 한다", async () => {
  server.use(
    http.get('/api/events', () => {
      return new HttpResponse(null, { status: 500 });
    })
  );

  await act(() => renderHook(() => useEventOperations(false)));

  expect(toastFn).toHaveBeenCalledWith(
    expect.objectContaining({
      title: '이벤트 로딩 실패',
      status: 'error',
    })
  );
});

it("존재하지 않는 이벤트 수정 시 '일정 저장 실패'라는 토스트가 노출되며 에러 처리가 되어야 한다", async () => {
  const { result } = await act(() => renderHook(() => useEventOperations(true)));

  const eventUpdate = {
    id: '5',
    title: '업데이트 실패 테스트',
  } as Event;

  await act(async () => {
    await result.current.saveEvent(eventUpdate);
  });

  expect(toastFn).toHaveBeenCalledWith(
    expect.objectContaining({
      title: '일정 저장 실패',
      status: 'error',
    })
  );
});

it("네트워크 오류 시 '일정 삭제 실패'라는 텍스트가 노출되며 이벤트 삭제가 실패해야 한다", async () => {
  setupMockHandlerDeletion();

  const { result } = await act(() => renderHook(() => useEventOperations(false)));

  server.use(
    http.delete('/api/events/:id', () => {
      return new HttpResponse(null, { status: 500 });
    })
  );

  await act(async () => {
    await result.current.deleteEvent('1');
  });

  expect(toastFn).toHaveBeenCalledWith(
    expect.objectContaining({
      title: '일정 삭제 실패',
      status: 'error',
    })
  );
});
