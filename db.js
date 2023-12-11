import sqlite3 from 'sqlite3';


const db = new sqlite3.Database('./DB', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Database initialization completed');

    // 创建 users 表
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        integral INT,
        introduce TEXT,
        type TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE
    )`

        , (err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log('Users exist');
            }
        });

    // 创建 用户分级表
    db.run(`
      CREATE TABLE IF NOT EXISTS share (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        share_id TEXT NOT NULL,
        cover TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        frontal INT DEFAULT 0,
        negative INT DEFAULT 0,
        status TEXT NOT NULL,
        link TEXT NOT NULL,
        create_time TEXT NOT NULL
    )`

        , (err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log('share exist');
            }
        });

    db.run(`
      CREATE TABLE IF NOT EXISTS comment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        content TEXT NOT NULL,
        email TEXT NOT NULL,
        create_time TEXT NOT NULL
    )`

        , (err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log('comment exist');
            }
        });

    // 点赞表
    db.run(`
      CREATE TABLE IF NOT EXISTS star (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        star_id TEXT NOT NULL,
        star_user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        create_time TEXT NOT NULL
    )`

        , (err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log('Star exist');
            }
        });

    //  
    db.run(`
        CREATE TABLE IF NOT EXISTS follow (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          follow_ids TEXT NOT NULL,
          follow_user_id TEXT NOT NULL UNIQUE
      )`

        , (err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log('Follow exist');
            }
        });

});

export default db