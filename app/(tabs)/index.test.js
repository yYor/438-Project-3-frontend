//import '@testing-library/jest-dom/extend-expect';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import HomeScreen from './index.tsx';

test('test for tests', () => {
  render(<HomeScreen />);
  expect(screen.getByText('Track your favorite birds')).toBeInTheDocument();
});