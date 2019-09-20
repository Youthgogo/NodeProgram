import express from 'express'
import Sowing from './../models/Sowing'
import config from './../src/config'
import {basename} from 'path'
import formidable from 'formidable'
import SowingController from './../controller/sowing/SowingController'
const router = express.Router({});

/*****************************接口api*******************************/
/*往数据库中插入一条新纪录*/
router.post('/back/sowing/api/add', SowingController.insertOneSowing);

/**
 * 获取所有的轮播图列表
 */
router.get('/back/sowing/api/list', (req, res, next)=>{
  Sowing.find({}, "_id image_title image_url image_link s_time e_time", (err, docs)=>{
    if(err){
      return next(err);
    }
    //数据返回
    res.json({
      status: 200,
      result: docs
    })
  });
});

/**
 * 获取一条轮播图(id)
 * /sowing/api/singer/:sowingId 模糊匹配
 * /sowing/api/singer/*
 * /sowing/api/singer/111
 * 千万不要
 * /sowing/api/singer/a/b
 */
router.get('/back/sowing/api/singer/:sowingId', (req, res, next)=>{
  Sowing.findById(req.params.sowingId, "_id image_title image_url image_link s_time e_time", (err, docs)=>{
    if(err){
      return next(err);
    }
    //数据返回
    res.json({
      status: 200,
      result: docs
    })
  })
});

/**
 * 根据id去修改一条轮播图
 */
router.post('/back/sowing/api/edit', (req, res, next)=>{
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
    Sowing.findById(body.id, (err, sowing)=>{
      if (err) {
        return next(err);
      }
      //2.1 修改文档的内容
      console.log(sowing);
      sowing.image_title = body.image_title;
      sowing.image_url = body.image_url || basename(files.image_url.path);
      sowing.image_link = body.image_link;
      sowing.s_time = body.s_time;
      sowing.e_time = body.e_time;
      sowing.l_time = Date.now();

      //2.2 保存
      sowing.save((err, result)=>{
        if(err){
          return next(err);
        }
        res.json({
          status: 200,
          result: '修改轮播图成功'
        })
      });
    });
  });
});

/**
 * 根据id删除一条记录
 */
router.get('/back/sowing/api/remove/:sowingId', (req, res, next)=>{
  Sowing.deleteOne({_id: req.params.sowingId}, (err, result)=>{
    if(err){
      return next(err);
    }
    console.log(result);
    //数据返回
    res.json({
      status: 200,
      result: '成功删除轮播图'
    });
  })
});

/*****************************页面路由*******************************/
/**
 * 加载轮播图列表
 */
router.get('/back/s_list', (req, res, next)=>{
  //查询所有数据
  Sowing.find((err, sowings)=>{
    if (err) {
      return next(err);
    }
    res.render('back/sowing_list.html', {sowings});
  });
});

/**
 * 添加轮播图页面
 */
router.get('/back/s_add', (req, res, next)=>{
  res.render('back/sowing_add.html');
});

/**
 * 修改轮播图页面
 */
router.get('/back/s_edit', (req, res, next)=>{
  res.render('back/sowing_edit.html');
});

export default router;