import { supportsFileSystemAccess } from "../compatibility.mjs";

function abortDefault(def) {
    return (error) => {
        if (error.name !== "AbortError") throw error;
        return def;
    };
}

export async function openFile() {
    if (supportsFileSystemAccess) {
        return (await window.showOpenFilePicker()
            .catch(abortDefault([])))?.[0];
    } else {
        const input = document.createElement("input");
        input.type = "file";
        input.style.display = "none";
        document.body.appendChild(input);
        input.click();

        const file = new Promise((resolve, reject) => {
            input.addEventListener("change", () => {
                resolve(input.files[0]);
            }, {once: true});
        });

        document.body.removeChild(input);
        return { getFile: () => file }
    }
}

export async function saveFile(name) {
    if (supportsFileSystemAccess) {
        return await window.showSaveFilePicker({"suggestedName": name})
            .catch(abortDefault(null));
    } else {
        const persistent = await navigator.storage.persist();


        const directory = await navigator.storage.getDirectory();
        const handle = await directory.getFileHandle(name, {create: true});
        const file = await handle.getFile();
        const writable = await handle.createWritable();
        const writer = writable.getWriter();
        return {
            createWritable: () => {
                return new WritableStream({
                    write(chunk) {
                        return writer.write(chunk);
                    },
                    abort(reason) {
                        return writer.abort(reason);
                    },
                    close() {
                        writer.close();
                        const url = URL.createObjectURL(file);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = name;
                        a.click();
                        URL.revokeObjectURL(url);
                    }
                })
            }
        }
    }
}