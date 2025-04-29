
import Database from 'better-sqlite3';

class DatabaseHandler {
  constructor(databaseFile = 'public/sqlite/system.db') {
    this.db = new Database(databaseFile);
  }

  createTable(tableName, columns) {
    const columnDefinitions = Object.entries(columns)
      .map(([name, type]) => `${name} ${type}`)
      .join(', ');
    const query = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefinitions});`;
    this.db.prepare(query).run();
  }

  insert(tableName, data) {
    const keys = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const query = `INSERT INTO ${tableName} (${keys}) VALUES (${placeholders});`;
    const statement = this.db.prepare(query);
    return statement.run(Object.values(data));
  }

  update(tableName, data, whereClause, whereParams) {
    const updates = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(', ');
    const query = `UPDATE ${tableName} SET ${updates} WHERE ${whereClause};`;
    const statement = this.db.prepare(query);
    return statement.run([...Object.values(data), ...whereParams]);
  }

  delete(tableName, whereClause, whereParams) {
    const query = `DELETE FROM ${tableName} WHERE ${whereClause};`;
    const statement = this.db.prepare(query);
    return statement.run(whereParams);
  }

  select(tableName, columns = '*', whereClause = '', whereParams = []) {
    const query = `SELECT ${columns} FROM ${tableName} ${whereClause ? `WHERE ${whereClause}` : ''};`;
    const statement = this.db.prepare(query);
    return statement.all(whereParams);
  }

  close() {
    this.db.close();
  }
}

export default DatabaseHandler;