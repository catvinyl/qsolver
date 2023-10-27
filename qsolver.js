const fs = require('fs');
const naurok = require('./naurok.js');
const server = require('./server.js');
const searchxng = require('./searchxng.js');
const dbmng = require('./db.js');

var secretsData = {};

function loadSecrets(){
    var data;
    if (process.env.SECRETS) {
        data = atob(process.env.SECRETS);
        process.env.SECRETS = '';
    } else {
        data = fs.readFileSync('secrets.json', { 'encoding': 'utf-8' });
    }
    secretsData = JSON.parse(data);
    naurok.setSecrets(secretsData.naurok);
}

loadSecrets();

function filterDomain (array, origin){
    var newArray = [];
    for (let i = 0; i < array.length; i++) {
        const url = array[i].url;
        const urlObj = new URL(url);
        if(urlObj.origin == origin){
            newArray.push(array[i]);
        }
    }
    return newArray;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function urlEndsWith(array, text) {
    var newArray = [];
    for (let i = 0; i < array.length; i++) {
        const url = array[i].url;
        if(url){
            if (url.endsWith(text)) {
                newArray.push(array[i]);
            }
        }
    }
    return newArray;
}

function isUrl(url){
    if(url.indexOf('.') == -1){
        return;
    }
    var urlObj;
    try {
        urlObj = new URL(url);
    } catch (error) {
    }
    if (!urlObj) {
        try {
            urlObj = new URL('https://' + url);
        } catch (error) {
        }
    }
    if(urlObj){
        return urlObj.href;
    }
}

async function naurokurl (url){
    if (!url) {
        return;
    }
    var out = [];
    var outTest = await naurok.completeTest(url);
    if (!outTest){
        return;
    }
    if (!outTest.error) {
        const title = outTest.title;
        outTest = { questions: outTest.questions, answers: outTest.answers, type: 'test' };
        out.push({ title: title, url: url });
    }
    out.push(outTest);
    return out;
}

async function asyncarray (f, array, ondone) {
    var x = 0;
    return new Promise((resolve, reject) => {
        for (let i = 0; i < array.length; i++) {
            const element = array[i];
            f(element).then(function (...a){
                ondone(...a);
                x++;
                if(x == array.length){
                    resolve();
                }
            });
        }
    });
}

async function naurokSearch (query, tryx){
    var tryx = tryx || 2;
    tryx--;
    const filterText = 'site:naurok.com.ua/test "'
    query = filterText + query.slice(0, 500 - filterText.length - 1) + '"';
    const searchArray = await searchxng.search(query);
    const filteredsearch = filterDomain(urlEndsWith(searchArray.results, '.html'), 'https://naurok.com.ua');
    if(tryx == 0){
        return;
    }
    if(filteredsearch.length == 0){
        return await naurokSearch(query, tryx);
    }
    var out = [];
    var urls = [];
    for (let i = 0; i < filteredsearch.length; i++) {
        urls.push(filteredsearch[i].url);
    }
    await asyncarray(naurokurl, urls, function (n){
        if(n){
            out = out.concat(n);
        }
    });
    out.push({ title: 'Використаний пошук', url: searchArray.endpoint });
    if(out.length != 0){
        return out;
    }
}

async function completeTest (o) {
    var out = [];
    var url = isUrl(o.data);
    var searchArray;
    if (!url) {
        const query = o.data.slice(0, 500);
        searchArray = await searchxng.search(query);
        for (let i = 0; i < searchArray.answers.length; i++) {
            const element = searchArray.answers[i];
            out.push({ title: o.data, description: element.description, url: element.url });
        }
    }
    if (url) {
        const n = await naurokurl(url);
        if (n) {
            out = out.concat(n);
        }
    } else {
        const ns = await naurokSearch(o.data);
        if (ns) {
            out = out.concat(ns);
        }
    }
    if (searchArray) {
        for (let i = 0; i < searchArray.results.length; i++) {
            const element = searchArray.results[i];
            out.push(element);
        }
        out.push({ title: 'Використаний пошук', url: searchArray.endpoint });
    }
    dbmng.addarray('historyData', out);
    dbmng.addarray('historyQuery', o.data.slice(0, 1024));
    return out;
}

function getQueriesHistory(){
    return { array: dbmng.getdb().historyQuery };
}

function getQueryHistory(datain) {
    var i = Number(datain.i);
    if(Number.isNaN(i)){
        return { error: 'NaN' };
    }
    i = Math.floor(i);
    const array = dbmng.getdb()['historyData'];
    if(i > array.length - 1){
        return { error: 'not found' };
    }
    return array[i];
}

server.setApi('api/q', completeTest);

server.setApi('api/history', getQueriesHistory);
server.setApi('api/qhistory', getQueryHistory);