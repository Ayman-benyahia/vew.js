/**
 * Get next and previous siblings of element
 * @param {HTMLElement} element - HTML element or DOM node
 * @return {Array} - Array contains siblings of the element
 */
export function getSiblings(element) {
    // for collecting siblings
    let siblings = [];
    // if no parent, return no sibling
    if (!element.parentNode) {
        return siblings;
    }
    // first child of the parent node
    let sibling = element.parentNode.firstChild;

    // collecting siblings
    while (sibling) {
        siblings.push(sibling);
        sibling = sibling.nextSibling;
    }
    return siblings;
};

/**
 * Get next siblings of element
 * @param {HTMLElement} element - HTML element or DOM node
 * @return {Array} - Array contains next siblings of the element
 */
export function getNextSiblings(element) {
    let nextSiblings = [];
    if (!element.parentNode) {
        return nextSiblings;
    }
    while (element) {
        nextSiblings.push(element);
        element = element.nextSibling;
    }
    return nextSiblings;
}

/**
 * Construct array of properties path from an object
 * @param {Object} object - Javascript object contains properties
 * @param {String} position - Position param used to check if we are on first function call "ROOT".
 * @return {Array} - Array contains properties path
 */
export function getPropertiesPath(object, position = "ROOT") {
    let paths = [];
    for (let prop in object) {
        if (typeof object[prop] !== "object") {
            position === "ROOT" ? position = "" : position += ".";
            paths.push(position + prop);
            continue;
        }
        if (position === "ROOT") position = "";
        let tmp = getPropertiesPath(object[prop], position + "." + prop);
        paths = paths.concat(tmp);
    }
    for (let i = 0; i < paths.length; i++) {
        paths[i] = paths[i].replace(/^\./g, "");
        paths[i] = paths[i].replace(/\.\./g, ".");
    }
    return paths;
}

/**
 * Get property value from object using path
 * @param {Object} object - Javascript object contains properties
 * @param {String} path - Path of the property inside object
 * @return {Any} - Property value (array - object - string...)
 */
export function getPropertyValue(object, path) {
    if (path.length === 1) return object[path[0]];
    else if (path.length === 0) throw error;
    else {
        if (object[path[0]]) { return getPropertyValue(object[path[0]], path.slice(1)); }
        else { object[path[0]] = {}; return getPropertyValue(object[path[0]], path.slice(1)); }
    }
};

/**
 * Generate random string (unique identifier)
 * @param {Number} length - Length of the random string
 * @param {String} prefix - String that will be put in beginning of the random string
 * @param {String} suffix - String that will be put in end of the random string
 * @param {String} combination - Combination represent wich set of characters are included
 * @return {String} - Random string (unique identifier)
 */
export function uniqueId(length = 16, prefix = "",
    suffix = "", combination = "LOWER_UPPER_NUMBER") {

    const types = {
        LOWER_UPPER_NUMBER: `abcdefghiklmnopqrstvxyzABCDEFGHIKLMNOPQRSTVXYZ0123456789`,
        LOWER_UPPER: "abcdefghiklmnopqrstvxyzABCDEFGHIKLMNOPQRSTVXYZ",
        LOWER_NUMBER: "abcdefghiklmnopqrstvxyz0123456789",
        UPPER_NUMBER: "ABCDEFGHIKLMNOPQRSTVXYZ0123456789",
        UPPER: "ABCDEFGHIKLMNOPQRSTVXYZ",
        LOWER: "abcdefghiklmnopqrstvxyz"
    }

    let result = prefix;
    for (let i = 0; i < length; i++) {
        let rdm = Math.round(Math.random()
            * (types[combination].length - 1));
        result += types[combination][rdm];
    }
    result += suffix;
    return result;
}

export default class View {

    constructor(model, templateId) {
        this.model = model;
        this.templateId = templateId;
        this.template = document.getElementById(this.templateId).content.cloneNode(true);
        this.templateHTML = this.getTemplateHTML();

        this.attributes = [];
        this.events = [];

        this.id = uniqueId(16);
        this.firstRender = false; 

        // regex patterns
        this.MATCH_TEMPLATE = /\<template((\n|.)*?)<\/template>/g;
        this.MATCH_ATTRIBUTES = /\w+\=\"(.*?)\"/g;
        this.MATCH_TEMPLATE_VAR = /\{\{(.*?)\}\}/g;
        this.MATCH_TEMPLATE_EVENT = /@\w+\=\"(.*?)\"/g;
        this.MATCH_BRACKETS_SPACE = /\{|\}|\s+/g;

        this.create();
    }

