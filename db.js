const fs = require('fs');
var dbData = { historyData: [], historyQuery: [] };
var needSave = false;
const dbPath = 'db.json';
var limitArray = 1000;

function save (){
    if(!needSave){
        return;
    }
    fs.writeFileSync(dbPath, JSON.stringify(dbData), { 'encoding': 'utf-8' });
}

function getdb (){
    return dbData;
}

function addarray(arrayName, o) {
    if (dbData[arrayName].length > limitArray){
        dbData[arrayName].shift();
    }
    dbData[arrayName].push(o);
    needSave = true;
}

function load () {
    if (fs.existsSync(dbPath)) {
        fs.readFile(dbPath, {'encoding': 'utf-8'}, function (err, data){
            dbData = JSON.parse(data);
        });
    }
}

load();

exports.addarray = addarray;
exports.getdb = getdb;
setInterval(save, 1000 * 60);