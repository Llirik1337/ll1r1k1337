import { type Collection, type MongoClient, type Document } from 'mongodb';
import { type Migration, type State } from '@ll1r1k/migration-tool';

export interface MongodbStateOptions {
  client: MongoClient;
  collection: string;
}

type MigrationDocument = {
  fileName: string;
  createdAt: Date;
} & Document;

export class MognodbState implements State {
  private collection!: Collection<MigrationDocument>;

  private constructor(private readonly options: MongodbStateOptions) {}

  private async connect(): Promise<void> {
    const { client, collection } = this.options;
    await client.connect();
    const db = client.db();
    this.collection = db.collection(collection);
    await this.collection.createIndex(
      { fileName: 1 },
      { unique: true, name: `fileName-index` },
    );
    await this.collection.createIndex(
      { createdAt: 1 },
      { name: `created-at-index` },
    );
  }

  static async create(options: MongodbStateOptions): Promise<MognodbState> {
    const mongodbState = new MognodbState(options);

    await mongodbState.connect();

    return mongodbState;
  }

  async getUpMigrations(migrations: Migration[]): Promise<Migration[]> {
    const countMigrations = await this.collection.countDocuments();

    if (countMigrations === 0) {
      return migrations;
    }

    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      const exist = await this.collection.findOne({
        fileName: migration.fileName,
      });

      if (exist == null) {
        return migrations.slice(i);
      }
    }

    return [];
  }

  async getDownMigrations(migrations: Migration[]): Promise<Migration[]> {
    const lastMigrationFromDb = await this.collection.findOne(
      {},
      { sort: { createdAt: -1 } },
    );

    if (lastMigrationFromDb === null) {
      return [];
    }

    const index = migrations.findIndex(
      (migration) => migration.fileName === lastMigrationFromDb.fileName,
    );

    return migrations.slice(0, index + 1);
  }

  async markaAsUp(migration: Migration): Promise<void> {
    const { fileName } = migration;

    await this.collection.insertOne({ fileName, createdAt: new Date() });
  }

  async markAsDown(migration: Migration): Promise<void> {
    const { fileName } = migration;

    await this.collection.deleteOne({ fileName });
  }

  async close(): Promise<void> {
    await this.options.client.close(true);
  }
}
