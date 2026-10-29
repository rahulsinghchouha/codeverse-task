const mongoose = require('mongoose');

// Schema FACTORY, not a compiled model: this gets compiled against a tenant
// connection (see config/tenant-db.js), never against the default mongoose
// connection, since master-created users must live only in their master's DB.
const masterUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    // The Master row lives in the central DB on a different connection than
    // this tenant DB, so Mongoose can't auto-populate this the way it can
    // Master.createdBy -> SuperAdmin. Plain stored id, matching how
    // record.model.js stores createdById as a string, not an ObjectId ref.
    masterId: { type: String, required: true },
  },
  { timestamps: true }
);

masterUserSchema.index({ email: 1 }, { unique: true });

function getMasterUserModel(connection) {
  return connection.models.MasterUser || connection.model('MasterUser', masterUserSchema);
}

module.exports = { masterUserSchema, getMasterUserModel };
