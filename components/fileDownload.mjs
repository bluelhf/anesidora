import { html, useState } from 'https://esm.sh/htm/preact/standalone';
import { decrypt } from "../scripts/crypt.mjs";

import { API_ENDPOINT } from "../scripts/config.mjs"
import { MetadataParser, ProgressStream } from "../scripts/utils/stream.mjs";

export function FileDownload(props) {
    const { hash, setError } = props;
    const [ uuid, secret ] = hash.substring(1).split(";");

    const [ state, setState ] = useState("ready");
    const [ progress, setProgress ] = useState(0);
    const [ total, setTotal ] = useState(1);

    const beginFileDownload = async () => {
        try {
            await navigator.storage.persist();

            const directory = await navigator.storage.getDirectory();
            const handle = await directory.getFileHandle(crypto.randomUUID(), {create: true});
            const writable = await handle.createWritable();

            const { url } = await (await fetch(API_ENDPOINT + "/download/" + uuid)).json();
            const response = await fetch(url);

            const contentLength = parseInt(response.headers.get("Content-Length"));

            const metadataParser = new MetadataParser();

            setTotal(contentLength);
            setState("started");
            try {
                await (await decrypt({ secret, encrypted: response.body.pipeThrough(new TransformStream(metadataParser)) }))
                    .pipeThrough(new ProgressStream(contentLength, setProgress))
                    .pipeTo(writable);
            } catch (error) {
                if (error.name === "QuotaExceededError") {
                    setError({
                        operatorReport: "Origin-private file system quota exceeded",
                        cause: error,
                        userReport: {
                            title: "The file is too large for this browser.",
                            userSuggestions: [
                                "Try with a modern version of Chrome.",
                                "Try again with a smaller file.",
                            ]
                        }
                    });
                } else throw error;
            }

            const metadata = metadataParser.metadata;
            const file = await handle.getFile();

            {
                setState("sync");
                const url = URL.createObjectURL(file);
                const a = document.createElement("a");
                a.href = url;
                a.download = metadata.name;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 40000);
            }

            setState("finished");
        } catch (error) {
            setError({
                operatorReport: "Uncaught exception while downloading file",
                cause: error,
                userReport: {
                    title: "Downloading the file failed.",
                    userSuggestions: [
                        "Try again later.",
                    ]
                }
            });
        }
    };

    return html`
        <div class="widget">
            <div>
                ${(() => {
                    switch (state) {
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