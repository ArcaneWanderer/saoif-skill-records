const sqlite3 = require('sqlite3').verbose();

const JP_DATABASE = 'db/gamemaster.db3';
const GLOBAL_DATABASE = 'db/gamemaster_fc.db3'; // eslint-disable-line
const TEXT_DATABASE_JP = 'db/ja/textmaster.db3';
const TEXT_DATABASE_EN = 'db/en/textmaster.db3';
const TEXT_DATABASE_KO = 'db/ko/textmaster.db3';
const TEXT_DATABASE_TW = 'db/zh/textmaster.db3';

class SkillRecordDatabase {
    constructor() {
        let db = this.createConnection(JP_DATABASE);
        db.run(`ATTACH DATABASE '${TEXT_DATABASE_JP}' AS textmaster_jp`);
        db.run(`ATTACH DATABASE '${TEXT_DATABASE_EN}' AS textmaster_en`);
        db.run(`ATTACH DATABASE '${TEXT_DATABASE_KO}' AS textmaster_ko`);
        db.run(`ATTACH DATABASE '${TEXT_DATABASE_TW}' AS textmaster_tw`);
        this.db = db;
    }

    createConnection(databaseFile) {
        const db = new sqlite3.Database(databaseFile, (error) => {
            if (error) {
                return console.error(error.message);
            }
            console.log('Connected to the database.');
        });
        return db;
    }
    
    closeConnection() {
        this.db.close((error) => {
            if (error) {
                return console.error(error.message);
            }
            console.log('Closed the database connection.');
        });
    }

    querySingleResult(sql, errorMessage) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, (error, row) => {
                if (error) {
                    console.log(errorMessage + ':', error);
                    reject(error);
                }

                resolve(row);
            });
        });
    }

    queryMultipleResult(sql, errorMessage) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, (error, rows) => {
                if (error) { 
                    console.log(errorMessage + ":", error);
                    reject();
                }

                let data = [];
                rows.forEach((row) => {
                    data.push(row);
                });

                resolve(data);
            });
        });
    }

    fetchCardOptions(language) {
        const sql = `SELECT card_masterid, data, evolution_card_masterid
                    FROM MCardMasters
                    INNER JOIN textmaster_${language}.MTextMasterS
                    ON text_name_id = id
                    WHERE data LIKE "[%" AND rarity = max_rarity`;
        
        return this.queryMultipleResult(sql, 'Error when retrieving card options');
    }

    fetchCardData(language) {
        const sql = `SELECT card_masterid, data, evolution_card_masterid
                    FROM MCardMasters
                    INNER JOIN textmaster_${language}.MTextMasters
                    ON text_name_id = id
                    WHERE data LIKE "${language === 'en' ? '[' : '【'}%" AND rarity = max_rarity`;
    
        return this.queryMultipleResult(sql, 'Error when retrieving card options');
    }
    
    getCardData(cardId) {
        const sql = `SELECT *
                    FROM MCardMasters
                    WHERE card_masterid = '${cardId}'`;
        
        return this.querySingleResult(sql, 'Error when retrieving card data');
    };
    
    getSkillData(skillId) {
        const sql = `SELECT *
                    FROM MSkillMasters
                    WHERE skill_masterid = '${skillId}'`;
        
        return this.querySingleResult(sql, 'Error when retrieving skill data');
    }
    
    getPassiveBuffs(cardId) {
        const sql = `SELECT *
                    FROM (SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) row, *
                            FROM MCardPowerupMasters)
                    WHERE card_masterid = '${cardId}'`;
    
        return this.queryMultipleResult(sql, 'Error when retrieving passive buffs data');
    }
    
    getActiveBuffs(skillId) {
        const sql = `SELECT *
                    FROM (SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) row, *
                            FROM MSkillBuffMasters)
                    WHERE skill_masterid = '${skillId}'`;
    
        let buffs = [];
        return this.queryMultipleResult(sql, 'Error when retrieving active buffs data')
            .then(async (data) => {
            buffs = data;
    
            return Promise.all(buffs.map((buff) => {
                let sql = `SELECT *
                        FROM MBuffPowerupMasters
                        WHERE buff_masterid = '${buff['buff_masterid']}'`;

                return this.querySingleResult(sql, 'Error when retrieving buff effect data');
            })).then((data) => {
                for (let i = 0; i < buffs.length; i++) {
                    buffs[i]['buffEffect'] = data[i];
                }
                return buffs;
            }).catch((error) => {
                console.log(error);
                return null;
            });
        });
    }
    
    getChargeSkillData(skillId) {
        const sql = `SELECT *
                    FROM MSkillChargeMasters
                    WHERE skill_masterid = '${skillId}'`;
    
        return this.querySingleResult(sql, 'Error when retrieving charge skill data');
    }
    
    getTextData(textId, language) {
        let sql = `SELECT *
                    FROM textmaster_${language}.MTextMasters
                    WHERE id = '${textId}'`;
        
        return this.querySingleResult(sql, 'Error when retrieving text data');
    }
    
    async getSkillRecordData(cardId, language) {
        let skillRecord;
        
        let cardName;
        let cardDescription;
        let cardType;
        let cardData;
        let skillName;
        let skillDescription;
        let skillData = {};
        let buffData = {};
        let hasCharge = false;
    
        cardData = await this.getCardData(cardId);
    
        if (!cardData) {
            return;
        }
    
        skillData['base'] = await this.getSkillData(cardData.skill_masterid);
    
        cardType = cardData.type === 1 ? 'active' : 'passive';
    
        return Promise.all([
            this.getTextData(cardData.text_name_id, language),
            this.getTextData(cardData.text_comment_id, language),
            this.getTextData(skillData.base.text_name_id, language),
            this.getTextData(skillData.base.text_comment_id, language)
        ]).then(async (values) => {
            cardName = values[0].data;
            cardDescription = values[1].data;
            skillName = values[2].data;
            skillDescription = values[3].data;
    
            if (cardType === 'active') {
                buffData['base'] = await this.getActiveBuffs(skillData.base.skill_masterid);
                let chargeSkillData = await this.getChargeSkillData(skillData.base.skill_masterid);
    
                if (chargeSkillData != null) {
                    hasCharge = true;
    
                    return Promise.all([
                        this.getSkillData(chargeSkillData.before_skill_masterid),
                        this.getSkillData(chargeSkillData.after_skill_masterid)
                    ]).then((values) => {
                        skillData['before'] = values[0];
                        skillData['after'] = values[1];
    
                        return Promise.all([
                            this.getActiveBuffs(skillData.before.skill_masterid),
                            this.getActiveBuffs(skillData.after.skill_masterid)
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
                buffData['base'] = await this.getPassiveBuffs(cardId);
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

}

module.exports = SkillRecordDatabase;
