import { Injectable } from "@angular/core";
import { knownFolders, path } from "@nativescript/core";
import { openOrCreate, SQLiteDatabase } from "@nativescript-community/sqlite";

const logTag = "Sqlite";

/**
 * Mobile Sqlite large storage
 */
@Injectable({
  providedIn: "root",
})
export class Sqlite {
  private dbInstance: SQLiteDatabase;

  constructor() {
    // Setup to sqlite database instance
    const filePath = path.join(knownFolders.documents().path, "db.sqlite");
    this.dbInstance = openOrCreate(filePath);

    // Create all tables needed for large storage
    const sql = `CREATE TABLE IF NOT EXISTS \`tokens\` (\'id\' TEXT,\'token\' TEXT,\'name\' TEXT)`;
    this.dbInstance.execute(sql).then(
      () => {
        console.log(logTag, "CREATED TABLE:", "tokens");
      },
      (error: unknown) => {
        console.log(logTag, "CREATE TABLE ERROR", error);
      }
    );
  }

  setItem(table: string, keyValuePairs: { [key: string]: string }) {
    return new Promise((resolve) => {
      if (this.dbInstance) {
        this._insert(table, keyValuePairs, resolve);
      }
    });
  }

  private _insert(
    tableName: string,
    keyValuePairs: { [key: string]: string },
    resolve: (value: unknown) => void
  ) {
    let sql: string;
    const properties = [];
    const propInsert = [];
    const values = [];
    for (const key in keyValuePairs) {
      properties.push(`\'${key}\'`);
      propInsert.push(`?`);
      values.push(keyValuePairs[key]);
    }
    // select the table to get the row id to update
    sql = `INSERT INTO \'${tableName}\' (id, ${properties.join(
      ","
    )}) VALUES (?, ${propInsert.join(",")})`;

    console.log(logTag, sql);
    console.log(logTag, "values:", values);
    this.dbInstance.execute(sql, [crypto.randomUUID(), ...values]).then(
      (id) => {
        console.log(logTag, "setItem RESULT", id);
        resolve(id);
      },
      (error) => {
        console.log(logTag, "setItem ERROR", error);
      }
    );
  }

  getItem(table: string): Promise<any> {
    return new Promise((resolve) => {
      if (this.dbInstance) {
        this._selectAllFromTable(table).then(
          (rows) => {
            this._getItemsFromTable(rows, resolve);
          },
          (error) => {
            console.log(logTag, "SELECT ERROR", error);
            this._getItemsFromTable(null, resolve);
          }
        );
      }
    });
  }

  clearTable(table: string) {
    return new Promise((resolve) => {
      this.dbInstance.execute("DELETE FROM `tokens`").then(
        () => {
          console.log(logTag, "DELETED TABLE:", "tokens");
        },
        (error: unknown) => {
          console.log(logTag, "DROP TABLE ERROR", error);
        }
      );
    });
  }

  private _getItemsFromTable(rows: unknown, resolve: (value: unknown) => void) {
    if (rows && Array.isArray(rows) && rows.length) {
      console.log(logTag, "getItem rows.length", rows.length);
      resolve(rows);
    } else {
      resolve(null);
    }
  }

  private _selectAllFromTable(tableName: string) {
    const sql = `SELECT * FROM \'${tableName}\'`;
    console.log(logTag, sql);
    return this.dbInstance.select(sql);
  }
}
