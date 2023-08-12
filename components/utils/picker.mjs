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