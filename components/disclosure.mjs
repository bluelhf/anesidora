import { html } from '../libs/htm-preact.min.mjs';

export function Disclosure() {
    return html`
        <details>
            <summary>Update on 2026-06-22: Important vulnerability disclosure</summary>
            <p>
                At 2026-06-21T00:49:05.256Z, <a href="https://trimpsuz.dev/">trimpsuz</a> responsibly disclosed a
                vulnerability in how Anesidora used the Web Crypto API. A sophisticated attacker may have been able
                to decrypt an encrypted file by correctly guessing 16-byte blocks of the plaintext.
            </p>
            <p>
                Files uploaded after 2026-06-21T00:07:00Z are not affected, as the encryption scheme was
                updated to patch the vulnerability. For files uploaded before that time, particularly if they are disk
                images or other files with predictable blocks, you should assume that an attacker may have been able to
                decrypt the file, and take appropriate precautions. Old files may still be decrypted but remain vulnerable.
            </p>
            <p>
                The vulnerability was caused by a bug in the encryption code wherein the initial counter value was incremented
                by 1 rather than by 262,144 for every chunk (where one chunk consists of 262,144 AES-CTR blocks).
            </p>
            <p>
                Please contact me via <a href="mailto:ilari.suhonen+anesidora@gmail.com">e-mail</a> if you would like
                to delete an affected file, or if you have any questions about the vulnerability.
            </p>
        </details>
    `;
}
