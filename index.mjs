import { html, render, useMemo, useState } from './libs/htm-preact.min.mjs';
import { Header } from './components/header.mjs';
import { FileUpload } from './components/fileUpload.mjs';
import { FileDownload } from './components/fileDownload.mjs';
import { ErrorWrapper } from './components/errorWrapper.mjs';
import { Disclosure } from './components/disclosure.mjs';

import { checkCompatibility } from './model/utils/compatibility.mjs';
import { useHash } from './components/hooks/useHash.mjs';
import { Route, parseHash } from './components/utils/route.mjs';
import { invalidLink } from './components/utils/errors.mjs';

function App() {
    const hash = useHash();
    const route = parseHash(hash);

    const compatibilityError = checkCompatibility()?.error ?? null;

    // Failures belong to the link they happened on.
    const [ failure, setFailure ] = useState(null);
    const setError = (error) => setFailure(error && { hash, error });

    const linkError = useMemo(() => route.name === Route.Invalid ? invalidLink() : null, [route.name]);

    const error = compatibilityError
        ?? linkError
        ?? (failure?.hash === hash ? failure.error : null);

    return html`
        <div id="app">
            <${Header} />
            <${ErrorWrapper} error=${error}>
                ${route.name === Route.Download
                        ? html`<${FileDownload} key=${hash} setError=${setError} uuid=${route.uuid} secret=${route.secret} />`
                        : html`<${FileUpload} setError=${setError}/>`
                }
            <//>
            <${Disclosure} />
        </div>
    `;
}

render(html`<${App} />`, document.body);