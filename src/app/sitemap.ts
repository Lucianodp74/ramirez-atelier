import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://ramirezatelier.it';
  return [
    { url: baseUrl, changeFrequency: 'monthly', priority: 1 },
    { url: `${baseUrl}/progetti`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/cookie-policy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/termini-e-condizioni`, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
