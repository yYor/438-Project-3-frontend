import { getMarkerColor, formatTimeAgo, type Sighting } from '@/utils/sighting';

describe('Sighting Utilities', () => {
  describe('getMarkerColor', () => {
    it('should return green for sightings from today or yesterday', () => {
      const todaySighting: Sighting = {
        id: 1,
        species: 'Test Bird',
        count: 1,
        location: 'Test Location',
        latitude: 0,
        longitude: 0,
        date: new Date().toISOString(),
      };

      expect(getMarkerColor(todaySighting)).toBe('#4CAF50');
    });

    it('should return green for sightings from yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const yesterdaySighting: Sighting = {
        id: 2,
        species: 'Test Bird',
        count: 1,
        location: 'Test Location',
        latitude: 0,
        longitude: 0,
        date: yesterday.toISOString(),
      };

      expect(getMarkerColor(yesterdaySighting)).toBe('#4CAF50');
    });

    it('should return blue for sightings from this week (2-7 days ago)', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const weekSighting: Sighting = {
        id: 3,
        species: 'Test Bird',
        count: 1,
        location: 'Test Location',
        latitude: 0,
        longitude: 0,
        date: threeDaysAgo.toISOString(),
      };

      expect(getMarkerColor(weekSighting)).toBe('#2196F3');
    });

    it('should return orange for older sightings (more than 7 days)', () => {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      const oldSighting: Sighting = {
        id: 4,
        species: 'Test Bird',
        count: 1,
        location: 'Test Location',
        latitude: 0,
        longitude: 0,
        date: tenDaysAgo.toISOString(),
      };

      expect(getMarkerColor(oldSighting)).toBe('#FF9800');
    });
  });

  describe('formatTimeAgo', () => {
    it('should return "Today" for today\'s date', () => {
      const today = new Date().toISOString();
      expect(formatTimeAgo(today)).toBe('Today');
    });

    it('should return "Yesterday" for yesterday\'s date', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(formatTimeAgo(yesterday.toISOString())).toBe('Yesterday');
    });

    it('should return "X days ago" for dates 2+ days ago', () => {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      expect(formatTimeAgo(fiveDaysAgo.toISOString())).toBe('5 days ago');
    });

    it('should handle edge case of exactly 2 days ago', () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      expect(formatTimeAgo(twoDaysAgo.toISOString())).toBe('2 days ago');
    });
  });
});

