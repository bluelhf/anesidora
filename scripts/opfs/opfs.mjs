import * as Polyfills from "../polyfills.mjs";

// todo: on supporting browsers use transferable streams instead,
//       it looks like the current implementation leaks memory
export class Opfs {
    constructor() {
        Polyfills.fillCrypto();

        this.askedPermission = false;
        this.writeWorker = new Worker("./scripts/opfs/writeWorker.mjs");
        this.packetId = 0;
    }

    async send(worker, packet) {
        let listeners = {};
        const uid = this.packetId++;
        const promise = new Promise((resolve, reject) => {
            const onMessage = (event) => {
                if (event.data.uid !== uid) return;
                resolve(event.data);
            };

            listeners.message = onMessage
            worker.addEventListener("message", onMessage);

            const onError = (event) => {
                if (event.data.uid !== uid) return;
                reject(event.data);
            }

            listeners.error = onError;
            worker.addEventListener("error", onError);
        });

        worker.postMessage({ ...packet, uid });
        return await promise.then(() => {
            for (const listener of Object.keys(listeners)) {
                worker.removeEventListener(listener, listeners[listener]);
            }
        });
    }

    async store(stream) {
        await this.askPersistencePermission();

        this.writeWorker.onerror = this.writeWorker.onmessageerror = (event) => {
            console.error(event);
        };

        const opfs = await navigator.storage.getDirectory();
        const filename = crypto.randomUUID();

        await this.send(this.writeWorker, { id: 0, filename });

        const reader = stream.getReader();
        await reader.read().then(async function process({ done, value }) {
            if (done) {
                await this.send(this.writeWorker, { id: 2 });
                return;
            }

            await this.send(this.writeWorker, { id: 1, value });
            return reader.read().then(process.bind(this));
        }.bind(this));

        return opfs.getFileHandle(filename, { create: false });
    }

    async askPersistencePermission() {
        if (this.askedPermission) return;
        this.askedPermission = true;
        if (navigator.storage.persist)
            await navigator.storage.persist();
    }

    close() {
        this.writeWorker.terminate();
    }
}