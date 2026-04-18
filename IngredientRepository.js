const db = require("../config/db");

class IngredientRepository {
  // shared WHERE builder
  _searchClause(search) {
    if (!search) return { sql: "", params: [] };
    // Search by ingredient.Name or users.username
    const like = `%${search}%`;
    return {
      sql: "WHERE (ingredients.Name LIKE ? OR users.username LIKE ?)",
      params: [like, like]
    };
  }

  async listAll({ search, sortBy = "id", sortOrder = "ASC", limit = 50, offset = 0 }) {
    const { sql, params } = this._searchClause(search);
    const [rows] = await db.query(
      `
      SELECT ingredients.*, users.username AS created_by
      FROM ingredients
      LEFT JOIN users ON ingredients.clerk_id = users.clerk_id
      ${sql}
      ORDER BY \`${sortBy}\` ${sortOrder === "DESC" ? "DESC" : "ASC"}
      LIMIT ? OFFSET ?
      `,
      [...params, Number(limit), Number(offset)]
    );
    return rows;
  }

  async countAll({ search }) {
    const { sql, params } = this._searchClause(search);
    const [rows] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM ingredients
      LEFT JOIN users ON ingredients.clerk_id = users.clerk_id
      ${sql}
      `,
      params
    );
    return rows[0] ? rows[0].total : 0;
  }

  async listByClerk({ clerkId, search, sortBy = "id", sortOrder = "ASC", limit = 50, offset = 0 }) {
    const { sql, params } = this._searchClause(search);
    const [rows] = await db.query(
      `
      SELECT ingredients.*, users.username AS created_by
      FROM ingredients
      LEFT JOIN users ON ingredients.clerk_id = users.clerk_id
      WHERE ingredients.clerk_id = ?
      ${sql ? `AND ${sql.replace("WHERE ", "")}` : ""}
      ORDER BY \`${sortBy}\` ${sortOrder === "DESC" ? "DESC" : "ASC"}
      LIMIT ? OFFSET ?
      `,
      [clerkId, ...params, Number(limit), Number(offset)]
    );
    return rows;
  }

  async countByClerk({ clerkId, search }) {
    const { sql, params } = this._searchClause(search);
    const [rows] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM ingredients
      LEFT JOIN users ON ingredients.clerk_id = users.clerk_id
      WHERE ingredients.clerk_id = ?
      ${sql ? `AND ${sql.replace("WHERE ", "")}` : ""}
      `,
      [clerkId, ...params]
    );
    return rows[0] ? rows[0].total : 0;
  }

  async getUserRoleByClerkId(connection, clerkId) {
    const [rows] = await connection.query(
      "SELECT role FROM users WHERE clerk_id = ?",
      [clerkId]
    );
    if (!rows.length) {
      const err = new Error("User not found");
      err.status = 404;
      throw err;
    }
    return rows[0].role || "Guest";
  }

  async findByName(connection, name) {
    const [rows] = await connection.query(
      "SELECT * FROM ingredients WHERE Name = ? LIMIT 1",
      [name]
    );
    return rows[0];
  }

  async findById(connection, id) {
    const [rows] = await connection.query(
      "SELECT * FROM ingredients WHERE id = ? LIMIT 1",
      [id]
    );
    return rows[0];
  }

  async insert(connection, row) {
    const [result] = await connection.query("INSERT INTO `ingredients` SET ?", [row]);
    return result.insertId;
  }

  async deleteById(connection, id) {
    const [result] = await connection.query("DELETE FROM `ingredients` WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new IngredientRepository();
