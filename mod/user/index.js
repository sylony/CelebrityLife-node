import Router from 'koa-router';
import db from "../../db.js"
import * as bcrypt from "bcrypt"
import { tokenGuard, tokenGuardAdmin, secret } from "../../graud.js"
import { successRes, badRes } from "../../public.js"
import jsonwebtoken from "jsonwebtoken"
// import crypto from "crypto"

// 1普通用户 2博主 3管理员 

const userMod = new Router({ prefix: "/user" });


userMod.post("/sign_up", async ctx => {

    const { username, password, email, type, introduce, phone } = ctx.request.body
    if (password?.trim()?.length < 6) {
        return ctx.body = {
            code: 401,
            status: "fail",
            msg: "The password cannot be less than 6 digits in length"
        }
    }

    if (!username?.trim()) {
        return ctx.body = {
            code: 401,
            status: "fail",
            msg: "The username cannot be empty"
        }
    }

    if (!/^[0-9a-zA-Z_.-]+@[0-9a-zA-Z.-]+\.[a-zA-Z]{2,8}$/.test(email.trim())) {
        return ctx.body = {
            code: 401,
            status: "fail",
            msg: "Incorrect email format"
        }
    }

    const hashpwd = await hashPassword(password)

    const res = await new Promise((resolve, reject) => {

        db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
            if (err) {
                reject({
                    code: 401,
                    status: "fail",
                    msg: err.message
                })
            }

            if (!row) {
                const insertSql = `INSERT INTO users (username, password, email, type, introduce, phone) VALUES (?, ?, ?, ?, ?, ?)`;
                const user = [username, hashpwd, email, type, introduce, phone];

                db.run(insertSql, user, function (err) {
                    if (err) {
                        reject({
                            code: 401,
                            status: "fail",
                            msg: err.message
                        })
                    }
                });

                resolve({
                    code: 200,
                    status: "success",
                    msg: "login was successful"
                })
            }

            resolve({
                code: 401,
                status: "fail",
                msg: "This account has been registered"
            })
        });

    })
    return ctx.body = res
})

userMod.post("/delete", tokenGuardAdmin, async ctx => {

    const params = ctx.request.body
    const userJM = ctx.state.user;

    if (!params.id) {
        return ctx.body = {
            code: 401,
            status: "fail",
            msg: "ID does not exist"
        }
    }

    if (userJM.type !== "3") {
        return ctx.body = badRes({ msg: "This user type does not have permission to operate" })
    }

    const deleteSql = `DELETE FROM users WHERE id = ?`;
    const id = params.id;

    db.run(deleteSql, id, function (err) {
        if (err) {
            return console.error(err.message);
        }
    });


    return ctx.body = successRes({ msg: "Delete successful" })

})

userMod.post("/update", tokenGuardAdmin, async ctx => {
    const { username, introduce, phone, id } = ctx.request.body
    const userJM = ctx.state.user;

    if (userJM.id !== id) {
        return ctx.body = {
            code: 401,
            status: "fail",
            msg: "Unauthorized operation"
        }
    }

    if (!id) {
        return ctx.body = {
            code: 401,
            status: "fail",
            msg: "ID does not exist"
        }
    }

    ctx.body = await new Promise((resolve, reject) => {
        const updateSql = `UPDATE users SET username = ?, introduce = ?, phone = ? WHERE id = ?`;
        const data = [username, introduce, phone, id];

        db.run(updateSql, data, function (err) {
            if (err) {
                resolve({
                    code: 401,
                    status: "fail",
                    msg: err.message
                })
            }
        });

        resolve({
            code: 200,
            status: "success",
            msg: "Modified successfully"
        })
    })
})

userMod.get("/get", tokenGuardAdmin, async ctx => {
    return ctx.body = await new Promise((resolve, reject) => {
        db.all(`SELECT * FROM users`, [], (err, rows) => {
            if (err) {
                return resolve({
                    code: 401,
                    status: "fail",
                    msg: err.message
                })
            }

            rows.forEach(item => {
                item.password = undefined
            })

            resolve({
                code: 200,
                status: "success",
                msg: "Search successful",
                data: rows
            })
        });
    })
})

