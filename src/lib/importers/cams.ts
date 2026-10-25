/**
 * Mutual-fund holdings from a CAMS / KFintech Consolidated Account Statement (CAS) PDF.
 * The CAS is password-protected (usually your PAN in capitals).
 */
export interface Holding { name: string; value: number; units: number; folio?: string }

export function parseCasLines(lines: string[]): Holding[] {
  const out: Holding[] = [];
  let scheme = '', folio = '';
  for (const raw of lines) {
    const line = raw.replace(/\s+/g, ' ').trim();
    const f = line.match(/Folio No\s*:?\s*([\w/ ]+?)(?:\s{2,}|\s+PAN|$)/i);
    if (f) folio = f[1].trim();
    if (/(fund|scheme|plan|etf)/i.test(line) && /(growth|idcw|dividend|direct|regular)/i.test(line) && !/closing unit|market value|nav on/i.test(line)) {
      scheme = line
        .replace(/^[A-Z0-9]{2,10}\s*-\s*/, '')          // scheme code
        .replace(/\(\s*(advisor|non-demat|demat|formerly)[^)]*\)/gi, '')
        .replace(/-?\s*ISIN\s*:?\s*\w+.*$/i, '')
        .replace(/Registrar\s*:.*$/i, '')
        .replace(/\s+/g, ' ').replace(/[-\s]+$/, '').trim();
    }
    const mv = line.match(/Market Value on [^:]*:\s*(?:INR|Rs\.?)?\s*([\d,]+\.?\d*)/i);
    if (mv && scheme) {
      const units = line.match(/Closing Unit Balance\s*:?\s*([\d,]+\.?\d*)/i);
      const value = parseFloat(mv[1].replace(/,/g, ''));
      if (value > 0) out.push({ name: scheme, value, units: units ? parseFloat(units[1].replace(/,/g, '')) : 0, folio: folio || undefined });
      scheme = '';
    }
  }
  return out;
}
