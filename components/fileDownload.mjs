import { html } from '../libs/htm-preact.min.mjs';
import { DownloadState, PITHOS } from "../model/pithos.mjs";
import { TransferProgress } from "./transferProgress.mjs";
import { capitalise } from "./utils/display.mjs";
import { downloadFailed, quotaExceeded } from "./utils/errors.mjs";
import { DownloadResult } from "./downloadResult.mjs";
import { Phase } from "./state/transfer.mjs";
import { useTransfer } from "./hooks/useTransfer.mjs";
import { useSavedFile } from "./hooks/useSavedFile.mjs";

export function FileDownload(props) {
    const { uuid, secret, setError } = props;

    const { transfer, report } = useTransfer();

    const { keep, saveAgain, saving } = useSavedFile(setError);

    const beginFileDownload = async () => {
        try {
            const { handle, metadata, close } = await PITHOS.download(uuid, secret, report);

            await keep({ handle, name: metadata.name, close });
        } catch (error) {
            setError(error.name === "QuotaExceededError" ? quotaExceeded(error) : downloadFailed(error));
        }
    };

    const { phase, progress, total, start } = transfer;

    if (phase === Phase.Ready) {
        return html`<button class="widget" onclick=${beginFileDownload}>Download file</button>`;
    }

    return html`
        <div class="widget">
            <div>
                ${(() => {
                    switch (phase) {
                        case DownloadState.RequestingPermission: return html`<p>Requesting download permission...</p>`;
                        case DownloadState.Downloading:  return html`
                    <${TransferProgress} label=${capitalise(phase)} progress=${progress} total=${total} start=${start} />`;
                        case DownloadState.Done:         return html`<${DownloadResult} onDownloadAgain=${saveAgain} saving=${saving} />`;
                    }
                })()}
            </div>
        </div>
    `;
}
