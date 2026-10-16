/**
 * Hebrew letter and lexicon helpers for the Bible Technology page.
 *
 * Letters are stored as consonants (finals normalised) exactly as the Bereshit
 * Lab engine does it, so the browser demo and the Python engine agree.
 */

export interface Letter {
  char: string;
  name: string;
  hebrewName: string;
  pictograph: string;
  value: number;
  atbash: string;
}

export const LETTERS: Letter[] = [
  { char: "א", name: "Aleph", hebrewName: "אָלֶף", pictograph: "ox / strength / leader", value: 1, atbash: "ת" },
  { char: "ב", name: "Bet", hebrewName: "בֵּית", pictograph: "house / family / inside", value: 2, atbash: "ש" },
  { char: "ג", name: "Gimel", hebrewName: "גִּימֶל", pictograph: "camel / lift up / generosity", value: 3, atbash: "ר" },
  { char: "ד", name: "Dalet", hebrewName: "דָּלֶת", pictograph: "door / pathway", value: 4, atbash: "ק" },
  { char: "ה", name: "He", hebrewName: "הֵא", pictograph: "window / behold / breath", value: 5, atbash: "צ" },
  { char: "ו", name: "Vav", hebrewName: "וָו", pictograph: "nail / hook / and / join", value: 6, atbash: "פ" },
  { char: "ז", name: "Zayin", hebrewName: "זַיִן", pictograph: "weapon / cut / nourish", value: 7, atbash: "ע" },
  { char: "ח", name: "Chet", hebrewName: "חֵית", pictograph: "fence / inner room / life", value: 8, atbash: "ס" },
  { char: "ט", name: "Tet", hebrewName: "טֵית", pictograph: "basket / surround / good", value: 9, atbash: "נ" },
  { char: "י", name: "Yod", hebrewName: "יוֹד", pictograph: "hand / deed / power", value: 10, atbash: "מ" },
  { char: "כ", name: "Kaf", hebrewName: "כַּף", pictograph: "palm / cover / allow", value: 20, atbash: "ל" },
  { char: "ל", name: "Lamed", hebrewName: "לָמֶד", pictograph: "ox-goad / teach / toward", value: 30, atbash: "כ" },
  { char: "מ", name: "Mem", hebrewName: "מֵם", pictograph: "water / chaos / mighty", value: 40, atbash: "י" },
  { char: "נ", name: "Nun", hebrewName: "נוּן", pictograph: "fish / life / continue", value: 50, atbash: "ט" },
  { char: "ס", name: "Samekh", hebrewName: "סָמֶך", pictograph: "prop / support / shield", value: 60, atbash: "ח" },
  { char: "ע", name: "Ayin", hebrewName: "עַיִן", pictograph: "eye / see / fountain", value: 70, atbash: "ז" },
  { char: "פ", name: "Pe", hebrewName: "פֵּא", pictograph: "mouth / speak / open", value: 80, atbash: "ו" },
  { char: "צ", name: "Tsade", hebrewName: "צָדִי", pictograph: "hook / hunt / righteousness", value: 90, atbash: "ה" },
  { char: "ק", name: "Qof", hebrewName: "קוֹף", pictograph: "back of head / holiness", value: 100, atbash: "ד" },
  { char: "ר", name: "Resh", hebrewName: "רֵישׁ", pictograph: "head / first / person", value: 200, atbash: "ג" },
  { char: "ש", name: "Shin", hebrewName: "שִׁין", pictograph: "teeth / consume / fire", value: 300, atbash: "ב" },
  { char: "ת", name: "Tav", hebrewName: "תָּו", pictograph: "mark / covenant / sign", value: 400, atbash: "א" },
];

export const LETTER_BY_CHAR = new Map(LETTERS.map((l) => [l.char, l]));

/** Albam: split the 22-letter alphabet in half and pair across. */
export const ALBAM = (() => {
  const map = new Map<string, string>();
  const half = LETTERS.length / 2;
  for (let i = 0; i < half; i += 1) {
    map.set(LETTERS[i].char, LETTERS[i + half].char);
    map.set(LETTERS[i + half].char, LETTERS[i].char);
  }
  return map;
})();

const FINALS: Record<string, string> = { ך: "כ", ם: "מ", ן: "נ", ף: "פ", ץ: "צ" };

/** Keep consonants only (U+05D0–U+05EA), translate final forms. */
export function toConsonants(input: string): string {
  const stripped = Array.from(input).filter((ch) => {
    const code = ch.codePointAt(0) ?? 0;
    return code >= 0x05d0 && code <= 0x05ea;
  });
  return stripped.map((ch) => FINALS[ch] ?? ch).join("");
}

