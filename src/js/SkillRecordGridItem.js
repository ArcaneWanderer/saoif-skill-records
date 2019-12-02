import React from 'react';
import '../css/SkillRecordGridItem.css';

import loadGif from '../img/oie_trans.gif';
import starOn from '../img/UI_icon_status_rare_on.png';
import starOff from '../img/UI_icon_status_rare_off.png';
import cardFrame1_1 from '../img/Base_Frame/sr_base_1_1.png';
import cardFrame2_1 from '../img/Base_Frame/sr_base_2_1.png';
import cardFrame3_1 from '../img/Base_Frame/sr_base_3_1.png';
import cardFrame4_1 from '../img/Base_Frame/sr_base_4_1.png';
import cardFrame1_2 from '../img/Base_Frame/sr_base_1_2.png';
import cardFrame2_2 from '../img/Base_Frame/sr_base_2_2.png';
import cardFrame3_2 from '../img/Base_Frame/sr_base_3_2.png';
import cardFrame4_2 from '../img/Base_Frame/sr_base_4_2.png';

class SkillRecordGridItem extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            level: 1,
            maxLevel: 1,
            cardId: props.cardId,
            skillRecord: props.skillRecord ? props.skillRecord : null,
            skillDescription: '',
            cardImageLoaded: false
        };
    }

    handleChange(e) {
        var input = e.target.value;
        if (isNaN(input) || input === '0' || input === '') {
            input = 1;
        } else {
            input = parseInt(input);
            if (input < 0) {
                input = 1;
            } else if ( input > this.state.maxLevel) {
                input = this.state.maxLevel;
            }
        }
        this.setState({ level: input }, () => {
            this.updateSkillRecord();
        });
    }

    handleLoad(e) {
        if (!this.state.cardImageLoaded) {
            this.setState({ cardImageLoaded: true });
            document.getElementById('card-image').style.display = 'inline';
        }
    }
    
    toggleTransform() {
        // Note: The addition to maxLevel is +/- depending on what form 
        // the skill record is first initialized in
        var maxLevel = this.state.maxLevel;
        if (this.state.skillRecord.cardData.evolution_card_masterid > 0) {
            maxLevel += 10;
            this.setState({
                cardId: this.state.skillRecord.cardData.evolution_card_masterid,
                maxLevel: maxLevel
            }, () => {
                this.updateSkillRecord();
            });
        } else {
            maxLevel -= 10;
            if (this.state.level > maxLevel) {
                this.setState({ level: maxLevel });
            }
            this.setState({
                cardId: this.state.skillRecord.cardData.base_card_masterid,
                maxLevel: maxLevel
            }, () => {
                this.updateSkillRecord();
            });
        }
    }

    blockKeyInput(e) {
        // e.preventDefault();
    }

    initializeLevel(rarity) {
        var level = 1;
        switch (rarity) {
            case 5:
                level = 80;
                break;
            case 4:
                level = 70;
                break;
            case 3:
                level = 60;
                break;
            case 2:
                level = 50;
                break;
            case 1:
                level = 40;
                break;
            default:
                level = 1;
        }
        this.setState({ 
            maxLevel: level + 20,
            level: level 
        });
    }

    componentDidMount() {
        // Preload images
        const image = new Image();
        image.src = cardFrame1_1;
        image.src = cardFrame2_1;
        image.src = cardFrame3_1;
        image.src = cardFrame4_1;
        image.src = cardFrame1_2;
        image.src = cardFrame2_2;
        image.src = cardFrame3_2;
        image.src = cardFrame4_2;
        
        if (this.state.skillRecord) {
            this.initializeLevel(this.state.skillRecord.cardData.rarity);
            this.useSkillRecordData(this.state.skillRecord);
        } else {
            this.loadSkillRecordData(this.state.cardId).then((data) => {
                this.initializeLevel(data.cardData.rarity);
                this.updateSkillRecord();
            });
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.cardId !== this.props.cardId) {
            this.setState({ cardImageLoaded: false });
            if (document.getElementById('card-image')) {
                document.getElementById('card-image').style.display = 'none';
            }
            
            this.setState({ cardId: this.props.cardId }, () => {
                this.loadSkillRecordData(this.props.cardId).then((data) => {
                    this.initializeLevel(data);
                    this.updateSkillRecord();
                });
            });
        }
    }
    
    async loadSkillRecordData(cardId) {
        return new Promise(function(resolve, reject) {
            fetch('/en/sr/' + cardId, {method: 'get'})
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

    async useSkillRecordData(skillRecord) {
        var description = skillRecord.skillDescription;

        description = this.mapDescription(description, skillRecord, this.state.level);

        this.setState({
            skillRecord: skillRecord,
            skillDescription: description
        });
    }

    updateSkillRecord() {
        new Promise((resolve, reject) => {
            this.loadSkillRecordData(this.state.cardId).then((data) => {
                var skillRecord = data;
                var description = skillRecord.skillDescription;

                description = this.mapDescription(description, skillRecord, this.state.level);
        
                this.setState({
                    skillRecord: skillRecord,
                    skillDescription: description
                }, () => {
                    resolve();
                });
            });
        });
    }

    mapDescription(rawDescription, skillRecord, level) {
        var description = rawDescription; // The description template containing buff tags and no values
        
        // Replace line breaks with HTML line breaks <br>
        description = description.replace(/\\n/g, '<br>');

        var skillData;
        var buff;
        var buffRate;

        // TODO: Do something better about this duplicated code
        if (skillRecord.skillData.hasOwnProperty('before')) {
            skillData = skillRecord.skillData.before;

            description = description.replace(`%SkillDamage ${skillData.skill_masterid}%`, skillData['bAtkRate'] / 100 + (level-1) + '%');

            if (skillRecord.buffData.before.length > 0) {
                buff = skillRecord.buffData.before[0];
                buffRate = buff.buffEffect.slope * (buff.buff_level + level - 1) + buff.buffEffect.intercept;
                buffRate = (buffRate / 100) + '%';
                description = description.replace(`%BuffRate ${skillData.skill_masterid}%`, buffRate);
                description = description.replace(`%BuffTime ${skillData.skill_masterid}%`, buff.buff_time);
            }
        }
        
        if (skillRecord.skillData.hasOwnProperty('after')) {
            skillData = skillRecord.skillData.after;

            description = description.replace(`%SkillDamage ${skillData.skill_masterid}%`, skillData['bAtkRate'] / 100 + (level-1) + '%');

            if (skillRecord.buffData.after.length > 0) {
                buff = skillRecord.buffData.after[0];
                buffRate = buff.buffEffect.slope * (buff.buff_level + level - 1) + buff.buffEffect.intercept;
                buffRate = (buffRate / 100) + '%';
                description = description.replace(`%BuffRate ${skillData.skill_masterid}%`, buffRate);
                description = description.replace(`%BuffTime ${skillData.skill_masterid}%`, buff.buff_time);
            }
        }

        // Immediately compute and map the skill damage multiplier
        description = description.replace('%SkillDamage%', skillRecord.skillData.base['bAtkRate'] / 100 + (level-1) + '%');

        // Get all the buff tags and store them in an array in the order that they are found
        // e.g. ["%BuffRate%", "%BuffTime%"]
        var buffTags = description.match(/%Buff.+?%/g);

        // If there are no buff tags, no need to map anything else
        if (buffTags == null) {
            return description;
        }

        var buffs = []; // The buffs taken from buffList and stored in a Queue data structure
        var buffList = []; // Contains a reference to the buffs according to the database format
        var durations = []; // The durations of each skill record as a Queue data structure

        // If the skill record is a passive/ability-type (i.e. type == 2)
        // if (skillRecord.cardInfo.type == 2) {
        //     buffList = skillRecord.passiveBuffs.reverse();
        // } else {
        //     buffList = skillRecord.activeBuffs.reverse();
        // }
        buffList = skillRecord.buffData.base.reverse();

        // Do one pass across the list of buffs and store them in a different array
        // Also store the durations of each buff
        for (var i = 0; i < buffList.length; i++) {
            buff = buffList[i];
            buffs.push(buff);

            if (buff.hasOwnProperty('buff_time')) {
                durations.push(buff.buff_time);
            }
        }

        // e.g. {"%BuffRate%": "23%"}
        // The stored value is already the computed one based on level ^
        var buffMappings = {};

        // While there are still buff tags to be processed
        // Treat buffTags as a Queue data structure
        while (buffTags.length > 0) {
            var buffTag = buffTags.shift(); // Dequeue
            var value = -1; // The computed value to be added in buffMappings

            // If the buff tag is BuffTime, the value is from the durations queue
            if (buffTag.includes('BuffTime')) {
                value = durations.shift();
            } else {
                if (buffs.length <= 0) {
                    break;
                }
                buff = buffs.shift();

                // If it has buffEffects, then the buff is from an active skill
                // Data from active and passive skills are stored differently for some reason
                if (buff.hasOwnProperty('buffEffect')) {
                    value = buff.buffEffect.slope * (buff.buff_level + level - 1) + buff.buffEffect.intercept;
                } else {
                    value = buff.slope * level + buff.intercept;
                }

                // If the value is negative, make it positive
                // The description already has the "-" so no need for the actual value to be negative
                if (value < 0) {
                    value *= -1;
                }

                // If it's a rate/percentage, multiply by 100 and add a %
                if (buffTag.includes('BuffRate')) {
                    value = value / 100 + '%';
                }
            }

            // Store the buffTag and value in the mapping
            // e.g. {"%BuffRate%": "23%"}
            buffMappings[buffTag] = value;
        }

        // The replacement via mapping proper
        for (var tag in buffMappings) {
            description = description.replace(new RegExp(tag, "g"), buffMappings[tag]);
        }

        return description;
    }

    render() {

        if (this.state && this.state.skillRecord) {
            var stars = [];

            for (var i = 0; i < this.state.skillRecord.cardData.rarity; i++) {
                var star = <span key={i}><img width='25em' height='25em' src={starOn} alt=''></img></span>;
                stars.push(star);
            }
            // If the skill record is not the transformed version
            if (this.state.skillRecord.cardData.evolution_card_masterid > 0) {
                stars.push(<span key={this.state.skillRecord.cardData.rarity}><img width='25em' height='25em' src={starOff} alt=''></img></span>);
            }

            var imageSource;

            if (this.state.skillRecord.cardData.evolution_card_masterid === 0) {
                switch (this.state.skillRecord.cardData.rarity) {
                    case 2:
                        imageSource = cardFrame1_2;
                        break;
                    case 3:
                        imageSource = cardFrame2_2;
                        break;
                    case 4:
                        imageSource = cardFrame3_2;
                        break;
                    case 5:
                        imageSource = cardFrame4_2;
                        break;
                    default:
                        break;
                }
            } else {
                switch (this.state.skillRecord.cardData.rarity) {
                    case 1:
                        imageSource = cardFrame1_1;
                        break;
                    case 2:
                        imageSource = cardFrame2_1;
                        break;
                    case 3:
                        imageSource = cardFrame3_1;
                        break;
                    case 4:
                        imageSource = cardFrame4_1;
                        break;
                    default:
                        break;
                }
            }

            var cardImage = (
                <img 
                    onLoad={ this.handleLoad.bind(this) }
                    id='card-image'
                    alt=''
                    // style={{ display: this.state.cardImageLoaded ? "inline" : "none" }}
                    src={'https://raw.githubusercontent.com/Nayuta-Kani/SAOIF-Skill-Records-Database/master/srimages/sr_icon_l_' + (this.state.skillRecord.cardData.evolution_card_masterid > 0 ? this.state.skillRecord.cardData.evolution_card_masterid : this.state.skillRecord.cardData.card_masterid) + '.png'}>
                </img>
            )

            var cardBackground = <img src={imageSource} alt=''></img>;
        }

        return (
            this.state && this.state.skillRecord &&
            <div className="card">
                {/* <div className="card-actions">
                    <input type="number" placeholder="Level" min="1" max={ this.state.maxLevel } onChange={ this.handleChange.bind(this) } value={ this.state.level } onKeyDown={ this.blockKeyInput.bind(this) }></input>
                    <button onClick={ this.toggleTransform.bind(this) }>Transform</button>
                </div>
                <br></br> */}
                <div className="card-info">
                    <div className="card-type">
                        <span>{ this.state.skillRecord.cardData.type === 1 ? "Sword Skill" : "Ability" }</span>
                    </div>
                    <p className="card-title">{ this.state.skillRecord.cardName }</p>
                    <div className="card-rarity">
                        { stars }
                    </div>
                    <div className="card-img">
                        { this.state.cardImageLoaded ? "" : <img src={loadGif} alt=''></img>}
                        { this.state.cardImageLoaded ? cardBackground : "" }
                        { cardImage }
                    </div>
                    <div className="card-details">
                        <p className="skill-name">
                            { this.state.skillRecord.skillName.replace(/\//g, ', ') }
                            {/* <span className="skill-level"><br></br>Lv. { this.state.level }</span> */}
                        </p>
                        {/* <p className="skill-description" dangerouslySetInnerHTML={{__html: this.state.skillDescription}}>
                        </p> */}
                        <div className="card-id-text">
                            <span>#{ this.state.skillRecord.cardData.card_masterid }</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default SkillRecordGridItem;