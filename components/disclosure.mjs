import { html } from '../libs/htm-preact.min.mjs';

export function Disclosure() {
    return html`
        <details>
            <summary>Update on 2026-10-14: User interface improvements</summary>
            <p>
                The user interface of the application has been improved considerably :) It should now also handle errors better, as well as being less likely to stall.
            </p>
            <p>
                The vulnerability disclosure from 2026-06-22 still stands, you can find it in its
                raw form from the <a href="https://raw.githubusercontent.com/bluelhf/anesidora/6e97e28b807669954d5a25d95afc4bf5bf2c6535/components/disclosure.mjs">GitHub commit</a>. Thanks <a href="https://trimpsuz.dev/">trimpsuz</a>!
            </p>
        </details>
    `;
}
