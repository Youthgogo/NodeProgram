// const express = require('express');
import express from 'express';
import config from './config'
import nunjucks from 'nunjucks'
import db from './../db/db'

import bodyParser from './../middle_wares/body_parser'
import error_log from './../middle_wares/error_log'
import loginPass from './../middle_wares/login_pass'

//引入express-session
import session from 'express-session'
// 引入connect-mongo用于express连接数据库存储session
const mongoStore  = require('connect-mongo')(session);

//3. 引入路由
import indexRouter from './../routes/index'
import sowingRouter from './../routes/sowing'
import userRouter from './../routes/user'
import sourceRouter from './../routes/source'

const app = express();

//6. 使用session
app.use(session({
  //参数配置
  secret: config.secret,//加密字符串
  name: config.name,//返回客户端key的名称，默认为connect_sid
  resave:false,//强制保存session，即使它没有变化
  saveUninitialized:true,//强制将未初始化的session存储。当新建一个session且未设定属性或值时，它就处于未初始化状态。在设定cookie前，这对于登录验证，减轻服务器存储压力，权限控制是有帮助的，默认为true
  cookie:{maxAge: config.maxAge },  //24小时
  rolling:true, //在每次请求时进行设置cookie，将重置cookie过期时间
  store:new mongoStore({//将session数据存储到mongo数据库中
    url: config.db_url, //数据库地址
    touchAfter: config.maxAge  //多长时间往数据库中更新存储一次，除了在会话数据上更改了某些数据除外
  })
}));

//1.配置公共资源访问路径
app.use(express.static(config.publicPath));

//2.配置中间价(nunjucks模板引擎能够作用到views文件夹中的模板)
nunjucks.configure(config.viewsPath, {
  autoescape: true,
  express: app,
  noCache: true
});

// 配置数据处理的中间件
app.use(bodyParser);

//7. 配置后端拦截中间件
app.use(loginPass);

//4. 挂载路由
app.use(indexRouter);
app.use(sowingRouter);
app.use(userRouter);
app.use(sourceRouter);

//5. 挂载错误中间件
app.use(error_log);

app.use((req, res)=>{
  res.render('404.html');
});

app.listen(config.port, ()=>{
  console.log(`服务器已经启动, 端口是:${config.port}`);
});
