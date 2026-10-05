import type { ConstrainedGroup, ConstrainedSequenceSpec } from "../constraints/types.js";
import {
  AMBIGUOUS_CHARACTERS,
  ASCII_SYMBOLS,
  DIGITS,
  LOWERCASE,
  UPPERCASE,
} from "./charsets.js";
import { PasswordConfigurationError } from "./errors.js";
import type { PasswordGenerationOptions } from "./types.js";

type GroupName = "lowercase" | "uppercase" | "digits" | "symbols";

interface RawGroup {
  readonly id: GroupName;
  readonly enabled: boolean;
  readonly characters: string;
  readonly minimum: number | undefined;
}

function filterCharacters(characters: string, excluded: ReadonlySet<string>): string[] {
  return [...characters].filter((character) => !excluded.has(character));
}

function normalizeMinimum(group: RawGroup): number {
  const minimum = group.minimum ?? 0;

  if (!Number.isSafeInteger(minimum) || minimum < 0) {
    throw new PasswordConfigurationError(
      "INVALID_MINIMUM",
      `minimum for group "${group.id}" must be a non-negative safe integer.`,
    );
  }

  if (!group.enabled && minimum > 0) {
    throw new PasswordConfigurationError(
      "MINIMUM_FOR_DISABLED_GROUP",
      `minimum for disabled group "${group.id}" must be zero.`,
    );
  }

  return minimum;
}

export function buildPasswordSpec(
  options: PasswordGenerationOptions,
): ConstrainedSequenceSpec<string> {
  if (!Number.isSafeInteger(options.length) || options.length < 0) {
    throw new PasswordConfigurationError(
      "INVALID_LENGTH",
      "length must be a non-negative safe integer.",
    );
  }

  const excluded = new Set<string>([...(options.excludedCharacters ?? "")]);

  if (options.excludeAmbiguous ?? false) {
    for (const character of AMBIGUOUS_CHARACTERS) {
      excluded.add(character);
    }
  }

  const rawGroups: readonly RawGroup[] = [
    {
      id: "lowercase",
      enabled: options.lowercase,
      characters: LOWERCASE,
      minimum: options.minLowercase,
    },
    {
      id: "uppercase",
      enabled: options.uppercase,
      characters: UPPERCASE,
      minimum: options.minUppercase,
    },
    {
      id: "digits",
      enabled: options.digits,
      characters: DIGITS,
      minimum: options.minDigits,
    },
    {
      id: "symbols",
      enabled: options.symbols,
      characters: ASCII_SYMBOLS,
      minimum: options.minSymbols,
    },
  ];

  const groups: ConstrainedGroup<string>[] = [];

  for (const group of rawGroups) {
    const minimum = normalizeMinimum(group);

    if (!group.enabled) {
      continue;
    }

    groups.push({
      id: group.id,
      values: filterCharacters(group.characters, excluded),
      minimum,
    });
  }

  return {
    length: options.length,
    groups,
  };
}
