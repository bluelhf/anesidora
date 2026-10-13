import { navigateToUpload } from "./route.mjs";

// Shape: { operatorReport, cause, userReport: { title, userSuggestions }, recoverable, action }

const uploadInstead = { label: "Upload one instead", run: navigateToUpload };

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

// Expected, so there is nothing for the operator to log.
export function fileNotFound() {
    return {
        recoverable: false,
        action: uploadInstead,
        userReport: {
            title: "This file could not be found.",
            userSuggestions: [
                "It may have been deleted."
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

export function invalidLink() {
    return {
        operatorReport: "The location hash is not of the form #<uuid>;<secret>",
        recoverable: false,
        action: uploadInstead,
        userReport: {
            title: "This link is not valid.",
            userSuggestions: [
                "Make sure the whole link was copied, including everything after the #.",
            ]
        }
    };
}

export function classifyDownloadError(error) {
    if (error.name === "QuotaExceededError") return quotaExceeded(error);
    if (error.name === "HttpError" && (error.status === 404 || error.status === 410)) return fileNotFound();
    return downloadFailed(error);
}
