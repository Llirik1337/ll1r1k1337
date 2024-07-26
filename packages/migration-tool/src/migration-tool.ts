import { type FileResolver } from './resolvers';
import { type State } from './state';
import { program } from 'commander';

export type MigrationFunction = (context?: unknown) => Promise<void> | void;

export enum DIRECTION {
  UP = `up`,
  DOWN = `down`,
}

export interface Migration {
  fileName: string;
  up: MigrationFunction;
  down: MigrationFunction;
}

export interface MigrationToolOptions {
  migrations: Migration[];
  context?: unknown;
  initState: () => Promise<State>;
  resolvers?: Record<string, FileResolver>;
}

export class MigrationTool {
  constructor(private readonly options: MigrationToolOptions) {}

  async up(): Promise<void> {
    const { context, initState, migrations } = this.options;

    const state = await initState();

    try {
      const upMigrations = await state.getUpMigrations(migrations);

      if (upMigrations.length === 0) {
        console.log(`No migrations to up`);
        return;
      }

      for (const migration of upMigrations) {
        console.log(`Up: ${migration.fileName}`);
        await migration.up(context);
        await state.markaAsUp(migration);
        console.log(`Up: ${migration.fileName} ✔️`);
      }
    } finally {
      await state.close?.();
    }
  }

  async down(): Promise<void> {
    const { context, initState, migrations } = this.options;

    const state = await initState();

    try {
      const downMigrations = await state.getDownMigrations(migrations);

      if (downMigrations.length === 0) {
        console.log(`No migrations to down`);
        return;
      }

      for (const migration of downMigrations) {
        console.log(`Down: ${migration.fileName}`);
        await migration.down(context);
        await state.markAsDown(migration);
        console.log(`Down: ${migration.fileName} ✔️`);
      }
    } finally {
      await state.close?.();
    }
  }

  static async run(config: MigrationToolOptions): Promise<void> {
    program.option(`-d, --direction <up|down>`, `up or down`, `up`).parse();

    const options: { config: string; direction: string; typescript: boolean } =
      program.opts();

    const migrationTool = new MigrationTool(config);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (options.direction === DIRECTION.UP) {
      await migrationTool.up();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    } else if (options.direction === DIRECTION.DOWN) {
      await migrationTool.down();
    } else {
      throw new Error(`Unknown direction: ${options.direction}`);
    }
  }
}
