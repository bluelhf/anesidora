export class Opfs {
    constructor() {
        const _ = navigator.storage.persist();
    }

    async store(stream) {
        const directory = await navigator.storage.getDirectory();

        const handle = await directory.getFileHandle(crypto.randomUUID(), { create: true });
        const writable = await handle.createWritable();
        await stream.pipeTo(writable);

        return handle;
    }
}