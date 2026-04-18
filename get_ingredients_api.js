// const BaseController = require('./BaseController');
// const ingredientModel = require('../models/IngredientModel');

// class GetIngredientsAPIController extends BaseController {
//   constructor() {
//     super(ingredientModel);
//   }

  
//   async getAll(req, res) {
//     try {
//       console.log('Request Query Parameters:', req.query);

     
//       const page = req.query.page ? parseInt(req.query.page, 10) : 1;
//       const itemsPerPage = req.query.itemsPerPage ? parseInt(req.query.itemsPerPage, 10) : 50;

//       if (isNaN(page) || isNaN(itemsPerPage)) {
//         console.error('Invalid pagination parameters:', { page, itemsPerPage });
//         return res.status(400).json({
//           error: 'Invalid pagination parameters. Ensure page and itemsPerPage are numbers.'
//         });
//       }

//       const offset = (page - 1) * itemsPerPage;
//       console.log(`Pagination - page: ${page}, itemsPerPage: ${itemsPerPage}, offset: ${offset}`);

      
//       const dataQuery = 'SELECT * FROM ingredients LIMIT ? OFFSET ?';
//       const [dataRows] = await this.model.rawQuery(dataQuery, [itemsPerPage, offset]);
//       console.log(`Fetched ${dataRows.length} record(s) for the current page.`);

      
//       const countQuery = 'SELECT COUNT(*) AS total FROM ingredients';
//       const [countRows] = await this.model.rawQuery(countQuery);
//       const totalItems = countRows[0] ? countRows[0].total : 0;
//       console.log(`Total items in DB: ${totalItems}`);

      
//       res.status(200).json({
//         data: dataRows,
//         totalItems,
//         itemsPerPage,
//         currentPage: page
//       });
//     } catch (error) {
//       console.error('Error in getAll with pagination:', error);
//       res.status(500).json({
//         error: 'Server error while fetching ingredients',
//         message: error.message
//       });
//     }
//   }
// }

// module.exports = new GetIngredientsAPIController();
