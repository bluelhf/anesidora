import { html, useState } from '../libs/htm-preact.min.mjs';

import { openFile } from "./utils/picker.mjs";
import { PITHOS, UploadState } from "../model/pithos.mjs";
import { TransferProgress } from "./transferProgress.mjs";
import { capitalise } from "./utils/display.mjs";
import { uploadFailed } from "./utils/errors.mjs";
import { buildShareLink } from "./utils/route.mjs";
import { Phase } from "./state/transfer.mjs";
import { useTransfer } from "./hooks/useTransfer.mjs";

export function FileUpload(props) {
    const { setError } = props;

    const { transfer, report } = useTransfer();
    const [ link, setLink ] = useState(null);
    const [ copied, setCopied ] = useState(false);

    const copyLink = async () => {
        await navigator.clipboard.writeText(link);
        setCopied(true);
    }

    const beginFileUpload = async () => {
        try {
            const handle = await openFile();
            if (!handle) return;

            const file = await handle.getFile();

            const { secret, uuid } = await PITHOS.upload(file, report);

            setLink(buildShareLink(document.location.href, uuid, secret));

        } catch (error) {
            setError(uploadFailed(error));
        }
    }

    const { phase, progress, total, start } = transfer;

    return html`
        <div class="widget">
            <div>
                ${(() => {
                    switch (phase) {
                        case Phase.Ready:    return html`<button class="widget" onclick=${beginFileUpload}>Upload file</button>`;
                        case UploadState.RequestingPermission: return html`<p>Requesting upload permission...</p>`;
                        case UploadState.Encrypting:
                        case UploadState.Uploading:  return html`
                    <${TransferProgress} label=${capitalise(phase)} progress=${progress} total=${total} start=${start} />`;
                        case UploadState.Done: return html`
                    Finished!
                    <div id="link-container">
                        Link: 
                        <span id="link">${link}</span>
                        <button id="copy" onclick=${copyLink}>${copied ? "Copied!" : "Copy"}</button>
                    </div>
                `;
                    }
                })()}
            </div>
        </div>
    `;
}
