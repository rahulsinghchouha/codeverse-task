// Strips passwordHash before a document goes back to an HTTP response.
// Repositories keep returning the raw doc from findByEmail (auth needs the
// hash to compare against), but every other read/write goes through this.
function omitPasswordHash(doc) {
  if (!doc) return doc;
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  delete obj.passwordHash;
  return obj;
}

module.exports = { omitPasswordHash };
