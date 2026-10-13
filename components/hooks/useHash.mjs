import { useEffect, useState } from '../../libs/htm-preact.min.mjs';

export function useHash() {
    const [ hash, setHash ] = useState(window.location.hash);

    useEffect(() => {
        const onHashChange = () => setHash(window.location.hash);
        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    }, []);

    return hash;
}
