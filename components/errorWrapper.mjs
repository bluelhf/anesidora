import { html } from '../libs/htm-preact.min.mjs';
import { ErrorDisplay } from "./errorDisplay.mjs";

export function ErrorWrapper(props) {
    const { error, onRetry } = props;
    return html`
        <div id="error-wrapper">
            ${error ? html`<${ErrorDisplay} error=${error} onRetry=${onRetry} />` : props.children}
        </div>
    `;
}
