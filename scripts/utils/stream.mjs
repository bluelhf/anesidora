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

                // If the chunk doesn't fit in the buffer, we need to split it up.
                if (this.position + chunk.byteLength >= chunkSize) {
                    let fits = chunkSize - this.position;
                    this.buffer.set(chunk.slice(0, fits), this.position);
                    controller.enqueue(this.buffer);

                    // Recursively call transform with the remaining chunk.
                    this.buffer = new Uint8Array(chunkSize);
                    this.position = 0;

                    this.transform(chunk.slice(fits), controller);
                } else {
                    this.buffer.set(chunk, this.position);
                    this.position += chunk.byteLength;
                }
            },
            flush(controller) {
                // Make sure we don't leave any data behind.
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

export function toStream(bytearray) {
    return new ReadableStream({
        start(controller) {
            controller.enqueue(bytearray);
            controller.close();
        }
    });
}

export function buildStream(...objects) {
    return new ReadableStream({
        async start(controller) {
            for (const obj of objects) {
                if (obj instanceof ArrayBuffer) {
                    controller.enqueue(new Uint8Array(obj));
                } else if (obj instanceof ReadableStream) {
                    await obj.pipeTo(new WritableStream({
                        write(chunk) {
                            controller.enqueue(chunk);
                        }
                    }));
                } else if (obj?.constructor === String) {
                    controller.enqueue(new TextEncoder().encode(obj));
                }
            }
            controller.close();
        }
    });
}

export function concatStreams(...streams) {
    return new ReadableStream({
        async pull(controller) {
            let stream = streams.shift();

            if (stream) {
                await stream.pipeTo(new WritableStream({
                    write(chunk) {
                        controller.enqueue(chunk);
                    }
                }), { preventClose: true });
            } else {
                controller.close();
            }
        }
    });
}

/**
 * Reads the entire stream into a {@link Uint8Array}.
 * @param {ReadableStream<Uint8Array>} stream The stream to read.
 * @param {number} size The size of the stream in bytes.
 * @return {Promise<Uint8Array>} A promise that resolves to the entire stream, as a Uint8Array..
 * */
export function dangerouslyReadEntireStream(stream, size) {
    return new Promise((resolve, reject) => {
        const reader = stream.getReader();
        const array = new Uint8Array(size);
        let offset = 0;

        reader.read().then(function process({ done, value }) {
            if (done) {
                resolve(array);
            } else {
                array.set(value, offset);
                offset += value.byteLength;
                reader.read().then(process);
            }
        });
    });
}

export class MetadataParserStream {
}