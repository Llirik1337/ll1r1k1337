import type { Migration } from '../migration-tool';
// eslint-disable-next-line @typescript-eslint/no-empty-function
export const nullFunction = (): void => {};

export type FileResolver = (filePath: string) => Migration;

export * from './ts-js.resolver';
