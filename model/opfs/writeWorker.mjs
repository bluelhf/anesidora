import {Messages} from "./messages.mjs";

let accessMap = new Map();

async function handleCreate(event) {
    const { filename } = event.data;
    const opfs = await navigator.storage.getDirectory();
    const handle = await opfs.getFileHandle(filename, { create: true });
    accessMap.set(filename, await handle.createSyncAccessHandle());
}

async function handleChunk(event) {
    await accessMap.get(event.data.filename).write(event.data.value);
}

async function handleStream(event) {
    const { filename, stream } = event.data;
    const reader = stream.getReader();
    const access = accessMap.get(filename);
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            access.write(value);
        }
    } finally {
        access.close();
        accessMap.delete(filename);
    }
}

onmessage = async (event) => {
    if (event.data.id === Messages.Create) await handleCreate(event);
    if (event.data.id === Messages.WriteChunk) await handleChunk(event);
    if (event.data.id === Messages.WriteStream) await handleStream(event);
    if (event.data.id === Messages.Close) {
        const name = event.data.filename;
        const access = accessMap.get(name);

        access.flush();
        access.close();
        accessMap.delete(name);
    }

    // this is an ACKable packet, so send an ACK
    if (event.data.hasOwnProperty("uid")) postMessage({ uid: event.data.uid });
}
