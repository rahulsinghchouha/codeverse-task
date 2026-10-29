const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const superAdminRoutes = require('./routes/super-admin.routes');
const masterRoutes = require('./routes/master.routes');
const publicUserRoutes = require('./routes/public-user.routes');
const recordRoutes = require('./routes/record.routes');
const notFoundHandler = require('./middlewares/not-found.middleware');
const errorHandler = require('./middlewares/error-handler.middleware');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api', routes);

// Mounted at root (not /api) so paths match the brief exactly:
// /superadmin/*, /master/*, /auth/*, /data*.
app.use('/superadmin', superAdminRoutes);
app.use('/master', masterRoutes);
app.use('/auth', publicUserRoutes);
app.use('/data', recordRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
