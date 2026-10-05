import type { RandomSource } from "../random/random-source.js";

/**
 * Produces an independently owned RandomSource for one batch item.
 *
 * The batch engine rejects reuse of the same source object across items.
 */
export type RandomSourceFactory = (index: number) => RandomSource;