userMod.post("/login", async ctx => {
    const { password, email } = ctx.request.body

    if (password?.trim().length < 6) {
        return ctx.body = {
            code: 401,
            status: "fail",
            msg: "The password cannot be less than 6 digits in length"
        }
    }

    // console.log(email, password)

    if (!/^[0-9a-zA-Z_.-]+@[0-9a-zA-Z.-]+\.[a-zA-Z]{2,8}$/.test(email.trim())) {
        return ctx.body = {
            code: 401,
            status: "fail",
            msg: "Incorrect email format"
        }
    }


    const selectSql = `SELECT * FROM users WHERE email = ?`;
    const data = [email];

    return ctx.body = await new Promise((resolve, reject) => {
        db.get(selectSql, data, async (err, row) => {
            if (err) {
                resolve({
                    code: 401,
                    status: "fail",
                    msg: err.message
                })
            }

            if (!row) {
                resolve({
                    code: 401,
                    status: "fail",
                    msg: "Password or account error"
                })
                return
            }

            if (await checkPassword(password, row.password)) {

                const payload = {
                    id: row.id,
                    username: row.username,
                    email: row.email,
                    type: row.type
                };

                const token = jsonwebtoken.sign(payload, secret, { expiresIn: '24h' }); // Token 在 1 小时后过期
                row.password = undefined

                resolve({
                    code: 200,
                    status: "success",
                    msg: "Login succeeded",
                    token,
                    user: row
                })
                return
            }
            resolve({
                code: 401,
                status: "fail",
                msg: "Password or account error"
            })
        })
    });



})

userMod.post("/follow", tokenGuard, async ctx => {
    let { followId, isUnFollow } = ctx.request.body
    followId = followId.toString().replace(/\D/g, '')
    const userJM = ctx.state.user;

    return ctx.body = await new Promise((resolve, reject) => {

        // 只能关注博主，也就是type 为2的
        const selectSql = `SELECT * FROM users WHERE id = ? AND type = 2`
        const selectData = [followId]
        db.get(selectSql, selectData, (err, row) => {
            if (err) {
                return resolve({ code: 401, status: "fail", msg: err.message })
            }
            // 插入
            if (row) {
                // 首先检查是否已经有记录
                const checkSql = 'SELECT * FROM follow WHERE follow_user_id = ?';
                db.get(checkSql, [userJM.id], (err, followRow) => {
                    if (err) {
                        return resolve(badRes({ msg: err.message }));
                    }

                    if (followRow) {
                        let rowIds = followRow.follow_ids.split(",")
                        if (isUnFollow) {
                            const spliceIndex = rowIds.findIndex(item => item === followId)
                            rowIds.splice(spliceIndex, 1)
                        } else {
                            rowIds.push(followId)
                        }
                        let idsSet = [...new Set(rowIds)]
                        // 如果记录存在，则更新
                        const updateSql = 'UPDATE follow SET follow_ids = ? WHERE follow_user_id = ?';
                        db.run(updateSql, [idsSet.join(','), userJM.id], err => {
                            if (err) {
                                return resolve(badRes({ msg: err.message }));
                            }
                            resolve({
                                code: 200,
                                status: "success",
                                msg: isUnFollow ? "Unfollow successfully" : "Follow updated",
                            });
                        });
                    } else {
                        // 如果记录不存在，则插入
                        const insertSql = 'INSERT INTO follow (follow_ids, follow_user_id) VALUES(?, ?)';
                        db.run(insertSql, [followId, userJM.id], err => {
                            if (err) {
                                return resolve(badRes({ msg: err.message }));
                            }
                            resolve({
                                code: 200,
                                status: "success",
                                msg: "Follow added",
                            });
                        });
                    }
                });
                return;
            }
            return resolve(badRes({ msg: 'Cannot follow this type of user' }));
        })

    })
})

userMod.get("/get_follow", tokenGuard, async ctx => {
    const userJM = ctx.state.user;

    return ctx.body = await new Promise((resolve, reject) => {
        // const followIds = 
        const selectSql = `SELECT follow_ids FROM follow WHERE follow_user_id = ?`
        const selectData = [userJM.id]

        db.get(selectSql, selectData, (err, row) => {
            if (err) {
                return resolve({ code: 401, status: "fail", msg: err.message })
            }

            if (!row) {
                return resolve({ code: 401, status: "fail", msg: "No follow..." })
            }

            const followIds = row.follow_ids.split(",")
            // 创建占位符
            const followIdsPlaceholders = followIds.map(() => '?').join(', ');

            const selectFollowUsersSql = `SELECT username, integral, introduce, email, type, id FROM users WHERE id IN(${followIdsPlaceholders})`
            db.all(selectFollowUsersSql, followIds, (err, rows) => {
                if (err) {
                    return resolve({ code: 401, status: "fail", msg: err.message })
                }

                // console.log(rows)

                resolve(successRes({ msg: "Successfully obtained the following list", data: rows }))
            })
        })

    })
})



async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

async function checkPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
}


export default userMod.routes()