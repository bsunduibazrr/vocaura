export type WordLevel = "B1" | "B2";

export interface WordDTO {
  id: string;
  english: string;
  mongolian: string;
  level: WordLevel;
  example?: string | null;
  addedAt: string;
  isAutoAdded: boolean;
  source: "user" | "auto";
}
