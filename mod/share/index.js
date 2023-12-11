import Router from 'koa-router';
import db from "../../db.js"
import * as bcrypt from "bcrypt"
import { tokenGuard, tokenGuardCelebrity, tokenGuardAdmin, tokenGuardAdminAndCelebrity } from "../../graud.js"
import { successRes, badRes } from "../../public.js"
import jsonwebtoken from "jsonwebtoken"
import moment from "moment";

// import crypto from "crypto"

// 1普通用户 2博主 3管理员 

const shareMod = new Router({ prefix: "/share" });


// share_id TEXT NOT NULL,
// cover TEXT NOT NULL,
// content TEXT NOT NULL,
// score,
// average
// status TEXT NOT NULL,
// link TEXT NOT NULL,
// create_time TEXT NOT NULL

shareMod.post("/add", tokenGuardCelebrity, async ctx => {
    const { cover, content, link, title } = ctx.request.body
    const userJM = ctx.state.user;

    if (!/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(link?.trim())) {
        return ctx.body = badRes({
            msg: "The link format is incorrect"
        })
    }

    const insertSql = `INSERT INTO share (share_id, cover, content, status, create_time, link, title) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const data = [userJM.id, cover, content, "0", moment().format('YYYY-MM-DD HH:mm:ss'), link, title];

    return ctx.body = await new Promise((resolve, reject) => {
        db.run(insertSql, data, function (err) {
            if (err) {
                return resolve(badRes({
                    msg: err
                }))
            }
            resolve(successRes({
                msg: "Successfully published, please wait for administrator review"
            }))
        });
    })
})

shareMod.post("/delete", tokenGuardAdminAndCelebrity, async ctx => {
    const { id } = ctx.request.body
    const userJM = ctx.state.user;

    let deleteSql = `DELETE share WHERE share_id = ? AND id = ?`
    let data = [userJM.id, id]
    if (userJM.type === "3") {
        deleteSql = `DELETE share WHERE id = ?`;
        data = [id]
    }

    return ctx.body = await new Promise((resolve, reject) => {

        db.run(deleteSql, data, function (err) {
            if (err) {
                return resolve(badRes({
                    msg: err
                }))

            }

            resolve(successRes({
                msg: "Delete successful"
            }))

        });


    })
})

shareMod.post("/update", tokenGuardAdminAndCelebrity, async ctx => {
    const { cover, content, link, id } = ctx.request.body
    // const userJM = ctx.state.user;

    const selectRes = await new Promise((resolve, reject) => {
        const selectSql = `SELECT * FROM share WHERE id = ?`
        db.get(selectSql, [id], function (err, row) {
            if (err) {
                return resolve(badRes({
                    msg: err
                }))
            }
            if (!row) {
                resolve({
                    isExist: false,
                    data: row
                })
            }
            resolve({
                isExist: true,
                data: row
            })
        });
    })

    if (!selectRes.isExist) {
        return ctx.body = badRes({ msg: `ID does not exist` })
    }

    return ctx.body = await new Promise((resolve, reject) => {
        const updateSql = `UPDATE share SET cover = ?, content = ?, link = ? WHERE id = ?`
        const data = [cover, content, link, id]
        db.run(updateSql, data, (err) => {
            if (err) {
                resolve(badRes({
                    msg: err.message
                }))
                return
            }
            resolve(successRes({
                msg: "更新成功"
            }))

        })
    })
})

shareMod.get("/get", async ctx => {
    const { author_id } = ctx.request.query
    if (author_id) {
        return ctx.body = await new Promise((resolve, reject) => {
            const selectSql = `
            SELECT share.*, share.share_id, users.username AS user_name
            FROM share
            JOIN users ON share.share_id = users.id
            WHERE share.status = 1 AND share.share_id = ?
            order by id desc`;
            const selectData = [author_id]
            db.all(selectSql, selectData, (err, rows) => {
                if (err) {
                    resolve(badRes({
                        msg: err.message
                    }))
                    return
                }
                resolve(successRes({
                    msg: "Search successful",
                    data: rows
                }))
            })
        })
    }
    return ctx.body = await new Promise((resolve, reject) => {
        const selectSql = `
        SELECT share.*, share.share_id, users.username AS user_name
        FROM share
        JOIN users ON share.share_id = users.id
        WHERE share.status = 1 order by id desc`;
        db.all(selectSql, (err, rows) => {
            if (err) {
                resolve(badRes({
                    msg: err.message
                }))
                return
            }
            resolve(successRes({
                msg: "Search successful",
                data: rows
            }))
        })
    })
})

shareMod.post("/evaluate", tokenGuard, async ctx => {
    const { type, id } = ctx.request.body
    const userJM = ctx.state.user;

    const res = await new Promise((resolve, reject) => {

        const selectSql = `SELECT * FROM share WHERE id = ? AND status = 1`
        const data = [id];

        db.get(selectSql, data, (err, row) => resolve(row))

    })

    if (!res) {
        return ctx.body = badRes({ msg: `Evaluation ID does not exist` })
    }

    const res2 = await new Promise((resolve, reject) => {

        const selectSql = `SELECT * FROM star WHERE star_user_id = ? AND star_id = ?`
        const data = [userJM.id, id];

        db.get(selectSql, data, (err, row) => resolve(row))

    })

    if (res2) {
        return ctx.body = badRes({ msg: `already evaluated it` })
    }


    return ctx.body = await new Promise((resolve, reject) => {
        const insertSql = `INSERT INTO star (star_id, star_user_id, type, create_time) VALUES (?, ?, ?, ?)`;
        const data = [id, userJM.id, type === '1' ? '1' : '0', moment().format('YYYY-MM-DD HH:mm:ss')];
        db.run(insertSql, data, (err, rows) => {
            if (err) {
                resolve(badRes({
                    msg: err.message
                }))
                return
            }
            resolve(successRes({
                msg: "评价成功",
                data: rows
            }))

            let updateSql = `UPDATE share SET negative = negative + 1 WHERE id = ?`
            if (type === "1") {
                updateSql = `UPDATE share SET frontal = frontal + 1 WHERE id = ?`
            }

            db.run(updateSql, [id], (err) => {
                console.log("我去", err)
            })

        })
    })
})

shareMod.get("/evaluation_records", tokenGuard, async ctx => {
    const userJM = ctx.state.user;

    return ctx.body = await new Promise((resolve, reject) => {
        const selectSql = ` 
        SELECT star.*, 
          (
            SELECT json_object(
              'id', share.id, 
              'cover', share.cover, 
              'content', share.content, 
              'frontal', share.frontal, 
              'negative', share.negative, 
              'link', share.link, 
              'create_time', share.create_time,
              'user_name', (SELECT username FROM users WHERE id = share.share_id),
              'user_id', (SELECT id FROM users WHERE id = share.share_id)
            )
            FROM share
            WHERE share.id = star.star_id AND share.status = 1
          ) AS item
        FROM star
        WHERE star.star_user_id = ${userJM.id}`;

        db.all(selectSql, (err, rows) => {
            if (err) {
                resolve(badRes({
                    msg: err.message
                }))
                return
            }
            const processedRows = rows.map(row => ({
                ...row,
                item: JSON.parse(row.item || '{}')
            }));
            resolve(successRes({
                msg: "Search successful",
                data: processedRows
            }))
        })
    })
})

shareMod.get("/get_user_base_info", async ctx => {
    const { id } = ctx.request.query
    return ctx.body = await new Promise((resolve, reject) => {
        const selectSql = `SELECT * FROM users WHERE id = ?`
        const data = [id]
        db.get(selectSql, data, (err, row) => {
            if (row?.password) {
                row.password = undefined
                row.phone = undefined
            }
            resolve(successRes({
                msg: `User search successful`,
                data: row,
            }))
        })
    })
})

shareMod.get("/get_review", tokenGuardAdmin, async ctx => {
    const { id } = ctx.request.query
    return ctx.body = await new Promise((resolve, reject) => {
        const selectSql = `
        SELECT share.*, share.share_id, users.username AS user_name
        FROM share
        JOIN users ON share.share_id = users.id`;
        const data = [id]
        db.all(selectSql, data, (err, row) => {
            if (row?.password) {
                row.password = undefined
            }
            resolve(successRes({
                msg: `Search successful`,
                data: row,
            }))
        })
    })
})

shareMod.post("/review", tokenGuardAdmin, async ctx => {
    const { id, type } = ctx.request.body
    return ctx.body = await new Promise((resolve, reject) => {
        const updatetSql = `
            UPDATE share SET status = ? WHERE id = ?
        `;
        const data = [type === '1' ? '1' : '0', id]
        db.run(updatetSql, data, (err) => {
            resolve(successRes({
                msg: `Operation successful`,
            }))
        })
    })
})

shareMod.get("/search", async ctx => {
    const { title } = ctx.query
    return ctx.body = await new Promise((resolve, reject) => {
        const selectSql = `
        SELECT share.*, share.share_id, users.username AS user_name
        FROM share
        JOIN users ON share.share_id = users.id
        WHERE share.status = 1 AND share.title LIKE '%' || ? || '%'
        order by id desc
        `;
        db.all(selectSql, [title], (err, rows) => {
            if (err) {
                resolve(badRes({
                    msg: err.message
                }))
                return
            }
            resolve(successRes({
                msg: "Search successful",
                data: rows
            }))
        })
    })

})

export default shareMod.routes()