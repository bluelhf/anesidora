import { html } from 'https://esm.sh/htm/preact/standalone';
import { ErrorDisplay } from "./errorDisplay.mjs";

export function ErrorWrapper(props) {
    const { error } = props;
    return html`
        <div id="error-wrapper">
            ${error ? html`<${ErrorDisplay} error=${error} />` : props.children}
        </div>
    `;
}