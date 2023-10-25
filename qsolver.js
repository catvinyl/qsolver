const fs = require('fs');
const naurok = require('./naurok.js');
const server = require('./server.js');
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

server.setApi('api/completeTest', async function (o){
    var url;
    try {
        url = new URL(o.data);
    } catch (error) {
    }
    if(!url){
        o.data = 'https://' + o.data;
        try {
            url = new URL(o.data);
        } catch (error) {
        }
    }
    if(!url){
        return { error: 'Не посилання!' };
    }
    const out = await naurok.completeTest(o.data);
    if(out.error){
        return out;
    }else{
        return { questions: out.questions, answers: out.answers };
    }
});