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