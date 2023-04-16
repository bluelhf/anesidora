const supportsRequestStreams = (() => {
    let duplexAccessed = false;

    const hasContentType = new Request('', {
        body: new ReadableStream(),
        method: 'POST',
        get duplex() {
            duplexAccessed = true;
            return 'half';
        },
    }).headers.has('Content-Type');

    return duplexAccessed && !hasContentType;
})();

const OLD_BROWSER = "This browser is too old to use Anesidora.";

export function checkCompatibility() {
    if (!window?.crypto?.subtle) {
        return {
            "compatible": false,
            "userReport": {
                "title": "It's not possible to encrypt your files at the moment.",
                "userSuggestions": [
                    "Try using a modern version of Chrome",
                    "Make sure that the website link starts with https://"
                ],
            },
            "operatorReport": "The Web Crypto API is inaccessible (window.crypto.subtle was " + window?.crypto?.subtle + "). Is this a secure context?"
        }
    }

    if (!supportsRequestStreams) {
        return {
            "compatible": false,
            "userReport": {
                "title": OLD_BROWSER,
                "userSuggestions": [
                    "Try using a modern version of Chrome",
                ],
            },
            "operatorReport": "This browser does not support streaming HTTP requests (Half-duplex feature check failed)."
        }
    }

    if (!("showOpenFilePicker" in window)) {
        return {
            "compatible": false,
            "userReport": {
                "title": OLD_BROWSER,
                "userSuggestions": [
                    "Try using a modern version of Chrome",
                ],
            },
            "operatorReport": "This browser does not support the File System Access API. (window.showOpenFilePicker was " + window?.showOpenFilePicker + ")."
        }
    }

    return {
        "compatible": true
    }
}