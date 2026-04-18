// const BaseController = require('./BaseController');
// const ingredientModel = require('../models/IngredientModel');
// const logModel = require('../models/LogModel');

// class IngredientController extends BaseController {
//   constructor() {
//     super(ingredientModel);
//   }

//   async _getUserRole(clerkId) {
//     if (!clerkId) {
//       throw new Error('Missing Clerk ID');
//     }

//     const [rows] = await ingredientModel.rawQuery(
//       'SELECT role FROM users WHERE clerk_id = ?',
//       [clerkId]
//     );

//     if (rows.length === 0) {
//       throw new Error('User not found');
//     }

//     return rows[0].role || 'Guest';
//   }

//   async deleteIngredient(req, res) {
//     try {
//       const ingredientId = parseInt(req.params.id, 10);
//       if (isNaN(ingredientId)) {
//         return res.status(400).json({ message: 'Invalid ingredient ID' });
//       }

//       const ingredient = await ingredientModel.findById(ingredientId);
//       if (!ingredient) {
//         return res.status(404).json({ message: 'Ingredient not found' });
//       }

//       const createdById = req.auth?.userId;
//       if (!createdById) {
//         return res.status(401).json({ message: 'User not authenticated' });
//       }

//       let userRole;
//       try {
//         userRole = await this._getUserRole(createdById);
//       } catch (err) {
//         return res.status(404).json({ message: err.message });
//       }

//       if (ingredient.isCore === 1 && userRole !== 'Admin') {
//         return res.status(403).json({ message: 'Cannot delete: This ingredient is Core!' });
//       }

//       const deleted = await ingredientModel.delete(ingredient.id);
//       if (deleted) {
//         await logModel.insertLog(
//           req.auth.userId,
//           'ingredient',
//           `Deleted ingredient: ${ingredient.Name}`,
//           req.headers['x-forwarded-for'] || req.ip
//         );

//         res.status(200).json({ message: 'Ingredient deleted successfully' });
//       } else {
//         res.status(500).json({ message: 'Failed to delete ingredient' });
//       }
//     } catch (error) {
//       console.error('Error deleting ingredient:', error);
//       res.status(500).json({ message: 'Internal Server Error' });
//     }
//   }

//   // Get ingredients with search, pagination, filtering and sorting
//   async getAllIngredients(req, res) {
//     try {
//       const page = parseInt(req.query.page, 10) || 1;
//       const itemsPerPage = parseInt(req.query.itemsPerPage, 10) || 50;
//       const offset = (page - 1) * itemsPerPage;

//       const {
//         search,
//         sortBy = 'id',
//         sortOrder = 'ASC'
//       } = req.query;
  
//       const conditions = [];
//       const values = [];
  
//       // Search by Name or Username
//       if (search) {
//         conditions.push('(ingredients.Name LIKE ? OR users.username LIKE ?)');
//         values.push(`%${search}%`, `%${search}%`);
//       }
  
//       const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  
//       const query = `
//         SELECT ingredients.*, users.username AS created_by
//         FROM ingredients
//         LEFT JOIN users ON ingredients.clerk_id = users.clerk_id
//         ${whereClause}
//         ORDER BY \`${sortBy}\` ${sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}
//         LIMIT ? OFFSET ?
//       `;
  
//       const [dataRows] = await ingredientModel.rawQuery(query, [...values, itemsPerPage, offset]);
  
//       const [countRows] = await ingredientModel.rawQuery(
//         `SELECT COUNT(*) AS total 
//          FROM ingredients 
//          LEFT JOIN users ON ingredients.clerk_id = users.clerk_id 
//          ${whereClause}`,
//         values
//       );
  
//       const totalItems = countRows[0] ? countRows[0].total : 0;
  
//       res.status(200).json({
//         data: dataRows,
//         totalItems,
//         itemsPerPage,
//         currentPage: page
//       });
  
//     } catch (error) {
//       console.error('Error fetching ingredients:', error);
//       res.status(500).json({ message: 'Failed to fetch ingredients' });
//     }
//   }  

//   async create(req, res) {
//     try {
//       const data = req.body;
  
//       // Required fields check
//       const requiredFields = ['name'];
//       const missingFields = requiredFields.filter(f => !data[f]);
  
//       if (missingFields.length > 0) {
//         return res.status(400).json({
//           success: false,
//           message: `Missing required fields: ${missingFields.join(', ')}`
//         });
//       }
  
