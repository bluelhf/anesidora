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
    const version = 1;
    const versionArray = new Uint8Array([version]);

    const exported = (await exportKey(key));
    const secret = bytesToBase64(concatenate(exported, iv, versionArray));

    return {
        encrypted: stream.pipeThrough(new ChunkingStream(CHUNK_SIZE)).pipeThrough(await encryptStream(key, iv, version)),
        secret
    }
}

/**
 * Decrypts a stream of bytes using AES-CTR. The secret must be the one provided by the {@link encrypt} function.
 * */
export async function decrypt({ encrypted, secret }) {
    const secretBytes = base64ToBytes(secret);
    const key = await importKey(secretBytes.slice(0, 32));
    const iv = secretBytes.slice(32, 48);
    const version = secretBytes[48] || 0;

    return encrypted.pipeThrough(new ChunkingStream(CHUNK_SIZE)).pipeThrough(await decryptStream(key, iv, version));
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
function incrementCounterV0(counter) {
    for (let i = 0; i < counter.length; i++) {
        counter[i]++;

        // The slot in the array will have overflowed to 0 if it was 255
        if (counter[i] !== 0) {
            break;
        }
    }
}

function incrementCounterV1(counter, leftmostByte = 8, rightmostByte = 15) {
    for (let i = rightmostByte; i >= leftmostByte; i--) {
        counter[i]++;

        // The slot in the array will have overflowed to 0 if it was 255
        if (counter[i] !== 0) {
            break;
        }
    }
}

async function ncryptStream(key, iv, method, version = 0) {
    switch (version) {
        case 0: return ncryptStreamV0(key, iv, method);
        case 1: return ncryptStreamV1(key, iv, method);
        default: throw new Error("Unsupported encryption version: " + version);
    }
}

// V0 does a few things wrong:
//   - It uses a big-endian counter, when the leftmost half of the counter
//     should be used as a nonce and the rightmost half as a little-endian counter.
//
//   - It _completely ignores_ the IV, starting with a zero-initialised counter instead.
//     Note that this is not a security issue, because the key is randomly generated for each file.
//
// This happened because we changed the encryption scheme, but didn't realise the parameter signature changed.
// Should've used TypeScript...
async function ncryptStreamV0(key, unusedIV, method) {
    const counter = new Uint8Array(16);
    const algorithm = {name: "AES-CTR", counter, length: 64};

    return new TransformStream({
        async transform(chunk, controller) {
            if (!(chunk instanceof ArrayBuffer) && !(ArrayBuffer.isView(chunk))) {
                throw new Error("Encryption is only supported for ArrayBuffers or their views, but got " + chunk + " instead.");
            }

            const encrypted = await crypto.subtle[method](algorithm, key, chunk);

            // The encrypted data is an ArrayBuffer, but we return Uint8Arrays.
            controller.enqueue(new Uint8Array(encrypted));
            incrementCounterV0(counter);
        }
    });
}

// This version _actually_ initialises the eight left-most bytes of the counter with the IV.
async function ncryptStreamV1(key, iv, method) {
    const counter = new Uint8Array(16);
    counter.set(iv.slice(0, 8), 0);
    const algorithm = {name: "AES-CTR", counter, length: 64};
    return new TransformStream({
        async transform(chunk, controller) {
            if (!(chunk instanceof ArrayBuffer) && !(ArrayBuffer.isView(chunk))) {
                throw new Error("Encryption is only supported for ArrayBuffers or their views, but got " + chunk + " instead.");
            }

            const encrypted = await crypto.subtle[method](algorithm, key, chunk);
            controller.enqueue(new Uint8Array(encrypted));
            incrementCounterV1(counter);
        }
    });
}

function encryptStream(key, iv, version) {
    return ncryptStream(key, iv, "encrypt", version);
}

function decryptStream(key, iv, version) {
    return ncryptStream(key, iv, "decrypt", version);
}
//endregion