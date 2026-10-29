const mongoose = require('mongoose');

// Schema FACTORY compiled per tenant connection, same reasoning as
// master-user.model.js — a Record only ever exists inside one master's DB.
const recordSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdByType: { type: String, enum: ['master', 'masterUser'], required: true },
    createdById: { type: String, required: true },
  },
  { timestamps: true }
);

function getRecordModel(connection) {
  return connection.models.Record || connection.model('Record', recordSchema);
}

module.exports = { recordSchema, getRecordModel };
