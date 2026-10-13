import { useEffect, useState } from '../../libs/htm-preact.min.mjs';

export function useNow(intervalMs = 250) {
    const [ now, setNow ] = useState(Date.now());

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), intervalMs);
        return () => clearInterval(id);
    }, [intervalMs]);

    return now;
}