//       // Automatically assign created_at
//       data.created_at = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
//       // Validate and fill numeric fields
//       const numericFields = [ 
//         'dry matter', 'crude protein', 'digestible protein', 'total lipid', 'carbohydrate', 'total phosphorus', 'calcium', 'ash', 'gross energy', 
//         'digestible energy', 'alanine', 'arginine', 'aspartic acid', 'cysteine', 'glutamic acid', 'glycine', 'histidine', 'isoleucine', 'leucine', 'lysine', 'methionine', 
//         'phenylalanine', 'proline', 'serine', 'taurine', 'threonine', 'tyrosine', 'valine', 'c14:0', 'c16:0', 'c16:1', 'c18:0', 'c18:1',
//         'c18:2n-6', 'c18:3n-3', 'c20:4n-6', 'c20:5n-3', 'c22:6n-3', 'sfa', 'mufa', 'pufa', 'lcpufa', 'lc n-3', 'lc n-6'];
  
//       numericFields.forEach(field => {
//         if (data[field] === undefined || data[field] === null) {
//           data[field] = 0.00;
//         }
//       });
  
//       for (const field of numericFields) {
//         if (isNaN(data[field])) {
//           return res.status(400).json({
//             message: `${field} must be a number`
//           });
//         }
//       }
  
//       //  CreatedById (from Clerk user ID)
//       const createdById = req.auth?.userId;
//       if (!createdById) {
//         return res.status(401).json({           
//           success: false,
//           message: 'User not authenticated' 
//         });
//       }

//       let userRole;
//       try {
//         userRole = await this._getUserRole(createdById);
//       } catch (err) {
//         return res.status(404).json({ 
//           success: false,
//           message: err.message 
//         });
//       }

//       if (userRole === "Admin") {
//         data.isCore = data.isCore ? 1 : 0;
//       } else {
//         data.isCore = 0;
//       }
//       data.clerk_id = createdById;

//       // Duplicate ingredient check
//       const existingIngredient = await ingredientModel.findByName(data.name);
//       if (existingIngredient && existingIngredient.isCore === 1 && data.isCore === 1) {
//         return res.status(400).json({        
//           success: false,
//           message: `Core ingredient with name "${data.name}" already exists.` 
//         });
//       }
  
//       const id = await ingredientModel.create(data);
//       const newIngredient = await ingredientModel.findById(id);
  
//       await logModel.insertLog(
//         req.auth.userId,
//         'ingredient',
//         `Added ingredient: ${newIngredient.Name}`,
//         req.headers['x-forwarded-for'] || req.ip
//       );
  
//       return res.status(201).json({           
//         success: true,
//         message: `${newIngredient.Name} added successfully.` 
//       });
  
//     } catch (err) {
//       console.error('Error in addIngredient:', err);
//       res.status(500).json({ message: 'Internal server error' });
//     }
//   }

//   async getIngredientByUserId(req, res) {
//     try {
//       const page = parseInt(req.query.page, 10) || 1;
//       const itemsPerPage = parseInt(req.query.itemsPerPage, 10) || 50;
//       const offset = (page - 1) * itemsPerPage;
//       const search = req.query.search || '';
//       const sortBy = req.query.sortBy || 'id';
//       const sortOrder = req.query.sortOrder || 'ASC';

//       const createdById = req.auth?.userId;
//       if (!createdById) {
//         return res.status(401).json({ message: 'User not authenticated' });
//       }

//       try {
//         await this._getUserRole(createdById);
//       } catch (err) {
//         return res.status(404).json({ message: err.message });
//       }

//       // Build conditions
//       const conditions = ['(clerk_id = ? OR isCore = 1)'];
//       const values = [createdById];

//       if (search) {
//         conditions.push('Name LIKE ?');
//         values.push(`%${search}%`);
//       }

//       const whereClause = `WHERE ${conditions.join(' AND ')}`;

//       // Get total count
//       const [countRows] = await ingredientModel.rawQuery(
//         `SELECT COUNT(*) as total FROM ingredients ${whereClause}`,
//         values
//       );
//       const totalItems = countRows[0]?.total || 0;

//       // Add pagination values
//       values.push(itemsPerPage, offset);

//       const [ingredients] = await ingredientModel.rawQuery(
//         `SELECT * FROM ingredients 
//         ${whereClause}
//         ORDER BY \`${sortBy}\` ${sortOrder}
//         LIMIT ? OFFSET ?`,
//         values
//       );

//       res.status(200).json({
//         success: true,
//         data: ingredients,
//         totalItems,
//         itemsPerPage,
//         currentPage: page
//       });

//     } catch (error) {
//       console.error('[Ingredient] Error in getByUserId:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Internal server error',
//         error: process.env.NODE_ENV === 'development' ? error.message : undefined
//       });
//     }
//   }
// }

// module.exports = new IngredientController();
