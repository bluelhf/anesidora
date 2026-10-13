import { concatenate } from "./array.mjs";

export class MetadataParser {

    constructor() {
        this.bytes = new Uint8Array(0);
        this.metadata = null;
    }

    transform(chunk, controller) {
        if (this.metadata === null) {
            const startOfText = chunk.findIndex((byte) => byte === 2);
            if (startOfText === -1) {
                this.bytes = concatenate(this.bytes, chunk);
            } else {
                this.bytes = concatenate(this.bytes, chunk.slice(0, startOfText));
                this.metadata = JSON.parse(new TextDecoder().decode(this.bytes));
                controller.enqueue(chunk.slice(startOfText + 1));
            }
        } else controller.enqueue(chunk);
    }
}

/**
 * A TransformStream that splits up the incoming data into chunks of the given size.
 * @param {number} chunkSize The size of the chunks to split the data into.
 * @extends TransformStream
 * */
export class ChunkingStream extends TransformStream {
    constructor(chunkSize) {
        super({
            buffer: new Uint8Array(chunkSize),
            position: 0,
            transform(chunk, controller) {
                if (!(chunk instanceof Uint8Array)) {
                    throw new Error("ChunkingStream only supports Uint8Array chunks");
                }

                if (this.position + chunk.byteLength >= chunkSize) {
                    let fits = chunkSize - this.position;
                    this.buffer.set(chunk.slice(0, fits), this.position);
                    controller.enqueue(this.buffer);

                    this.buffer = new Uint8Array(chunkSize);
                    this.position = 0;

                    this.transform(chunk.slice(fits), controller);
                } else {
                    this.buffer.set(chunk, this.position);
                    this.position += chunk.byteLength;
                }
            },
            flush(controller) {
                controller.enqueue(this.buffer.slice(0, this.position));
                this.buffer = new Uint8Array(0);
                this.position = 0;
            }
        })
    }
}

/**
 * A TransformStream for TypedArray chunks with a callback for progress updates.
 * @param total The total amount of data to be processed.
 * @param onProgress A callback that will be called with the amount of data processed and the total amount of data.
 * @extends TransformStream
 * */
export class ProgressStream extends TransformStream {
    constructor(total, onProgress, options) {
        super({
            ...options,
            progress: 0,
            transform(chunk, controller) {
                if (!("byteLength" in chunk)) {
                    throw new Error("ProgressStream only supports TypedArray chunks (chunk " + chunk + " does not have a byteLength property)");
                }

                onProgress(this.progress += chunk.byteLength, total);
                controller.enqueue(chunk);
            }
        })
    }
}

export function buildStream(...objects) {
    let index = 0;
    let reader = undefined;
    const encoder = new TextEncoder();
    return new ReadableStream({
        async pull(controller) {
            if (reader) {
                const { done, value } = await reader.read();
                if (!done) {
                    controller.enqueue(value);
                    return;
                } else reader = undefined;
            }

            if (index >= objects.length) {
                controller.close();
                return;
            }

            const current = objects?.[index++];
            if (current instanceof ReadableStream) {
                reader = current.getReader();
                return this.pull(controller);
            } else {
                if (current instanceof ArrayBuffer) controller.enqueue(new Uint8Array(current));
                else if (ArrayBuffer.isView(current)) controller.enqueue(new Uint8Array(current.buffer, current.byteOffset, current.byteLength));
                else if (typeof current === "string") controller.enqueue(encoder.encode(current));
                else throw new TypeError(`Unsupported chunk type ${current.constructor.name}`);
            }
        },

        async cancel(reason) {
            await Promise.allSettled([
                reader?.cancel(reason),
                ...objects
                    .slice(index)
                    .filter(thing => thing instanceof ReadableStream && !thing.locked)
                    .map(stream => stream.cancel(reason))
            ])
        }
    });
}
