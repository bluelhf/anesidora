import { html, useState } from '../libs/htm-preact.min.mjs';
import { DownloadState, PITHOS } from "../scripts/pithos.mjs";
import { humanReadableSize, humanReadableTime } from "../scripts/utils/display.mjs";

export function FileDownload(props) {
    const { hash, setError } = props;
    const [ uuid, secret ] = hash.substring(1).split(";");

    const [ state, setState ] = useState("ready");

    const [ start, setStart ] = useState(Date.now());
    const [ progress, setProgress ] = useState(0);
    const [ total, setTotal ] = useState(1);

    const beginFileDownload = async () => {
        try {
            try {
                const { handle, metadata } = await PITHOS.download(uuid, secret, (event) => {
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
                setTimeout(() => URL.revokeObjectURL(url), 40000);

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
                        case DownloadState.RequestingPermission: return html`<p>Requesting download permission...</p>`;
                        case DownloadState.Downloading:  return html`
                    <p>${state.charAt(0).toUpperCase() + state.slice(1)}... ${(progress / total * 100).toFixed(2)}% complete</p>
                    <p>${humanReadableSize(progress)} / ${humanReadableSize(total)} @ ${humanReadableSize(progress / (Date.now() - start) * 1000, 0)}/s</p>
                    <p>${(() => {
                            const elapsed = (Date.now() - start) / 1000.0;
                            const remaining = (total - progress) / (progress / elapsed);
                            const totalTime = elapsed + remaining;
                            return `${humanReadableTime(elapsed)}/${humanReadableTime(totalTime)}; -${humanReadableTime(remaining)}`;
                        })()}</p>`;
                        case DownloadState.Done:         return html`<p>Downloaded.</p>`;
                    }
                })()}
            </div>
        </div>
    `;
}