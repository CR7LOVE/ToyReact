import {Component, render, createElement} from "./toy-react";

class MyComponent extends Component{
    constructor() {
        super();
        this.state = {
            f: 1111
        }
    }
    render() {
        return <div>
            <h1>my component</h1>
            { this.children }
            <p>{this.state.f.toString()}</p>
        </div>
    }
}

render(
    <MyComponent id="a" class="c">
        <div>abc</div>
        <div></div>
        <div></div>
    </MyComponent>, document.body
);
