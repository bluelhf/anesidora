import { html, useState } from 'https://esm.sh/htm/preact/standalone';

import { openFile } from "../scripts/utils/picker.mjs";
import { PITHOS, UploadState } from "../scripts/pithos.mjs";
import { humanReadableSize, humanReadableTime } from "../scripts/utils/display.mjs";

export function FileUpload(props) {
    const { setError } = props;

    const [ state, setState ] = useState("ready");
    const [ total, setTotal ] = useState(1);
    const [ link, setLink ] = useState(null);

    const [ start, setStart ] = useState(null);

    const copyLink = async () => {
        await navigator.clipboard.writeText(link);
        setState("copied");
    }

    const [progress, setProgress] = useState(0);
    const beginFileUpload = async () => {
        try {
            const handle = await openFile();
            if (!handle) return;

            const file = await handle.getFile();

            const { secret, uuid } = await PITHOS.upload(file, (event) => {
                setState(event.state);

                switch (event.state) {
                    case UploadState.Encrypting:
                        setStart(event.start);
                        setProgress(event.progress);
                        setTotal(event.total);
                        break;

                    case UploadState.Uploading:
                        setStart(event.start);
                        setProgress(event.progress);
                        setTotal(event.total);
                        break;
                }
            });

            if (document.location.hash.length === 0) {
                setLink(document.location.href + "#" + uuid + ";" + secret);
            } else {
                setLink(document.location.href.replace(document.location.hash, "#" + uuid + ";" + secret));
            }

        } catch (error) {
            setError({
                operatorReport: "Uncaught exception while uploading file",
                cause: error,
                userReport: {
                    title: "Uploading the file failed.",
                    userSuggestions: [
                        "Try again later.",
                    ]
                }
            });
        }
    }

    return html`
        <div class="widget">
            <div>
                ${(() => {
                    switch (state) {
                        case "ready":    return html`<button class="widget" onclick=${beginFileUpload}>Upload file</button>`;
                        case UploadState.Encrypting:
                        case UploadState.Uploading:  return html`
                    <p>${state.charAt(0).toUpperCase() + state.slice(1)}... ${(progress / total * 100).toFixed(2)}% complete</p>
                    <p>${humanReadableSize(progress)} / ${humanReadableSize(total)} @ ${humanReadableSize(progress / (Date.now() - start) * 1000, 0)}/s</p>
                    <p>${(() => {
                            const elapsed = (Date.now() - start) / 1000.0;
                            const remaining = (total - progress) / (progress / elapsed);
                            const totalTime = elapsed + remaining;
                            return `${humanReadableTime(elapsed)}/${humanReadableTime(totalTime)}; -${humanReadableTime(remaining)}`;
                        })()}</p>`;
                        case "copied":
                        case UploadState.Done: return html`
                    Finished!
                    <div id="link-container">
                        Link: 
                        <span id="link">${link}</span>
                        <button id="copy" onclick=${copyLink}>${state === "copied" ? "Copied!" : "Copy"}</button>
                    </div>
                `;
                    }
                })()}
            </div>
        </div>
    `;
}