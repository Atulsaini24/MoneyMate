/**
 * Recognises well-known merchants from a transaction description and returns
 * their real brand mark (from Simple Icons, CC0) and brand colour.
 *
 * Brands Simple Icons doesn't carry (Amazon, Flipkart, Ola…) get a monogram
 * in their own brand colour instead of a made-up logo.
 *
 * Named imports only, so the bundle carries just these ~60 marks.
 */
import {
  siSwiggy, siZomato, siUber, siUbereats, siNetflix, siSpotify, siAirtel, siJio, siYoutube, siYoutubemusic,
  siApple, siApplemusic, siGoogle, siGooglepay, siPhonepe, siPaytm, siStarbucks, siMcdonalds, siKfc, siBurgerking,
  siAirbnb, siBookmyshow, siZara, siNike, siAdidas, siPuma, siUniqlo, siIkea, siBigbasket, siDunzo, siIndigo,
  siAirindia, siAirasia, siOyo, siVisa, siMastercard, siAmericanexpress, siHdfcbank, siIcicibank, siAxisbank,
  siZerodha, siUdemy, siCoursera, siByjus, siUnacademy, siShell, siSamsung, siWhatsapp, siInstagram, siSteam,
  siPlaystation, siNotion, siFigma, siDropbox, siIcloud, siGooglegemini, siClaude, siDuolingo, siTinder,
  siOneplus, siXiaomi, siLyft, siDiscord, siTata, siCocacola,
} from 'simple-icons';

export interface Brand {
  name: string;
  /** Brand colour as #RRGGBB */
  color: string;
  /** SVG path in a 24×24 box, when we have the real mark */
  path?: string;
  /** Monogram for brands without a mark */
  letter?: string;
}

type SI = { title: string; hex: string; path: string };
const si = (icon: SI, name = icon.title): Brand => ({ name, color: `#${icon.hex}`, path: icon.path });
const mono = (name: string, color: string, letter = name[0]): Brand => ({ name, color, letter });

