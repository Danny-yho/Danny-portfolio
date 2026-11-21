const express = require('express');
const controller = require('../controllers/catalog-controller');

const router = express.Router();
router.get('/products', controller.listProducts);
router.get('/products/:slug', controller.getProduct);
router.get('/categories', controller.listCategories);
router.get('/settings', controller.publicSettings);

module.exports = router;
