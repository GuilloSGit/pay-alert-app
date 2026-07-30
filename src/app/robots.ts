import type { MetadataRoute } from 'next'

const BASE_URL = 'https://pay-alert.com.ar'

const DISALLOW = [
  '/dashboard',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/invitations',
  '/onboarding',
  '/suscripcion/resultado',
  '/api',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Buscadores tradicionales + crawlers de asistentes IA
      {
        userAgent: [
          '*',
          'GPTBot',
          'ChatGPT-User',
          'OAI-SearchBot',
          'ClaudeBot',
          'anthropic-ai',
          'Claude-Web',
          'PerplexityBot',
          'Perplexity-User',
          'Google-Extended',
          'Applebot-Extended',
          'Bingbot',
          'CCBot',
        ],
        allow: '/',
        disallow: DISALLOW,
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
