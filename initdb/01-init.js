// создаём пользователя в прикладной БД "icj"
db = db.getSiblingDB('icj');
db.createUser({
  user: 'icj_app',
  pwd:  'icj_app_pass',
  roles: [{ role: 'readWrite', db: 'icj' }]
});

// индексы для GridFS метаданных (если используете вложения)
db.getCollection('fs.files').createIndex({"metadata.target":1,"metadata.targetId":1});
db.getCollection('fs.files').createIndex({"metadata.objectId":1});
db.getCollection('fs.files').createIndex({"uploadDate":-1});
db.getCollection('fs.files').createIndex({"metadata.ocr.status":1});
