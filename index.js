import Koa from 'koa';
import Router from 'koa-router';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import userMod from "./mod/user/index.js";
import shareMod from "./mod/share/index.js";

const app = new Koa();
const router = new Router();


const corsOptions = {
    origin: () => '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
};


app.use(cors(corsOptions));


router.use("/api", userMod).use('/api', shareMod);
app.use(bodyParser()).use(router.allowedMethods()).use(router.routes());

app.on('error', err => {
    console.error('Server error', err);
});


app.listen(4000, () => {
    console.log('Server running on port 4000');
});
