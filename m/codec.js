/*
 * RasoiOne menu QR + order QR format — shared by the app and the rasoione.shop menu page.
 * (website/m/codec.js is a byte-for-byte copy made by website/build.mjs; a test checks they match.)
 *
 * MENU QR (free, no server, no API):
 *   The whole menu travels INSIDE the QR link, after "#", compressed:
 *     https://rasoione.shop/m/#t=T4&p=1/2&d=<base64url(deflate(menu))>
 *   The "#…" part never leaves the customer's phone — the website is a plain static page that only
 *   draws what is in the link. So there is nothing to host per shop, nothing to update online,
 *   and it costs the same at 10 scans or 1 crore scans: ₹0.
 *   Big menus are split into parts (one QR per group of categories) so each QR stays easy to scan.
 *
 * ORDER QR (no WhatsApp, no internet needed to send):
 *   The customer picks items on that page; the page shows an Order QR on their screen.
 *   The waiter scans it with RasoiOne (phone camera, or a USB scanner on the computer) → exact bill.
 *     RO2|<shopTag>|<table>|<itemId>:<qty>[:<variantIndex>],…|<name>|<note>
 *   The order is physically shown to staff, so nobody outside the shop can place or change an order,
 *   and the app always uses its OWN prices.
 *
 * Plain JavaScript, no imports: the caller passes in pako (deflate library).
 */

export const MENU_VERSION = 1;
export const PART_LIMIT = 1150; // characters of compressed data per QR (≈ QR version 25, scannable at 7 cm)

// Words that appear on most Indian menus — given to deflate as a dictionary so short menus compress well.
const DICT = [
  'Paneer', 'Chicken', 'Mutton', 'Egg', 'Veg', 'Masala', 'Tikka', 'Butter', 'Tandoori', 'Kadai', 'Handi', 'Dal', 'Tadka', 'Fry', 'Fried', 'Rice',
  'Jeera', 'Biryani', 'Pulao', 'Roti', 'Naan', 'Kulcha', 'Paratha', 'Chapati', 'Garlic', 'Plain', 'Special', 'Thali', 'Combo', 'Noodles', 'Hakka',
  'Schezwan', 'Manchurian', 'Chilli', 'Soup', 'Momos', 'Steam', 'Spring Roll', 'Burger', 'Sandwich', 'Grilled', 'Cheese', 'Pizza', 'Fries', 'Pasta',
  'Chai', 'Tea', 'Coffee', 'Cold', 'Hot', 'Lassi', 'Shake', 'Juice', 'Lime', 'Soda', 'Water', 'Bottle', 'Sweet', 'Salted', 'Kulfi', 'Ice Cream',
  'Gulab Jamun', 'Rasgulla', 'Jalebi', 'Halwa', 'Kheer', 'Barfi', 'Ladoo', 'Samosa', 'Kachori', 'Vada Pav', 'Pav Bhaji', 'Misal', 'Poha', 'Upma',
  'Idli', 'Dosa', 'Uttapam', 'Medu Vada', 'Sambar', 'Chutney', 'Pani Puri', 'Bhel', 'Sev Puri', 'Chaat', 'Aloo', 'Gobi', 'Mix', 'Bhurji',
  'Cake', 'Pastry', 'Chocolate', 'Vanilla', 'Black Forest', 'Pineapple', 'Red Velvet', 'Cookies', 'Bread', 'Half', 'Full', 'Small', 'Medium',
  'Large', 'Regular', 'Plate', 'Piece', 'Starters', 'Main Course', 'Breads', 'Drinks', 'Desserts', 'Snacks', 'Beverages', 'Chinese', 'South Indian',
].join(' ');
// Self-contained UTF-8 and base64url (no TextEncoder/atob needed — works on every phone engine).
function utf8(str) {
  const out = [];
  for (const ch of String(str)) {
    let c = ch.codePointAt(0);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return new Uint8Array(out);
}
function fromUtf8(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length;) {
    const b = bytes[i];
    let c;
    if (b < 0x80) { c = b; i += 1; }
    else if (b < 0xe0) { c = ((b & 31) << 6) | (bytes[i + 1] & 63); i += 2; }
    else if (b < 0xf0) { c = ((b & 15) << 12) | ((bytes[i + 1] & 63) << 6) | (bytes[i + 2] & 63); i += 3; }
    else { c = ((b & 7) << 18) | ((bytes[i + 1] & 63) << 12) | ((bytes[i + 2] & 63) << 6) | (bytes[i + 3] & 63); i += 4; }
    s += String.fromCodePoint(c);
  }
  return s;
}
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function toB64url(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8) | (bytes[i + 2] || 0);
    s += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (i + 1 < bytes.length ? B64[(n >> 6) & 63] : '') + (i + 2 < bytes.length ? B64[n & 63] : '');
  }
  return s;
}
function fromB64url(str) {
  const clean = String(str).replace(/[^A-Za-z0-9\-_]/g, '');
  const out = [];
  for (let i = 0; i < clean.length; i += 4) {
    const n = (B64.indexOf(clean[i]) << 18) | (B64.indexOf(clean[i + 1]) << 12) | ((i + 2 < clean.length ? B64.indexOf(clean[i + 2]) : 0) << 6) | (i + 3 < clean.length ? B64.indexOf(clean[i + 3]) : 0);
    out.push((n >> 16) & 255);
    if (i + 2 < clean.length) out.push((n >> 8) & 255);
    if (i + 3 < clean.length) out.push(n & 255);
  }
  return new Uint8Array(out);
}
const dictBytes = () => utf8(DICT);

