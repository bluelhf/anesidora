import { useCallback, useEffect, useReducer, useRef } from '../../libs/htm-preact.min.mjs';
import { initialTransfer, progressed, restarted, transferReducer } from '../state/transfer.mjs';

// The model reports progress per stream chunk, so coalesce it to one render per interval.
const PROGRESS_INTERVAL_MS = 100;

export function useTransfer() {
    const [ transfer, dispatch ] = useReducer(transferReducer, initialTransfer);

    const phase = useRef(initialTransfer.phase);
    const pending = useRef(null);
    const timer = useRef(null);

    const cancelPending = useCallback(() => {
        clearTimeout(timer.current);
        timer.current = null;
        pending.current = null;
    }, []);

    const flush = useCallback(() => {
        const event = pending.current;
        cancelPending();
        if (event) dispatch(progressed(event));
    }, [cancelPending]);

    const report = useCallback((event) => {
        const isProgress = event.progress !== undefined && event.state === phase.current;
        phase.current = event.state;

        if (!isProgress) {
            cancelPending();
            dispatch(progressed(event));
            return;
        }

        pending.current = event;
        if (timer.current === null) timer.current = setTimeout(flush, PROGRESS_INTERVAL_MS);
    }, [cancelPending, flush]);

    const reset = useCallback(() => {
        cancelPending();
        phase.current = initialTransfer.phase;
        dispatch(restarted());
    }, [cancelPending]);

    useEffect(() => cancelPending, [cancelPending]);

    return { transfer, report, reset };
}
