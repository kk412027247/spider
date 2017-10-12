const express = require('express');
const router = express.Router();
const url = require('url');

//引入superAgent
const superAgent = require('superagent');

const cheerio = require('cheerio');


const cNodeUrl = 'http://cNodeJs.org';

router.get('/', (req, res, next) => {
  superAgent.get(cNodeUrl)
  .end((err, sRes)=>{
    if(err) return next(err) ;
    const $ = cheerio.load(sRes.text);
    const items = [];
    $('#topic_list .topic_title').each((index, element)=>{
      const $element = $(element);
      items.push({
        title: $element.attr('title'),
        href: $element.attr('href'),
        link: url.resolve(cNodeUrl, $element.attr('href'))
      })
    });
    res.send(items)
  })
});

module.exports = router;
