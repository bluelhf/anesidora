export function isTransferable(obj) {
    try {
        const tempArray = [obj];
        const channel = new MessageChannel();
        channel.port1.postMessage(tempArray, tempArray);
        return true;
    } catch (error) {
        return false;
    }
}

export const supportsFileSystemAccess = typeof window !== "undefined" && ("showOpenFilePicker" in window);

export function checkCompatibility() {
    if (!window?.crypto?.subtle) {
        return {
            "compatible": false,
            "error": {
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
    }

    return {
        "compatible": true
    }
}