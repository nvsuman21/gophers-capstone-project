// const BaseModel = require('./BaseModel');
// const db = require('../config/db');

// class IngredientModel extends BaseModel {
//   constructor() {
//     super('ingredients');
//   }

//   async findByName(name) {
//     const [rows] = await db.query(
//       `SELECT * FROM ingredients WHERE Name = ? LIMIT 1`,
//       [name]
//     );
//     return rows[0];
//   }

//   async create(data) {
//     const [result] = await db.query(`INSERT INTO \`${this.tableName}\` SET ?`, [data]);
//     return result.insertId;
//   }

//   async getAll() {
//     const [rows] = await db.query(`SELECT * FROM \`${this.tableName}\``);
//     return rows;
//   }

//   async delete(id) {
//     const [result] = await db.query(`DELETE FROM \`${this.tableName}\` WHERE id = ?`, [id]);
//     return result.affectedRows > 0;
//   }

//   async findById(id) {
//     const [rows] = await db.query(`SELECT * FROM \`${this.tableName}\` WHERE id = ? LIMIT 1`, [id]);
//     return rows[0];
//   }

//   async rawQuery(query, params) {
//     return await db.query(query, params);
//   }
// }

// module.exports = new IngredientModel();
