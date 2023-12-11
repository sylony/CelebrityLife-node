import jsonwebtoken from "jsonwebtoken"
import { successRes, badRes } from "./public.js"

const secret = '56664642985197140a6e10709c6dabee50fca53a610306bbd34467a8b3200a75264be93580d77ba93e55323ea4f4e7a3a30b4940051595d559c003baeb29132e'; // key
async function tokenGuard(ctx, next) {
    const token = ctx.headers.token;

    if (!token) {
        ctx.status = 402;
        ctx.body = badRes({ code: 402, msg: 'No token' })
        return;
    }

    try {
        const decoded = jsonwebtoken.verify(token, secret);

        if (decoded.type !== "1") {
            return ctx.body = badRes({ code: 402, msg: 'User types that cannot be operated on' });
        }

        ctx.state.user = decoded;
        await next();
    } catch (err) {
        console.log(err)
        ctx.status = 402;
        ctx.body = badRes({ code: 402, msg: 'Invalid token' });
    }
}

async function tokenGuardAdmin(ctx, next) {
    const token = ctx.headers.token;

    if (!token) {
        ctx.status = 402;
        ctx.body = badRes({ code: 402, msg: 'Invalid token' });
        return;
    }

    try {
        const decoded = jsonwebtoken.verify(token, secret);

        if (decoded.type !== "3") {
            return ctx.body = badRes({ code: 402, msg: 'User types that cannot be operated on' });
        }

        ctx.state.user = decoded;
        await next();
    } catch (err) {
        console.log(err)
        ctx.status = 402;
        ctx.body = badRes({ code: 402, msg: 'Invalid token' });
    }
}

async function tokenGuardCelebrity(ctx, next) {
    const token = ctx.headers.token;

    if (!token) {
        ctx.status = 402;
        ctx.body = badRes({ code: 402, msg: 'Invalid token' });
        return;
    }

    try {
        const decoded = jsonwebtoken.verify(token, secret);

        if (decoded.type !== "2") {
            return ctx.body = badRes({ code: 402, msg: 'User types that cannot be operated on' });
        }

        ctx.state.user = decoded;
        await next();
    } catch (err) {
        console.log(err)
        ctx.status = 402;
        ctx.body = badRes({ code: 402, msg: 'Invalid token' });
    }
}

async function tokenGuardAdminAndCelebrity(ctx, next) {
    const token = ctx.headers.token;

    if (!token) {
        ctx.status = 402;
        ctx.body = badRes({ code: 402, msg: 'Invalid token' });
        return;
    }

    try {
        const decoded = jsonwebtoken.verify(token, secret);

        if (decoded.type === "1") {
            return ctx.body = badRes({ code: 402, msg: 'User types that cannot be operated on' });
        }

        ctx.state.user = decoded;
        await next();
    } catch (err) {
        console.log(err)
        ctx.status = 402;
        ctx.body = badRes({ code: 402, msg: 'Invalid token' });
    }
}


export {
    tokenGuard,
    tokenGuardCelebrity,
    tokenGuardAdmin,
    tokenGuardAdminAndCelebrity,
    //
    secret,
}