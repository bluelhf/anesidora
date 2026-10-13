// Shape: { operatorReport, cause, userReport: { title, userSuggestions }, recoverable, action }

export function uploadFailed(cause) {
    return {
        operatorReport: "Uncaught exception while uploading file",
        cause,
        recoverable: true,
        userReport: {
            title: "Uploading the file failed.",
            userSuggestions: [
                "Try again later.",
            ]
        }
    };
}

export function downloadFailed(cause) {
    return {
        operatorReport: "Uncaught exception while downloading file",
        cause,
        recoverable: true,
        userReport: {
            title: "Downloading the file failed.",
            userSuggestions: [
                "Try again later.",
            ]
        }
    };
}

export function quotaExceeded(cause) {
    return {
        operatorReport: "Origin-private file system quota exceeded",
        cause,
        recoverable: true,
        userReport: {
            title: "The file is too large for this browser.",
            userSuggestions: [
                "Try with a modern version of Chrome.",
                "Try again with a smaller file.",
            ]
        }
    };
}
