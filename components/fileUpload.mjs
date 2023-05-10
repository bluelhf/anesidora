import { html, useEffect, useState } from 'https://esm.sh/htm/preact/standalone';
import { encrypt } from "../scripts/crypt.mjs";

import { API_ENDPOINT, CHUNK_SIZE } from "../scripts/config.mjs";
import { openFile } from "../scripts/utils/picker.mjs";
import { dangerouslyReadEntireStream, ProgressStream } from "../scripts/utils/stream.mjs";
import { supportsRequestStreams } from "../scripts/compatibility.mjs";

function humanReadableSize(amount, decimals = 2) {
    const units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
    const exponent = Math.min(Math.floor(Math.log2(amount) / 10), units.length - 1);
    const unit = units[exponent];
    const size = (amount / 2 ** (10 * exponent)).toFixed(exponent > 0 ? decimals : 0);
    return `${size} ${unit}`;
}

function humanReadableTime(number, precision = 3) {
    const hours = Math.floor(number / 3600);
    const minutes = Math.floor(number / 60) % 60;
    const seconds = Math.floor(number) % 60;
    const milliseconds = Math.floor(number * 1000) % 1000;

    const parts = [];

    if (precision >= 4) parts.push(milliseconds);
    parts.unshift(precision >= 3 ? seconds : 0);
    parts.unshift(precision >= 2 ? minutes : 0);
    parts.unshift(precision >= 1 ? hours : 0);

    return parts.map((part) => part.toString().padStart(2, "0")).join(":");
}

function humanReadableDuration(number) {
    if (isNaN(number)) return "unknown amount of time";
    const years = Math.floor(number / 31536000);
    const months = Math.floor(number / 2592000) % 12;
    const days = Math.floor(number / 86400) % 30;
    const hours = Math.floor(number / 3600) % 24;
    const minutes = Math.floor(number / 60) % 60;
    const seconds = Math.floor(number) % 60;

    const parts = [];

    if (years > 0) parts.push(`${years} year${years > 1 ? "s" : ""}`);
    if (months > 0) parts.push(`${months} month${months > 1 ? "s" : ""}`);
    if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
    if (seconds > 0) parts.push(`${seconds} second${seconds > 1 ? "s" : ""}`);

    return parts.length === 0 ? "a little bit" : parts.join(", ");
}

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

            setState("started");
            setStart(Date.now());
            setTotal(file.size);

            let { encrypted, secret } = await encrypt(file.stream().pipeThrough(new ProgressStream(file.size, setProgress)));

            let bodyToSend = encrypted;
            if (!supportsRequestStreams) {
                try {
                    bodyToSend = await dangerouslyReadEntireStream(encrypted, file.size);
                } catch (error) {
                    if (error instanceof RangeError) {
                        setError({
                            operatorReport: "Request streams not supported and " + file.size + "-byte file does not fit into array",
                            cause: error,
                            userReport: {
                                title: "The file is too large for this browser.",
                                userSuggestions: [
                                    "Try with a modern version of Chrome.",
                                    "Try again with a smaller file.",
                                ]
                            }
                        });
                        return;
                    } else throw error;
                }
            }

            const response = await fetch(API_ENDPOINT + "/upload", {
                ...(() => {
                    if (!supportsRequestStreams) return {};
                    else return { duplex: "half" }
                })(),
                method: "POST",
                body: bodyToSend,
                headers: {
                    "Content-Type": "application/octet-stream",
                    "X-File-Name": encodeURIComponent(file.name)
                }
            });

            const body = await response.text();
            if (!response.ok) throw new Error("Upload failed, got status " + response.status + ": " + body);
            if (document.location.hash.length === 0) {
                setLink(document.location.href + "#" + body + ";" + secret);
            } else {
                setLink(document.location.href.replace(document.location.hash, "#" + body + ";" + secret));
            }
            setState("finished");
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
                        case "started":  return html`
                    <p>Uploading... ${(progress / total * 100).toFixed(2)}% complete</p>
                    <p>${humanReadableSize(progress)} / ${humanReadableSize(total)} @ ${humanReadableSize(progress / (Date.now() - start) * 1000, 0)}/s</p>
                    <p>${(() => {
                            const elapsed = (Date.now() - start) / 1000.0;
                            const remaining = (total - progress) / (progress / elapsed);
                            const totalTime = elapsed + remaining;
                            return `${humanReadableTime(elapsed)}/${humanReadableTime(totalTime)}; -${humanReadableTime(remaining)}`;
                        })()}</p>`;
                        case "copied":
                        case "finished": return html`
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