function abortDefault(def) {
    return (error) => {
        if (error.name !== "AbortError") throw error;
        return def;
    };
}

export async function openFile() {
    return (await window.showOpenFilePicker()
        .catch(abortDefault([])))?.[0];
}

export async function saveFile(name) {
    return await window.showSaveFilePicker({"suggestedName": name})
        .catch(abortDefault(null));
}