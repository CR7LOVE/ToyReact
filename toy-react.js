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
        this._vdom = this.vdom;
        this._vdom[RENDER_TO_DOM](range);
    }
    update() {
        // 对比分两段逻辑：1. 对比根结点，包含 props 2. 对比 children
        // 如果节点不同，会 replace

        let isSameNode = (oldNode, newNode) => {
            if(oldNode.type !== newNode.type) {
                return false;
            }
            // 旧的属性比新的属性多，说明不一样了，此时返回 false
            if(Object.keys(oldNode.props).length > Object.keys(newNode.props).length) {
                return false;
            }

            for(let name in newNode.props) {
                if(newNode.props[name] !== oldNode.props[name]) {
                    return false;
                }
            }
            if(newNode.type === '#text') {
                if(newNode.content !== oldNode.content) {
                    return false;
                }
            }
            return true;
        };

        // 递归，所以写成一个函数
        let _update = (oldNode, newNode) => {
            if (!isSameNode(oldNode, newNode)) {
                newNode[RENDER_TO_DOM](oldNode._range); // 替换，覆盖
                return;
            }
            newNode._range = oldNode._range;

            // 处理 children
            let newChildren = newNode.vchildren;
            let oldChildren = oldNode.vchildren;
            if(!newChildren || !newChildren.length) {
                return;
            }

            let tailRange = oldChildren[oldChildren.length - 1]._range;

            for(let i = 0; i < newChildren.length; i++) {
                let newChild = newChildren[i];
                let oldChild = oldChildren[i];
                if(i < oldChildren.length) {
                    _update(oldChild, newChild);
                } else {
                    let range = document.createRange();
                    range.setStart(tailRange.endContainer, tailRange.endOffset);
                    range.setEnd(tailRange.endContainer, tailRange.endOffset);
                    newChild[RENDER_TO_DOM](range);
                    tailRange = range;
                }

            }
        }
        let vdom = this.vdom; // 新 vdom
        _update(this._vdom, vdom);
        this._vdom = vdom;
    }

    setState(newState) {
        if(this.state === null || typeof this.state !== 'object') {
            this.state = newState;
            // this.update();
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
        this.update();
    }
}

class ElementWrapper extends Component{
    constructor(type) {
        super(type);
        this.type = type;
    }
    get vdom() {
        this.vchildren = this.children.map(child => child.vdom)
        return this;
    }
    [RENDER_TO_DOM](range) {
        this._range = range;

        // root
        let root = document.createElement(this.type);

        // props
        for (let name in this.props) {
            let value = this.props[name];
            if(name.match(/^on([\S\s]+)$/)) {
                root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value);
            } else {
                if(name === 'className') {
                    root.setAttribute("class", value)
                } else {
                    root.setAttribute(name, value)
                }
            }
        }

        if(!this.vchildren) {
            this.vchildren = this.children.map(child => child.vdom);
        }

        // children
        for (let child of this.vchildren) {
            let childRange = document.createRange();
            childRange.setStart(root, root.childNodes.length);
            childRange.setEnd(root, root.childNodes.length);
            child[RENDER_TO_DOM](childRange);
        }

        repalceContent(range, root);
    }
}

class TextWrapper extends Component{
    constructor(content) {
        super(content)
        this.type = '#text';
        this.content = content;
    }
    get vdom() {
        return this;
    }
    [RENDER_TO_DOM](range) {
        this._range = range;
        let root = document.createTextNode(this.content)
        repalceContent(range, root);
    }
}

function repalceContent(range, node) {
    range.insertNode(node);
    range.setStartAfter(node);
    range.deleteContents();

    range.setStartBefore(node);
    range.setEndAfter(node);
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