const RENDER_TO_DOM = Symbol('render to dom');

class ElementWrapper {
    constructor(type) {
        this.root = document.createElement(type);
    }
    setAttribute(name, value) {
        this.root.setAttribute(name, value)
    }
    appendChild(component) {
        let range = document.createRange();
        range.setStart(this.root, this.root.childNodes.length); // TODO: 这里没懂
        range.setEnd(this.root, this.root.childNodes.length);
        component[RENDER_TO_DOM](range);
    }
    [RENDER_TO_DOM](range) {
        range.deleteContents();
        range.insertNode(this.root);
    }
}

class TextWrapper {
    constructor(content) {
        this.root = document.createTextNode(content);
    }
    [RENDER_TO_DOM](range) {
        range.deleteContents();
        range.insertNode(this.root);
    }
}

export class Component {
    constructor() {
        this.props = Object.create(null);
        this.children = [];
    }
    setAttribute(name, value) {
        this.props[name] = value;
    }
    appendChild(component) {
        this.children.push(component)
    }
    [RENDER_TO_DOM](range){
        this.render()[RENDER_TO_DOM](range); // component[RENDER_TO_DOM](range) 时会调用这里
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