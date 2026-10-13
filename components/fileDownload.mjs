import { html, useState } from '../libs/htm-preact.min.mjs';
import { DownloadState, PITHOS } from "../model/pithos.mjs";
import { TransferProgress } from "./transferProgress.mjs";
import { capitalise } from "./utils/display.mjs";
import { downloadFailed, quotaExceeded } from "./utils/errors.mjs";

export function FileDownload(props) {
    const { hash, setError } = props;
    const [ uuid, secret ] = hash.substring(1).split(";");

    const [ state, setState ] = useState("ready");

    const [ start, setStart ] = useState(Date.now());
    const [ progress, setProgress ] = useState(0);
    const [ total, setTotal ] = useState(1);

    const beginFileDownload = async () => {
        try {
            const { handle, metadata, close } = await PITHOS.download(uuid, secret, (event) => {
                setState(event.state);
                if (event.state === DownloadState.Downloading) {
                    setStart(event.start);
                    setProgress(event.progress);
                    setTotal(event.total);
                }
            });

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

    return html`
        <div class="widget">
            <div>
                ${(() => {
                    switch (state) {
                        case "ready":    return html`<button class="widget" onclick=${beginFileDownload}> Download file</button>`;
                        case DownloadState.RequestingPermission: return html`<p>Requesting download permission...</p>`;
                        case DownloadState.Downloading:  return html`
                    <${TransferProgress} label=${capitalise(state)} progress=${progress} total=${total} start=${start} />`;
                        case DownloadState.Done:         return html`<p>Downloaded.</p>`;
                    }
                })()}
            </div>
        </div>
    `;
}