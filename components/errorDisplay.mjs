import { html, useEffect } from '../libs/htm-preact.min.mjs';

export function ErrorDisplay(props) {
    const { error, onRetry } = props;
    useEffect(() => {
        if (error.operatorReport) console.error(error.operatorReport);
        if (error.cause) console.error(error.cause);
    }, [error]);

    return html`
        <div class="widget" id="error" role="alert">
            <div>
                <strong>${error.userReport?.title}</strong>
                <ul>
                    ${error.userReport?.userSuggestions?.map((suggestion) => html`<li>${suggestion}</li>`)}
                </ul>
                ${error.recoverable && onRetry ? html`<button id="retry" class="primary" onclick=${onRetry}>Try again</button>` : null}
            </div>
        </div>
    `;
}
