import React from 'react';
import Select from 'react-select';
import Immutable from 'immutable';

import SkillRecordGridItem from './SkillRecordGridItem';

import '../css/App.css';

import starOn from '../img/UI_icon_status_rare_on.png';
import loadGif from '../img/oie_trans.gif';

class App extends React.Component {
    constructor(props) {
        super(props);

        var filters = {};
        filters['rarity'] = [];
        filters['skillType'] = [];
        filters['character'] = [];
        
        this.state = {
            cards: [],
            filters: filters,
            visibleItemsCount: 20,
            characterList: [],
            cardNameList: [],
            selectedCharacter: null,
            searchedCharacter: null
        };

        this.handleChange = this.handleChange.bind(this);
        this.scrollLoad = this.scrollLoad.bind(this);
    }

    componentDidMount() {
        // this.loadCardOptions('en').then((data) => {
        //     // this.initializeCardOptions('en');
        //     this.setState({ cards: data });
        // });
        let languageParam = this.props.match.params.language;
        let language = languageParam;

        if (languageParam === 'ja') {
            language = 'jp';
        } else if (languageParam === 'cn' || languageParam === 'zh') {
            language = 'tw';
        } else if (languageParam === 'sk') {
            language = 'ko';
        } else if (!['jp', 'en', 'tw', 'ko'].includes(languageParam) || languageParam === undefined) {
            language = 'en';
        }

        this.loadSkillRecordData(language).then((data) => {
            var characterList = new Set();
            var cardNameList = [];
            data.forEach((element) => {
                characterList.add(element.characterName);
                cardNameList.push(element.cardName);
            });
            this.setState({
                cards: data,
                characterList: [...characterList].sort(),
                cardNameList: cardNameList
            }, () => {
                console.log(this.state.cards);
            });
        }).catch((error => {
            console.log('Failed to initialize app.');
        }));
        
        document.addEventListener('scroll', this.scrollLoad);
    }

    componentWillUnmount() {
        document.removeEventListener('scroll', this.scrollLoad);
    }

