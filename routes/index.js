const express = require('express');
const router = express.Router();
const url = require('url');
//const eventProxy = require('eventproxy');

//引入superAgent
const superAgent = require('superagent');

const cheerio = require('cheerio');

//引入定时器
//const schedule = require('node-schedule');
// 六个参数 分别是 秒（不是必选） 分钟 小时 日 月 星期（0-7）
//const job = schedule.scheduleJob('0-59 * * * * *', ()=>console.log('每秒运行一次'));


//并发控制
const async = require('async');

let cNodeUrl = 'https://cNodeJs.org';

router.get('/', (req, res, next) => {

  let tab = req.query.tab || 'all';
  let page = req.query.page  || 1;
  cNodeUrl = cNodeUrl + '?' + 'tab='+ tab + '&' + 'page=' + page;
  //console.log(cNodeUrl) ;
  superAgent.get(cNodeUrl)
  .end((err, sRes)=>{
    if(err) return next(err) ;
    const $ = cheerio.load(sRes.text);
    // const queryUrl = url.resolve(cNodeUrl, $('#content .pagination ul li:last-child a').attr('href'));
    // console.log(url.parse(queryUrl, true).query);
    //let totalPages = url.parse($('#content .pagination ul li:last-child a').attr('href'), true).query;
    //console.log('totalpages: ' + totalPages.page);
    const items = [];
    $('#topic_list .topic_title').each((index, element)=>{
      const $element = $(element);
      items.push({
        title: $element.attr('title'),
        href: $element.attr('href'),
        link: url.resolve(cNodeUrl, $element.attr('href')),
        type: $element.parent().find('span').text()
      })
    });
    res.send(items)
  })
});

router.get('/eventProxy', (req, res, next)=>{
  superAgent.get(cNodeUrl)
  .then((success, failure)=>{
    if(failure) next(failure);
    const $ = cheerio.load(success.text);
    const topicUrls = [];
    $('#topic_list .topic_title').each((index, element)=>{
      const $element = $(element);
      let href = url.resolve(cNodeUrl, $element.attr('href')) ;
      topicUrls.push(href);
    }) ;

    topicUrls.forEach((item)=>{
      superAgent.get(item).then(success => console.log(success))
    }) ;
    res.send(topicUrls);
  })
});


router.get('/async', (req, res) => {
  let concurrencyCount = 0 ;

  const fetchUrl = (url, callback)=>{
    concurrencyCount++;
    console.log('现在的并发数是' + concurrencyCount + ',现在抓取的URL是' + url) ;
    superAgent.get(url)
    .then( ()=>{
      console.log('抓取' + url + '成功');
      concurrencyCount--;
      callback(null, url)
    })
    .catch((err)=>console.log(err))
  };

  const topicUrls = [];
  superAgent.get(cNodeUrl)
  .then((success)=>{
    const $ = cheerio.load(success.text);

    $('#topic_list .topic_title').each((index, element)=>{
      const $element = $(element);
      let href = url.resolve(cNodeUrl, $element.attr('href')) ;
      topicUrls.push(href);
    }) ;
    res.send(topicUrls);

    async.mapLimit(topicUrls, 2, (url, callback)=>{
      fetchUrl(url, callback)
    }, (err, result)=>{
      if(err) console.log(err);
      console.log('final');
      console.log(result);
    })
  })
  .catch((err)=>console.log(err));
});








module.exports = router;
