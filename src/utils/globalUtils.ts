export function isUndefined(value: unknown): boolean {
    return value === undefined;
}

export function isNull(value: unknown): boolean {
    return value === null;
}

export function isNullOrUndefined(value: any): boolean {
    return value === null || value === undefined;
}