export function createCodec(pako) {
  const pack = (obj) => toB64url(pako.deflateRaw(utf8(JSON.stringify(obj)), { level: 9, dictionary: dictBytes() }));
  const unpack = (str) => {
    const raw = pako.inflateRaw(fromB64url(str), { dictionary: dictBytes() });
    if (!raw) throw new Error('This QR is damaged or incomplete. Please scan again.');
    return JSON.parse(fromUtf8(raw));
  };

  /**
   * menu: { shop:{name, tag}, categories:[{id,name}], items:[{id,name,price,category_id,sell_by,variants:[{name,price}]}], offers:[string] }
   * → [ 'data', 'data', … ] one per QR (categories kept whole; a single giant category is split by items)
   */
  function encodeMenu(menu) {
    const avail = (menu.items || []).filter((i) => i.status == null || i.status === 'available');
    const cats = (menu.categories || []).map((c) => ({ c, items: avail.filter((i) => i.category_id === c.id) })).filter((x) => x.items.length);
    const loose = avail.filter((i) => !(menu.categories || []).some((c) => c.id === i.category_id));
    if (loose.length) cats.push({ c: { id: 0, name: 'Menu' }, items: loose });
    const row = (i) => {
      const r = [i.id, i.name, Number(i.price)];
      const v = (i.variants || []).map((x) => [x.name, Number(x.price)]);
      if (v.length || i.sell_by === 'kg') r.push(v);
      if (i.sell_by === 'kg') r.push(1);
      return r;
    };
    const head = (first) => ({ v: MENU_VERSION, n: menu.shop?.name || '', s: menu.shop?.tag || '', ...(first && menu.offers?.length ? { o: menu.offers.slice(0, 5) } : {}) });
    const parts = [];
    let cur = [];
    const flush = () => { if (cur.length) { parts.push(cur); cur = []; } };
    for (const { c, items } of cats) {
      const block = [c.name, items.map(row)];
      const trial = pack({ ...head(!parts.length), c: [...cur, block] });
      if (trial.length <= PART_LIMIT || !cur.length) {
        cur.push(block);
        // One category too big on its own: cut it into halves until each fits.
        if (pack({ ...head(!parts.length), c: cur }).length > PART_LIMIT && cur.length === 1) {
          cur = [];
          let chunk = [];
          for (const it of items.map(row)) {
            chunk.push(it);
            if (pack({ ...head(!parts.length), c: [[c.name, chunk]] }).length > PART_LIMIT && chunk.length > 1) {
              chunk.pop(); parts.push([[c.name, chunk]]); chunk = [it];
            }
          }
          if (chunk.length) cur = [[c.name, chunk]];
        }
      } else { flush(); cur.push(block); }
    }
    flush();
    if (!parts.length) parts.push([]);
    return parts.map((c, i) => pack({ ...head(i === 0), c }));
  }

  /** → { name, tag, offers, categories:[{name, items:[{id,name,price,variants:[{name,price}],kg}]}] } */
  function decodeMenu(data) {
    const m = unpack(data);
    if (!m || m.v !== MENU_VERSION) throw new Error('This menu QR is from a newer RasoiOne. Please update the page.');
    return {
      name: m.n || '', tag: m.s || '', offers: m.o || [],
      categories: (m.c || []).map(([name, rows]) => ({ name, items: rows.map(([id, n, price, v, kg]) => ({ id, name: n, price, variants: (v || []).map(([vn, vp]) => ({ name: vn, price: vp })), kg: !!kg })) })),
    };
  }

  return { encodeMenu, decodeMenu };
}

/** Link printed on a table: everything after "#" stays on the customer's phone. */
export function menuLink(base, { table = '', part = 1, of = 1, data }) {
  const q = [table ? `t=${encodeURIComponent(table)}` : '', of > 1 ? `p=${part}/${of}` : '', `d=${data}`].filter(Boolean).join('&');
  return `${String(base).replace(/\/$/, '')}/m/#${q}`;
}

export function parseMenuHash(hash) {
  const out = {};
  for (const kv of String(hash || '').replace(/^#/, '').split('&')) {
    const i = kv.indexOf('=');
    if (i > 0) out[kv.slice(0, i)] = decodeURIComponent(kv.slice(i + 1));
  }
  const [part, of] = (out.p || '1/1').split('/').map(Number);
  return { table: out.t || '', part: part || 1, of: of || 1, data: out.d || '' };
}

const clean = (s, n) => String(s || '').replace(/[|\n\r]/g, ' ').trim().slice(0, n);

/** lines: [{ id, qty, variant: index or -1 }] */
export function encodeOrder({ tag = '', table = '', lines = [], name = '', note = '' }) {
  const items = lines.filter((l) => Number(l.qty) > 0).map((l) => `${l.id}:${Number(l.qty)}${l.variant >= 0 ? `:${l.variant}` : ''}`).join(',');
  return ['RO2', clean(tag, 12), clean(table, 12), items, clean(name, 30), clean(note, 120)].join('|');
}

export function decodeOrder(text) {
  const s = String(text || '').trim();
  if (!s.startsWith('RO2|')) return null;
  const [, tag, table, items, name, note] = s.split('|');
  const lines = String(items || '').split(',').filter(Boolean).map((x) => {
    const [id, qty, v] = x.split(':');
    return { id: Number(id), qty: Number(qty), variant: v === undefined ? -1 : Number(v) };
  }).filter((l) => l.id && l.qty > 0 && l.qty <= 99);
  return { tag: tag || '', table: table || '', lines, name: name || '', note: note || '' };
}
