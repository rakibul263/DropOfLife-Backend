import arcjet, { shield, detectBot, slidingWindow } from '@arcjet/node';
import { config } from '../config';

export const arcjetClient = config.arcjetKey && !config.arcjetKey.includes('mock')
  ? arcjet({
      key: config.arcjetKey,
      rules: [
        // Protect against SQL Injection, XSS, and common CVE attacks
        shield({
          mode: 'LIVE',
        }),
        // Automated malicious bot protection
        detectBot({
          mode: 'LIVE',
          allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW'],
        }),
        // Sliding window rate limiter (120 requests per minute)
        slidingWindow({
          mode: 'LIVE',
          interval: '60s',
          max: 120,
        }),
      ],
    })
  : null;
