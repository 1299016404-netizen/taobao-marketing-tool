export type FontSegmentKind = "latin" | "number" | "text";

export type FontCharacter = {
  value: string;
  kind: FontSegmentKind;
  index: number;
};

const numberPattern = /\p{Number}/u;
const latinPattern = /\p{Script=Latin}/u;

export function getCharacterKind(value: string): FontSegmentKind {
  if (numberPattern.test(value)) return "number";
  if (latinPattern.test(value)) return "latin";
  return "text";
}

export function splitFontText(text: string): FontCharacter[] {
  return Array.from(text).map((value, index) => ({
    value,
    kind: getCharacterKind(value),
    index,
  }));
}
