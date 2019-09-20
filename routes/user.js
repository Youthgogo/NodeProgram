import express from 'express'
import User from '../models/User'
import md5 from 'blueimp-md5'
import {basename} from 'path'
import formidable from 'formidable'
import config from './../src/config'
const router = express.Router({});

const S_KEY = '@wencai.com';

/*************************数据接口API-start****************************/
/**
 * 生成后台管理员
 * itlike
 * 123
 */
router.post('/user/api/add', (req, res, next)=>{
  const user_name = req.body.user_name || '';
  const user_pwd = md5(req.body.user_pwd + S_KEY) || '';

  //操作数据库
  const user = new User({
    //用户名
    user_name: user_name,
    //密码
    user_pwd: user_pwd
  });

  //存储
  user.save((err, result)=>{
    if (err) {
      return next(err);
    }
    res.json({
      status: 200,
      result: '添加管理员成功！'
    });
  });
});

/**
 * 用户名和密码进行登录
 */
router.post('/user/api/login', (req, res, next)=>{
  //1. 获取数据
  const user_name = req.body.user_name;
  const user_pwd = req.body.user_pwd;

  // console.log('------------------------');
  // console.log(req.body);
  // console.log('------------------------');

  //2. 查询数据
  User.findOne({user_name: user_name}, (err, user)=>{
    if (err) {
      return next(err);
    }
    //2.1 如果用户存在
    if(user !== null){
      //2.2 判断密码
      if(user.user_pwd === user_pwd){  //密码匹配成功
        // console.log(req.session);
        //session中存token
        req.session.token = user._id;

        //2.3 登录成功
        res.json({
          status: 200,
          result: {
            token: user._id,
            message: '登录成功'
          }
        })
      }else{
        res.json({
          status: 1,
          result: '输入密码有误！'
        })
      }
    }else{
      res.json({
        status: 2,
        result: '用户名不存在！'
      });
    }
  });
});

/**
 * 退出登录
 */
router.get('/back/user/api/logout', (req, res, next)=>{
  //销毁session
  //方式一：将cookie的时间设置为0，只有cookie中携带的信息通过客户端请求传到服务器，
  // 由对应的session接收session才起作用，cookie没了session自然而然的将不起作用
  req.session.cookie.maxAge = 0;

  //方式二： destroy
/*  req.session.destroy((err)=>{
    return next(err);
  });*/

  //提示用户
  res.json({
    status: 200,
    result: '退出登录成功!'
  });
});

/**
 * 获取用户信息-部分
 */
router.get('/back/user/api/u_msg/:token', (req, res, next)=>{
  User.findById(req.params.token, '-_id icon_url real_name intro_self points rank gold', (err, user)=>{
    if (err) {
      return next(err);
    }

    if(user){
      res.json({
        status: 200,
        result: user
      })
    }else{
      req.session.cookie.maxAge = 0;
    }
  });
});

/**
 * 获取用户信息-所有
 */
router.get('/back/user/api/u_msg_all/:token', (req, res, next)=>{
  User.findById(req.params.token, '-_id -user_name -user_pwd -l_edit -c_time', (err, user)=>{
    if (err) {
      return next(err);
    }

    if(user){
      res.json({
        status: 200,
        result: user
      })
    }else{
      req.session.cookie.maxAge = 0;
    }
  });
});

/**
 * 根据id去修改一条用户信息
 */
router.post('/back/user/api/edit', (req, res, next)=>{
  const form = new formidable.IncomingForm();
  form.uploadDir = config.uploadPath;  //上传图片放置的文件夹
  form.keepExtensions = true;  //保持文件的原始拓展名
  form.parse(req, (err, fields, files)=>{
    if (err) {
      return next(err);
    }
    //1. 取出普通字段
    let body = fields;
    // console.log(body);
    //2. 根据id查询文档
    User.findById(body.token, (err, user)=>{
      if(err){
        return next(err);
      }
      //2.1 修改文档的内容
      console.log(user);
      user.real_name = body.real_name;
      user.icon_url = body.icon_url || basename(files.icon_url.path);
      user.phone = body.phone;
      user.e_mail = body.e_mail;
      user.join_time = body.join_time;
      user.intro_self = body.intro_self;

      //2.2 保存
      user.save((err, result)=>{
        if(err){
          return next(err);
        }
        res.json({
          status: 200,
          result: '用户信息修改成功！'
        })
      });
    });
  });
});

/**
 * 根据token修改密码
 */
router.post('/back/user/api/reset', (req, res, next)=>{
  //1. 获取数据
  const token = req.body.token;
  const old_pwd = req.body.old_pwd;
  const new_pwd = req.body.new_pwd;

  //2. 根据token查询用户
  User.findById(token, (err, user)=>{
    if(err){
      return next(err);
    }
    //2.1 没有查询到
    if(user){  //有
      //2.2 取出散列
      if(user.user_pwd !== old_pwd){
        res.json({
          status: 2,
          result: '密码不正确！'
        });
      }
      //2.3 更换密码
      user.user_pwd = new_pwd;
      //2.4 保存到数据
      user.save((err, result)=>{
        if(err){
          return next(err);
        }
        res.json({
          status: 200,
          result: '修改密码成功！'
        })
      });
    }else{  //没有
      res.json({
        status: 1,
        result: '非法用户！'
      })
    }
  })

});

/*************************数据接口API-end****************************/


/*************************页面的路由-start****************************/
router.get('/back/login', (req, res, next)=>{
  res.render('back/login.html');
});

router.get('/back/u_center', (req, res, next)=>{
  res.render('back/user_center.html');
});

router.get('/back/u_set', (req, res, next)=>{
  res.render('back/user_message.html');
});

router.get('/back/u_reset_pwd', (req, res, next)=>{
  res.render('back/reset_pwd.html');
});
/*************************页面的路由-end****************************/

export default router;