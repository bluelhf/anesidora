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

    // Values only break between spans, never inside "44 MiB/s".
    // Separators are interpolated because htm trims whitespace next to newlines.
    return html`
        <div class="transfer">
            <p>${label}... ${(fraction * 100).toFixed(2)}% complete</p>
            <progress aria-label=${label} max="1" value=${fraction} />
            <p class="detail">
                <span class="nowrap">${humanReadableSize(progress)}</span>${" / "}<span class="nowrap">${humanReadableSize(total)}</span>${" @ "}<span class="nowrap">${humanReadableSize(speed, 0)}/s</span>
            </p>
            <p class="detail">
                <span class="nowrap">${humanReadableTime(elapsed)}/${humanReadableTime(elapsed + remaining)};</span>${" "}<span class="nowrap">-${humanReadableTime(remaining)}</span>
            </p>
        </div>
    `;
}
