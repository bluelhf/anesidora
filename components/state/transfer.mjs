export const Phase = {
    Ready: "ready",
};

export const initialTransfer = {
    phase: Phase.Ready,
    progress: 0,
    total: 1,
    start: null,
};

export const Action = {
    Progress: "progress",
    Reset: "reset",
};

export function progressed(event) {
    return { type: Action.Progress, event };
}

export function restarted() {
    return { type: Action.Reset };
}

export function transferReducer(state, action) {
    switch (action.type) {
        case Action.Progress: {
            const { event } = action;
            const next = { ...state, phase: event.state };
            if (event.progress !== undefined) {
                next.progress = event.progress;
                next.total = event.total;
            }
            if (event.start !== undefined) next.start = event.start;
            return next;
        }
        case Action.Reset:
            return initialTransfer;
        default:
            return state;
    }
}
