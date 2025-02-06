import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, within, act, waitFor } from '@testing-library/react';
import { UserEvent, userEvent } from '@testing-library/user-event';
import { ReactElement } from 'react';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerUpdating,
} from '../__mocks__/handlersUtils';
import App from '../App';
import { Event } from '../types';

// ! HINT. 이 유틸을 사용해 리액트 컴포넌트를 렌더링해보세요.
const setup = (element: ReactElement) => {
  const user = userEvent.setup();

  return { ...render(<ChakraProvider>{element}</ChakraProvider>), user }; // ? Medium: 여기서 ChakraProvider로 묶어주는 동작은 의미있을까요? 있다면 어떤 의미일까요?
};

// ! HINT. 이 유틸을 사용해 일정을 저장해보세요.
const saveSchedule = async (
  user: UserEvent,
  form: Omit<Event, 'id' | 'notificationTime' | 'repeat'>
) => {
  const { title, date, startTime, endTime, location, description, category } = form;

  await user.click(screen.getAllByText('일정 추가')[0]);

  await user.type(screen.getByLabelText('제목'), title);
  await user.type(screen.getByLabelText('날짜'), date);
  await user.type(screen.getByLabelText('시작 시간'), startTime);
  await user.type(screen.getByLabelText('종료 시간'), endTime);
  await user.type(screen.getByLabelText('설명'), description);
  await user.type(screen.getByLabelText('위치'), location);
  await user.selectOptions(screen.getByLabelText('카테고리'), category);

  await user.click(screen.getByTestId('event-submit-button'));
};

const textContentMatcher = (textMatch: string) => {
  return (_content: string, node: Element | null) => {
    if (!node) return false;
    const nodeHasText = node.textContent?.includes(textMatch) ?? false;
    const childrenDontHaveText = Array.from(node.children).every(
      (child) => !child.textContent?.includes(textMatch)
    );
    return nodeHasText && childrenDontHaveText;
  };
};

// ! HINT. "검색 결과가 없습니다"는 초기에 노출되는데요. 그럼 검증하고자 하는 액션이 실행되기 전에 검증해버리지 않을까요? 이 테스트를 신뢰성있게 만드려면 어떻게 할까요?
describe('일정 CRUD 및 기본 기능', () => {
  it('입력한 새로운 일정 정보에 맞춰 모든 필드가 이벤트 리스트에 정확히 저장된다.', async () => {
    // ! HINT. event를 추가 제거하고 저장하는 로직을 잘 살펴보고, 만약 그대로 구현한다면 어떤 문제가 있을 지 고민해보세요.
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    const newEvent = {
      title: '회의',
      date: '2024-10-01',
      startTime: '10:00',
      endTime: '11:00',
      location: '회의실 A',
      description: '주간 회의 진행',
      category: '업무',
    };

    await act(async () => {
      await saveSchedule(user, newEvent);
    });

    const eventList = screen.getByTestId('event-list');

    await waitFor(() => {
      expect(within(eventList).getByText(newEvent.title)).toBeInTheDocument();
      expect(within(eventList).getByText(newEvent.date)).toBeInTheDocument();
      expect(
        within(eventList).getByText(`${newEvent.startTime} - ${newEvent.endTime}`)
      ).toBeInTheDocument();
      expect(within(eventList).getByText(newEvent.description)).toBeInTheDocument();
      expect(within(eventList).getByText(newEvent.location)).toBeInTheDocument();
      expect(
        within(eventList).getByText((content) => content.includes(newEvent.category))
      ).toBeInTheDocument();
    });
  });

  it('기존 일정의 세부 정보를 수정하고 변경사항이 정확히 반영된다', async () => {
    setupMockHandlerUpdating();
    const { user } = setup(<App />);

    const editButtons = await screen.findAllByLabelText('Edit event');
    await user.click(editButtons[0]);

    const input = screen.getByLabelText('제목');
    await user.clear(input);
    await user.type(input, '수정된 event의 타이틀');
    await user.click(
      screen.getByRole('button', {
        name: '일정 수정',
      })
    );

    const eventList = screen.getByTestId('event-list');
    const expectedText = await within(eventList).findByText('수정된 event의 타이틀');
    expect(expectedText).toBeInTheDocument();
  });

  it('일정을 삭제하고 더 이상 조회되지 않는지 확인한다', async () => {
    setupMockHandlerDeletion();
    const { user } = setup(<App />);

    const deleteButton = await screen.findByLabelText('Delete event');
    await user.click(deleteButton);

    await waitFor(() => {
      const eventList = screen.getByTestId('event-list');
      const deletedEvent = within(eventList).queryByText('팀 회의');
      expect(deletedEvent).toBeNull();
    });
  });
});

