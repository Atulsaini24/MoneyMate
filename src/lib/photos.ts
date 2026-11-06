/**
 * Real photographs for savings goals, served by Unsplash's image CDN (free to
 * use under the Unsplash License). Picked by the goal's name first ("Goa
 * trip" gets a beach), then by its icon.
 *
 * Every <Photo> falls back to a coloured cover if an image fails to load, so a
 * missing photo never shows a broken-image box.
 */
const U = (id: string, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

const BY_NAME: [RegExp, string][] = [
  [/goa|beach|maldives|bali|andaman|island/i, '1507525428034-b723cf961d3e'],
  [/ladakh|manali|himalaya|trek|mountain|leh|kashmir|switzerland/i, '1506905925346-21bda4d32df4'],
  [/paris|europe|france/i, '1502602898657-3e91760cbb34'],
  [/japan|tokyo|kyoto/i, '1493976040374-85c8e12f0c0e'],
  [/iphone|phone|pixel|galaxy/i, '1511707171634-5f897ff02aa9'],
  [/macbook|laptop|computer|pc\b/i, '1496181133206-80ce9b88a853'],
  [/wedding|shaadi|marriage/i, '1519741497674-611481863552'],
  [/house|home|flat|apartment|down\s*payment/i, '1512917774080-9991f1c4c750'],
  [/car\b|tesla|creta|nexon|thar/i, '1494976388531-d1058494cdd8'],
  [/bike|royal\s*enfield|motorcycle|scooter/i, '1558981806-ec527fa84c39'],
  [/camera|dslr|lens/i, '1516035069371-29a1b244cc32'],
  [/ps5|playstation|xbox|gaming|console/i, '1550745165-9bc0b252726f'],
];

const BY_ICON: Record<string, string> = {
  ShieldCheck: '1579621970563-ebec7560ff3e',
  PiggyBank: '1579621970563-ebec7560ff3e',
  Target: '1579621970563-ebec7560ff3e',
  Plane: '1507525428034-b723cf961d3e',
  House: '1512917774080-9991f1c4c750',
  Car: '1494976388531-d1058494cdd8',
  Bike: '1558981806-ec527fa84c39',
  Smartphone: '1511707171634-5f897ff02aa9',
  Laptop: '1496181133206-80ce9b88a853',
  Camera: '1516035069371-29a1b244cc32',
  Gamepad2: '1550745165-9bc0b252726f',
  GraduationCap: '1523050854058-8df90110c9f1',
  Gem: '1519741497674-611481863552',
  Baby: '1555252333-9f8e92e65df9',
  HeartPulse: '1505751172876-fa1923c5c528',
  Gift: '1513885535751-8b9238bd345a',
  Sofa: '1555041469-a586c61ea9bc',
};

export function goalPhoto(name: string, icon: string, width = 900): string | null {
  const byName = BY_NAME.find(([re]) => re.test(name))?.[1];
  const id = byName || BY_ICON[icon];
  return id ? U(id, width) : null;
}
