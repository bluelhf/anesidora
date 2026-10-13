import { useEffect, useRef, useState } from '../../libs/htm-preact.min.mjs';
import { saveFromHandle } from "../utils/save.mjs";
import { downloadFailed } from "../utils/errors.mjs";

const COOLDOWN_MS = 1500;

export function useSavedFile(setError) {
    const saved = useRef(null);
    const [ saving, setSaving ] = useState(false);

    useEffect(() => () => { saved.current?.close(); }, []);

    const keep = async (file) => {
        saved.current = file;
        await saveFromHandle(file.handle, file.name);
    };

    const saveAgain = async () => {
        if (!saved.current || saving) return;
        setSaving(true);

        // Let the disabled button paint first: handing a large file to the browser can block the page.
        await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve)));
        try {
            await saveFromHandle(saved.current.handle, saved.current.name);
        } catch (error) {
            setError(downloadFailed(error));
        } finally {
            setTimeout(() => setSaving(false), COOLDOWN_MS);
        }
    };

    return { keep, saveAgain, saving };
}
