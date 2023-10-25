const nhp = require('node-html-parser');
var fs = require('fs');
var dir = 'cache';

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

var instances = [];

const fsCfg = { 'encoding': 'utf-8' };
async function get_instances(query) {
    const dir = 'cache/searchxng-instances.txt';
    if (fs.existsSync(dir)) {
        return fs.readFileSync(dir, fsCfg).split('@');
    }
    const response = await fetch("https://searx.neocities.org/nojs", { "method": "GET" });
    const text = await response.text();
    const root = nhp.parse(text);
    const results = root.querySelectorAll('form');
    var array = [];
    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        array.push(result.getAttribute('action'));
    }
    fs.writeFileSync(dir, array.join('@'),fsCfg);
    return array;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function search(query) {
    if(instances.length == 0){
        instances = await get_instances();
    }
    const endpointId = getRandomInt(0, instances.length - 1);
    const endpoint = instances[endpointId];
    var response
    try {
        response = await fetch(endpoint, { "body": "q=" + encodeURIComponent(query), "method": "POST", "headers": { "Content-Type": "application/x-www-form-urlencoded"}});
    } catch (error) {
        return await search(query);
    }
    const text = await response.text();
    const root = nhp.parse(text);
    const results = root.querySelectorAll('.result');
    var array = [];
    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const url_wrapper = result.querySelector('.url_wrapper');
        const title = result.querySelector('h3');
        const description = result.querySelector('.content');
        const o = {
            title: title.textContent,
            url: url_wrapper.getAttribute('href'),
            description: description.textContent
        };
        array.push(o);
    }
    return array;
}

exports.search = search;