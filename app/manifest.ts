import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Content Machine — AI Media System',
    short_name: 'Content Machine',
    description: 'Одна идея → полноценная контент-система за секунды',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#08080F',
    theme_color: '#7C3AED',
    orientation: 'portrait-primary',
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'Новая идея',
        short_name: 'Новая идея',
        description: 'Создать новую идею с нуля',
        url: '/',
      },
      {
        name: 'Мои идеи',
        short_name: 'Мои идеи',
        description: 'Открыть архив сохранённых идей',
        url: '/?openIdeas=1',
      },
    ],
    categories: ['productivity'],
  }
}
