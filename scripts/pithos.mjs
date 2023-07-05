import { decrypt, encrypt } from "./crypt.mjs";
import { buildStream, MetadataParser, ProgressStream } from "./utils/stream.mjs";
import { API_ENDPOINT } from "./config.mjs";
import { Opfs } from "./opfs.mjs";

export const UploadState = {
    Encrypting: "encrypting",
    RequestingPermission: "requesting_permission",
    Uploading: "uploading",
    Done: "done",
}

export const DownloadState = {
    RequestingPermission: "requesting_permission",
    Downloading: "downloading",
    Done: "done",
}

export class Pithos {
    constructor(endpoint) {
        this.endpoint = endpoint;
        this.opfs = new Opfs();
    }

    async upload(file, onProgress) {
        const metadata = { name: file.name }
        const prefix = JSON.stringify(metadata) + "\x02";

        let start = Date.now();
        const unencrypted = buildStream(prefix, file.stream())
            .pipeThrough(new ProgressStream(file.size, (progress, total) => {
                onProgress({ state: UploadState.Encrypting, progress, total, start });
            }));

        const { secret, encrypted } = await encrypt(unencrypted);

        const handle = await this.opfs.store(encrypted);

        start = Date.now();
        onProgress({ state: UploadState.RequestingPermission, start });
        const { url, uuid } = await this.requestUploadPermission(prefix.length + file.size);

        start = Date.now();

        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (event) => {
            onProgress({ state: UploadState.Uploading, progress: event.loaded, total: event.total, start });
        });

        const promise = new Promise((resolve, reject) => {
            xhr.addEventListener("load", () => {
                onProgress({ state: UploadState.Done, secret, uuid });
                resolve({ secret, uuid });
            });

            xhr.addEventListener("error", reject);
        });

        xhr.open("PUT", url);
        xhr.send(await handle.getFile());

        return promise;
    }

    async download(uuid, secret, onProgress) {
        onProgress({ state: DownloadState.RequestingPermission });
        const { url } = await this.requestDownloadPermission(uuid);

        const response = await fetch(url);
        const contentLength = parseInt(response.headers.get("Content-Length"));

        const metadataParser = new MetadataParser();
        const encrypted = response.body;

        const start = Date.now();
        const decrypted = await (await decrypt({ secret,
            encrypted: encrypted.pipeThrough(new ProgressStream(contentLength, (progress, total) => {
                onProgress({ state: DownloadState.Downloading, progress, total, start });
            }))
        })).pipeThrough(new TransformStream(metadataParser));

        const handle = await this.opfs.store(decrypted);
        onProgress({ state: DownloadState.Done, handle, metadata: metadataParser.metadata });
        return { handle, metadata: metadataParser.metadata };
    }

    async requestUploadPermission(size) {
        const response = await fetch(this.endpoint + "/upload", {
            headers: { "X-File-Size": size }
        });

        return await response.json();
    }

    async requestDownloadPermission(uuid) {
        const response = await fetch(this.endpoint + "/download/" + uuid);
        return await response.json();
    }
}

export const PITHOS = new Pithos(API_ENDPOINT);
