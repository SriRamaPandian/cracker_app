import { render, screen } from '@testing-library/react';
import App from './App';
import { TextEncoder, TextDecoder } from "util";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

test('renders Crackers Order heading', () => {
  render(<App />);
  const heading = screen.getByText(/Sivakasi Crackers/i);
  expect(heading).toBeInTheDocument();
});
