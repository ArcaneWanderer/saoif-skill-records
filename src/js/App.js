import React from 'react';
import '../css/App.css';
import SkillRecordGridItem from './SkillRecordGridItem';

class App extends React.Component {
    render() {
        return (
            <div id="app">
                <SkillRecordGridItem cardId='6100001'></SkillRecordGridItem>
            </div>
        )
    }
}

export default App;