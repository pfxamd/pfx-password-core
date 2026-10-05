import {
  countConstrainedSequences,
  sampleConstrainedSequence,
} from "../constraints/model.js";
import type { RandomSource } from "../random/random-source.js";
import { buildPasswordSpec } from "./spec.js";
import type { PasswordGenerationOptions } from "./types.js";

export function countPasswordSearchSpace(options: PasswordGenerationOptions): bigint {
  return countConstrainedSequences(buildPasswordSpec(options));
}

export function generatePassword(
  source: RandomSource,
  options: PasswordGenerationOptions,
): string {
  return sampleConstrainedSequence(source, buildPasswordSpec(options)).join("");
}
