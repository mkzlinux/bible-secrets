/** Curated hero + row configuration for the cinematic home page. */
export interface FeaturedSlide {
  partSlug: string;
  eyebrow: string;
  headline?: string;
  /** Short TV-guide style synopsis shown in the hero. */
  pitch: string;
  meta?: string[];
}

export const FEATURED: FeaturedSlide[] = [
  {
    partSlug: "the-return-of-melchizedek-1-the-return-of-melchizedek-i",
    eyebrow: "Bible Secrets Original",
    pitch:
      "He blessed Abraham, took bread and wine, and walked out of the story without a genealogy. Follow the priest-king from Genesis 14 to the courts of heaven — and to the volume that closes the loop.",
    meta: ["Series · 15 volumes", "Bible Study", "Tinotenda Gwiriri"],
  },
  {
    partSlug: "the-days-of-noah-1-part-1-the-fall-of-the-sons-of-god-1",
    eyebrow: "35-part series",
    pitch:
      "The days that framed a flood. The fall of the sons of God, the ministry of the Watchers, the gates of hell — and what Genesis 6 set in motion that we are still living in.",
    meta: ["Genesis 6", "35 sessions", "Spiritual warfare"],
  },
  {
    partSlug: "comic-book-issues-1-church-witchcraft-issue-1",
    eyebrow: "Illustrated · Issue #1",
    pitch:
      "The Word, drawn. Church Witchcraft opens the illustrated wing of Bible Secrets — doctrine and warfare in panels, with the character terms published alongside.",
    meta: ["Comic", "Issue #1", "Grieyx Studios"],
  },
  {
    partSlug: "meditation-series-3-part-3-the-course-of-meditation",
    eyebrow: "Meditation series",
    pitch:
      "Meditation is a road, not a mood. Three studies on the discipline of staying in the Word until it stays in you.",
    meta: ["3 parts", "Inner life", "Inner court"],
  },
  {
    partSlug: "word-of-god-1-eating-with-the-word",
    eyebrow: "Word of God series",
    pitch:
      "How to eat, hide, sleep on and stand with the Word. Eight studies on your relationship with the text itself.",
    meta: ["8 studies", "Foundations"],
  },
];

export const ROW_ORDER = [
  "the-return-of-melchizedek",
  "the-days-of-noah",
  "unmasking-the-devil",
  "word-of-god",
  "comic-book-issues",
  "heis-series",
  "meditation-series",
  "question-and-answer",
];