export function isHebrew(text: string): boolean {
  return /[\u05d0-\u05ea]/.test(text);
}

export function gematria(consonants: string): number {
  return Array.from(consonants).reduce((sum, ch) => sum + (LETTER_BY_CHAR.get(ch)?.value ?? 0), 0);
}

export function atbash(consonants: string): string {
  return Array.from(consonants).map((ch) => LETTER_BY_CHAR.get(ch)?.atbash ?? ch).join("");
}

export function albam(consonants: string): string {
  return Array.from(consonants).map((ch) => ALBAM.get(ch) ?? ch).join("");
}

/* ------------------------------------------------------------------ lexicon */

export interface LexEntry {
  strongs: string;
  cons: string;
  xlit: string;
  gloss: string;
  /** true for single-letter prefixes ב ה ו כ ל מ ש */
  prefix?: boolean;
  /** particles that complete a segmentation but are not headwords */
  particle?: boolean;
}

/**
 * A working subset of the Open Scriptures Strong's lexicon. The full set
 * (~8,674 entries) is compiled into `bible-tech/data/bible.sqlite` by
 * `bible-tech/build_data.py`, which the Bereshit Lab server reads.
 */
export const LEXICON: LexEntry[] = [
  { strongs: "H1254", cons: "ברא", xlit: "bara", gloss: "to create" },
  { strongs: "H1247", cons: "בר", xlit: "bar", gloss: "son (Aramaic)" },
  { strongs: "H7218", cons: "ראש", xlit: "rosh", gloss: "head, first, chief" },
  { strongs: "H7225", cons: "ראשית", xlit: "reshith", gloss: "beginning, firstfruits" },
  { strongs: "H784", cons: "אש", xlit: "esh", gloss: "fire" },
  { strongs: "H7896", cons: "שית", xlit: "shith", gloss: "to set, place, appoint" },
  { strongs: "H7862", cons: "שי", xlit: "shay", gloss: "gift, present" },
  { strongs: "H1004", cons: "בית", xlit: "bayith", gloss: "house, family" },
  { strongs: "H1", cons: "אב", xlit: "ab", gloss: "father" },
  { strongs: "H517", cons: "אם", xlit: "em", gloss: "mother" },
  { strongs: "H216", cons: "אור", xlit: "or", gloss: "light" },
  { strongs: "H120", cons: "אדם", xlit: "adam", gloss: "man, Adam" },
  { strongs: "H127", cons: "אדמה", xlit: "adamah", gloss: "ground, soil" },
  { strongs: "H181", cons: "דם", xlit: "dam", gloss: "blood" },
  { strongs: "H410", cons: "אל", xlit: "el", gloss: "god, mighty one" },
  { strongs: "H430", cons: "אלהימ", xlit: "elohim", gloss: "God, gods" },
  { strongs: "H3220", cons: "ימ", xlit: "yam", gloss: "sea" },
  { strongs: "H3117", cons: "יומ", xlit: "yom", gloss: "day" },
  { strongs: "H4325", cons: "מימ", xlit: "mayim", gloss: "waters" },
  { strongs: "H7549", cons: "רקיע", xlit: "raqia", gloss: "firmament, expanse" },
  { strongs: "H776", cons: "ארצ", xlit: "erets", gloss: "earth, land" },
  { strongs: "H8064", cons: "שמימ", xlit: "shamayim", gloss: "heavens" },
  { strongs: "H2822", cons: "חשכ", xlit: "choshek", gloss: "darkness" },
  { strongs: "H5769", cons: "עולמ", xlit: "olam", gloss: "forever, age" },
  { strongs: "H3820", cons: "לב", xlit: "leb", gloss: "heart" },
  { strongs: "H5315", cons: "נפש", xlit: "nephesh", gloss: "soul, living being" },
  { strongs: "H7307", cons: "רוח", xlit: "ruach", gloss: "spirit, wind, breath" },
  { strongs: "H1697", cons: "דבר", xlit: "dabar", gloss: "word, matter" },
  { strongs: "H5869", cons: "עינ", xlit: "ayin", gloss: "eye, fountain" },
  { strongs: "H3027", cons: "יד", xlit: "yad", gloss: "hand" },
  { strongs: "H1870", cons: "דרכ", xlit: "derek", gloss: "way, road" },
  { strongs: "H4428", cons: "מלכ", xlit: "melek", gloss: "king" },
  { strongs: "H3548", cons: "כהנ", xlit: "kohen", gloss: "priest" },
  { strongs: "H6942", cons: "קדש", xlit: "qadash", gloss: "holy, set apart" },
  { strongs: "H8451", cons: "תורה", xlit: "torah", gloss: "law, instruction" },
  { strongs: "H1285", cons: "ברית", xlit: "berith", gloss: "covenant" },
  { strongs: "H7965", cons: "שלומ", xlit: "shalom", gloss: "peace, wholeness" },
  { strongs: "H2416", cons: "חי", xlit: "chay", gloss: "living, life" },
  { strongs: "H4194", cons: "מות", xlit: "maveth", gloss: "death" },
  { strongs: "H571", cons: "אמת", xlit: "emeth", gloss: "truth, faithfulness" },
  { strongs: "H2617", cons: "חסד", xlit: "chesed", gloss: "mercy, steadfast love" },
  { strongs: "H6664", cons: "צדק", xlit: "tsedeq", gloss: "righteousness" },
  { strongs: "H4941", cons: "משפט", xlit: "mishpat", gloss: "judgment, justice" },
  { strongs: "H3678", cons: "כסא", xlit: "kisse", gloss: "throne" },
  { strongs: "H4397", cons: "מלאכ", xlit: "malak", gloss: "angel, messenger" },
  { strongs: "H5030", cons: "נביא", xlit: "nabi", gloss: "prophet" },
  { strongs: "H1350", cons: "גאל", xlit: "gaal", gloss: "to redeem, kinsman" },
  { strongs: "H3444", cons: "ישועה", xlit: "yeshuah", gloss: "salvation, deliverance" },
  { strongs: "H1588", cons: "גנ", xlit: "gan", gloss: "garden" },
  { strongs: "H5175", cons: "נחש", xlit: "nachash", gloss: "serpent" },
  { strongs: "H6083", cons: "עפר", xlit: "aphar", gloss: "dust" },
  { strongs: "H68", cons: "אבנ", xlit: "eben", gloss: "stone" },
  { strongs: "H2022", cons: "הר", xlit: "har", gloss: "mountain, hill" },
  { strongs: "H4057", cons: "מדבר", xlit: "midbar", gloss: "wilderness, desert" },
  { strongs: "H168", cons: "אהל", xlit: "ohel", gloss: "tent, tabernacle" },
  { strongs: "H4196", cons: "מזבח", xlit: "mizbeach", gloss: "altar" },
  { strongs: "H3899", cons: "לחמ", xlit: "lechem", gloss: "bread, food" },
  { strongs: "H3196", cons: "ינ", xlit: "yayin", gloss: "wine" },
  { strongs: "H8081", cons: "שמנ", xlit: "shemen", gloss: "oil, fatness" },
  { strongs: "H3605", cons: "כל", xlit: "kol", gloss: "all, every" },
  { strongs: "H5647", cons: "עבד", xlit: "abad", gloss: "to serve, work" },
  { strongs: "H8085", cons: "שמע", xlit: "shama", gloss: "to hear, obey" },
  { strongs: "H8104", cons: "שמר", xlit: "shamar", gloss: "to keep, guard" },
  { strongs: "H157", cons: "אהב", xlit: "ahab", gloss: "to love" },
  { strongs: "H3372", cons: "ירא", xlit: "yare", gloss: "to fear, revere" },
  { strongs: "H982", cons: "בטח", xlit: "batach", gloss: "to trust" },
  { strongs: "H1984", cons: "הלל", xlit: "halal", gloss: "to praise, shine" },
  { strongs: "H1288", cons: "ברכ", xlit: "barak", gloss: "to bless, kneel" },
  { strongs: "H7121", cons: "קרא", xlit: "qara", gloss: "to call, proclaim" },
  { strongs: "H7971", cons: "שלח", xlit: "shalach", gloss: "to send, stretch out" },
  { strongs: "H3947", cons: "לקח", xlit: "laqach", gloss: "to take, receive" },
  { strongs: "H5414", cons: "נתנ", xlit: "nathan", gloss: "to give, place" },
  { strongs: "H6213", cons: "עשה", xlit: "asah", gloss: "to do, make" },
  { strongs: "H1961", cons: "היה", xlit: "hayah", gloss: "to be, become" },
  { strongs: "H559", cons: "אמר", xlit: "amar", gloss: "to say, speak" },
  { strongs: "H7200", cons: "ראה", xlit: "raah", gloss: "to see, appear" },
  { strongs: "H3045", cons: "ידע", xlit: "yada", gloss: "to know" },
  { strongs: "H935", cons: "בוא", xlit: "bo", gloss: "to come, enter" },
  { strongs: "H1980", cons: "הלכ", xlit: "halak", gloss: "to walk, go" },
  { strongs: "H3427", cons: "ישב", xlit: "yashab", gloss: "to dwell, sit" },
  { strongs: "H6605", cons: "פתח", xlit: "patach", gloss: "to open" },
  { strongs: "H1129", cons: "בנה", xlit: "banah", gloss: "to build" },
  { strongs: "H3789", cons: "כתב", xlit: "kathab", gloss: "to write" },
  { strongs: "H2450", cons: "חכמ", xlit: "chakam", gloss: "wise" },
  { strongs: "H998", cons: "בינה", xlit: "binah", gloss: "understanding" },
  { strongs: "H1847", cons: "דעת", xlit: "daath", gloss: "knowledge" },
  { strongs: "H530", cons: "אמונה", xlit: "emunah", gloss: "faithfulness, faith" },
  { strongs: "H8605", cons: "תפלה", xlit: "tephillah", gloss: "prayer" },
  { strongs: "H6963", cons: "קול", xlit: "qol", gloss: "voice, sound" },
  { strongs: "H8034", cons: "שמ", xlit: "shem", gloss: "name" },
  { strongs: "H3519", cons: "כבוד", xlit: "kabod", gloss: "glory, weight" },
  { strongs: "H2580", cons: "חנ", xlit: "chen", gloss: "grace, favour" },
  { strongs: "H2091", cons: "זהב", xlit: "zahab", gloss: "gold" },
  { strongs: "H3701", cons: "כספ", xlit: "keseph", gloss: "silver" },
  { strongs: "H6051", cons: "עננ", xlit: "anan", gloss: "cloud" },
  { strongs: "H1653", cons: "גשמ", xlit: "geshem", gloss: "rain" },
  { strongs: "H5146", cons: "נח", xlit: "noach", gloss: "Noah — rest" },
  { strongs: "H8352", cons: "שת", xlit: "sheth", gloss: "Seth" },
  { strongs: "H85", cons: "אברהמ", xlit: "avraham", gloss: "Abraham" },
  { strongs: "H3327", cons: "יצחק", xlit: "yitschaq", gloss: "Isaac" },
  { strongs: "H3290", cons: "יעקב", xlit: "yaaqob", gloss: "Jacob" },
  { strongs: "H3130", cons: "יוספ", xlit: "yosef", gloss: "Joseph" },
  { strongs: "H4872", cons: "משה", xlit: "mosheh", gloss: "Moses" },
  { strongs: "H1732", cons: "דוד", xlit: "dawid", gloss: "David" },
  { strongs: "H4899", cons: "משיח", xlit: "mashiach", gloss: "anointed one, Messiah" },
  { strongs: "H6726", cons: "ציונ", xlit: "tsiyon", gloss: "Zion" },
  { strongs: "H3389", cons: "ירושלמ", xlit: "yerushalayim", gloss: "Jerusalem" },
  { strongs: "H4714", cons: "מצרימ", xlit: "mitsrayim", gloss: "Egypt" },
  { strongs: "H894", cons: "בבל", xlit: "babel", gloss: "Babylon" },
  // Single-letter prefixes are allowed even though they are not headwords.
  { strongs: "H0", cons: "ב", xlit: "be", gloss: "in, with, by (prefix)", prefix: true },
  { strongs: "H0", cons: "ה", xlit: "ha", gloss: "the (prefix)", prefix: true },
  { strongs: "H0", cons: "ו", xlit: "ve", gloss: "and (prefix)", prefix: true },
  { strongs: "H0", cons: "כ", xlit: "ke", gloss: "as, like (prefix)", prefix: true },
  { strongs: "H0", cons: "ל", xlit: "le", gloss: "to, for (prefix)", prefix: true },
  { strongs: "H0", cons: "מ", xlit: "mi", gloss: "from (prefix)", prefix: true },
  { strongs: "H0", cons: "ש", xlit: "she", gloss: "that, which (prefix)", prefix: true },
  { strongs: "H0", cons: "ית", xlit: "-(i)th", gloss: "noun ending (teaching convention)", particle: true },
];

