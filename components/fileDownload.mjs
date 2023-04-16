import { html, useState } from 'https://esm.sh/htm/preact/standalone';
import { decrypt } from "../scripts/crypt.mjs";

import { API_ENDPOINT } from "../scripts/config.mjs"
import { ProgressStream } from "../scripts/utils/stream.mjs";
import { saveFile } from "../scripts/utils/picker.mjs";

async function getFilename(uuid) {
    const response = (await fetch(API_ENDPOINT + "/download/" + uuid, { method: "HEAD" }));
    return response.headers.get("X-File-Name");
}

export function FileDownload(props) {
    const { hash, setError } = props;
    const [ uuid, secret ] = hash.substring(1).split(";");

    const [ state, setState ] = useState("loading");
    const [ progress, setProgress ] = useState(0);
    const [ total, setTotal ] = useState(1);

    const [ filenameRequest, setFilenameRequest ] = useState(null);
    if (filenameRequest === null) {
        setFilenameRequest(getFilename(uuid).then((filename) => {
            if (!filename) setError({
                title: "The file you are trying to download does not exist.",
                userSuggestions: [
                    "Ensure the link you are trying to access is correct.",
                ]
            });
            if (state === "loading") setState("ready");
            return filename;
        }));
    }

    const beginFileDownload = async () => {
        try {
            const filename = await filenameRequest;
            const handle = await saveFile(filename);
            if (!handle) return;

            const response = await fetch(API_ENDPOINT + "/download/" + uuid);
            const contentLength = parseInt(response.headers.get("Content-Length"));

            setTotal(contentLength);
            setState("started");
            await (await decrypt({secret, encrypted: response.body}))
                .pipeThrough(new ProgressStream(contentLength, setProgress))
                .pipeThrough(new TransformStream({
                    flush() {
                        setState("sync");
                    }
                })).pipeTo(await handle.createWritable());

            setState("finished");
        } catch (error) {
            console.error(error);
            setError({
                title: "Downloading the file failed.",
                userSuggestions: [
                    "Try again later.",
                ]
            });
        }
    };

    return html`
        <div class="widget">
            <div>
                ${(() => {
                    switch (state) {
                        case "loading":  return html`<p>Loading...</p>`;
                        case "ready":    return html`<button class="widget" onclick=${beginFileDownload}> Download file</button>`;
                        case "started":  return html`<p>Downloading... ${(progress / total * 100).toFixed(2)}%</p>`;
                        case "sync":     return html`<p>Synchronising disk...</p>`
                        case "finished": return html`<p>Download finished.</p>`;
                    }
                })()}
            </div>
        </div>
    `;
}