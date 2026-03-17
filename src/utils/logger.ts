/**
 * Logger utility for Dorman Lakely's Legendary Actions
 */
export class logger {
    static info(title: string, ...args: unknown[]): void {
        console.log(`Dorman ${title || ""} | `, ...args);
    }

    static debug(isDebug: boolean, ...args: unknown[]): void {
        if (isDebug) {
            this.info("Dorman DEBUG | ", ...args);
        }
    }

    static error(title: string, ...args: unknown[]): void {
        console.error(`Dorman ${title || ""} | ERROR | `, ...args);
        ui.notifications.error(`${title || ""} | ERROR | ${args[0]}`);
    }

    static notify(...args: unknown[]): void {
        ui.notifications.notify(`Dorman ${args[0]}`);
    }
}
