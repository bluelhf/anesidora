export class Opfs {
    constructor() {
        this.askedPermission = false;
        this.writeWorker = new Worker("./scripts/opfs/writeWorker.mjs");
    }

    async store(stream) {
        await this.askPersistencePermission();

        const directory = await navigator.storage.getDirectory();

        const handle = await directory.getFileHandle(crypto.randomUUID(), { create: true });

        const promise = new Promise((resolve, reject) => {
            this.writeWorker.onmessage = (event) => resolve(handle);
            this.writeWorker.onerror = (event) => reject(event.error);
            this.writeWorker.postMessage({ handle, stream }, [ stream ]);
        });

        return await promise;
    }

    async askPersistencePermission() {
        if (this.askedPermission) return;
        this.askedPermission = true;
        await navigator.storage.persist();
    }

    close() {
        this.writeWorker.terminate();
    }
}