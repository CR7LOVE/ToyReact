class ElementWrapper {
    constructor(type) {
        this.root = document.createElement(type);
    }
    setAttribute(name, value) {
        this.root.setAttribute(name, value)
    }
    appendChild(component) {
        this.root.appendChild(component.root); // 注意这里是 component.root
    }
}

class TextWrapper {
    constructor(content) {
        this.root = document.createTextNode(content);
    }
}

export class Component {
    constructor() {
        this.props = Object.create(null);
        this.children = [];
        this._root = null;
    }
    setAttribute(name, value) {
        this.props[name] = value;
    }
    appendChild(component) {
        this.children.push(component) // 注意这里就没有 .root，上面 L9 有 .root 是因为一个节点要添加另一个节点，所以是 .root appendChild .root，而这里只是存到自己的数组中，所以不用 .root
    }
    get root() {
        if(!this._root) {
            this._root = this.render().root; // render 指的是 自定义组件中的 render，render() 的结果是 JSX，JSX 会被编译成 React.createElement()，所以这里又会调用 createElement,
        }
        return this._root;
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
    parentElement.appendChild(component.root); // 注意这里有个 .root，说明在这一步 component 返回的不是元素，.root 才是元素
}