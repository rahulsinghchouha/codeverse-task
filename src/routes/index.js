const express = require('express');
const userRoutes = require('./user.routes');

// Adding a new feature (e.g. "order") means adding one line here, not
// editing existing routers. (Open/Closed Principle)
const router = express.Router();

router.use('/users', userRoutes);

module.exports = router;
