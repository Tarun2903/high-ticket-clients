export {};

declare global {
  interface Window {
    fbq?: (
      command: "init" | "track" | "trackCustom" | "consent",
      eventOrId: string,
      params?: Record<string, unknown>,
      options?: { eventID?: string },
    ) => void;
    /** Calls made before the Pixel loaded; drained by the base code. null once drained. */
    __pxq?: unknown[][] | null;
    dataLayer?: Record<string, unknown>[];
  }
}
