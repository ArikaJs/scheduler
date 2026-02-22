
## Arika Scheduler

`@arikajs/scheduler` provides a clean, expressive, and framework-integrated task scheduling system for the ArikaJS ecosystem.

It allows you to define scheduled jobs directly in code using a fluent API — similar in spirit to Laravel’s scheduler — while remaining lightweight and Node.js-native.

The scheduler is designed to work seamlessly with `@arikajs/foundation`, `@arikajs/queue`, and `@arikajs/logging`.

---

## ✨ Features

- **🕒 Fluent scheduling API**: Expressive and readable schedule definitions
- **🔁 Cron-based scheduling**: Full support for standard cron expressions
- **⏱ Human-readable intervals**: Preset methods like `everyMinute()`, `hourly()`, `daily()`
- **🧵 Queue integration**: Dispatch jobs directly to the background instead of blocking
- **🪵 Logging integration**: Automatically logs task starts, completions, and failures
- **🚦 Overlapping prevention**: Use cache locks to ensure tasks don't run twice simultaneously
- **🌍 Timezone support**: Run tasks relative to your preferred global or local timezone
- **🧠 Stateless & worker-safe**: Perfect for containerized or clustered deployments
- **🟦 TypeScript-first**: Full type safety for all scheduling operations

---

## 📦 Installation

```bash
npm install @arikajs/scheduler
# or
yarn add @arikajs/scheduler
# or
pnpm add @arikajs/scheduler
```

**Requires:**
- `@arikajs/foundation`
- `@arikajs/logging`
- `@arikajs/queue` (optional but recommended)

---

## 🚀 Quick Start

### 1️⃣ Define Scheduled Tasks

Create a scheduler definition file (e.g., `app/Console/Kernel.ts`):

```ts
import { Schedule } from '@arikajs/scheduler';

export default (schedule: Schedule) => {
  // Run a closure every minute
  schedule.call(() => {
    console.log('Running every minute');
  }).everyMinute();

  // Run a CLI command daily
  schedule.command('app:cleanup').daily();

  // Dispatch a job to the queue hourly
  schedule.job(CleanupJob).hourly();
};
```

### 2️⃣ Run the Scheduler

You can run the scheduler in two modes:

**Long-running Daemon (Recommended for Production)**
```bash
arika schedule:work
```

**Single Run (For Cron Jobs)**
```bash
* * * * * cd /path-to-your-project && node artisan schedule:run >> /dev/null 2>&1
```

---

## 📅 Defining Tasks

### 🔁 Run a Closure
```ts
schedule.call(async () => {
  await db.table('users').where('active', false).delete();
}).everyMinute();
```

### 🧾 Run a Command
```ts
schedule.command('cache:clear').dailyAt('02:00');
```

### 🧵 Dispatch a Queue Job
```ts
schedule.job(SendEmailsJob).everyFiveMinutes();
```
*Note: This will dispatch the job to `@arikajs/queue`.*

---

## ⏱ Frequency Methods

| Method | Description | Cron Equivalent |
| :--- | :--- | :--- |
| `.everyMinute()` | Run every minute | `* * * * *` |
| `.everyFiveMinutes()` | Run every 5 minutes | `*/5 * * * *` |
| `.hourly()` | Run at the start of every hour | `0 * * * *` |
| `.hourlyAt(15)` | Run at 15 minutes past the hour | `15 * * * *` |
| `.daily()` | Run at midnight every day | `0 0 * * *` |
| `.dailyAt('13:00')` | Run at 1:00 PM every day | `0 13 * * *` |
| `.weekly()` | Run every Sunday | `0 0 * * 0` |
| `.monthly()` | Run on the first day of every month | `0 0 1 * *` |
| `.cron('* * * * *')` | Custom cron expression | User defined |

---

## 🛡 Advanced Usage

### Preventing Overlaps
If a task should not run if its previous instance is still active:
```ts
schedule
  .command('report:generate')
  .everyMinute()
  .withoutOverlapping();
```
*Requires `@arikajs/cache` to be configured.*

### Timezone Support
```ts
schedule
  .command('backup:run')
  .dailyAt('01:00')
  .timezone('Asia/Kolkata');
```

### Lifecycle Hooks
```ts
schedule
  .command('cleanup')
  .daily()
  .onSuccess(() => {
    console.log('Cleanup successful');
  })
  .onFailure((error) => {
    console.error(`Cleanup failed: ${error.message}`);
  });
```

---

## 🏗 Architecture

```
scheduler/
├── src/
│   ├── Scheduler.ts   # Main runner logic
│   ├── Schedule.ts    # Fluent API definition
│   ├── Event.ts       # Individual task event
│   ├── Worker.ts      # Persistent daemon
│   ├── Contracts/
│   │   └── Task.ts    # Task interface
│   └── index.ts
├── tests/             # Unit tests
├── package.json
├── tsconfig.json
└── README.md
```

---

## 📄 License

`@arikajs/scheduler` is open-source software licensed under the **MIT License**.

---

## 🧭 Philosophy

> "If it must run, it must run reliably."
