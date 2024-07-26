import { basename } from 'node:path';
import type { FileResolver } from '.';
import { nullFunction } from '.';

export interface TypescirptMigrationFile {
  up?: (context?: unknown) => Promise<void> | void;
  down?: (context?: unknown) => Promise<void> | void;
}

// eslint-disable-next-line @typescript-eslint/require-await
export const tsJsResolver: FileResolver = (filePath: string) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const file = require(filePath) as TypescirptMigrationFile;

  const up = file.up ?? nullFunction;
  const down = file.down ?? nullFunction;

  return { up, down, fileName: basename(filePath) };
};
