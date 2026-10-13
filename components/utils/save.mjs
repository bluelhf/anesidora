const URL_LIFETIME_MS = 40000;

export async function saveFromHandle(handle, name) {
    const url = URL.createObjectURL(await handle.getFile());
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), URL_LIFETIME_MS);
}