    scrollLoad(event) {
        if ((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight) {
            if (this.state && this.state.visibleItemsCount < this.state.cards.length) {
                this.setState({ visibleItemsCount: this.state.visibleItemsCount + 20 });
            }
        }
    }

    handleChange(e) {
        this.setState({ selected: e.target.value });
    }

    initializeCardOptions(language) {
        var cardOptions = [];
        for (var [index, card] of this.state.cards.entries()) {
            var option = (
                <option key={ index } value={ card.evolution_card_masterid }>
                    { '#' + ++index + ' ' + card.data }
                </option>
            );
            cardOptions.push(option);
        }
        var selectedCard = this.state.cards[178].evolution_card_masterid;
        this.setState({
            selected: selectedCard,
            cardOptions: cardOptions
        });
    }

    async loadSkillRecordData(language) {
        return new Promise(function(resolve, reject) {
            fetch(`/${language}/sr`, {method: 'get'})
                .then((response) => {
                    if (response.status !== 200) {
                        console.log('Error when fetching skill record data. Status code:', response.status);
                        reject();
                    } else {
                        return response.json();
                    }
                }).then((data) => {
                    resolve(data);
                }).catch((err) => {
                    console.log('Error when fetching skill record data.', err);
                    reject(err);
                });
        });
    }
    
    async loadCardOptions(language) {
        return new Promise(function(resolve, reject) {
            fetch(`/${language}/card`, {method: 'get'})
                .then(function(response) {
                    if (response.status !== 200) {
                        console.log('Error when fetching card options. Status code:', response.status);
                        reject();
                    } else {
                        return response.json();
                    }
                }).then(function(data) {
                    resolve(data);
                }).catch(function(err) {
                    console.log('Error when fetching card options.', err);
                    reject(err);
                });
        });
    }

    filterCardOptions(cards) {
        var rarity = this.state.filters.rarity;
        var skillType = this.state.filters.skillType;
        var character = this.state.selectedCharacter;
        var search = this.state.searchedCharacter;

        return Immutable.List(cards).filter((card) => {
            var rarityFilter = true;
            var skillTypeFilter = true;
            var characterFilter = true;
            var searchFilter = true;

            if (rarity.length > 0) {
                rarityFilter = rarity.some(value => card.cardData.rarity === value);
            }

            if (skillType.length > 0) {
                skillTypeFilter = skillType.some(value => card.skillType === value);
            }

            if (character != null) {
                characterFilter = character.value === card.characterName;
            }

            if (search != null) {
                searchFilter = search.value === card.cardName;
            }

            return [rarityFilter, skillTypeFilter, characterFilter, searchFilter].every(filter => filter === true);
        });
    }

    handleFilterChoice(e) {
        var filters = this.state.filters;
        var filterName = e.target.name.replace('Filter', '');
        var filter = e.target.value;

        if (!isNaN(filter)) {
            filter = parseInt(filter);
        }
        
        if (filters[filterName].includes(filter)) {
            filters[filterName] = filters[filterName].filter(value => value !== filter);
        } else {
            filters[filterName].push(filter);
        }

        this.setState({
            filters: filters,
            visibleItemsCount: 20
        });
    }

    handleCharacterSelection(value) {
        this.setState({
            selectedCharacter: value,
            visibleItemsCount: 20
        });
    }

    handleCharacterSearch(value) {
        this.setState({
            searchedCharacter: value,
            visibleItemsCount: 20
        });
    }

    render() {
        var app;

        if (this.state && this.state.cards && this.state.cards.length > 0) {
            var cardElements = this.filterCardOptions(this.state.cards);
            const availableCardsCount = cardElements.size;
            cardElements = cardElements.map((card) => {
                return <SkillRecordGridItem
                    key={card.cardData.card_masterid}
                    // cardId={card.evolution_masterid}
                    skillRecord={card}
                ></SkillRecordGridItem>
            }).reverse().slice(0, this.state.visibleItemsCount);

            var rarityFilterButtons = [];
            for (var i = 1; i < 5; i++) {
                var buttonClass = "filter-button" + (this.state.filters.rarity.includes(i) ? " active" : "");
                rarityFilterButtons.push(
                    <label key={i} className={buttonClass}>
                        {i} <img src={starOn} className="filter-star" alt=""></img>
                        <input
                            type="checkbox"
                            name="rarityFilter"
                            value={i}
                            checked={this.state.filters.rarity.includes({i})}
                            onChange={this.handleFilterChoice.bind(this)}
                        >
                        </input>
                    </label>
                );
            };
            
            const skillTypes = [
                "Ability", "1H Sword", "1H Rapier", "Shield",
                "1H Club", "2H Axe", "2H Spear", "Bow", "1H Dagger"
            ];
            var skillTypeRarityButtons = skillTypes.map((value) => {
                var buttonClass = "filter-button" + (this.state.filters.skillType.includes(value) ? " active" : "");
                return (
                    <label key={value} className={buttonClass}>
                        {value}
                        <input
                            type="checkbox"
                            name="skillTypeFilter"
                            value={value}
                            checked={this.state.filters.rarity.includes({value})}
                            onChange={this.handleFilterChoice.bind(this)}
                        >
                        </input>
                    </label>
                );
            });

            var loadingIndicator;

            if (this.state.visibleItemsCount < availableCardsCount) {
                loadingIndicator = (
                    <div id="card-loading-text">
                        <img src={loadGif} alt=""></img>
                    </div>
                );
            }

            const characterList = this.state.characterList.map((value) => {
                return { value: value, label: value};
            });

            const cardNameList = this.state.cardNameList.map((value) => {
                return { value: value, label: value};
            });

            const customStyles = {
                menu: (provided, state) => ({
                    ...provided,
                    backgroundColor: 'rgb(255, 255, 255, 0.9)'
                }),
                control: (provided, state) => ({
                    ...provided,
                    border: state.isFocused ? 0 : 0,
                    boxShadow: state.isFocused ? 0 : 0,
                    '&:hover': {
                        boxShadow: `0 10px 25px -15px rgba(0, 0, 0, .5), 
                                    0 -10px 25px -15px rgba(0, 0, 0, .5)`,
                    },
                    backgroundColor: 'rgb(255, 255, 255, 0.9)',
                    padding: '0.5em',
                })
            }

            app = (
                <div id="app">
                    <div className="filter-group">
                        <div id="skill-type-filter">
                            {skillTypeRarityButtons}
                        </div>
                        <div>
                            <div id="rarity-filter">
                                {rarityFilterButtons}
                            </div>
                            <div id="character-filter">
                                <Select
                                    value={this.state.selectedCharacter}
                                    options={characterList}
                                    styles={customStyles}
                                    onChange={this.handleCharacterSelection.bind(this)}
                                    isClearable={true}
                                    isSearchable={false}
                                    placeholder="Select a character..."
                                />
                            </div>
                        </div>
                        <div id="character-search">
                            <Select
                                value={this.state.searchedCharacter}
                                options={cardNameList}
                                styles={customStyles}
                                onChange={this.handleCharacterSearch.bind(this)}
                                isClearable={true}
                                isSearchable={true}
                                placeholder="Search a skill record..."
                            />
                        </div>
                    </div>
                    <div className="card-group">
                        {cardElements}
                    </div>
                    {loadingIndicator}
                    {/* <select id="card-select" value={ this.state.selected } onChange={ this.handleChange }>
                        { this.state.cardOptions }
                    </select>
                    <br></br>
    
                    <SkillRecordGridItem id="currentCard" cardId={ this.state.selected }></SkillRecordGridItem> */}
                </div>
            );
        } else {
            app = (
                <div id="app" className="loading-app" style={{ height: "100%" }}>
                    <div id="app-loading-text">
                        Loading app...
                        <div>
                            <img src={loadGif} alt=""></img>
                        </div>
                    </div>
                    <select hidden id="card-select"></select>
                </div>
            )
        }

        return app;
    }
}

export default App;