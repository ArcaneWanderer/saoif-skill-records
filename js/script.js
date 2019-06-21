var HOST = 'http://localhost'
var PORT = 5000
var HOST_URL = HOST + ':' + PORT

var cards = []
var selectedCard = {}

Vue.component('skill-record-info', {
    props: ['cardId'],
    data: function () {
        return {
            skillRecord: {'cardInfo': {}},
            level: 80
        }
    },
    methods: {
        toggleTransform: function() {
            if (this.skillRecord.cardInfo.evolution_card_masterid > 0) {
                this.cardId = this.skillRecord.cardInfo.evolution_card_masterid;
            } else {
                this.cardId = this.skillRecord.cardInfo.base_card_masterid;
            }
        },
        updateSkillRecord: async function() {
            this.skillRecord = await buildSkillRecordInfo(this.cardId);
            console.log(this.skillRecord);

            var description = this.skillRecord.skillDescription;
            description = description.replace(/\\n/g, '<br>');
            description = description.replace('%SkillDamage%', this.skillRecord.skillInfo['bAtkRate'] / 100 + (this.level-1) + '%');
            
            console.log(description);

            if (this.skillRecord.cardInfo.type == 2) {
                if (description.includes('%BuffRate0%')) {
                    for (var i = 0; i < this.skillRecord.passiveBuffs.length; i++) {
                        var buff = this.skillRecord.passiveBuffs[i];
                        description = description.replace('%BuffRate' + i + '%', (buff.slope * this.level + buff.intercept) / 100 + '%');
                    }
                } else {
                    for (var i = 0; i < this.skillRecord.passiveBuffs.length; i++) {
                        var buff = this.skillRecord.passiveBuffs[i];
                        if (!buff.define_name.includes('Rate') && this.skillRecord.passiveBuffs.length > 1) {
                            continue;
                        }
                        description = description.replace('%BuffRate%', (buff.slope * this.level + buff.intercept) / 100 + '%');
                    }
                }
                
                // for (var i = 0; i < this.skillRecord.passiveBuffs.length; i++) {
                //     var buff = this.skillRecord.passiveBuffs[i];
                //     if (buff.define_name.includes('Rate')) {
                //         continue;
                //     }
                //     description = description.replace('%BuffConst%', (buff.slope * this.level + buff.intercept));
                // }
                
                if (description.includes('%BuffConst0%')) {
                    var j = 0;
                    for (var i = 0; i < this.skillRecord.passiveBuffs.length; i++) {
                        var buff = this.skillRecord.passiveBuffs[i];
                        if (buff.define_name.includes('Rate') || buff.define_name.includes('Buff')) {
                            continue;
                        }
                        description = description.replace('%BuffConst' + i + '%', (buff.slope * this.level + buff.intercept));
                        j++;
                    }
                } else if (this.skillRecord.passiveBuffs.length > 0) {
                    for (var i = 0; i < this.skillRecord.passiveBuffs.length; i++) {
                        var buff = this.skillRecord.passiveBuffs[i];
                        if (buff.define_name.includes('Rate')) {
                            continue;
                        }
                            description = description.replace('%BuffConst%', (buff.slope * this.level + buff.intercept));
                    }
                }
                
            } else {
                if (description.includes('%BuffRate0%')) {
                    for (var i = 0; i < this.skillRecord.activeBuffs.length; i++) {
                        var buff = this.skillRecord.activeBuffs[i];
                        description = description.replace('%BuffRate' + i + '%', (buff.buffEffects[0].slope * (buff.buff_level + this.level) + buff.buffEffects[0].intercept) / 100 + '%');
                    }
                } else {
                    for (var i = 0; i < this.skillRecord.activeBuffs.length; i++) {
                        var buff = this.skillRecord.activeBuffs[i];
                        if (!buff.define_name.includes('Rate') && this.skillRecord.passiveBuffs.length > 1) {
                            continue;
                        }
                        description = description.replace('%BuffRate%', (buff.buffEffects[0].slope * (buff.buff_level + this.level) + buff.buffEffects[0].intercept) / 100 + '%');
                    }
                }
                
                if (description.includes('%BuffTime0%')) {
                    for (var i = 0; i < this.skillRecord.activeBuffs.length; i++) {
                        var buff = this.skillRecord.activeBuffs[i];
                        description = description.replace('%BuffTime' + i + '%', this.skillRecord.activeBuffs[i].buff_time);
                    }
                } else if (this.skillRecord.activeBuffs.length > 0) {
                        description = description.replace('%BuffTime%', this.skillRecord.activeBuffs[0].buff_time);
                }
                
                if (description.includes('%BuffConst0%')) {
                    var j = 0;
                    for (var i = 0; i < this.skillRecord.activeBuffs.length; i++) {
                        var buff = this.skillRecord.activeBuffs[i];
                        if (buff.define_name.includes('Rate')) {
                            continue;
                        }
                        description = description.replace('%BuffConst' + j + '%', (buff.buffEffects[0].slope * (buff.buff_level + this.level) + buff.buffEffects[0].intercept));
                        j++;
                    }
                } else if (this.skillRecord.activeBuffs.length > 0) {
                    for (var i = 0; i < this.skillRecord.activeBuffs.length; i++) {
                        var buff = this.skillRecord.activeBuffs[i];
                        if (buff.define_name.includes('Rate')) {
                            continue;
                        }
                        description = description.replace('%BuffConst%', (buff.buffEffects[0].slope * (buff.buff_level + this.level) + buff.buffEffects[0].intercept));
                    }
                }

                // if (this.skillRecord.activeBuffs.length > 0) {
                //     description = description.replace('%BuffTime%', this.skillRecord.activeBuffs[0].buff_time);
                // }
            }

            this.skillRecord.skillDescription = description;
        }
    },
    watch: {
        cardId: function() {
            this.updateSkillRecord();
        },
        level: function() {
            this.updateSkillRecord();
        }
    },
    mounted: function() {
        // this.skillRecord = await buildSkillRecordInfo(this.cardId);
        this.updateSkillRecord();
    },
    template: `
        <div class="card">
            <div><input v-model="level"></div><br>
            <div class="card-info">
                <div class="card-type">
                    <span>{{ skillRecord.cardInfo.type == 1 ? "Sword Skill" : "Ability" }}</span>
                </div>
                <p class="card-title">{{ skillRecord.cardName }}</p>
                <div class="card-rarity">
                    <span v-for="index in skillRecord.cardInfo.rarity" :key="index">⭐</span>
                </div>
                <div class="card-img">
                    <img v-bind:src="'https://raw.githubusercontent.com/Nayuta-Kani/SAOIF-Skill-Records-Database/master/srimages/sr_icon_l_' + (skillRecord.cardInfo.evolution_card_masterid > 0 ? skillRecord.cardInfo.evolution_card_masterid : skillRecord.cardInfo.card_masterid) + '.png'">
                </div>
                <div class="card-details">
                    <p class="skill-name">{{ skillRecord.skillName }}</p>
                    <p class="skill-description" v-html="skillRecord.skillDescription"></p>
                    <div class="card-id-text">
                        <span>#{{ skillRecord.cardInfo.card_masterid }}</span>
                    </div>
                </div>
            </div>
            <div class="card-actions">
                <button @click="toggleTransform">⭐</button>
            </div>
        </div>
    `
});