export const LEX_INDEX = (() => {
  const map = new Map<string, LexEntry[]>();
  for (const entry of LEXICON) {
    const list = map.get(entry.cons) ?? [];
    list.push(entry);
    map.set(entry.cons, list);
  }
  return map;
})();

export function lookup(cons: string): LexEntry[] {
  return LEX_INDEX.get(cons) ?? [];
}

/** Consecutive substrings found in the lexicon (the "words inside a word"). */
export function substringHits(cons: string, minLength = 1) {
  const hits: { text: string; start: number; entries: LexEntry[] }[] = [];
  for (let i = 0; i < cons.length; i += 1) {
    for (let len = Math.max(minLength, 1); i + len <= cons.length; len += 1) {
      const text = cons.slice(i, i + len);
      if (len < minLength) continue;
      const entries = LEX_INDEX.get(text);
      if (entries && entries.length) hits.push({ text, start: i, entries });
    }
  }
  return hits;
}

/** Prefixes are allowed to stand alone; particles only complete a segmentation. */
function partsFor(text: string): LexEntry[] | null {
  const entries = LEX_INDEX.get(text);
  if (!entries) return null;
  return entries;
}

/** Every full-cover segmentation of the string, up to `maxParts` pieces. */
export function segmentations(cons: string, maxParts = 4) {
  const results: { parts: LexEntry[]; words: string[] }[] = [];

  function walk(start: number, acc: LexEntry[], words: string[]) {
    if (results.length > 400) return;
    if (start === cons.length) {
      if (acc.length > 1) results.push({ parts: acc, words });
      return;
    }
    if (acc.length >= maxParts) return;

    for (let end = start + 1; end <= cons.length; end += 1) {
      const slice = cons.slice(start, end);
      const entries = partsFor(slice);
      if (!entries) continue;
      for (const entry of entries) {
        // A word must be a real headword or a single-letter prefix.
        if (!entry.prefix && !entry.particle && slice.length === 1) continue;
        walk(end, [...acc, entry], [...words, slice]);
      }
    }
  }

  walk(0, [], []);

  const seen = new Set<string>();
  return results
    .filter((r) => {
      const key = r.words.join("+");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      const strength = (x: typeof a) =>
        x.parts.reduce((n, p) => n + (p.prefix || p.particle ? 0 : 1), 0) - x.parts.length * 0.1;
      return strength(b) - strength(a);
    })
    .slice(0, 24);
}

