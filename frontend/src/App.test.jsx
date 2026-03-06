// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App.jsx';

describe('App component', () => {
  it('renders login page when not authenticated', () => {
    render(<App />);
    // expect login button or title to be in document
    const loginButton = screen.getByText(/sign in|登录/i);
    expect(loginButton).toBeInTheDocument();
  });
});