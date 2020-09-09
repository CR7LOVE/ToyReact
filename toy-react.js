const RENDER_TO_DOM = Symbol('render to dom');

export class Component {
    constructor() {
        this.props = Object.create(null);
        this.children = [];
        this._range = null;
    }
    setAttribute(name, value) {
        this.props[name] = value;
    }
    appendChild(component) {
        this.children.push(component) // 注意这里就没有 .root，上面 L9 有 .root 是因为一个节点要添加另一个节点，所以是 .root appendChild .root，而这里只是存到自己的数组中，所以不用 .root
    }
    get vdom() {
        return this.render().vdom; // 递归调用
    }
    [RENDER_TO_DOM](range){
        this._range = range;
        this.render()[RENDER_TO_DOM](range);
    }
    rerender() {
        // TODO：这块没懂，但是老师说没关系，后面会换成 virtual dom
        let oldRange = this._range;

        let range = document.createRange();
        range.setStart(oldRange.startContainer, oldRange.startOffset);
        range.setEnd(oldRange.startContainer, oldRange.startOffset)
        this[RENDER_TO_DOM](range);

        oldRange.setStart(range.endContainer, range.endOffset);
        oldRange.deleteContents();
    }
    setState(newState) {
        if(this.state === null || typeof this.state !== 'object') {
            this.state = newState;
            this.rerender();
            return;
        }
        let merge = (oldState, newState) => {
            for (let p in newState) {
                if(oldState[p] === null || typeof oldState[p] !== 'object') {
                    oldState[p] = newState[p];
                } else {
                    merge(oldState[p], newState[p]) // 对象的情况
                }
            }
        }
        merge(this.state, newState);
        this.rerender();
    }
}

class ElementWrapper extends Component{
    constructor(type) {
        super(type);
        this.type = type;
        this.root = document.createElement(type);
    }
    // setAttribute(name, value) {
    //     if(name.match(/^on([\S\s]+)$/)) {
    //         this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value);
    //     } else {
    //         if(name === 'className') {
    //             this.root.setAttribute("class", value)
    //         } else {
    //             this.root.setAttribute(name, value)
    //         }
    //     }
    // }
    // appendChild(component) {
    //     let range = document.createRange();
    //     range.setStart(this.root, this.root.childNodes.length);
    //     range.setEnd(this.root, this.root.childNodes.length);
    //     component[RENDER_TO_DOM](range);
    // }
    get vdom() {
        return {
            type: this.type,
            props: this.props,
            children: this.children.map(child => child.vdom)
        }
    }
    [RENDER_TO_DOM](range) {
        range.deleteContents();
        range.insertNode(this.root);
    }
}

class TextWrapper extends Component{
    constructor(content) {
        super(content)
        this.content = content;
        this.root = document.createTextNode(content);
    }
    get vdom() {
        return {
            type: '#text',
            content: this.content,
        }
    }
    [RENDER_TO_DOM](range) {
        range.deleteContents();
        range.insertNode(this.root);
    }
}

// 源码中不是这样子的，这样写方便理解
export function createElement(type, attributes, ...children) {
    let e;
    if(typeof type === 'string') { // 这是原生标签的情况
        e = new ElementWrapper(type);
    } else {
        e = new type(); // 这是组件的情况
    }

    for (let p in  attributes) {
        e.setAttribute(p, attributes[p]);
    }
    let insertChildren = (children) => {
        for (let child of children) {
            if(typeof child === 'string') {
                child = new TextWrapper(child);
            }
            if(child === null) {
                continue;
            }
            if(typeof child === 'object' && child instanceof Array) { // this.children 的情况
                insertChildren(child)
            } else {
                e.appendChild(child) // 添加的 child 是个原生标签的情况
            }
        }
    };

    insertChildren(children);
    return e;
}

export function render(component, parentElement) {
    let range = document.createRange();
    range.setStart(parentElement, 0);
    range.setEnd(parentElement, parentElement.childNodes.length);
    range.deleteContents();
    component[RENDER_TO_DOM](range)
}