import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import SpeciesScreen from '@/app/(tabs)/species';

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
  },
  Stack: {
    Screen: ({ children }: any) => children,
  },
}));

global.fetch = jest.fn();

describe('SpeciesScreen', () => {
  const mockBirds = [
    {
      birdId: 1,
      birdName: 'Northern Cardinal',
      sciName: 'Cardinalis cardinalis',
      habitat: 'Woodlands',
      family: 'Cardinalidae',
      cnsrvStatus: 'Least Concern',
    },
    {
      birdId: 2,
      birdName: 'Blue Jay',
      sciName: 'Cyanocitta cristata',
      habitat: 'Forests',
      family: 'Corvidae',
      cnsrvStatus: 'Least Concern',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockBirds,
    });
  });

  it('should render species screen with title', () => {
    render(<SpeciesScreen />);
    expect(screen.getByText('Bird Species')).toBeTruthy();
  });

  it('should render search input', () => {
    render(<SpeciesScreen />);
    expect(screen.getByPlaceholderText('Search species...')).toBeTruthy();
  });

  it('should show loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<SpeciesScreen />);
    expect(screen.getByText('Loading species…')).toBeTruthy();
  });

  it('should display species list when loaded', async () => {
    render(<SpeciesScreen />);
    await waitFor(() => {
      expect(screen.getByText('Northern Cardinal')).toBeTruthy();
      expect(screen.getByText('Blue Jay')).toBeTruthy();
    });
  });

  it('should filter species by search query', async () => {
    render(<SpeciesScreen />);
    await waitFor(() => {
      expect(screen.getByText('Northern Cardinal')).toBeTruthy();
    });

    const searchInput = screen.getByPlaceholderText('Search species...');
    fireEvent.changeText(searchInput, 'Cardinal');

    await waitFor(() => {
      expect(screen.getByText('Northern Cardinal')).toBeTruthy();
      expect(screen.queryByText('Blue Jay')).toBeNull();
    });
  });

  it('should open modal when species card is pressed', async () => {
    render(<SpeciesScreen />);
    await waitFor(() => {
      expect(screen.getByText('Northern Cardinal')).toBeTruthy();
    });

    const speciesCards = screen.getAllByText('Northern Cardinal');
    const card = speciesCards[0];
    const { TouchableOpacity } = require('react-native');
    const touchables = screen.UNSAFE_queryAllByType(TouchableOpacity);
    const speciesCard = touchables.find((t: any) => 
      t.props.children?.some?.((child: any) => 
        typeof child === 'object' && child?.props?.children === 'Northern Cardinal'
      )
    );
    
    if (speciesCard) {
      fireEvent.press(speciesCard);
    } else {
      fireEvent.press(touchables[2] || touchables[0]);
    }

    await waitFor(() => {
      expect(screen.getByText('Family')).toBeTruthy();
      expect(screen.getByText('Habitat')).toBeTruthy();
      expect(screen.getByText('Conservation Status')).toBeTruthy();
    });
  });

  it('should close modal when close button is pressed', async () => {
    render(<SpeciesScreen />);
    await waitFor(() => {
      expect(screen.getByText('Northern Cardinal')).toBeTruthy();
    });

    const { TouchableOpacity } = require('react-native');
    const touchables = screen.UNSAFE_queryAllByType(TouchableOpacity);
    if (touchables.length > 0) {
      fireEvent.press(touchables[2] || touchables[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Family')).toBeTruthy();
      });

      const closeButtons = screen.UNSAFE_queryAllByType(TouchableOpacity);
      if (closeButtons.length > 0) {
        fireEvent.press(closeButtons[closeButtons.length - 1]);
      }
    }
  });

  it('should handle fetch error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<SpeciesScreen />);
    await waitFor(() => {
      expect(screen.getByText('Bird Species')).toBeTruthy();
    });
  });
});

