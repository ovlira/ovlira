import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config.js';

export default defineConfig(baseConfig, {
  testMatch: '**/component-visual.review.ts',
});
