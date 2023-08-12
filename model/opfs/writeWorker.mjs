import { Messages } from "./opfs.mjs";

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
    const reader = event.data.stream.getReader();
    const access = accessMap.get(event.data.filename);
    reader.read().then(async function process({value, done}) {
        if (done) return;
        access.write(value);
        reader.read().then(process);
    });

    await reader.closed;
}

onmessage = async (event) => {
    if (event.data.id === Messages.Create) await handleCreate(event);
    if (event.data.id === Messages.WriteChunk) await handleChunk(event);
    if (event.data.id === Messages.WriteStream) await handleStream(event);
    if (event.data.id === Messages.Close) await accessMap.get(event.data.filename).close();

    // this is an ACKable packet, so send an ACK
    if (event.data.hasOwnProperty("uid")) postMessage({ uid: event.data.uid });
}