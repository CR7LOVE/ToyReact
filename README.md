#第一节课内容：JSX 的原理和关键实现  
思路步骤：
1. 使用 webpack 的 pulgin(@babel/plugin-transform-react-jsx) 在 dist 中看到了 jsx 被编译成了 React.createElement，所以要想着怎样实现 React.createElement,
React.createElement 只是个名字，可以换成自己的，代码中换成了 createElement
2. 把 1 中的代码所生成的 node 加载到 document.body 上
3. createElement 目前只能接收原生标签，开始写自定义组件，其中包含了封装 Component 基类, ElementWrapper 和 TextWrapper
4. 最张效果是 class MyComponent extends Component ,并把结果添加到了 document.body 上  

或者这样描述，为了实现 JSX：
1. 需要知道 JSX 最终被编译成了什么，这个可以通过 webpack 的 babel plugin 知道。  
2. 1 的编译结果是 React.createElement，可以把这个换个名字，所以，实现 React.createElement 即可，并挂载到 DOM 上
3. 在 2 的基础上实现自定义组件，并挂载到 DOM 上

具体执行过程：  
1. MyComponent 的 3 个 children 先执行 createElement()；  
2. MyComponent 的实例被初始化，constructor 中的 props 属性上添加 id 与 class 属性；  
3. MyComponent 的实例的 constructor 中的 children 属性上添加 1 的 3 个 div
4. MyComponent 的实例的 constructor 中的 get root 开始执行，get root() 中的 this.render().root 中的 render 开始执行
5. render() 的结果是个 JSX，即 createElement，所以进入 createElement，此时是 h1
6. 接 5，再来一次 createElement，此时是 MyComponent 的外壳 div，里面包含了 h1 和 3 个 div，此时 get root 执行完毕，拿到的结果是外壳 div 加个里面的 4 个元素，即自定义元素返回的元素已经拿到了
7. 添加到 document.body 中

自己写代码中遇到的坑：
1. 自定义组件在这个步骤中，返回的不是元素，就是一个实例而已，实例的 .root 才是元素
2. 所以，.root 肯定是自定义组件执行 render() 的结果。然后 document.body.append(com.root)
3. 先不要抽取 ElementWrapper 和 TextWrapper，写好后再一步步抽取

#第二节课内容：为 toy-react 添加生命周期
思路：
1. 添加 this.state 并运行成功（这步不用做别的就可以成功，但是注意 JSX 中要写成 toString）
2. root 换成 range 并运行成功
3. 添加 setState 并运行简单的 demo 成功
4. demo 换成官方的 demo 并运行成功

#第三节课内容：VDOM 的原理和关键实现
1. 拿到自定义组件的 vdom：为 Component, ElementWrapper, TextWrapper 都添加 vdom
2. 将 vdom 转换成 dom，这步完成后，就显示在网页上了。转成 vdom 需要转换三个东西：root, props 和 children
