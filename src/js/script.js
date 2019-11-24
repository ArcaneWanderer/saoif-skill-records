const SERVER_HOST = process.env.IP || 'localhost';
const SERVER_PORT = process.env.PORT || 8080;
const HOST_URL = SERVER_HOST + ':' + SERVER_PORT;

export async function loadCardOptions() {
    return new Promise(function(resolve, reject) {
        fetch('/card', {method: 'get'})
            .then(function(response) {
                if (response.status !== 200) {
                    console.log('Looks like there was a problem. Status Code: ' + response.status);
                    return;
                }

                return response.json();
            }).then(function(data) {
                resolve(data);
            }).catch(function(err) {
                console.log('Fetch Error :-S', err);
            });
    });
}

async function loadCardInfo(cardId) {
    var card = '';
    return new Promise(function(resolve, reject) {
        fetch('/card/' + cardId, {method: 'get'})
            .then(function(response) {
                if (response.status !== 200) {
                    console.log('Looks like there was a problem. Status Code: ' + response.status);
                    return;
                }

                return response.json();
            }).then(function(data) {
                card = data;
                resolve(card);
            }).catch(function(err) {
                console.log('Fetch Error :-S', err);
            });
    });
}

async function loadSkillInfo(skillId) {
    var skill = '';
    return new Promise(function(resolve, reject) {
        fetch('/skill/' + skillId, {method: 'get'})
            .then(function(response) {
                if (response.status !== 200) {
                    console.log('Looks like there was a problem. Status Code: ' + response.status);
                    return;
                }

                return response.json();
            }).then(function(data) {
                skill = data;
                resolve(skill);
            }).catch(function(err) {
                console.log('Fetch Error :-S', err);
            });
    });
}

async function loadPassiveBuffs(cardId) {
    var buffs = [];
    return new Promise(function(resolve, reject) {
        fetch('/buff/passive/' + cardId, {method: 'get'})
            .then(function(response) {
                if (response.status !== 200) {
                    console.log('Looks like there was a problem. Status Code: ' + response.status);
                    return;
                }

                return response.json();
            }).then(function(data) {
                buffs = data;
                resolve(buffs);
            }).catch(function(err) {
                console.log('Fetch Error :-S', err);
            });
    });
}

async function loadActiveBuffs(cardId) {
    var buffs = [];
    return new Promise(function(resolve, reject) {
        fetch('/buff/active/' + cardId, {method: 'get'})
            .then(function(response) {
                if (response.status !== 200) {
                    console.log('Looks like there was a problem. Status Code: ' + response.status);
                    return;
                }

                return response.json();
            }).then(function(data) {
                buffs = data;
                resolve(buffs);
            }).catch(function(err) {
                console.log('Fetch Error :-S', err);
            });
    });
}

async function loadTextData(textId) {
    var textData = '';
    return new Promise(function(resolve, reject) {
        fetch('/text/' + textId, {method: 'get'})
            .then(function(response) {
                if (response.status !== 200) {
                    console.log('Looks like there was a problem. Status Code: ' + response.status);
                    return;
                }

                return response.json();
            }).then(function(data) {
                textData = data;
                resolve(textData);
            }).catch(function(err) {
                console.log('Fetch Error :-S', err);
            });
    });
}

export const buildSkillRecordInfo = function(cardId) {
    var skillRecord = {};
    var cardInfo;
    var skillInfo;
    var cardName;
    var cardDescription;
    var skillName;
    var skillDescription;
    var passiveBuffs = [];
    var activeBuffs = [];

    return new Promise(async function(resolve, reject) {
        await loadCardInfo(cardId)
            .then(async function(data) {
                cardInfo = data;
                return await loadSkillInfo(data['skill_masterid']);
            }).then(async function(data) {
                skillInfo = data;
                return await loadTextData(cardInfo['text_name_id']);
            }).then(async function(data) {
                cardName = data['data'];
                return await loadTextData(cardInfo['text_comment_id']);
            }).then(async function(data) {
                cardDescription = data['data'];
                return await loadTextData(skillInfo['text_name_id']);
            }).then(async function(data) {
                skillName = data['data'];
                return await loadTextData(skillInfo['text_comment_id']);
            }).then(async function(data) {
                skillDescription = data['data'];
                
                if (cardInfo['type'] == 2) {
                    return await loadPassiveBuffs(cardInfo['card_masterid']);
                } else {
                    return await loadActiveBuffs(cardInfo['card_masterid']);
                }
            }).then(async function(data) {
                if (cardInfo['type'] == 2) {
                    passiveBuffs = data;
                } else {
                    activeBuffs = data;
                }

                skillRecord['cardInfo'] = cardInfo;
                skillRecord['skillInfo'] = skillInfo;
                skillRecord['cardName'] = cardName;
                skillRecord['cardDescription'] = cardDescription;
                skillRecord['skillName'] = skillName;
                skillRecord['skillDescription'] = skillDescription;
                skillRecord['passiveBuffs'] = passiveBuffs;
                skillRecord['activeBuffs'] = activeBuffs;

                resolve(skillRecord);
            });
    });
}