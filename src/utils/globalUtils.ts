import { format } from 'date-fns';

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

export const numberCountFormmatter = new Intl.NumberFormat('en', {
    notation: 'compact',
    compactDisplay: 'short',
});

/**
 * Returns the English ordinal suffix for a day of month.
 */
function getOrdinalSuffix(day: number): string {
    const j = day % 10;
    const k = day % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
}

export function formatWithOrdinal(isoString: string): string {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
        return '';
    }

    const parts = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).formatToParts(date);

    const weekdayPart = parts.find((p) => p.type === 'weekday');
    const monthPart = parts.find((p) => p.type === 'month');
    const dayPart = parts.find((p) => p.type === 'day');
    const yearPart = parts.find((p) => p.type === 'year');

    if (!weekdayPart || !monthPart || !dayPart || !yearPart) {
        return '';
    }

    const weekday = weekdayPart.value;
    const month = monthPart.value;
    const dayNum = parseInt(dayPart.value, 10);
    const year = yearPart.value;

    const suffix = getOrdinalSuffix(dayNum);

    return `${weekday}, ${month} ${dayNum}${suffix}, ${year}`;
}

export function formatToFullDateTime(date: Date): string {
    const dayDateMonthYear = format(date, 'EEEE, do MMMM yyyy');
    const time = format(date, 'hh:mm a');
    return `${time}, ${dayDateMonthYear}`;
}

export function titleCase(str: string): string {
    return str
        .split(' ')
        .map((word) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : ''))
        .join(' ');
}
