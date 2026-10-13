import { html, useEffect } from '../libs/htm-preact.min.mjs';

export function ErrorDisplay(props) {
    const { error, onRetry } = props;
    useEffect(() => {
        if (error.operatorReport) console.error(error.operatorReport);
        if (error.cause) console.error(error.cause);
    }, [error]);

    const { action, recoverable, userReport } = error;
    const canRetry = recoverable && onRetry;

    return html`
        <div class="widget" id="error" role="alert">
            <div class="result">
                <p><strong>${userReport?.title}</strong></p>
                <ul>
                    ${userReport?.userSuggestions?.map((suggestion) => html`<li>${suggestion}</li>`)}
                </ul>
                ${action || canRetry ? html`
                    <div class="actions">
                        ${action ? html`<button id="error-action" class="primary" onclick=${action.run}>${action.label}</button>` : null}
                        ${canRetry ? html`<button id="retry" class=${action ? "wide" : "primary"} onclick=${onRetry}>Try again</button>` : null}
                    </div>
                ` : null}
            </div>
        </div>
    `;
}
