import * as Polyfills from "../polyfills.mjs";
import { isTransferable } from "../utils/compatibility.mjs";

export const Messages = {
    Create: 0,
    WriteChunk: 1,
    WriteStream: 2,
    Close: 3,
}

if (typeof window !== 'undefined') window.addEventListener("beforeunload", clearOpfs);
await clearOpfs();

export async function clearOpfs() {
    const opfs = await navigator.storage.getDirectory();
    for await (const key of opfs.keys()) {
        console.log("Removed stale entry " + key);
        await opfs.removeEntry(key, { recursive: true });
    }
}

export class Opfs {
    constructor() {
        Polyfills.fillCrypto();

        this.askedPermission = false;
        this.writeWorker = new Worker("./model/opfs/writeWorker.mjs", { "type": "module" });
        this.packetId = 0;
    }

    async waitForAck(worker, uid) {
        let listeners = {};
        const promise = new Promise((resolve, reject) => {
            const onMessage = (event) => {
                if (event.data.uid !== uid) return;
                resolve(event.data);
            };

            worker.addEventListener("message", onMessage);

            const onError = (event) => {
                if (event.data.uid !== uid) return;
                reject(event.data);
            }

            worker.addEventListener("error", onError);
        });

        return await promise.then(() => {
            for (const listener of Object.keys(listeners)) {
                worker.removeEventListener(listener, listeners[listener]);
                delete listeners[listener];
            }
        });
    }

    async send(worker, packet, transfer) {
        const uid = this.packetId++;

        let ackWait = this.waitForAck(worker, uid)
        const message = { ...packet, uid };
        worker.postMessage(message, transfer);

        if (message.value)
            delete message.value;

        return await ackWait;
    }

    process(reader, filename) {
        const process0 = async (event) => {
            if (event.done) {
                await this.send(this.writeWorker, { id: Messages.Close, filename });
                return;
            }

            const packet = { id: Messages.WriteChunk, value: event.value, filename };
            await this.send(this.writeWorker, packet);
            reader.read().then(process0);
        };

        return process0;
    }

    async store(stream) {
        await this.askPersistencePermission();

        this.writeWorker.onerror = this.writeWorker.onmessageerror = this.handleError;

        const opfs = await navigator.storage.getDirectory();
        const filename = crypto.randomUUID();

        await this.send(this.writeWorker, { id: Messages.Create, filename });
        if (isTransferable(new TransformStream())) {
            await this.send(this.writeWorker, {id: Messages.WriteStream, stream, filename}, [stream]);
        } else {
            const reader = stream.getReader();
            reader.read().then(this.process(reader, filename))
            await reader.closed;
        }

        return opfs.getFileHandle(filename, { create: false });
    }

    async delete(handle) {
        const opfs = await navigator.storage.getDirectory();
        await opfs.removeEntry((await handle.getFile()).name);
    }

    handleError(event) {
        console.error(event.error);
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