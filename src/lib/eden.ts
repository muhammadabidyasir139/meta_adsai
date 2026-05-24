import { edenTreaty } from '@elysiajs/eden';
// We would import the type of our app here once it's more developed
// For now, we'll use a generic or any to get the structure ready

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return window.location.origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
};

export const api = edenTreaty<any>(getBaseUrl());
