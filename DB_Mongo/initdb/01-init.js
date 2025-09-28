// создаём прикладную БД и пользователя с правами readWrite
const APP_DB   = process.env.MONGO_APP_DB   || 'icj';
const APP_USER = process.env.MONGO_APP_USER || 'icj_app';
const APP_PASS = process.env.MONGO_APP_PASS || 'icj_app_pass';

db = db.getSiblingDB(APP_DB);

db.createUser({
  user: APP_USER,
  pwd:  APP_PASS,
  roles: [{ role: "readWrite", db: APP_DB }]
});

// индексы для fs.files (GridFS) по метаданным
db.getCollection('fs.files').createIndex({"metadata.target":1,"metadata.targetId":1});
db.getCollection('fs.files').createIndex({"metadata.objectId":1});
db.getCollection('fs.files').createIndex({"uploadDate":-1});
db.getCollection('fs.files').createIndex({"metadata.ocr.status":1});
