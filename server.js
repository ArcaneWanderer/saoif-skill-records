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

app.get('/sr/:cardId', (req, res) => {
    var cardId = req.params.cardId;
    // var db = createConnection(JP_DATABASE);
    // var sql = `SELECT *
    //             FROM MCardMasters
    //             WHERE card_masterid = '${cardId}'`;
});

app.get('/card', (req, res) => {
    var db = createConnection(JP_DATABASE);
    var sql = `SELECT card_masterid, data, evolution_card_masterid, skill_masterid
                FROM MCardMasters
                INNER JOIN textmaster.MTextMasterS
                ON text_name_id = id
                WHERE data LIKE "[%" AND rarity = max_rarity - 1`;
    
    db.run(`ATTACH DATABASE '${TEXT_DATABASE_EN}' AS textmaster`, [], (error) => {
        if (error) { 
            throw error;
        }

        db.all(sql, [], (error, rows) => {
            if (error) { 
                throw error;
            }

            var data = [];
            rows.forEach((row) => {
                data.push(row);
            });

            res.contentType('application/json');
            res.send(JSON.stringify(data));
            
            closeConnection(db);
        });
    });

});

app.get('/card/:cardId', (req, res) => {
    var cardId = req.params.cardId;
    var db = createConnection(JP_DATABASE);
    var sql = `SELECT *
                FROM MCardMasters
                WHERE card_masterid = '${cardId}'`;
    
    db.get(sql, [], (error, row) => {
        if (error) {
            throw error;
        }

        res.contentType('application/json');
        
        if (row) {
            res.send(row);
        } 
        else {
            res.send("Error");
        }
        
        closeConnection(db);
    });
});

app.get('/skill/:skillId', (req, res) => {
    var skillId = req.params.skillId;
    var db = createConnection(JP_DATABASE);
    var sql = `SELECT *
                FROM MSkillMasters
                WHERE skill_masterid = '${skillId}'`;
    
    db.get(sql, [], (error, row) => {
        if (error) {
            throw error;
        }

        res.contentType('application/json');
        
        if (row) {
            res.send(row);
        } 
        else {
            res.send("Error");
        }
        
        closeConnection(db);
    });
});

app.get('/buff/passive/:cardId', (req, res) => {
    var cardId = req.params.cardId;
    var db = createConnection(JP_DATABASE);
    var sql = `SELECT *
                FROM MCardPowerupMasters
                WHERE card_masterid = '${cardId}'`;

    var data = [];
    
    db.run(`ATTACH DATABASE '${TEXT_DATABASE_EN}' AS textmaster`, [], (error) => {
        if (error) {
            throw error;
        }
        db.all(sql, [], (error, rows) => {
            if (error) {
                throw error;
            }
            rows.forEach((row) => {
                data.push(row);
            });

            res.contentType('application/json');
            res.send(JSON.stringify(data));
            
            closeConnection(db);
        });
    });
});

app.get('/buff/active/:cardId', (req, res) => {
    var cardId = req.params.cardId;
    var db = createConnection(JP_DATABASE);
    var sql = `SELECT *
                FROM MCardMasters
                WHERE card_masterid = '${cardId}'`;
    
    var skillId;
    db.get(sql, [], (error, row) => {
        if (error) {
            throw error;
        }

        skillId = row['skill_masterid'];
        
        var sql2 = `SELECT *
                    FROM MSkillBuffMasters
                    WHERE skill_masterid = '${skillId}'`

        var buffSkills = [];
        db.all(sql2, [], (error, rows) => {
            if (error) {
                throw error;
            }
            rows.forEach((row) => {
                buffSkills.push(row);
            });

            
            for (var buffSkill in buffSkills) {
                var sql3 = `SELECT *
                            FROM MBuffPowerupMasters
                            WHERE buff_masterid = '${buffSkill['buff_masterid']}'`;
                db.all(sql3, [], (error, rows) => {
                    if (error) {
                        throw error;
                    }
                    var buffEffects = [];
                    rows.forEach((row) => {
                        buffEffects.push(row);
                    });
                    buffSkill['buffEffects'] = buffEffects;
                });
            }

            res.contentType('application/json');
            res.send(JSON.stringify(buffSkills));
            
            closeConnection(db);
        });
    });
});

app.get('/text/:textId', (req, res) => {
    var textId = req.params.textId;
    var db = createConnection(TEXT_DATABASE_EN);
    var sql = `SELECT *
                FROM MTextMasters
                WHERE id = '${textId}'`;
    
    db.get(sql, [], (error, row) => {
        if (error) {
            throw error;
        }

        res.contentType('application/json');
        
        if (row) {
            res.send(row);
        } 
        else {
            res.send("Error");
        }
        
        closeConnection(db);
    });
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

app.listen(SERVER_PORT, SERVER_HOST, () => console.log(`Server running at http://${SERVER_HOST}:${SERVER_PORT}/`));