import { z } from "zod";

// Schema for structured color output
export const ColorScheme = z.object({
  below4: z
    .string()
    .describe("Background color, Font color (comma separated hex values) in hex [DONT INCLUDE #] for values ≤ 4."),
  below8: z
    .string()
    .describe("Background color, Font color (comma separated hex values) in hex [DONT INCLUDE #] for values ≤ 8."),
  below16: z
    .string()
    .describe("Background color, Font color (comma separated hex values) in hex [DONT INCLUDE #] for values ≤ 16."),
  below64: z
    .string()
    .describe("Background color, Font color (comma separated hex values) in hex [DONT INCLUDE #] for values ≤ 64."),
  below256: z
    .string()
    .describe("Background color, Font color (comma separated hex values) in hex [DONT INCLUDE #] for values ≤ 256."),
  below1024: z
    .string()
    .describe("Background color, Font color (comma separated hex values) in hex [DONT INCLUDE #] for values ≤ 1024."),
  above1024: z
    .string()
    .describe("Background color, Font color (comma separated hex values) in hex [DONT INCLUDE #] for values > 1024."),
});

export type ColorSchemeType = z.infer<typeof ColorScheme>;
