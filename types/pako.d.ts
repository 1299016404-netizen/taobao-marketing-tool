declare module "pako" {
  export function deflate(data: Uint8Array, options?: { level?: number }): Uint8Array;
}