/* ------------------------------------------------------------------ English */

/** Small KJV vocabulary slice for the English analogue (full set = 12,000+ types). */
export const KJV_VOCAB = new Set([
  "beginning", "begin", "beginnings", "be", "in", "inn", "gin", "ginnings", "inning",
  "god", "created", "create", "earth", "heaven", "heavens", "light", "darkness", "deep",
  "word", "words", "faith", "love", "loved", "hope", "grace", "truth", "life", "living",
  "death", "blood", "priest", "king", "kingdom", "prophet", "angel", "angels", "spirit",
  "heart", "soul", "hand", "hands", "eye", "eyes", "way", "ways", "holy", "holiness",
  "covenant", "peace", "mercy", "righteous", "righteousness", "judgment", "throne",
  "garden", "serpent", "dust", "stone", "stones", "mountain", "wilderness", "altar",
  "bread", "wine", "oil", "hear", "heard", "keep", "kept", "trust", "praise", "bless",
  "blessed", "call", "called", "send", "sent", "take", "took", "give", "gave", "made",
  "make", "say", "said", "see", "saw", "know", "knew", "come", "came", "walk", "walked",
  "open", "opened", "build", "built", "write", "written", "wisdom", "wise", "knowledge",
  "understanding", "prayer", "voice", "name", "glory", "gold", "silver", "cloud", "rain",
]);

export function englishHits(text: string) {
  const clean = text.toLowerCase().replace(/[^a-z]/g, "");
  const hits: { text: string; start: number }[] = [];
  for (let i = 0; i < clean.length; i += 1) {
    for (let end = i + 2; end <= clean.length; end += 1) {
      const slice = clean.slice(i, end);
      if (KJV_VOCAB.has(slice)) hits.push({ text: slice, start: i });
    }
  }
  return hits;
}

export function englishSegmentations(text: string, maxParts = 4) {
  const clean = text.toLowerCase().replace(/[^a-z]/g, "");
  const out: string[][] = [];

  function walk(start: number, acc: string[]) {
    if (out.length > 60) return;
    if (start === clean.length) {
      if (acc.length > 1) out.push(acc);
      return;
    }
    if (acc.length >= maxParts) return;
    for (let end = start + 2; end <= clean.length; end += 1) {
      const slice = clean.slice(start, end);
      if (KJV_VOCAB.has(slice)) walk(end, [...acc, slice]);
    }
  }

  walk(0, []);
  const seen = new Set<string>();
  return out
    .filter((parts) => {
      const key = parts.join("+");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.length - b.length)
    .slice(0, 16);
}
