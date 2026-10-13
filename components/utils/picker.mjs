import { supportsFileSystemAccess } from "../../model/utils/compatibility.mjs";

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
        return new Promise((resolve) => {
            const input = document.createElement("input");
            input.type = "file";
            input.style.display = "none";

            const finish = (file) => {
                input.remove();
                resolve(file ? { getFile: async () => file } : undefined);
            };

            input.addEventListener("change", () => finish(input.files[0]), { once: true });
            input.addEventListener("cancel", () => finish(undefined), { once: true });

            document.body.appendChild(input);
            input.click();
        });
    }
}
