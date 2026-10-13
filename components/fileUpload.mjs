import { html, useState } from '../libs/htm-preact.min.mjs';

import { openFile } from "./utils/picker.mjs";
import { PITHOS, UploadState } from "../model/pithos.mjs";
import { TransferProgress } from "./transferProgress.mjs";
import { capitalise } from "./utils/display.mjs";
import { uploadFailed } from "./utils/errors.mjs";
import { buildShareLink } from "./utils/route.mjs";
import { UploadResult } from "./uploadResult.mjs";
import { Phase } from "./state/transfer.mjs";
import { useTransfer } from "./hooks/useTransfer.mjs";

export function FileUpload(props) {
    const { setError } = props;

    const { transfer, report, reset } = useTransfer();
    const [ link, setLink ] = useState(null);

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

    const uploadAnother = () => {
        reset();
        setLink(null);
    };

    const { phase, progress, total, start } = transfer;

    if (phase === Phase.Ready) {
        return html`<button class="widget" onclick=${beginFileUpload}>Upload file</button>`;
    }

    return html`
        <div class="widget">
            <div>
                ${(() => {
                    switch (phase) {
                        case UploadState.RequestingPermission: return html`<p>Requesting upload permission...</p>`;
                        case UploadState.Encrypting:
                        case UploadState.Uploading:  return html`
                    <${TransferProgress} label=${capitalise(phase)} progress=${progress} total=${total} start=${start} />`;
                        case UploadState.Done: return html`<${UploadResult} link=${link} onUploadAnother=${uploadAnother} />`;
                    }
                })()}
            </div>
        </div>
    `;
}
