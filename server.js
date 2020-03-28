const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fetch = require('node-fetch');

const app = express();
const SERVER_HOST = process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';
const SERVER_PORT = process.env.OPENSHIFT_NODEJS_PORT || process.env.I247_PORT || 8080;
const SERVER_URL = SERVER_HOST + ':' + SERVER_PORT;

const JP_DATABASE = 'db/gamemaster.db3';
const GLOBAL_DATABASE = 'db/gamemaster_fc.db3';
const TEXT_DATABASE_JP = 'db/ja/textmaster.db3';
const TEXT_DATABASE_EN = 'db/en/textmaster.db3';
const TEXT_DATABASE_KO = 'db/ko/textmaster.db3';
const TEXT_DATABASE_TW = 'db/zh/textmaster.db3';

app.use(express.static(path.join(__dirname, 'build')));

app.get('/:language', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const db = createConnection(JP_DATABASE);
db.run(`ATTACH DATABASE '${TEXT_DATABASE_JP}' AS textmaster_jp`);
db.run(`ATTACH DATABASE '${TEXT_DATABASE_EN}' AS textmaster_en`);
db.run(`ATTACH DATABASE '${TEXT_DATABASE_KO}' AS textmaster_ko`);
db.run(`ATTACH DATABASE '${TEXT_DATABASE_TW}' AS textmaster_tw`);

app.get('/:language/card', (req, res) => {
    const language = req.params.language;
    const sql = `SELECT card_masterid, data, evolution_card_masterid
                FROM MCardMasters
                INNER JOIN textmaster_${language}.MTextMasterS
                ON text_name_id = id
                WHERE data LIKE "[%" AND rarity = max_rarity`;

    db.all(sql, (error, rows) => {
        if (error) { 
            console.log('Error when retrieving card options:', error);
            res.status(500).json({ error: error.toString() });
        }

        var data = [];
        rows.forEach((row) => {
            data.push(row);
        });

        res.contentType('application/json');
        res.send(JSON.stringify(data));
    });
});

function fetchCardData(language) {
    const sql = `SELECT card_masterid, data, evolution_card_masterid
                FROM MCardMasters
                INNER JOIN textmaster_${language}.MTextMasters
                ON text_name_id = id
                WHERE data LIKE "${language === 'en' ? '[' : '【'}%" AND rarity = max_rarity`;

    return new Promise((resolve, reject) => {
        db.all(sql, (error, rows) => {
            if (error) { 
                console.log('Error when retrieving card options:', error);
                reject();
            }

            var data = [];
            rows.forEach((row) => {
                data.push(row);
            });

            resolve(data);
        });
    });
}

app.get('/:language/sr/', async (req, res) => {
    const language = req.params.language;
    fetchCardData(language).then((data) => {
        return Promise.all(data.map((element) => {
            return getSkillRecordData(element.card_masterid, language);
        }));
    }).then((data) => {
        res.contentType('application/json');
        res.send(JSON.stringify(data));
    }).catch((error) => {
        console.log(error);
        res.status(500).json({ error: error.toString() });
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
                reject(error);
            } else {
                resolve(row);
            }
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
                reject(error);
            } else {
                resolve(row);
            }
        });
    });
}

async function getPassiveBuffs(cardId) {
    const sql = `SELECT *
                FROM (SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) row, *
                        FROM MCardPowerupMasters)
                WHERE card_masterid = '${cardId}'`;

    return new Promise((resolve, reject) => {
        db.all(sql, (error, rows) => {
            if (error) {
                console.log('Error when retrieving passive buffs data:', error);
                reject(error);
            } else {
                var data = [];
                rows.forEach((row) => {
                    data.push(row);
                });
                resolve(data);
            }
        });
    });
}

async function getActiveBuffs(skillId) {
    const sql = `SELECT *
                FROM (SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) row, *
                        FROM MSkillBuffMasters)
                WHERE skill_masterid = '${skillId}'`;

    var buffs = [];
    return new Promise((resolve, reject) => {
        db.all(sql, (error, rows) => {
            if (error) {
                console.log('Error when retrieving active buffs data:', error);
                reject(error);
            } else {
                var data = [];
                rows.forEach((row) => {
                    data.push(row);
                });
                resolve(data);
            }
        });
    }).then(async (data) => {
        buffs = data;

        return Promise.all(buffs.map((buff) => {
            var sql = `SELECT *
                    FROM MBuffPowerupMasters
                    WHERE buff_masterid = '${buff['buff_masterid']}'`;
                    
            return new Promise((resolve, reject) => {
                db.get(sql, (error, row) => {
                    if (error) {
                        console.log('Error when retrieving buff effect data:', error);
                        reject(error);
                    } else {
                        resolve(row);
                    }
                });
            });
        })).then((data) => {
            for (var i = 0; i < buffs.length; i++) {
                buffs[i]['buffEffect'] = data[i];
            }
            return buffs;
        }).catch((error) => {
            return null;
        });
    });
}

