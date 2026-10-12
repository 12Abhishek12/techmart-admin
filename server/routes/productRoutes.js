const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Ingestion endpoint
router.post('/seed', productController.seedFromExternalAPI);

// CRUD Endpoints
router.get('/', productController.getAllProducts);
router.post('/', productController.createProduct);
router.put('/:id/stock', productController.updateProductStock);
router.delete('/:id', productController.deleteProduct);

module.exports = router;