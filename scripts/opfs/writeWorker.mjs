let access;

async function handleCreate(event) {
    const { filename } = event.data;
    const opfs = await navigator.storage.getDirectory();
    const handle = await opfs.getFileHandle(filename, { create: true });
    access = await handle.createSyncAccessHandle();
}

async function handleWrite(event) {
    const { value } = event.data;
    await access.write(value);
}

onmessage = async (event) => {
    if (event.data.id === 0) await handleCreate(event);
    if (event.data.id === 1) await handleWrite(event);
    if (event.data.id === 2) await access.close();

    // this is an ACKable packet, so send an ACK
    if (event.data.hasOwnProperty("uid")) postMessage({ uid: event.data.uid });
}