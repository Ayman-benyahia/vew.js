# vew.js
An efficient lightweight templating library for javascript.

# Why use vew.js?
vew.js is extremely fast. It uses fast platform features like HTML <template> elements with native cloning.
Unlike VDOM libraries, vew.js only ever updates the parts of templates that actually change - it doesn't re-render the entire view.
vew.js will help you create - delete - update DOM tree easly and also gives you nice maintainable structure, 
keep in mind that vew.js light as feather with file size of 14 bytes unminified so you dont have to think about load time.


# How to use?
vew.js has three functions(create, update, delete), 
you can start by creating template element inside HTML and giving it a id,
after that instantiate "View" class that needs two parameters model and template id.
we are going to make random color generator as example see code below:

HTML
```
<template id="color">
  <div style="background: rgb({{red}}, 
    {{green}}, {{blue}});"></div>
  <h5>
    <span>Red: {{red}}</span>
    <span>Green: {{green}}</span>
    <span>Blue: {{blue}}</span>
  </h5>
  <button @click="generate">
    Generate Color</button>
</template>
```

CSS 
```
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: sans-serif;
  margin-bottom: 8px;
  color: #212121;
}

body {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

div { 
  height: 50px;
  width: 50px;
  background-color: #000;
}
```

JAVASCRIPT 
```
let color = new View({
  red: 0,
  green: 0,
  blue: 0,
  generate: (event) => {
    color.model.red = Math.round(Math.random() * 255);
    color.model.green = Math.round(Math.random() * 255);
    color.model.blue = Math.round(Math.random() * 255);
      color.update();        
    }
}, 
"color");
```

let's talk about HTML above, we have template element that has id and contains three elements (div, h5, button),
div has style attribute with value of `background: rgb({{red}}, {{green}}, {{blue}})`, keep in mind that `{{red}} & {{green}} & {{blue}}`
are variables with default value of 0 and they exist inside the model(normal js object).

h5 contains three span elements every one of them has variable (red, green, blue).
button has click event with handler called "generate" it's functon exist inside the model as you can see in HTML you define event using ("@" + event name).

as you can see in javascript side we have instantiated "View" that has two parameters first is the model(simple javascript object)
that has everything(variables, functions) that exist on template and also there template id with value of "color".
the model contains four properties (red, green, blue, generate function) when you click on button generate event function get invoked and new values are generated for
(red, green, blue) but nothing will change until you call update function and the changed part get rerendered,

***Note: keep in mind if you have for example model that similar to this `{parent:{child: "value"}}` you can express it as template
variable `{{parent.child}}` you can add as many nesting as you want.***

***Note: you can delete the rendered template by calling delete function and render it again by calling create function.***

vew.js also support nesting templates see code below:

HTML
```
<template id="parent">
    {{text}}
    <template id="child">
        {{text}}
    </template>
</template>
```

JAVASCRIPT 
```
let parent = new View({text: "Parent"}, "parent");
let child = new View({text: "Child"}, parent.id + "child");
```
