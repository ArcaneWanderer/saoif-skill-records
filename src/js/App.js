import React from 'react';
import '../css/App.css';
import {loadCardOptions} from './script.js';
import SkillRecordGridItem from './SkillRecordGridItem';

class App extends React.Component {
    constructor(props) {
        super(props);

        loadCardOptions().then((data) => {
            this.state = { cards: data };
            this.initializeCardOptions();
        });

        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(e) {
        this.setState({ selected: e.target.value });
    }

    initializeCardOptions() {
        var cardOptions = [];
        for (var [index, card] of this.state.cards.entries()) {
            var option = (
                <option key={ index } value={ card.evolution_card_masterid }>
                    { '#' + ++index + ' ' + card.data }
                </option>
            );
            cardOptions.push(option);
        }
        var selectedCard = this.state.cards[6].evolution_card_masterid;
        this.setState({
            selected: selectedCard,
            cardOptions: cardOptions
        });
    }
    
    loadSkillRecord() {
        console.log(this.currentCard);
    }

    render() {
        var app;

        if (this.state && this.state.selected) {
            app = (
                <div id="app">
                    <select id="card-select" value={ this.state.selected } onChange={ this.handleChange }>
                        { this.state.cardOptions }
                    </select>
                    <br></br>
    
                    <SkillRecordGridItem id="currentCard" cardId={ this.state.selected }></SkillRecordGridItem>
                </div>
            );
        } else {
            app = (
                <div id="app">
                    Loading app...
                    <select hidden id="card-select"></select>
                </div>
            )
        }

        return app;
    }
}

export default App;