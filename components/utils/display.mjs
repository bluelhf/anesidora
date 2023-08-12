export function humanReadableSize(amount, decimals = 2) {
    const units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
    const exponent = Math.min(Math.floor(Math.log2(amount) / 10), units.length - 1);
    const unit = units[exponent];
    const size = (amount / 2 ** (10 * exponent)).toFixed(exponent > 0 ? decimals : 0);
    return `${size} ${unit}`;
}

export function humanReadableTime(number, precision = 3) {
    const hours = Math.floor(number / 3600);
    const minutes = Math.floor(number / 60) % 60;
    const seconds = Math.floor(number) % 60;
    const milliseconds = Math.floor(number * 1000) % 1000;

    const parts = [];

    if (precision >= 4) parts.push(milliseconds);
    parts.unshift(precision >= 3 ? seconds : 0);
    parts.unshift(precision >= 2 ? minutes : 0);
    parts.unshift(precision >= 1 ? hours : 0);

    return parts.map((part) => part.toString().padStart(2, "0")).join(":");
}

export function humanReadableDuration(number) {
    if (isNaN(number)) return "unknown amount of time";
    const years = Math.floor(number / 31536000);
    const months = Math.floor(number / 2592000) % 12;
    const days = Math.floor(number / 86400) % 30;
    const hours = Math.floor(number / 3600) % 24;
    const minutes = Math.floor(number / 60) % 60;
    const seconds = Math.floor(number) % 60;

    const parts = [];

    if (years > 0) parts.push(`${years} year${years > 1 ? "s" : ""}`);
    if (months > 0) parts.push(`${months} month${months > 1 ? "s" : ""}`);
    if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
    if (seconds > 0) parts.push(`${seconds} second${seconds > 1 ? "s" : ""}`);

    return parts.length === 0 ? "a little bit" : parts.join(", ");
}