    create() {
        if (this.firstRender === true) {
            if(this.selectWrappingComments().length > 0 && 
            this.selectWrappingComments()[0].textContent.includes(this.id)) return;

            document.getElementById(this.templateId).outerHTML =
                `<!-- START | ${this.id} -->` + this.templateHTML + `<!-- END | ${this.id} -->` +
                document.getElementById(this.templateId).outerHTML;

            for(let event of this.events) {
                let element = document.querySelector(`[data-event-${event.name}-${event.id}]`);
                element.addEventListener(event.name, getPropertyValue(this.model ,event.value.split(".")));
            }

            this.update();
            return;
        }
        this.firstRender = true;

        let subTemplatesHTML = this.templateHTML.match(this.MATCH_TEMPLATE);
        if (subTemplatesHTML === null || typeof subTemplatesHTML === "undefined") subTemplatesHTML = [];

        let subTemplateElements = Array.from(this.template.querySelectorAll("template"));
        for (let templateElement of subTemplateElements) {
            let idAttributeValue = templateElement.id;
            if (idAttributeValue.includes(this.id)) continue;
            idAttributeValue = this.id + idAttributeValue;
            templateElement.setAttribute("id", idAttributeValue);
        }

        for (let subTemplateHTML of subTemplatesHTML) {
            this.templateHTML = this.templateHTML
                .replace(subTemplateHTML, "||TEMPLATE||");
        }

        let attributes = this.templateHTML.match(this.MATCH_ATTRIBUTES);
        if (attributes === null || typeof attributes === "undefined") attributes = [];

        for (let attribute of attributes) {
            let attributeName = attribute.replace("=", "||EQUAL_SIGN||").split("||EQUAL_SIGN||")[0];
            let attributeValue = attribute.replace("=", "||EQUAL_SIGN||").split("||EQUAL_SIGN||")[1];

            let varnames = attributeValue.match(this.MATCH_TEMPLATE_VAR);
            if (varnames === null || typeof varnames === "undefined") varnames = [];

            for (let varname of varnames) {
                varname = varname.replace(/\{|\}|\+/g, "") || "";
                let identifier = uniqueId(16, "", "", "LOWER");
                this.templateHTML = this.templateHTML.replace(attribute,
                    attribute + ` data-${attributeName}-${identifier}`);
                this.attributes.push({
                    id: identifier,
                    name: attributeName,
                    value: attributeValue.slice(1, -1)
                });
                this.templateHTML = this.templateHTML.replace(`{{${varname}}}`,
                    getPropertyValue(this.model, varname.split(".")));
            }
        }

        let varnames = this.templateHTML.match(this.MATCH_TEMPLATE_VAR);
        if (varnames === null || typeof varnames === "undefined") varnames = [];

        for (let varname of varnames) {
            varname = varname.replace(this.MATCH_BRACKETS_SPACE, "");
            this.templateHTML = this.templateHTML.replace(`{{${varname}}}`,
                `<!-- ${this.id} | ${varname} -->` + getPropertyValue(this.model, varname.split(".")) + "   ");
        }

        let templateEvents = this.templateHTML.match(this.MATCH_TEMPLATE_EVENT);
        if (templateEvents === null || typeof templateEvents === "undefined") templateEvents = [];
        let eventIdentifiers = [];

        for (let event of templateEvents) {
            let identifier = uniqueId(16, "", "", "LOWER");
            let eventName = event.split("=")[0].slice(1, 9999);
            this.templateHTML = this.templateHTML
                .replace(event, event + `data-event-${eventName}-${identifier}`);
            eventIdentifiers.push(identifier);
        }

        for (let templateElement of subTemplateElements) {
            this.templateHTML = this.templateHTML
                .replace("||TEMPLATE||", templateElement.outerHTML);
        }

        document.getElementById(this.templateId).outerHTML = `<!-- START | ${this.id} -->` + this.templateHTML
            + `<!-- END | ${this.id} -->` + document.getElementById(this.templateId).outerHTML;

        for (let i = 0; i < templateEvents.length; i++) {
            let eventName = templateEvents[i].split("=")[0].slice(1, 9999);
            let eventValue = templateEvents[i].split("=")[1].slice(1, -1);
            let eventId = eventIdentifiers[i];
            this.events.push({
                name: eventName,
                value: eventValue,
                id: eventId
            });
            let element = document.querySelector(`[data-event-${eventName}-${eventId}]`);
            element.addEventListener(eventName, getPropertyValue(this.model, eventValue.split(".")));
        }
    }

