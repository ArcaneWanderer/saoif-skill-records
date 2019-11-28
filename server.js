const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const SERVER_HOST = process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';
const SERVER_PORT = process.env.OPENSHIFT_NODEJS_PORT || 8080;

const JP_DATABASE = 'db/gamemaster.db3';
const GLOBAL_DATABASE = 'db/gamemaster_fc.db3';
const TEXT_DATABASE_JP = 'db/jp/textmaster.db3';
const TEXT_DATABASE_EN = 'db/en/textmaster.db3';
const TEXT_DATABASE_KO = 'db/ko/textmaster.db3';
const TEXT_DATABASE_TW = 'db/zh/textmaster.db3';

app.use(express.static(path.join(__dirname, 'build')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const db = createConnection(JP_DATABASE);
db.run(`ATTACH DATABASE '${TEXT_DATABASE_JP}' AS textmaster_jp`);
db.run(`ATTACH DATABASE '${TEXT_DATABASE_EN}' AS textmaster_en`);
db.run(`ATTACH DATABASE '${TEXT_DATABASE_KO}' AS textmaster_ko`);
db.run(`ATTACH DATABASE '${TEXT_DATABASE_TW}' AS textmaster_tw`);

app.get('/sr/:cardId', (req, res) => {
    const cardId = req.params.cardId;
    const sql = `SELECT *
                FROM MCardMasters
                WHERE card_masterid = '${cardId}'`;
});

app.get('/card', (req, res) => {
    const sql = `SELECT card_masterid, data, evolution_card_masterid
                FROM MCardMasters
                INNER JOIN textmaster.MTextMasterS
                ON text_name_id = id
                WHERE data LIKE "[%" AND rarity = max_rarity - 1`;

    db.all(sql, (error, rows) => {
        if (error) { 
            console.log('Error when retrieving card options:', error);
        }

        var data = [];
        rows.forEach((row) => {
            data.push(row);
        });

        res.contentType('application/json');
        res.send(JSON.stringify(data));
    });
});

async function getCardData(cardId) {
    const sql = `SELECT *
                FROM MCardMasters
                WHERE card_masterid = '${cardId}'`;
    
    return new Promise((resolve, reject) => {
        db.get(sql, (error, row) => {
            if (error) {
                console.log('Error when retrieving card data:', error);
                reject(null);
            }
            resolve(row);
        });
    });
};

async function getSkillData(skillId) {
    const sql = `SELECT *
                FROM MSkillMasters
                WHERE skill_masterid = '${skillId}'`;
    
    return new Promise((resolve, reject) => {
        db.get(sql, (error, row) => {
            if (error) {
                console.log('Error when retrieving skill data:', error);
                reject(null);
            }
            resolve(row);
        });
    });
}

async function getPassiveBuffs(cardId) {
    const sql = `SELECT *
                FROM MCardPowerupMasters
                WHERE card_masterid = '${cardId}'`;

    return new Promise((resolve, reject) => {
        db.all(sql, (error, rows) => {
            if (error) {
                console.log('Error when retrieving passive buffs data:', error);
                reject(null);
            }
            var data = [];
            rows.forEach((row) => {
                data.push(row);
            });
            resolve(data);
        });
    });
}

async function getActiveBuffs(skillId) {
    var sql = `SELECT *
                FROM MSkillBuffMasters
                WHERE skill_masterid = '${skillId}'`;

    var buffs = [];
    return new Promise((resolve, reject) => {
        db.all(sql, (error, rows) => {
            if (error) {
                console.log('Error when retrieving active buffs data:', error);
                reject(null);
            }
            var data = [];
            rows.forEach((row) => {
                data.push(row);
            });
            resolve(data);
        });
    }).then((data) => {
        buffs = data;

        return Promise.all(buffs.map((buff) => {
            var sql = `SELECT *
                    FROM MBuffPowerupMasters
                    WHERE buff_masterid = '${buff['buff_masterid']}'`;
                    
            db.get(sql, (error, row) => {
                if (error) {
                    console.log('Error when retrieving buff effect data:', error);
                    reject(null);
                }
                resolve(row);
            });
        })).then((data) => {
            for (var i = 0; i < buffs.length; i++) {
                buffs[i]['buffEffect'] = data[i];
            }
            resolve(buffs);
        }).catch((error) => {
            return null;
        });
    });
}

// app.get('/buff/charge/:skillId', (req, res) => {
//     var skillId = req.params.skillId;
//     var db = createConnection(JP_DATABASE);
//     var sql = `SELECT *
//                 FROM MSkillBuffMasters
//                 WHERE skill_masterid = '${skillId}'`

//     var buffSkills = [];
//     db.all(sql, [], (error, rows) => {
//         if (error) {
//             throw error;
//         }
//         rows.forEach((row) => {
//             buffSkills.push(row);
//         });

//         if (buffSkills.length > 0) {
//             var count = 0;
//             buffSkills.forEach((buffSkill) => {
//                 var sql2 = `SELECT *
//                             FROM MBuffPowerupMasters
//                             WHERE buff_masterid = '${buffSkill['buff_masterid']}'`;
//                 db.all(sql2, [], (error, rows) => {
//                     if (error) {
//                         throw error;
//                     }
//                     var buffEffects = [];
//                     rows.forEach((row) => {
//                         buffEffects.push(row);
//                     });
//                     buffSkill['buffEffects'] = buffEffects;
//                     count++;

//                     if (count >= buffSkills.length) {
//                         res.contentType('application/json');
//                         res.send(JSON.stringify(buffSkills));
                        
//                         closeConnection(db);
//                     }
//                 });
//             });
//         } else {
//             res.contentType('application/json');
//             res.send(JSON.stringify([]));
            
//             closeConnection(db);
//         }
//     });
// });

async function getTextData(textId) {
    var sql = `SELECT *
                FROM MTextMasters
                WHERE id = '${textId}'`;
    
    return new Promise((resolve, reject) => {
        db.get(sql, (error, row) => {
            if (error) {
                console.log('Error when retrieving skill data');
                reject(error);
            }
            resolve(row);
        });
    });
}

async function getSkillRecord(cardId) {
    var cardData;
    var skillData;
    var passiveBuffData;
    var activeBuffData;
    var chargeSkill;
    var chargeBeforeBuffData;
    var chargeAfterBuffData;
}


function createConnection(databaseFile) {
    var db = new sqlite3.Database(databaseFile, (error) => {
        if (error) {
        return console.error(error.message);
        }
        console.log('Connected to the SQlite database.');
    });
    return db;
}

function closeConnection(databaseObject) {
    databaseObject.close((error) => {
        if (error) {
          return console.error(error.message);
        }
        console.log('Closed the database connection.');
    });
}

app.listen(SERVER_PORT, SERVER_HOST, () => console.log(`Server running at http://${SERVER_HOST}:${SERVER_PORT}/`));