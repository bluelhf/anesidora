import { html, render, useState, useEffect } from './libs/htm-preact.min.mjs';
import { Header } from './components/header.mjs';
import { FileUpload } from './components/fileUpload.mjs';
import { FileDownload } from './components/fileDownload.mjs';
import { ErrorWrapper } from './components/errorWrapper.mjs';

import { checkCompatibility } from './scripts/compatibility.mjs';

function App() {
    const [hash] = useState(window.location.hash);
    useEffect(() => {if (hash.length > 0) { window.location.hash = hash; }}, [hash]);

    const compatibility = checkCompatibility();
    const [error, setError] = useState(compatibility?.error ?? null);

    return html`
        <div id="app">
            <${Header} />
            <${ErrorWrapper} error=${error}>
                ${hash.length > 1 
                        ? html`<${FileDownload} setError=${setError} hash=${hash} />` 
                        : html`<${FileUpload} setError=${setError}/>`
                }
            </ErrorWrapper>
        </div>
    `;
}

render(html`<${App} />`, document.body);