import { html, useEffect } from 'https://esm.sh/htm/preact/standalone'
export function ErrorDisplay(props) {
    const { error } = props;
    useEffect(() => {
        if (error.operatorReport) console.error(error.operatorReport);
        if (error.cause) console.error(error.cause);
    }, [error]);

    return html`
        <div class="widget" id="error">
            <div>
                <strong>${error.userReport?.title}</strong>
                <ul>
                    ${error.userReport?.userSuggestions?.map((suggestion) => html`<li>${suggestion}</li>`)}
                </ul>    
            </div>
        </div>
    `;
}