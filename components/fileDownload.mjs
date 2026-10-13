import { html } from '../libs/htm-preact.min.mjs';
import { DownloadState, PITHOS } from "../model/pithos.mjs";
import { TransferProgress } from "./transferProgress.mjs";
import { capitalise } from "./utils/display.mjs";
import { downloadFailed, quotaExceeded } from "./utils/errors.mjs";
import { Phase } from "./state/transfer.mjs";
import { useTransfer } from "./hooks/useTransfer.mjs";

export function FileDownload(props) {
    const { uuid, secret, setError } = props;

    const { transfer, report } = useTransfer();

    const beginFileDownload = async () => {
        try {
            const { handle, metadata, close } = await PITHOS.download(uuid, secret, report);

            const url = URL.createObjectURL(await handle.getFile());
            const a = document.createElement("a");
            a.href = url;
            a.download = metadata.name;
            a.click();
            setTimeout(async () => {
                URL.revokeObjectURL(url);
                await close();
            }, 40000);
        } catch (error) {
            setError(error.name === "QuotaExceededError" ? quotaExceeded(error) : downloadFailed(error));
        }
    };

    const { phase, progress, total, start } = transfer;

    return html`
        <div class="widget">
            <div>
                ${(() => {
                    switch (phase) {
                        case Phase.Ready:    return html`<button class="widget" onclick=${beginFileDownload}> Download file</button>`;
                        case DownloadState.RequestingPermission: return html`<p>Requesting download permission...</p>`;
                        case DownloadState.Downloading:  return html`
                    <${TransferProgress} label=${capitalise(phase)} progress=${progress} total=${total} start=${start} />`;
                        case DownloadState.Done:         return html`<p>Downloaded.</p>`;
                    }
                })()}
            </div>
        </div>
    `;
}
