const express = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/admin-controller');
const upload = require('../middleware/upload');
const { authenticate, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../utils/schemas');

const router = express.Router();
const adminLimit = rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false });
router.use(authenticate, requireAdmin, adminLimit);

router.get('/products', controller.listProducts);
router.post('/products', validate(schemas.product), controller.createProduct);
router.put('/products/:id', validate(schemas.product), controller.updateProduct);
router.delete('/products/:id', controller.deleteProduct);
router.get('/categories', controller.listCategories);
router.post('/categories', validate(schemas.category), controller.createCategory);
router.put('/categories/:id', validate(schemas.category), controller.updateCategory);
router.delete('/categories/:id', controller.deleteCategory);
router.get('/orders', controller.listOrders);
router.patch('/orders/:id', validate(schemas.orderStatus), controller.updateOrder);
router.get('/settings', controller.listSettings);
router.put('/settings', validate(schemas.settings), controller.updateSettings);
router.post('/uploads', upload.single('image'), controller.uploadImage);
router.get('/messages', controller.listMessages);

module.exports = router;
