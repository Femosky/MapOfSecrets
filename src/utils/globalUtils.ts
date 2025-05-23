export function isUndefined(value: unknown): boolean {
    return value === undefined;
}

export function isNull(value: unknown): boolean {
    return value === null;
}

export function isNullOrUndefined(value: unknown): boolean {
    return value === null || value === undefined;
}

export function trimAndToLowerCase(value: string): string {
    return value.trim().toLowerCase();
}

export function formatCoordinateTo6DecimalPlaces(n: number): number {
    return Math.trunc(n * 1e6) / 1e6;
}
