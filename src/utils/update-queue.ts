import { logger } from './logger.js';

/**
 * Helper class to manage database updates that occur from
 * hooks that may fire back to back.
 */
class UpdateQueue {
    private entityType: string;
    private queue: Array<() => Promise<void>>;
    private inFlight: boolean;

    constructor(entityType: string) {
        this.entityType = entityType;
        this.queue = [];
        this.inFlight = false;
    }

    queueUpdate(fn: () => Promise<void>): void {
        this.queue.push(fn);
        if (!this.inFlight) {
            this.runUpdate();
        }
    }

    private async runUpdate(): Promise<void> {
        this.inFlight = true;

        while (this.queue.length > 0) {
            const updateIndex = this.queue.length - 1;
            const updateFn = this.queue[updateIndex];

            try {
                await updateFn();
            } catch (e) {
                logger.error("UpdateQueue", e);
            } finally {
                this.queue.splice(updateIndex, 1);
            }
        }

        this.inFlight = false;
    }
}

const updateQueue = new UpdateQueue("All");

/**
 * Safely manages concurrent updates to Foundry documents.
 * @param updateFn - async function that performs the update
 */
export function queueUpdate(updateFn: () => Promise<void>): void {
    updateQueue.queueUpdate(updateFn);
}