/** Ordered: the first pattern that matches wins, so specific names sit above generic ones. */
const RULES: [RegExp, Brand][] = [
  [/swiggy|instamart/i, si(siSwiggy)],
  [/zomato/i, si(siZomato)],
  [/uber\s*eats/i, si(siUbereats)],
  [/\buber\b/i, si(siUber)],
  [/\bola\b|olacabs/i, mono('Ola', '#1C1C1C', 'O')],
  [/rapido/i, mono('Rapido', '#F9C933', 'R')],
  [/\blyft\b/i, si(siLyft)],
  [/netflix/i, si(siNetflix)],
  [/youtube\s*music/i, si(siYoutubemusic)],
  [/youtube|yt premium/i, si(siYoutube)],
  [/spotify/i, si(siSpotify)],
  [/apple\s*music/i, si(siApplemusic)],
  [/icloud/i, si(siIcloud)],
  [/\bapple\b|app\s*store|itunes/i, si(siApple)],
  [/prime\s*video|amazon|amzn/i, mono('Amazon', '#FF9900', 'a')],
  [/hotstar|disney/i, mono('Hotstar', '#0F1014', 'H')],
  [/flipkart/i, mono('Flipkart', '#2874F0', 'F')],
  [/myntra/i, mono('Myntra', '#FF3F6C', 'M')],
  [/ajio/i, mono('AJIO', '#2C4152', 'A')],
  [/nykaa/i, mono('Nykaa', '#FC2779', 'N')],
  [/meesho/i, mono('Meesho', '#9F2089', 'M')],
  [/blinkit|grofers/i, mono('Blinkit', '#F8CB46', 'b')],
  [/zepto/i, mono('Zepto', '#5E17EB', 'Z')],
  [/big\s*basket|bbdaily/i, si(siBigbasket, 'BigBasket')],
  [/dunzo/i, si(siDunzo)],
  [/d-?mart/i, mono('DMart', '#0A8F3C', 'D')],
  [/starbucks/i, si(siStarbucks)],
  [/mc\s*donald|mcd\b/i, si(siMcdonalds, 'McDonald’s')],
  [/\bkfc\b/i, si(siKfc)],
  [/burger\s*king/i, si(siBurgerking)],
  [/domino/i, mono('Domino’s', '#006491', 'D')],
  [/pizza\s*hut/i, mono('Pizza Hut', '#C8102E', 'P')],
  [/chaayos|chai\s*point/i, mono('Chai', '#2E7D32', 'C')],
  [/airbnb/i, si(siAirbnb)],
  [/\boyo\b/i, si(siOyo)],
  [/indigo|6e\d/i, si(siIndigo, 'IndiGo')],
  [/air\s*india/i, si(siAirindia)],
  [/air\s*asia/i, si(siAirasia)],
  [/irctc|indian\s*rail/i, mono('IRCTC', '#1E3A8A', 'R')],
  [/make\s*my\s*trip|mmt\b/i, mono('MakeMyTrip', '#E7272D', 'm')],
  [/bookmyshow|bms\b/i, si(siBookmyshow)],
  [/pvr|inox/i, mono('PVR INOX', '#1A1A1A', 'P')],
  [/\bzara\b/i, si(siZara)],
  [/\bnike\b/i, si(siNike)],
  [/adidas/i, si(siAdidas)],
  [/\bpuma\b/i, si(siPuma)],
  [/uniqlo/i, si(siUniqlo)],
  [/ikea/i, si(siIkea)],
  [/\bh&m\b|\bhm\b/i, mono('H&M', '#E50010', 'H')],
  [/decathlon/i, mono('Decathlon', '#0082C3', 'D')],
  [/croma/i, mono('Croma', '#00A19B', 'C')],
  [/samsung/i, si(siSamsung)],
  [/oneplus/i, si(siOneplus)],
  [/xiaomi|\bmi\b|redmi/i, si(siXiaomi)],
  [/airtel/i, si(siAirtel)],
  [/\bjio\b|reliance\s*jio/i, si(siJio)],
  [/\bvi\b|vodafone|\bidea\s*(prepaid|postpaid|recharge)/i, mono('Vi', '#EE2A24', 'V')],
  [/\btata\b(?!\s*1mg)|tanishq/i, si(siTata)],
  [/google\s*pay|gpay/i, si(siGooglepay)],
  [/phone\s*pe/i, si(siPhonepe)],
  [/paytm/i, si(siPaytm)],
  [/\bcred\b/i, mono('CRED', '#1B1B1B', 'C')],
  [/gemini/i, si(siGooglegemini)],
  [/google/i, si(siGoogle)],
  [/claude|anthropic/i, si(siClaude)],
  [/chatgpt|openai/i, mono('ChatGPT', '#10A37F', 'G')],
  [/notion/i, si(siNotion)],
  [/figma/i, si(siFigma)],
  [/dropbox/i, si(siDropbox)],
  [/duolingo/i, si(siDuolingo)],
  [/tinder/i, si(siTinder)],
  [/discord/i, si(siDiscord)],
  [/whatsapp/i, si(siWhatsapp)],
  [/instagram/i, si(siInstagram)],
  [/steam/i, si(siSteam)],
  [/playstation|\bpsn\b/i, si(siPlaystation)],
  [/zerodha/i, si(siZerodha)],
  [/groww/i, mono('Groww', '#00B386', 'G')],
  [/hdfc/i, si(siHdfcbank, 'HDFC Bank')],
  [/icici/i, si(siIcicibank, 'ICICI Bank')],
  [/axis/i, si(siAxisbank, 'Axis Bank')],
  [/\bsbi\b|state bank/i, mono('SBI', '#22409A', 'S')],
  [/kotak/i, mono('Kotak', '#ED1C24', 'K')],
  [/udemy/i, si(siUdemy)],
  [/coursera/i, si(siCoursera)],
  [/byju/i, si(siByjus, 'BYJU’S')],
  [/unacademy/i, si(siUnacademy)],
  [/cult\.?fit|cure\.?fit/i, mono('cult.fit', '#FF3278', 'c')],
  [/apollo/i, mono('Apollo', '#0B6FB8', 'A')],
  [/pharmeasy/i, mono('PharmEasy', '#10847E', 'P')],
  [/1mg|tata\s*1mg/i, mono('Tata 1mg', '#FF6F61', '1')],
  [/practo/i, mono('Practo', '#14BEF0', 'P')],
  [/lenskart/i, mono('Lenskart', '#000042', 'L')],
  [/\bshell\b/i, si(siShell)],
  [/indian\s*oil|iocl/i, mono('IndianOil', '#F37022', 'I')],
  [/bharat\s*petroleum|\bbpcl\b/i, mono('BPCL', '#0055A4', 'B')],
  [/coca[\s-]*cola|coke/i, si(siCocacola)],
];

const cache = new Map<string, Brand | null>();

/** The brand behind a description, or null when it's not a merchant we know. */
export function brandFor(description: string | undefined | null): Brand | null {
  const key = (description || '').trim();
  if (!key) return null;
  if (cache.has(key)) return cache.get(key)!;
  const hit = RULES.find(([re]) => re.test(key))?.[1] || null;
  cache.set(key, hit);
  return hit;
}

/** Card-network and wallet marks for payment methods. */
export const PAYMENT_BRANDS = {
  visa: si(siVisa), mastercard: si(siMastercard), amex: si(siAmericanexpress),
  gpay: si(siGooglepay), phonepe: si(siPhonepe), paytm: si(siPaytm),
};

/** Relative luminance, so a glyph on a yellow tile is dark and on navy is white. */
export function isLight(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.42;
}

/** Popular merchants offered as one-tap chips when adding an expense. */
export const QUICK_MERCHANTS: { description: string; category: string }[] = [
  { description: 'Swiggy', category: 'Food & Dining' },
  { description: 'Zomato', category: 'Food & Dining' },
  { description: 'Blinkit', category: 'Food & Dining' },
  { description: 'Uber', category: 'Transport' },
  { description: 'Amazon', category: 'Shopping' },
  { description: 'Netflix', category: 'Entertainment' },
  { description: 'Spotify', category: 'Entertainment' },
  { description: 'Airtel', category: 'Bills & Utilities' },
];
