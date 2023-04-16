import { html } from 'https://esm.sh/htm/preact/standalone'
export function ErrorDisplay(props) {
    const { error } = props;
    return html`
        <div class="widget" id="error">
            <div>
                <strong>${error.title}</strong>
                <ul>
                    ${error.userSuggestions.map((suggestion) => html`<li>${suggestion}</li>`)}
                </ul>    
            </div>
        </div>
    `;
}