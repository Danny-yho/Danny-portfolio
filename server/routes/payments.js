const express = require('express');
const controller = require('../controllers/order-controller');
const { authenticate, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../utils/schemas');

const router = express.Router();
router.post('/paystack/verify', validate(schemas.paymentVerification), controller.verifyPaystack);
router.post('/paystack/webhook', controller.paystackWebhook);

module.exports = router;
