
import { Container } from '@arikajs/foundation';
import { Log } from '@arikajs/logging';
import { Schedule } from './Schedule';
import { Event } from './Event';

export class Scheduler {
    protected schedule: Schedule;

    constructor(protected container: Container) {
        this.schedule = new Schedule();
    }

    /**
     * Define the schedule.
     */
    public define(callback: (schedule: Schedule) => void): this {
        callback(this.schedule);
        return this;
    }

    /**
     * Run the scheduled tasks.
     */
    public async run(date: Date = new Date()): Promise<void> {
        const config = this.container.make('config') as any;
        const timezone = config.get('app.timezone', 'UTC');
        const dueEvents = this.schedule.dueEvents(date, timezone);

        if (dueEvents.length === 0) {
            return;
        }

        Log.info(`Running ${dueEvents.length} scheduled tasks...`);

        for (const event of dueEvents) {
            await this.runEvent(event);
        }
    }

    protected async runEvent(event: Event): Promise<void> {
        try {
            // Check for overlapping
            if (event.shouldSkipOverlapping()) {
                const locked = await this.isLocked(event);
                if (locked) {
                    Log.debug(`Skipping task [${this.getEventName(event)}] as it is still running.`);
                    return;
                }
                await this.lock(event);
            }

            Log.info(`Running scheduled task: [${this.getEventName(event)}]`);

            if (typeof event.command === 'string') {
                const { CommandRegistry } = await import('@arikajs/console');
                const registry = this.container.make(CommandRegistry) as any;
                await registry.run([event.command]);
            } else {
                await event.run();
            }

            Log.info(`Task [${this.getEventName(event)}] completed successfully.`);

        } catch (e: any) {
            Log.error(`Task [${this.getEventName(event)}] failed: ${e.message}`);
        } finally {
            if (event.shouldSkipOverlapping()) {
                await this.unlock(event);
            }
        }
    }

    protected getEventName(event: Event): string {
        return typeof event.command === 'string' ? event.command : 'closure';
    }

    protected async isLocked(event: Event): Promise<boolean> {
        if (!this.container.has('cache')) return false;
        const cache = this.container.make('cache') as any;
        return await cache.has(this.getMutexName(event));
    }

    protected async lock(event: Event): Promise<void> {
        if (!this.container.has('cache')) return;
        const cache = this.container.make('cache') as any;
        await cache.put(this.getMutexName(event), true, event.mutexExpiration());
    }

    protected async unlock(event: Event): Promise<void> {
        if (!this.container.has('cache')) return;
        const cache = this.container.make('cache') as any;
        await cache.forget(this.getMutexName(event));
    }

    protected getMutexName(event: Event): string {
        return `framework/schedule-${Buffer.from(this.getEventName(event) + event.expression()).toString('base64')}`;
    }
}
