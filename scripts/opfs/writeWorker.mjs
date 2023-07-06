onmessage = async (event) => {
    const { filename, stream } = event.data;
    const opfs = await navigator.storage.getDirectory();
    const handle = await opfs.getFileHandle(filename, { create: true });

    const access = await handle.createSyncAccessHandle();

    const reader = stream.getReader();
    reader.read().then(async function process({ done, value }) {
        if (done) {
            await access.close();
            postMessage({ done: true });
        } else {

            /*
            * this operation is actually synchronous now, but it used to be asynchronous
            * (despite the name), so we might as well have the useless `await` here to be safe
            * */

            await access.write(value);
            reader.read().then(process);
        }
    });

}