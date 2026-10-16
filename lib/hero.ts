export interface HeroSlide {
  id: string;
  title: string;
  eyebrow: string;
  pitch: string;
  meta: string[];
  backdrop: string;
  poster: string;
  /** Where the primary action goes (reader inside the platform). */
  actionHref: string;
  actionLabel: string;
  /** "More info" target — usually the series page. */
  infoHref: string;
  locked?: boolean;
  accent?: string;
}

export interface HeroSet {
  id: string;
  label: string;
  slides: HeroSlide[];
}
