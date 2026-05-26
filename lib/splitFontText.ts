export type FontSegmentKind = "latin" | "text";

export type FontCharacter = {
  value: string;
  kind: FontSegmentKind;
  index: number;
};

const latinOrNumberPattern = /[\p{Script=Latin}\p{Number}]/u;

export function getCharacterKind(value: string): FontSegmentKind {
  return latinOrNumberPattern.test(value) ? "latin" : "text";
}

export function splitFontText(text: string): FontCharacter[] {
  return Array.from(text).map((value, index) => ({
    value,
    kind: getCharacterKind(value),
    index,
  }));
}
