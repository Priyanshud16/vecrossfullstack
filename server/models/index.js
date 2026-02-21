const User = require('./User');
const Annotation = require('./Annotation');
const Rectangle = require('./Rectangle');

// Relationships
User.hasMany(Annotation);
Annotation.belongsTo(User);

Annotation.hasMany(Rectangle, { onDelete: 'CASCADE' });
Rectangle.belongsTo(Annotation);

module.exports = {
  User,
  Annotation,
  Rectangle
};