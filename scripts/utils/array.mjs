/**
 * Concatenates multiple Uint8Arrays into a single Uint8Array. This is slow.
 * @param {...Uint8Array} arrays
 * @returns {Uint8Array}
 * */
export function concatenate(...arrays) {
    let totalLength = 0;
    for (const arr of arrays) {
        totalLength += arr.byteLength;
    }
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.byteLength;
    }

    return result;
}