/* <p class="skill-name">{{ skillRecord.skillName }}</p> */

// <p v-for="(info, key, index) in skillRecord.cardInfo">
//     {{ key + ": " + info }}
// </p>

var app = new Vue({
    el: '#app',
    data: {
        selected: selectedCard,
        cardOptions: cards,
        currentCard: null
    },
    methods: {
        loadSkillRecord: async function() {
            // this.currentCard = await buildSkillRecordInfo(this.selected.card_masterid);
            console.log(this.currentCard);
        },
        triggerCardSelect: function(value) {
            this.selected = value;
        }
    }
})

window.onload = async function() {
    await loadCardOptions()
        .then(function(data) {
            document.getElementById("card-select").selectedIndex = "0";
            selectedCard = data[0];
            cards = data;
            // console.log(app.selected);
            app.triggerCardSelect(selectedCard);
        });
}

async function loadCardOptions() {
    return new Promise(function(resolve, reject) {
        fetch(HOST_URL + '/card', {method: 'get'})
            .then(function(response) {
                if (response.status !== 200) {
                    console.log('Looks like there was a problem. Status Code: ' + response.status);
                    return;
                }

                return response.json();
            }).then(function(data) {
                app.cardOptions = data;
                resolve(app.cardOptions);
            }).catch(function(err) {
                console.log('Fetch Error :-S', err);
            });
    });
}

async function loadCardInfo(cardId) {
    card = ''
    return new Promise(function(resolve, reject) {
        fetch(HOST_URL + '/card/' + cardId, {method: 'get'})
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
    skill = ''
    return new Promise(function(resolve, reject) {
        fetch(HOST_URL + '/skill/' + skillId, {method: 'get'})
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
    buffs = []
    return new Promise(function(resolve, reject) {
        fetch(HOST_URL + '/buff/passive/' + cardId, {method: 'get'})
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
    buffs = []
    return new Promise(function(resolve, reject) {
        fetch(HOST_URL + '/buff/active/' + cardId, {method: 'get'})
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
    textData = ''
    return new Promise(function(resolve, reject) {
        fetch(HOST_URL + '/text/' + textId, {method: 'get'})
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

function buildSkillRecordInfo(cardId) {
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