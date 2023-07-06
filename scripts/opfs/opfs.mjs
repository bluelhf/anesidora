export class Opfs {
    constructor() {
        this.askedPermission = false;
        this.writeWorker = new Worker("./scripts/opfs/writeWorker.mjs");
    }

    async store(stream) {
        await this.askPersistencePermission();

        const opfs = await navigator.storage.getDirectory();
        const filename = crypto.randomUUID();

        const promise = new Promise((resolve, reject) => {
            this.writeWorker.onmessage = async () => resolve(await opfs.getFileHandle(filename));
            this.writeWorker.onerror = (event) => reject(event.error);

            this.writeWorker.postMessage({ id: 0, filename });

            const reader = stream.getReader();
            reader.read().then(async function process({ done, value }) {
                if (done) {
                    this.writeWorker.postMessage({ id: 2 });
                    return;
                }

                this.writeWorker.postMessage({ id: 1, value });
                reader.read().then(process.bind(this));
            }.bind(this));
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