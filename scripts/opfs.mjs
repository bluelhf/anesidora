export class Opfs {
    constructor() {
        const _ = navigator.storage.persist();
    }

    async store(stream) {
        const directory = await navigator.storage.getDirectory();

        const handle = await directory.getFileHandle(crypto.randomUUID(), { create: true });

        // FIXME(ilari): use web workers and createSyncAccessHandle()
        //               because webkit sucks and doesn't have createWritable

        const writable = await handle.createWritable();
        await stream.pipeTo(writable);

        return handle;
    }
}