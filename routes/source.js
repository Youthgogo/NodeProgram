import express from 'express'
import Source from './../models/Source'
import config from './../src/config'
import {basename} from 'path'
import formidable from 'formidable'
import Sowing from "../models/Sowing";
const router = express.Router({});

/*****************************接口api-start*******************************/
/**
 * 图片上传 uploads
 */
router.post('/back/source/api/add_img', (req, res, next)=>{
  const form = new formidable.IncomingForm();
  form.uploadDir = config.uploadPath;  //上传图片放置的文件夹
  form.keepExtensions = true;  //保持文件的原始拓展名
  form.parse(req, (err, fields, files)=>{
    if(err){
      return next(err);
    }

    if(files.image_url){
      let image_url = 'http://localhost:3000/uploads/' + basename(files.image_url.path);
      res.json({
        status: 200,
        result: image_url
      });
    }else {
      res.json({
        status: 1,
        result: '上传图片路径出现问题！'
      });
    }
  });
});

/*往数据库中插入一条新纪录*/
router.post('/back/source/api/add', (req, res, next) => {
  const form = new formidable.IncomingForm();
  form.uploadDir = config.uploadPath;  //上传图片放置的文件夹
  form.keepExtensions = true;  //保持文件的原始拓展名
  form.parse(req, (err, fields, files)=>{
    if (err) {
      return next(err);
    }
    //1. 取出普通字段
    let body = fields;
    //2. 解析上传的文件路径，取出文件名保持到数据库
    body.small_img = basename(files.small_img.path);
    //3. 操作数据库
    const source = new Source({
      // 标题
      title: body.title,
      // 作者
      author: body.author,
      // 缩略图
      small_img: body.small_img,
      // 价格
      price: body.price,
      // 内容
      content: body.content,
    });

    source.save((err, result)=>{
      if(err){
        return next(err);
      }
      res.json({
        status: 200,
        result: '添加文章资源成功！'
      })
    });
  });
});

/**
 * 获取一条文章id)
 */
router.get('/back/source/api/singer/:sourceId', (req, res, next)=>{
  Source.findById(req.params.sourceId, (err, docs)=>{
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
 * 根据id去修改一篇文章
 */
router.post('/back/source/api/edit', (req, res, next)=>{
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
    Source.findById(body.id, (err, source)=>{
      if (err) {
        return next(err);
      }
      //2.1 修改文档的内容
      source.title = body.title;
      source.author = body.author || basename(files.author.path);
      source.small_img = body.small_img || basename(files.small_img.path);
      source.price = body.price;
      source.content = body.content;

      //2.2 保存
      source.save((err, result)=>{
        if(err){
          return next(err);
        }
        res.json({
          status: 200,
          result: '修改文章成功'
        })
      });
    });
  });
});

/**
 * 根据id删除一篇文章
 */
router.get('/back/source/api/remove/:sourceId', (req, res, next)=>{
  Source.deleteOne({_id: req.params.sourceId}, (err, result)=>{
    if(err){
      return next(err);
    }
    console.log(result);
    //数据返回
    res.json({
      status: 200,
      result: '成功删除文章！'
    });
  })
});

/*前台获取总记录数*/
router.get('/web/source/api/count', (req, res, next)=>{
  Source.countDocuments((err, count)=> {
    if (err) {
      return next(err);
    }
    //数据返回
    res.json({
      status: 200,
      result: count
    })
  })
});

/*前台获取资源列表*/
router.get('/web/source/api/list', (req, res, next)=>{
  //1. 接收客户端传递的参数
  let {page, pageSize, sortBy} = req.query;
  page = Number.parseInt(page, 10) || 1;
  pageSize = Number.parseInt(pageSize, 10) || 100;

  //2. 数据查询规则
  let sortObj;
  if(sortBy === 'price'){  //按照价格排序
    sortObj = {'price': -1}
  }else{
    sortObj = {'read_count': -1}
  }

  //查询所有数据
  Source.find({}, 'title small_img price').sort(sortObj).skip((page - 1) * pageSize).limit(pageSize).exec((err, sources)=>{
    if (err) {
      return next(err);
    }
    res.json({
      status: 200,
      result: sources
    });
  });
});

/*前台获取详情页数据*/
router.get('/web/source/api/content/:sourceId', (req, res, next)=>{
  Source.findById(req.params.sourceId, "title author read_count add_time content", (err, source)=>{
    if(err) {
      return next(err);
    }
    res.json({
      status: 200,
      result: source
    });
  });
});

/*前端详情页面阅读量处理*/
router.get('/web/source/api/content/read_count/:sourceId', (req, res, next)=>{
  Source.findById(req.params.sourceId, "read_count", (err, source)=>{
    if(err) {
      return next(err);
    }
    //1. 取出要修改的数据
    source.read_count += 1;

    //2. 保存
    source.save((err, result)=>{
      if(err) {
        return next(err);
      }
      res.json({
        status: 200,
        result: '阅读数据更新成功！'
      })
    });
  });
});

/*****************************接口api-end*******************************/


/*****************************页面路由-start*******************************/
/**
 * 加载资源文章列表
 */
/*router.get('/back/source_list', (req, res, next)=>{
  //查询所有数据
  Source.find((err, sources)=>{
    if (err) {
      return next(err);
    }
    res.render('back/source_list.html', {sources});
  });
});*/

router.get('/back/source_list', (req, res, next)=>{
  //接收2个参数
  let page = Number.parseInt(req.query.page, 10) || 1;
  let pageSize = Number.parseInt(req.query.pageSize, 10) || 3;
  /*
  * 1   0-9
  * 2   10-19
  * 3   20-29
  * (page-1) * pageSize
  * */
  //查询所有数据
  Source.find().skip((page - 1) * pageSize).limit(pageSize).exec((err, sources)=>{
    if (err) {
      return next(err);
    }
    //查询数据库中的总页数
    Source.countDocuments((err, count)=>{
      if (err) {
        return next(err);
      }
      //总页码
      let totalPage = Math.ceil(count/pageSize);
      //当前页面
      res.render('back/source_list.html', {sources, totalPage, page});
    });
  });
});

/**
 * 添加资源文章页面
 */
router.get('/back/source_add', (req, res, next)=>{
  res.render('back/source_add.html');
});

/**
 * 编辑资源文章页面
 */
router.get('/back/source_edit', (req, res, next)=>{
  res.render('back/source_edit.html');
});

/*****************************页面路由-end*******************************/


export default router;