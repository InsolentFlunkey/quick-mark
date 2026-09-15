export function fixture(name: string): string;
export function mixedFixture(bytes: number): string;
export const CASES: string[];
export function dimensions(source: string): { bytes: number; characters: number; lines: number };
export function summary(samples: number[]): { samples: number[]; median: number; max: number } | null;