describe('일정 뷰', () => {
  it('주별 뷰를 선택 후 해당 주에 일정이 없으면, 일정이 표시되지 않는다.', async () => {
    setupMockHandlerCreation([]);
    const { user } = setup(<App />);

    await user.selectOptions(screen.getByLabelText('view'), 'week');

    const weekView = screen.getByTestId('week-view');
    expect(within(weekView).queryByText(/회의/)).not.toBeInTheDocument();
  });

  it('주별 뷰 선택 후 해당 일자에 일정이 존재한다면 해당 일정이 정확히 표시된다', async () => {
    const mockEvent: Event[] = [
      {
        id: '1',
        title: '주간 회의',
        date: '2024-10-01',
        startTime: '10:00',
        endTime: '11:00',
        description: '팀 미팅',
        location: '회의실',
        category: '업무',
        repeat: { type: 'none' as const, interval: 0 },
        notificationTime: 10,
      },
    ];

    setupMockHandlerCreation(mockEvent);

    const { user } = setup(<App />);

    await act(async () => {
      await user.selectOptions(screen.getByLabelText('view'), 'week');
    });

    await waitFor(() => {
      const weekView = screen.getByTestId('week-view');
      const eventElement = within(weekView).getByText(textContentMatcher('주간 회의'));

      expect(
        within(eventElement).getByText((content) => content.includes('주간 회의'))
      ).toBeInTheDocument();
      expect(eventElement).toBeInTheDocument();
    });
  });

  it('월별 뷰에 일정이 없으면, 일정이 표시되지 않아야 한다.', async () => {
    setupMockHandlerCreation([]);
    const { user } = setup(<App />);

    await user.selectOptions(screen.getByLabelText('view'), 'month');

    const monthView = screen.getByTestId('month-view');
    expect(within(monthView).queryByText(/회의/)).not.toBeInTheDocument();
  });

  it('월별 뷰에 일정이 정확히 표시되는지 확인한다', async () => {
    const mockEvent: Event = {
      id: '1',
      title: '월간 회의',
      date: '2024-10-15',
      startTime: '10:00',
      endTime: '11:00',
      description: '월간 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    };
    setupMockHandlerCreation([mockEvent]);
    const { user } = setup(<App />);

    await user.selectOptions(screen.getByLabelText('view'), 'month');

    const monthView = screen.getByTestId('month-view');
    expect(within(monthView).getByText('월간 회의')).toBeInTheDocument();
  });

  it('달력에 1월 1일(신정)이 공휴일로 표시되는지 확인한다', async () => {
    setupMockHandlerCreation([]);
    vi.setSystemTime(new Date('2024-01-01T18:30'));

    const { user } = setup(<App />);

    await user.selectOptions(screen.getByLabelText('view'), 'month');

    await navigateToMonthView('2024년 1월', user);

    expect(within(screen.getByTestId('month-view')).getByText('신정')).toBeInTheDocument();
  });

  async function navigateToMonthView(targetMonth: string, user: UserEvent) {
    while (!screen.getByText(targetMonth)) {
      await user.click(screen.getByLabelText('Next'));
    }
  }
});

describe('검색 기능', () => {
  it('검색 결과가 없으면, "검색 결과가 없습니다."가 표시되어야 한다.', async () => {
    setupMockHandlerCreation([]);
    const { user } = setup(<App />);

    await user.type(screen.getByPlaceholderText('검색어를 입력하세요'), '존재하지 않는 일정');

    await waitFor(() => {
      expect(screen.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
    });
  });

  it("'팀 회의'를 검색하면 해당 제목을 가진 일정이 리스트에 노출된다", async () => {
    const mockEvent: Event = {
      id: '1',
      title: '팀 회의',
      date: '2024-10-15',
      startTime: '10:00',
      endTime: '11:00',
      description: '팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    };
    setupMockHandlerCreation([mockEvent]);
    const { user } = setup(<App />);

    await user.type(screen.getByPlaceholderText('검색어를 입력하세요'), '팀 회의');

    await waitFor(async () => {
      const eventList = screen.getByTestId('event-list');
      const foundEventText = await within(eventList).findByText('팀 회의');
      expect(foundEventText).toBeInTheDocument();
    });
  });

  it('검색어를 지우면 모든 일정이 다시 표시되어야 한다', async () => {
    const mockEvents: Event[] = [
      {
        id: '1',
        title: '팀 회의',
        date: '2024-10-15',
        startTime: '10:00',
        endTime: '11:00',
        description: '팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
      {
        id: '2',
        title: '개인 일정',
        date: '2024-10-16',
        startTime: '14:00',
        endTime: '15:00',
        description: '개인 일정',
        location: '집',
        category: '개인',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
    ];

    setupMockHandlerCreation(mockEvents);

    const { user } = setup(<App />);

    const searchInput = screen.getByLabelText('일정 검색');
    const eventList = screen.getByTestId('event-list');

    await user.type(searchInput, '팀 회의');
    await user.clear(searchInput);

    await waitFor(() => {
      mockEvents.forEach(async (event) => {
        expect(await within(eventList).findByText(event.title)).toBeInTheDocument();
      });
    });
  });
});

describe('일정 충돌', () => {
  it('겹치는 시간에 새 일정을 추가할 때 경고가 표시된다', async () => {
    const existingEvent: Event = {
      id: '1',
      title: '기존 회의',
      date: '2024-10-15',
      startTime: '10:00',
      endTime: '11:00',
      description: '기존 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    };
    setupMockHandlerCreation([existingEvent]);
    const { user } = setup(<App />);

    const newEvent = {
      title: '새 회의',
      date: '2024-10-15',
      startTime: '10:30',
      endTime: '11:30',
      description: '새로운 회의',
      location: '회의실 B',
      category: '업무',
    };

    await saveSchedule(user, newEvent);

    await waitFor(() => {
      expect(screen.getByText('일정 겹침 경고')).toBeInTheDocument();
    });
  });

  it('should display a warning when modifying event times and a conflict occurs', async () => {
    setupMockHandlerUpdating();
    const { user } = setup(<App />);

    const editButtons = await screen.findAllByLabelText('Edit event');
    await user.click(editButtons[0]);

    await user.clear(screen.getByLabelText('시작 시간'));
    await user.type(screen.getByLabelText('시작 시간'), '10:30');
    await user.clear(screen.getByLabelText('종료 시간'));
    await user.type(screen.getByLabelText('종료 시간'), '11:30');

    await user.click(screen.getByTestId('event-submit-button'));

    await waitFor(() => {
      expect(screen.getByText('일정 겹침 경고')).toBeInTheDocument();
    });
  });
});

it('notificationTime을 10으로 하면 지정 시간 10분 전 알람 텍스트가 노출된다', async () => {
  const mockEvent: Event = {
    id: '1',
    title: '알림 테스트',
    date: '2024-10-15',
    startTime: '10:00',
    endTime: '11:00',
    description: '알림 테스트',
    location: '회의실 A',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  };
  setupMockHandlerCreation([mockEvent]);
  setup(<App />);

  await waitFor(() => {
    expect(screen.getByText('알림: 10분 전')).toBeInTheDocument();
  });
});
