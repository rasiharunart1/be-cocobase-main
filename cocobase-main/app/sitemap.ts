import type { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://cocobase.vercel.app',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },

    {
      url: 'https://cocobase.vercel.app/produk',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },

    {
      url: 'https://cocobase.vercel.app/cocoblog',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },

  ]
}