async function getChargeSkillData(skillId) {
    const sql = `SELECT *
                FROM MSkillChargeMasters
                WHERE skill_masterid = '${skillId}'`;

    return new Promise((resolve, reject) => {
        db.get(sql, (error, row) => {
            if (error) {
                console.log('Error when retrieving charge skill data:', error);
                reject(error);
            } else {
                resolve(row);
            }
        });
    });
}

async function getTextData(textId, language) {
    var sql = `SELECT *
                FROM textmaster_${language}.MTextMasters
                WHERE id = '${textId}'`;
    
    return new Promise((resolve, reject) => {
        db.get(sql, (error, row) => {
            if (error) {
                console.log('Error when retrieving text data:', error);
                reject(error);
            } else {
                resolve(row.data);
            }
        });
    });
}

async function getSkillRecordData(cardId, language) {
    var skillRecord;
    
    var cardName;
    var cardDescription;
    var cardType;
    var cardData;
    var skillName;
    var skillDescription;
    var skillData = {};
    var buffData = {};
    var hasCharge = false;
    var hasBurst = false;

    cardData = await getCardData(cardId);

    if (!cardData) {
        return;
    }

    skillData['base'] = await getSkillData(cardData.skill_masterid);

    cardType = cardData.type == 1 ? 'active' : 'passive';

    return Promise.all([
        getTextData(cardData.text_name_id, language),
        getTextData(cardData.text_comment_id, language),
        getTextData(skillData.base.text_name_id, language),
        getTextData(skillData.base.text_comment_id, language)
    ]).then(async (values) => {
        cardName = values[0];
        cardDescription = values[1];
        skillName = values[2];
        skillDescription = values[3];

        if (cardType == 'active') {
            buffData['base'] = await getActiveBuffs(skillData.base.skill_masterid);
            var chargeSkillData = await getChargeSkillData(skillData.base.skill_masterid);

            if (chargeSkillData != null) {
                hasCharge = true;

                return Promise.all([
                    getSkillData(chargeSkillData.before_skill_masterid),
                    getSkillData(chargeSkillData.after_skill_masterid)
                ]).then((values) => {
                    skillData['before'] = values[0];
                    skillData['after'] = values[1];

                    return Promise.all([
                        getActiveBuffs(skillData.before.skill_masterid),
                        getActiveBuffs(skillData.after.skill_masterid)
                    ]);
                }).then((values) => {
                    buffData['before'] = values[0];
                    buffData['after'] = values[1];

                    return Promise.resolve();
                }).catch((error) => {
                    console.log('Error:', error);

                    return Promise.reject();
                });
            } else {
                return Promise.resolve();
            }
        } else {
            buffData['base'] = await getPassiveBuffs(cardId);
            return Promise.resolve();
        }
    }).then(() => {
        const skillTypes = {
            0: "Ability",
            1: "1H Sword",
            2: "1H Rapier",
            3: "Shield",
            4: "1H Club",
            5: "2H Axe",
            6: "2H Spear",
            7: "Bow",
            9: "1H Dagger"
        }

        let delimiter;
        if (language === 'en') {
            delimiter = ']';
        } else {
            delimiter = '】';
        }

        skillRecord = {
            'cardName': cardName,
            'characterName': cardName.split(delimiter)[1].trim(),
            'cardDescription': cardDescription,
            'cardData': cardData,
            'skillName': skillName,
            'skillType': skillTypes[cardData.weapon_type],
            'skillDescription': skillDescription,
            'skillData': skillData,
            'buffData': buffData,
            'hasCharge': hasCharge
        };

        return skillRecord;
    }).catch((error) => {
        console.log('Error:', error);
        return null;
    });
}

app.get('/:language/sr/:cardId', async (req, res) => {
    const cardId = req.params.cardId;
    const language = req.params.language;
    const skillRecord = await getSkillRecordData(cardId, language);

    if (skillRecord) {
        res.contentType('application/json');
        res.send(JSON.stringify(skillRecord));
    } else {
        res.status(500);
    }
});

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

process.on('SIGINT', () => {
    closeConnection(db);
});

app.listen(SERVER_PORT, SERVER_HOST, () => console.log(`Server running at http://${SERVER_HOST}:${SERVER_PORT}/`));