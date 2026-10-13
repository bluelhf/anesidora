import { html } from '../libs/htm-preact.min.mjs';
import { humanReadableSize, humanReadableTime } from "./utils/display.mjs";
import { useNow } from "./hooks/useNow.mjs";

export function transferStats({ progress, total, start, now }) {
    const elapsed = Math.max(0, (now - start) / 1000);
    const speed = elapsed > 0 ? progress / elapsed : 0;
    const remaining = speed > 0 ? (total - progress) / speed : 0;
    const fraction = total > 0 ? Math.min(1, progress / total) : 0;
    return { elapsed, speed, remaining, fraction };
}

export function TransferProgress(props) {
    const { label, progress, total, start } = props;
    const now = useNow();
    const { elapsed, speed, remaining, fraction } = transferStats({ progress, total, start, now });

    return html`
        <p>${label}... ${(fraction * 100).toFixed(2)}% complete</p>
        <p>${humanReadableSize(progress)} / ${humanReadableSize(total)} @ ${humanReadableSize(speed, 0)}/s</p>
        <p>${humanReadableTime(elapsed)}/${humanReadableTime(elapsed + remaining)}; -${humanReadableTime(remaining)}</p>
    `;
}
