import { html } from '../libs/htm-preact.min.mjs';
import { navigateToUpload } from "./utils/route.mjs";

export function DownloadResult(props) {
    const { onDownloadAgain, saving } = props;

    return html`
        <div class="result">
            <p>Downloaded.</p>
            <div class="actions">
                <button class="primary" onclick=${navigateToUpload}>Upload a file</button>
                <button onclick=${onDownloadAgain} disabled=${saving}>Download again</button>
            </div>
        </div>
    `;
}
