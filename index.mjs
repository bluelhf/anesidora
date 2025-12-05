import { html, render, useState, useEffect } from './libs/htm-preact.min.mjs';
import { Header } from './components/header.mjs';
import { FileUpload } from './components/fileUpload.mjs';
import { FileDownload } from './components/fileDownload.mjs';
import { ErrorWrapper } from './components/errorWrapper.mjs';

import { checkCompatibility } from './model/utils/compatibility.mjs';

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
            <details>
                <summary>Update on 2025-12-05: Encryption works better now!</summary>
                <p>
                    <a href="https://antti.codes/">Antti</a> recently identified a bug in the
                    encryption implementation. The initialisation vector (IV) used for AES-CTR
                    encryption was completely ignored, which weakened the security of the encryption.
                </p><p>
                    While this does not matter for the security of files uploaded to Anesidora (since a
                    new random key is generated for each file), I decided to fix it anyway. Now, the IV
                    is used properly to initialise the counter, and the counter is being incremented
                    properly (little-endian in the rightmost half).
                </p><p>
                    Files generated with the new Anesidora version will have one extra byte in the secret
                    to specify the encryption scheme version number, but old files will still work as before.
                </p>
            </details>
        </div>
    `;
}

render(html`<${App} />`, document.body);