    delete() {
        let startWrappingComment = this.selectWrappingComments().shift();
        if (typeof startWrappingComment === "undefined") { return; }
        let siblings = getNextSiblings(startWrappingComment);
        for (let sibling of siblings) {
            if (sibling.textContent.split("|")[0].includes("END")
                && sibling.textContent.split("|")[1].includes(this.id)) {
                sibling.remove();
                break;
            }
            sibling.remove();
        }
    }

    update() {
        for (let attribute of this.attributes) {
            let element = document.querySelector(`[data-${attribute.name}-${attribute.id}]`);
            if (element === null || typeof element === "undefined") continue;

            let value = attribute.value;
            let varnames = value.match(this.MATCH_TEMPLATE_VAR);
            if (varnames === null || typeof varnames === "undefined") varnames = [];
            for (let varname of varnames) {
                varname = varname.replace(this.MATCH_BRACKETS_SPACE, "") || "";
                value = value.replace(`{{${varname}}}`, getPropertyValue(this.model, varname.split(".")));
            }
            element.setAttribute(attribute.name, value);
        }

        let variableComments = this.selectVariableComments();
        for (let comment of variableComments) {
            let varname = comment.textContent.split("|")[1].replace(/\s+/g, "");
            let element = getNextSiblings(comment).pop();
            element.textContent = getPropertyValue(this.model, varname.split("."));
        }
    }

    /**
    * Get template HTML 
    * @return {String} - String containing template HTML
    */
    getTemplateHTML() {
        let html = "";
        // get template child nodes and loop through every node 
        // and get it's (text or html) and append it into the above html var
        let childNodes = Array.from(this.template.childNodes);
        for (let child of childNodes) {
            if (child.nodeType === 1) { html += child.outerHTML; continue; }
            html += child.textContent;
        }
        return html;
    }

    /**
    * Select wrapping comment elements, format: <!-- (START or END) | identifier | template varname -->
    * @param {HTMLElement} element - HTML element or DOM node to search in 
    * @return {Array} - Array containing start and end wrapping comment elements
    */
    selectWrappingComments(element = document.body) {
        let foundNodes = [];
        if (element.childNodes.length <= 0) return [];
        for (let child of element.childNodes) {

            // add the current node to foundNodes array if current node 
            // type is a comment and includes "Start" and also includes id
            if (child.nodeType === 8 && child.textContent.split("|").length === 2
                && child.textContent.split("|")[0].includes("START")
                && child.textContent.split("|")[1].includes(this.id)) {
                foundNodes.push(child);
                continue;
            }

            // add the current node to foundNodes array if current node 
            // type is a comment and includes "END" and also includes id
            if (child.nodeType === 8 && child.textContent.split("|").length === 2
                && child.textContent.split("|")[0].includes("END")
                && child.textContent.split("|")[1].includes(this.id)) {
                foundNodes.push(child);
                continue;
            }

            // current node has child nodes wich mean it's not wrapping comment node
            // call the function again and pass it the current node 
            foundNodes = foundNodes.concat(
                this.selectWrappingComments(child));
        }

        return foundNodes;
    }

    /**
    * Select wrapping comment elements, format <!-- (START or END) | identifier | template varname(anything inside '{{}}') -->
    * @param {HTMLElement} element - HTML element or DOM node to search in 
    * @return {Array} - Array containing start and end wrapping comment elements
    */
    selectVariableComments(element = document.body) {
        let foundNodes = [];
        if (element.childNodes.length <= 0) return [];
        for (let child of element.childNodes) {

            if (child.nodeType === 8 && child.textContent.split("|").length === 2
                && child.textContent.split("|")[0].includes(this.id)) {
                foundNodes.push(child);
                continue;
            }

            if (child.nodeType === 8 && child.textContent.split("|").length === 2
                && child.textContent.split("|")[0].includes(this.id)) {
                foundNodes.push(child);
                continue;
            }

            foundNodes = foundNodes.concat(
                this.selectVariableComments(child));
        }

        return foundNodes;
    }
}
