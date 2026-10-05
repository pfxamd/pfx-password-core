import type {
  PassphraseGenerationOptions,
  PassphraseWordlist,
} from "../passphrase/types.js";
import { countPassphraseSearchSpace } from "../passphrase/model.js";
import type { PasswordGenerationOptions } from "../password/types.js";
import { countPasswordSearchSpace } from "../password/generate.js";
import { generationEntropyFromSearchSpace } from "./search-space.js";
import type { GenerationEntropy } from "./types.js";

export function analyzePasswordGenerationEntropy(
  options: PasswordGenerationOptions,
): GenerationEntropy {
  return generationEntropyFromSearchSpace(countPasswordSearchSpace(options));
}

export function analyzePassphraseGenerationEntropy(
  wordlist: PassphraseWordlist,
  options: PassphraseGenerationOptions,
): GenerationEntropy {
  return generationEntropyFromSearchSpace(
    countPassphraseSearchSpace(wordlist, options),
  );
}
