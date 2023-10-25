const fs = require('fs');
const naurok = require('./naurok.js');
const server = require('./server.js');
const searchxng = require('./searchxng.js');
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
        if (url.endsWith(text)) {
            newArray.push(array[i]);
        }
    }
    return newArray;
}

server.setApi('api/completeTest', async function (o){
    var url;
    try {
        url = new URL(o.data);
    } catch (error) {
    }
    if(!url){
        try {
            url = new URL('https://' + o.data);
            o.data = 'https://' + o.data;
        } catch (error) {
        }
    }
    if(!url){
        const filterText = 'site:naurok.com.ua/test "'
        const query = filterText + o.data.slice(0, 500 - filterText.length - 1) + '"';
        var searchArray = await searchxng.search(query);
        searchArray = filterDomain(urlEndsWith(searchArray, '.html'), 'https://naurok.com.ua');
        if (searchArray.length > 0){
            url = searchArray[getRandomInt(0, searchArray.length - 1)].url;
            o.data = url;
        }else{
            return { error: 'Спробуй щось інше або спробуйте ще раз!' };
        }
    }
    const out = await naurok.completeTest(o.data);
    if(out.error){
        return out;
    }else{
        return { questions: out.questions, answers: out.answers };
    }
});