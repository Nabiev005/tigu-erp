import { setupWorker } from 'msw/browser';
import { browserHandlers } from './handlers';

export const worker = setupWorker(...browserHandlers);
