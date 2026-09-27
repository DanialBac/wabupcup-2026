import { Request, Response } from 'express';
import { Database } from './db';
import { MatchItem, CategoryDetail } from '../src/types';

/**
 * Escapes characters for safe inclusion in XML documents
 */
function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Normalizes and determines the public base URL of the incoming request
 */
export function getBaseUrl(req: Request): string {
  // 1. Check environment variable override
  if (process.env.APP_URL && process.env.APP_URL.trim() !== '') {
    return process.env.APP_URL.trim().replace(/\/+$/, '');
  }

  // 2. Check standard proxy headers (Cloud Run, Vercel, Nginx, Cloudflare)
  const forwardedProto = (req.headers['x-forwarded-proto'] as string) || '';
  const proto = forwardedProto.split(',')[0].trim() || req.protocol || 'https';
  const forwardedHost = (req.headers['x-forwarded-host'] as string) || '';
  const host = forwardedHost.split(',')[0].trim() || req.get('host') || 'localhost:3000';

  return `${proto}://${host}`.replace(/\/+$/, '');
}

/**
 * Parses and converts dates to valid W3C Datetime format for XML sitemaps
 */
function toW3CDate(dateStr?: string): string {
  if (!dateStr) return new Date().toISOString();
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  } catch {
    // fallback
  }
  return new Date().toISOString();
}

/**
 * Generates dynamic XML Sitemap containing Landing Page, Standings (Klasemen),
 * and all Public Tournament Matches with rich metadata and image references.
 */
export async function generateSitemapXml(baseUrl: string): Promise<string> {
  const [config, categories, matches] = await Promise.all([
    Database.getConfig().catch(() => null),
    Database.getCategories().catch(() => [] as CategoryDetail[]),
    Database.getMatches().catch(() => [] as MatchItem[]),
  ]);

  const nowIso = new Date().toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:xhtml="http://www.w3.org/1999/xhtml"\n`;
  xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  // 1. LANDING PAGE (Root /)
  xml += `  <!-- 1. LANDING PAGE -->\n`;
  xml += `  <url>\n`;
  xml += `    <loc>${escapeXml(`${baseUrl}/`)}</loc>\n`;
  xml += `    <lastmod>${nowIso}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>1.0</priority>\n`;
  if (config?.wabupLogoUrl) {
    const logoUrl = config.wabupLogoUrl.startsWith('/') ? `${baseUrl}${config.wabupLogoUrl}` : config.wabupLogoUrl;
    if (logoUrl.startsWith('http')) {
      xml += `    <image:image>\n`;
      xml += `      <image:loc>${escapeXml(logoUrl)}</image:loc>\n`;
      xml += `      <image:title>${escapeXml(config.name || 'WabupCup 2026')}</image:title>\n`;
      xml += `    </image:image>\n`;
    }
  }
  xml += `  </url>\n\n`;

  // 2. STANDINGS (KLASEMEN) - Main Standings Page
  xml += `  <!-- 2. STANDINGS (KLASEMEN & STATISTIK) -->\n`;
  xml += `  <url>\n`;
  xml += `    <loc>${escapeXml(`${baseUrl}/klasemen`)}</loc>\n`;
  xml += `    <lastmod>${nowIso}</lastmod>\n`;
  xml += `    <changefreq>hourly</changefreq>\n`;
  xml += `    <priority>0.9</priority>\n`;
  xml += `  </url>\n`;

  // Standings per Tournament Category (SD, SMP, SMA, INSTANSI, UMUM, DESA, etc.)
  if (Array.isArray(categories) && categories.length > 0) {
    for (const cat of categories) {
      if (!cat?.id) continue;
      const catUrl = `${baseUrl}/klasemen?category=${encodeURIComponent(cat.id)}`;
      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(catUrl)}</loc>\n`;
      xml += `    <lastmod>${nowIso}</lastmod>\n`;
      xml += `    <changefreq>hourly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }
  }
  xml += `\n`;

  // 3. PUBLIC TOURNAMENT MATCHES
  xml += `  <!-- 3. PUBLIC TOURNAMENT MATCHES -->\n`;
  if (Array.isArray(matches) && matches.length > 0) {
    for (const match of matches) {
      if (!match?.id) continue;

      const matchUrl = `${baseUrl}/match/${encodeURIComponent(match.id)}`;
      const matchLastMod = toW3CDate(match.date);

      // Dynamically tune change frequency and search index priority based on live match status
      let changefreq = 'weekly';
      let priority = '0.6';

      if (match.status === 'LIVE') {
        changefreq = 'always';
        priority = '0.9';
      } else if (match.status === 'UPCOMING') {
        changefreq = 'hourly';
        priority = '0.8';
      } else if (match.status === 'FINISHED') {
        changefreq = 'weekly';
        priority = '0.7';
      }

      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(matchUrl)}</loc>\n`;
      xml += `    <lastmod>${matchLastMod}</lastmod>\n`;
      xml += `    <changefreq>${changefreq}</changefreq>\n`;
      xml += `    <priority>${priority}</priority>\n`;

      // Include Team A logo if available
      if (match.teamA?.logo && typeof match.teamA.logo === 'string') {
        const logoA = match.teamA.logo.startsWith('/') ? `${baseUrl}${match.teamA.logo}` : match.teamA.logo;
        if (logoA.startsWith('http')) {
          xml += `    <image:image>\n`;
          xml += `      <image:loc>${escapeXml(logoA)}</image:loc>\n`;
          xml += `      <image:title>${escapeXml(`Logo ${match.teamA.name || 'Tim A'}`)}</image:title>\n`;
          xml += `    </image:image>\n`;
        }
      }

      // Include Team B logo if available
      if (match.teamB?.logo && typeof match.teamB.logo === 'string') {
        const logoB = match.teamB.logo.startsWith('/') ? `${baseUrl}${match.teamB.logo}` : match.teamB.logo;
        if (logoB.startsWith('http')) {
          xml += `    <image:image>\n`;
          xml += `      <image:loc>${escapeXml(logoB)}</image:loc>\n`;
          xml += `      <image:title>${escapeXml(`Logo ${match.teamB.name || 'Tim B'}`)}</image:title>\n`;
          xml += `    </image:image>\n`;
        }
      }

      xml += `  </url>\n`;
    }
  }

  xml += `</urlset>`;
  return xml;
}

/**
 * Express handler for GET /sitemap.xml
 */
export async function sitemapHandler(req: Request, res: Response) {
  try {
    const baseUrl = getBaseUrl(req);
    const xml = await generateSitemapXml(baseUrl);

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    // Cache for 10 minutes in browser, 30 minutes in CDN, while allowing revalidation
    res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=1800');
    res.setHeader('X-Robots-Tag', 'noindex, follow');
    res.send(xml);
  } catch (err: any) {
    console.error('[Sitemap] Error generating sitemap.xml:', err);
    res.status(500).setHeader('Content-Type', 'text/plain').send('Error generating dynamic sitemap.xml');
  }
}

/**
 * Express handler for GET /robots.txt
 */
export function robotsHandler(req: Request, res: Response) {
  const baseUrl = getBaseUrl(req);
  const robots = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api/',
    '',
    `Sitemap: ${baseUrl}/sitemap.xml`,
    '',
  ].join('\n');

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(robots);
}
