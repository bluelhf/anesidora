import { bytesToBase64, base64ToBytes } from "./thirdparty/base64.mjs";

import { ChunkingStream } from "./utils/stream.mjs";
import { concatenate } from "./utils/array.mjs";
import { CHUNK_SIZE } from "./config.mjs";


/**
 * Encrypts a stream of bytes using AES-CTR. The returned object contains the encrypted stream and the generated
 * base64-encoded secret, consisting of the cryptographic key and the initialization vector.
 * @param {ReadableStream<Uint8Array>} stream - The stream to encrypt.
 * @return {Promise<{encrypted: ReadableStream<Uint8Array>, secret: String}>}
 * */
export async function encrypt(stream) {
    const key = await generateKey();
    const iv = crypto.getRandomValues(new Uint8Array(16));

    const exported = (await exportKey(key));
    const secret = bytesToBase64(concatenate(exported, iv));

    return {
        encrypted: stream.pipeThrough(new ChunkingStream(CHUNK_SIZE)).pipeThrough(await encryptStream(key, iv)),
        secret
    }
}

/**
 * Decrypts a stream of bytes using AES-CTR. The secret must be the one provided by the {@link encrypt} function.
 * */
export async function decrypt({ encrypted, secret }) {
    const secretBytes = base64ToBytes(secret);
    const key = await importKey(secretBytes.slice(0, 32));
    const iv = secretBytes.slice(32);

    return encrypted.pipeThrough(new ChunkingStream(CHUNK_SIZE)).pipeThrough(await decryptStream(key, iv));
}

// region Key Generation
async function generateKey() {
    const algorithm = {name: "AES-CTR", length: 256};
    return await crypto.subtle.generateKey(algorithm, true, ["encrypt", "decrypt"]);
}

async function exportKey(key) {
    return new Uint8Array(await crypto.subtle.exportKey("raw", key));
}

async function importKey(key) {
    const algorithm = {name: "AES-CTR", length: 256};
    return await crypto.subtle.importKey("raw", key, algorithm, true, ["encrypt", "decrypt"]);
}
// endregion

// region Encryption
function incrementCounter(counter) {
    for (let i = 0; i < counter.length; i++) {
        counter[i]++;

        // The slot in the array will have overflowed to 0 if it was 255
        if (counter[i] !== 0) {
            break;
        }
    }
}

async function ncryptStream(key, iv, method) {
    const counter = new Uint8Array(16);
    const algorithm = {name: "AES-CTR", iv, counter, length: 64};

    return new TransformStream({
        async transform(chunk, controller) {
            if (!(chunk instanceof ArrayBuffer) && !(ArrayBuffer.isView(chunk))) {
                throw new Error("Encryption is only supported for ArrayBuffers or their views, but got " + chunk + " instead.");
            }

            const encrypted = await crypto.subtle[method](algorithm, key, chunk);

            // The encrypted data is an ArrayBuffer, but we return Uint8Arrays.
            controller.enqueue(new Uint8Array(encrypted));
            incrementCounter(counter);
        }
    });
}

function encryptStream(key, iv) {
    return ncryptStream(key, iv, "encrypt");
}

function decryptStream(key, iv) {
    return ncryptStream(key, iv, "decrypt");
}
//endregion