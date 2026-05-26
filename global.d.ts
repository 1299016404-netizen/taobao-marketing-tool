declare module "gif.js" {
  const GIF: unknown;
  export default GIF;
}

declare module "upng-js" {
  export function encode(
    buffers: ArrayBuffer[],
    width: number,
    height: number,
    colors: number,
    delays: number[],
  ): ArrayBuffer;
}
