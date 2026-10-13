import { html, useEffect, useState } from '../libs/htm-preact.min.mjs';

const COPIED_FEEDBACK_MS = 2000;

const canShare = "share" in navigator;

export function UploadResult(props) {
    const { link, onUploadAnother } = props;
    const [ copied, setCopied ] = useState(false);
    const [ showLink, setShowLink ] = useState(false);

    useEffect(() => {
        if (!copied) return;
        const id = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
        return () => clearTimeout(id);
    }, [copied]);

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
        } catch (error) {
            setShowLink(true);
        }
    };

    const shareLink = async () => {
        try {
            await navigator.share({ url: link });
        } catch (error) {
            if (error.name !== "AbortError") setShowLink(true);
        }
    };

    return html`
        <div class="result">
            <p>Finished!</p>
            <div class="actions">
                <button class="primary" onclick=${copyLink}>${copied ? "Copied!" : "Copy link"}</button>
                ${canShare ? html`<button onclick=${shareLink}>Share</button>` : null}
                <button aria-expanded=${showLink} onclick=${() => setShowLink(!showLink)}>
                    ${showLink ? "Hide link" : "Show link"}
                </button>
                <button class="wide" onclick=${onUploadAnother}>Upload another file</button>
            </div>
            ${showLink ? html`<p id="link">${link}</p>` : null}
        </div>
    `;
}
