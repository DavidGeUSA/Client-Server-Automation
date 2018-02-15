/*
	Client Server Automation Preprocessor
	JavaScript parsing and generation are Based on Esprima (https://github.com/ariya/esprima)

	Author: David Wei Ge
	Date  : 2015-04-08
*/
/*jslint browser:true */
/*global esprima:true, escodegen:true, require:true */

function id(i) {
    'use strict';
    return document.getElementById(i);
}

function setText(id, str) {
    'use strict';
    var el = document.getElementById(id);
    if (typeof el.innerText === 'string') {
        el.innerText = str;
    } else {
        el.textContent = str;
    }
}
function sourceRewrite() {
    'use strict';

    var code, syntax, indent, quotes, option;

    if (typeof window.editor !== 'undefined') {
        code = window.editor.getText();
    } else {
        code = id('code').value;
    }

    indent = '';
    if (id('onetab').checked) {
        indent = '\t';
    } else if (id('twospaces').checked) {
        indent = '  ';
    } else if (id('fourspaces').checked) {
        indent = '    ';
    }

    quotes = 'auto';
    if (id('singlequotes').checked) {
        quotes = 'single';
    } else if (id('doublequotes').checked) {
        quotes = 'double';
    }

    option = {
        comment: true,
        format: {
            indent: {
                style: indent
            },
            quotes: quotes
        }
    };

    try {
        syntax = window.esprima.parse(code, { raw: true, tokens: true, range: true, comment: true });
        syntax = window.escodegen.attachComments(syntax, syntax.comments, syntax.tokens);
        code = window.escodegen.generate(syntax, option);
        window.editor.setText(code);
        setText('info', 'Source rewriting was successful.');
    } catch (e) {
        id('info').innerHTML = e.toString();
        setText('info', e.toString());
    }
}
var JsBuiltIn = [
	'Infinity',
	'Nan',
	'undefined',
	'null',
	'eval',
	'Infinity',
	'uneval',
	'isFinite',
	'isNan',
	'parseFloat',
	'oarseInt',
	'decodeURI'
	,'this'
, 'decodeURIComponent'
,'encodeURI'
,'encodeURIComponent'
,'escape' 
, 'unescape'
, 'Object'
, 'Function'
, 'Boolean'
, 'Symbol'
, 'Error'
, 'EvalError'
, 'InternalError'
, 'RangeError'
, 'ReferenceError'
, 'SyntaxError'
, 'TypeError'
, 'URIError'
, 'Number'
, 'Math'
, 'Date'
, 'String'
, 'RegExp'
, 'Array'
, 'Int8Array'
, 'Uint8Array'
, 'Uint8ClampedArray'
, 'Int16Array'
, 'Uint16Array'
, 'Int32Array'
, 'Uint32Array'
, 'Float32Array'
, 'Float64Array'
, 'Map'
, 'Set'
, 'WeakMap'
, 'WeakSet'
, 'SIMD'
, 'ArrayBuffer'
, 'SharedArrayBuffer' 
, 'Atomics' 
, 'DataView'
, 'JSON'
, 'Promise'
, 'Generator'
, 'GeneratorFunction'
, 'Reflect'
, 'Proxy'
, 'Intl'
, 'Iterator' 
, 'ParallelArray' 
, 'StopIteration' 
, 'arguments'
];
//Client Server Automation Preprocessor
var CSAPREPROC = CSAPREPROC || (function () {
	//===constants===
	var CSAVERSION = '1.0.0.1';
	var CLIENT_CONTEXT = false, SERVER_CONTEXT = true;//execution context type
	var CODEBRANCH_UNKNOWN = 0, CODEBRANCH_1 = 1, CODEBRANCH_2 = 2, CODEBRANCH_3 = 3, CODEBRANCH_4 = 4, CODEBRANCH_5 = 5, CODEBRANCH_6 = 6; //code branch situations
	//===============
	var libObjs = [];
	var libFileToObjectMapping = [];
	var prgObj;
	var _webname;
	var _error;
	var namemap;
	var clientCode;
	var _serverCodeIndex;
	var _serverCodes = [];
	function newname(prefix) {
		if (!prefix)
			prefix = 'v';
		return prefix + (Math.random() + 1).toString(36).substring(7);
	}
	function arrayFromCodeElements(elements) {
		var ret = [];
		for (var i = 0; i < elements.length; i++) {
			ret.push(elements[i].raw);
		}
		return ret;
	}
	function isStandardName(nm) {
		for (var i = 0; i < JsBuiltIn.length; i++) {
			if (JsBuiltIn[i] == nm) {
				return true;
			}
		}
		return false;
	}
	//check if a function/object can run at both client side and server side.
	//most standard JavaScript functions are such functions
	function canRun2sides(obj, scope) {
		if (obj.type == 'ThisExpression') {
			return true;
		}
		if (obj.type == 'MemberExpression') {
			return canRun2sides(obj.object, scope);
		}
		else if (obj.type == 'CallExpression') {
			return canRun2sides(obj.callee, scope);
		}
		else if (obj.type == 'Identifier') {
			if (isStandardName(obj.name)) {
				return true;
			}
		}
		else {
			throw 'unhandled type in canRun2sides:' + obj.type;
		}
		return false;
	}
	function isLibServerObj(name) {
		for (var i = 0; i < libObjs.length; i++) {
			for (var k = 0; k < libObjs[i].body.length; k++) {
				if (libObjs[i].body[k].type == 'ExpressionStatement') {
					var e = libObjs[i].body[k].expression;
					if (e.operator == '=') {
						if (e.right.type == 'Literal') {
							if (e.right.value === true) {
								if (e.left.type == 'MemberExpression') {
									if (e.left.property.type == 'Identifier') {
										if (e.left.property.name == 'RunAt') {
											if (e.left.object.type == 'MemberExpression') {
												if (e.left.object.property.type == 'Identifier') {
													if (e.left.object.property.name == 'prototype') {
														if (e.left.object.object.type == 'Identifier') {
															if (e.left.object.object.name == name) {
																return true;
															}
														}
													}
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
		return false;
	}
	function gothroughcode(obj, handler, scope) {
		var r = handler(obj, scope);
		if (r.finish) {
			return r;
		}
		if (r.processed) {
			return {};
		}
		switch (obj.type) {
			case 'AssignmentExpression':
				if (!r.leftProcessed) {
					r = gothroughcode(obj.left, handler, scope);
					if (r.finish)
						return r;
				}
				r = gothroughcode(obj.right, handler, scope);
				if (r.finish)
					return r;
				break;
			case 'ArrayExpression':
				if (obj.elements) {
					for (var i = 0; i < obj.elements.length; i++) {
						r = gothroughcode(obj.elements[i], handler, scope);
						if (r.finish)
							return r;
					}
				}
				break;
			case 'ArrowFunctionExpression':
				if (obj.body) {
					for (var i = 0; i < obj.body.length; i++) {
						r = gothroughcode(obj.body[i], handler, scope);
						if (r.finish)
							return r;
					}
				}
				break;
			case 'BlockStatement':
				if (obj.body) {
					for (var i = 0; i < obj.body.length; i++) {
						r = gothroughcode(obj.body[i], handler, scope);
						if (r.finish)
							return r;
					}
				}
				break;
			case 'BinaryExpression':
				r = gothroughcode(obj.left, handler, scope);
				if (r.finish)
					return r;
				r = gothroughcode(obj.right, handler, scope);
				if (r.finish)
					return r;
				break;
			case 'BreakStatement':
				break;
			case 'CallExpression':
				if (!r.CalleeProcessed) {
					var r0 = gothroughcode(obj.callee, handler, scope);
					if (r0.finish)
						return r0;
				}
				if(r.between){
					r.between();
				}
				if (obj.arguments && obj.arguments.length > 0) {
					for (var k = 0; k < obj.arguments.length; k++) {
						r = gothroughcode(obj.arguments[k], handler, scope);
						if (r.finish)
							return r;
					}
				}
				break;
			case 'CatchClause':
				if (obj.param) {
					if (obj.param.type == 'Identifier') {
						var s = getlowestscope(scope);
						if (typeof (s.variables) == 'undefined') {
							s.variables = {};
						}
						if (typeof (s.variables[obj.param.name]) == 'undefined') {
							s.variables[obj.param.name] = {};
						}
					}
				}
				if (obj.body) {
					r = gothroughcode(obj.body, handler, scope);
					if (r.finish)
						return r;
				}
				break;
			case 'ConditionalExpression':
				if (obj.test) {
					r = gothroughcode(obj.test, handler, scope);
					if (r.finish)
						return r;
				}
				if (obj.consequent) {
					r = gothroughcode(obj.consequent, handler, scope);
					if (r.finish)
						return r;
				}
				if (obj.alternate) {
					r = gothroughcode(obj.alternate, handler, scope);
					if (r.finish)
						return r;
				}
				break;
			case 'ContinueStatement':
				break;
			case 'DoWhileStatement':
				if (obj.test) {
					r = gothroughcode(obj.test, handler, scope);
					if (r.finish)
						return r;
				}
				if (obj.body) {
					r = gothroughcode(obj.body, handler, scope);
					if (r.finish)
						return r;
				}
				break;
			case 'DebuggerStatement':
				break;
			case 'EmptyStatement':
				break;
			case 'ExpressionStatement':
				if (obj.expression) {
					r = gothroughcode(obj.expression, handler, scope);
					if (r.finish)
						return r;
				}
				break;
			case 'ForStatement':
				if (obj.init) {
					r = gothroughcode(obj.init, handler, scope);
					if (r.finish)
						return r;
				}
				if (obj.test) {
					r = gothroughcode(obj.test, handler, scope);
					if (r.finish)
						return r;
				}
				if (obj.update) {
					r = gothroughcode(obj.update, handler, scope);
					if (r.finish)
						return r;
				}
				if (obj.body) {
					r = gothroughcode(obj.body, handler, scope);
					if (r.finish)
						return r;
				}
				break;
			case 'ForInStatement':
				if (obj.left) {
					r = gothroughcode(obj.left, handler, scope);
					if (r.finish)
						return r;
				}
				if (obj.right) {
					r = gothroughcode(obj.right, handler, scope);
					if (r.finish)
						return r;
				}
				if (obj.body) {
					r = gothroughcode(obj.body, handler, scope);
					if (r.finish)
						return r;
				}
				break;
			case 'FunctionDeclaration':
				break;
			case 'FunctionExpression':
				if (obj.body) {
					r = gothroughcode(obj.body, handler, scope);
					if (r.finish)
						return r;
				}
				break;
			case 'Identifier':
				break;
			case 'IfStatement':
				if (obj.test) {
					r = gothroughcode(obj.test, handler, scope);
					if (r.finish)
						return r;
				}
				if (obj.consequent) {
					r = gothroughcode(obj.consequent, handler, scope);
					if (r.finish)
						return r;
				}
				if (obj.alternate) {
					r = gothroughcode(obj.alternate, handler, scope);
					if (r.finish)
						return r;
				}
				break;
			case 'Literal':
				break;
			case 'LabeledStatement':
				break;
			case 'LogicalExpression':
				r = gothroughcode(obj.left, handler, scope);
				if (r.finish)
					return r;
				r = gothroughcode(obj.right, handler, scope);
				if (r.finish)
					return r;
				break;
			case 'MemberExpression':
				var r0 = gothroughcode(obj.object, handler, scope);
				if (r0.finish)
					return r0;
				if (!r.propProcessed) {
					r = gothroughcode(obj.property, handler, scope);
					if (r.finish)
						return r;
				}
				break;
			case 'NewExpression':
				if (!r.CalleeProcessed) {
					r = gothroughcode(obj.callee, handler, scope);
					if (r.finish)
						return r;
				}
				if (obj.arguments && obj.arguments.length > 0) {
					for (var i = 0; i < obj.arguments.length; i++) {
						r = gothroughcode(obj.arguments[i], handler, scope);
						if (r.finish)
							return r;
					}
				}
				break;
			case 'ObjectExpression':
				if (obj.properties && obj.properties.length > 0) {
					for (var i = 0; i < obj.properties.length; i++) {
						r = gothroughcode(obj.properties[i], handler, scope);
						if (r.finish)
							return r;
					}
				}
				break;
			case 'Program':
				if (obj.body && obj.body.length > 0) {
					for (var i = 0; i < obj.body.length; i++) {
						r = gothroughcode(obj.body[i], handler, scope);
						if (r.finish)
							return r;
					}
				}
				break;
			case 'Property':
				break;
			case 'ReturnStatement':
				if (obj.argument) {
					r = gothroughcode(obj.argument, handler, scope);
					if (r.finish)
						return r;
				}
				break;
			case 'SequenceExpression':
				if (obj.expressions) {
					for (var i = 0; i < obj.expressions.length; i++) {
						r = gothroughcode(obj.expressions[i], handler, scope);
						if (r.finish)
							return r;
					}
				}
				break;
			case 'SwitchStatement':
				if (obj.discriminant) {
					r = gothroughcode(obj.discriminant, handler, scope);
					if (r.finish)
						return r;
				}
				if (obj.cases) {
					for (var i = 0; i < obj.cases.length; i++) {
						r = gothroughcode(obj.cases[i], handler, scope);
						if (r.finish)
							return r;
					}
				}
				break;
			case 'SwitchCase':
				if (obj.test) {
					r = gothroughcode(obj.test, handler, scope);
					if (r.finish)
						return r;
				}
				if (obj.consequent) {
					for (var i = 0; i < obj.consequent.length; i++) {
						r = gothroughcode(obj.consequent[i], handler, scope);
						if (r.finish)
							return r;
					}
				}
				break;
			case 'ThisExpression':
				break;
			case 'ThrowStatement':
				if (obj.argument) {
					r = gothroughcode(obj.argument, handler, scope);
					if (r.finish)
						return r;
				}
				break;
			case 'TryStatement':
				if (obj.block) {
					r = gothroughcode(obj.block, handler, scope);
					if (r.finish)
						return r;
				}
				if (obj.finalizer) {
					r = gothroughcode(obj.finalizer, handler, scope);
					if (r.finish)
						return r;
				}
				if (obj.handlers) {
					for (var i = 0; i < obj.handlers.length; i++) {
						r = gothroughcode(obj.handlers[i], handler, scope);
						if (r.finish)
							return r;
					}
				}
				if (obj.guardedHandlers) {
					for (var i = 0; i < obj.guardedHandlers.length; i++) {
						r = gothroughcode(obj.guardedHandlers[i], handler, scope);
						if (r.finish)
							return r;
					}
				}
				break;
			case 'UnaryExpression':
				if (obj.argument) {
					r = gothroughcode(obj.argument, handler, scope);
					if (r.finish)
						return r;
				}
				break;
			case 'UpdateExpression':
				if (obj.argument) {
					r = gothroughcode(obj.argument, handler, scope);
					if (r.finish)
						return r;
				}
				break;
			case 'VariableDeclaration':
				for (var i = 0; i < obj.declarations.length; i++) {
					r = gothroughcode(obj.declarations[i], handler, scope);
					if (r.finish)
						return r;
				}
				break;
			case 'VariableDeclarator':
				if (obj.init) {
					r = gothroughcode(obj.init, handler, scope);
					if (r.finish)
						return r;
				}
				break;
			case 'WhileStatement':
				if (obj.test) {
					r = gothroughcode(obj.test, handler, scope);
					if (r.finish)
						return r;
				}
				if (obj.body) {
					r = gothroughcode(obj.body, handler, scope);
					if (r.finish)
						return r;
				}
				break;
			case 'WithStatement':
				throw 'Use of "with" is not supported.'
				break;
			default: throw 'unhandled type:' + obj.type;
		}
		return {};
	}
	//if func is a server object then it returns the scope where func belongs to
	function isServerFunction(func, scope) {
		switch (func.type) {
			case 'Identifier':
				if (func.name == 'jsServer') {
					return scope;
				}
				if (func.isServerFunction) {
					return scope;
				}
				if (isLibServerObj(func.name)) {
					return scope;
				}
				for (var i = 0; i < libFileToObjectMapping.length; i++) {
					if (func.name == libFileToObjectMapping[i].objname) {
						return scope;
					}
				}
				var s = scope;
				while (s) {
					if (s.serverVariables && s.serverVariables[func.name]) {
						return s;
					}
					s = s.scope;
				}
				break;
			case 'MemberExpression':
				if (func.property && func.property.type == 'Identifier' && func.property.name == 'Upload') {
					//check for e.dataTransfer.files
					var s = isFileListReference(scope, func.object);
					if (s) {
						return s;
					}
				}
				var s = isServerFunction(func.object, scope);
				if (s) {
					return s;
				}
				return null;
				break;
			case 'CallExpression':
			case 'NewExpression':
				if (func.callee.type == 'MemberExpression' && func.callee.object.name == 'jsServer') {
					return scope;
				}
				return isServerFunction(func.callee, scope);
				break;
			case 'VariableDeclaration':
				for (var i = 0; i < func.declarations.length; i++) {
					var s = isServerFunction(func.declarations[i], scope);
					if (s) {
						return s;
					}
				}
				break;
			case 'VariableDeclarator':
				if (isServerFunction(func.init, scope)) {
					var s = getlowestscope(scope);
					if (!s.serverVariables) {
						s.serverVariables = {};
					}
					s.serverVariables[func.id.name] = { init: func.init };
					return s;
				}
				break;
			case 'ExpressionStatement':
				return isServerFunction(func.expression, scope);
				break;
			case 'AssignmentExpression':
				return isServerFunction(func.left, scope);
				break;
			case 'UpdateExpression':
				return isServerFunction(func.argument, scope);
				break;
			case 'UnaryExpression':
				return isServerFunction(func.argument, scope);
			case 'ConditionalExpression':
				var s = isServerFunction(func.test, scope);
				if (s)
					return s;
				s = isServerFunction(func.consequent, scope);
				if (s)
					return s;
				s = isServerFunction(func.alternate, scope);
				if (s)
					return s;
			case 'Literal':
				if (scope.currentContext == SERVER_CONTEXT) {
					return scope;
				}
				break;
			case 'ForStatement':
				//if its body contains a client operation then treat it as a client statement
				var isClient = false;
				if (func.body && func.body.length > 0) {
					for (var i = 0; i < func.body.length; i++) {
						if (!isServerFunction(func.body[i], scope)) {
							isClient = true;
							break;
						}
					}
					if (!isClient) {
						return scope;
					}
				}
				else {
					if (scope.currentContext == CLIENT_CONTEXT) {
						return null;
					}
					else {
						return scope;
					}
				}
				break;
			default:
				throw 'unhandled type in isServerFunction:' + func.type;
		}
		return null;
	}
	function involveServerValue(obj, scope) {
		var r = gothroughcode(obj, involveServerValueCall, scope);
		return r.ret;
	}
	function involveServerValueCall(obj, scope) {
		switch (obj.type) {
			case 'Identifier': 
				if (isServerFunction(obj, scope)) { //process
					if (!isUploadedFiles(scope, obj.name)) {
						return { finish: true, ret: true };
					}
				}
				break;
			case 'MemberExpression':
				if (!obj.computed) { //process
					if (involveServerValue(obj.object, scope)) {
						return { finish: true, ret: true };
					}
				}
				break;
			case 'CallExpression':
				if (isServerFunction(obj.callee, scope)) {//process
					return { finish: true, ret: true };
				}
				break;
			case 'NewExpression':
				if (isServerFunction(obj.callee, scope)) {//process
					return { finish: true, ret: true };
				}
				break;
			default:
				return {};
		}
		return {};
	}
	function hasClientOperation(codeBranch, scope) {
		if (codeBranch.consequent && codeBranch.consequent.type == 'BlockStatement') {
			if (codeBranch.consequent.body && codeBranch.consequent.body.length > 0) {
				for (var i = 0; i < codeBranch.consequent.body.length; i++) {
					if (codeBranch.consequent.body[i].type == 'IfStatement') {
						if (hasClientOperation(codeBranch.consequent.body[i], scope)) {
							return true;
						}
					}
					else if (!isServerFunction(codeBranch.consequent.body[i], scope)) {
						return true;
					}
				}
			}
		}
		if (codeBranch.alternate && codeBranch.alternate.type == 'BlockStatement') {
			if (codeBranch.alternate.body && codeBranch.alternate.body.length > 0) {
				for (var i = 0; i < codeBranch.alternate.body.length; i++) {
					if (codeBranch.alternate.body[i].type == 'IfStatement') {
						if (hasClientOperation(codeBranch.alternate.body[i], scope)) {
							return true;
						}
					}
					else if (!isServerFunction(codeBranch.alternate.body[i], scope)) {
						return true;
					}
				}
			}
		}
		return false;
	}
	function determineBranchType(codeBranch, scope) {
		if (!codeBranch.consequent && !codeBranch.alternate) {
			return CODEBRANCH_5;
		}
		if (scope.currentContext == CLIENT_CONTEXT) {
			//check branching condition to see server values are involved
			if (involveServerValue(codeBranch.test, scope)) {
				return CODEBRANCH_4;
			}
			else {
				return CODEBRANCH_3;
			}
		}
		else {
			//check to see if the first statement in each branch is a server operation
			var hasClientOp = false;
			var hasFirstServerOp = false;
			if (codeBranch.consequent && codeBranch.consequent.type == 'BlockStatement') {
				if (codeBranch.consequent.body && codeBranch.consequent.body.length > 0) {
					hasFirstServerOp = isServerFunction(codeBranch.consequent.body[0], scope);
				}
			}
			if (!hasFirstServerOp) {
				if (codeBranch.alternate && codeBranch.alternate.type == 'BlockStatement') {
					if (codeBranch.alternate.body && codeBranch.alternate.body.length > 0) {
						hasFirstServerOp = isServerFunction(codeBranch.alternate.body[0], scope);
					}
				}
			}
			hasClientOp = hasClientOperation(codeBranch, scope);
			if (hasFirstServerOp) {
				if (hasClientOp) {
					return CODEBRANCH_2; //the first statement of at least one branch is a server operation; there are client operations
				}
				else {
					return CODEBRANCH_6; //there is not a client operation in all branches
				}
			}
			else {
				if (hasClientOp) {
					return CODEBRANCH_1; //the first statement in every branch is a client operation
				}
				else {
					return CODEBRANCH_5; //empty branches
				}
			}
		}
		return CODEBRANCH_UNKNOWN;
	}
	function getlowestscope(scope) {
		var s = scope;
		while (s.scope) {
			s = s.scope;
		}
		return s;
	}
	function gettopscope(scope) {
		var s = scope;
		while (s) {
			if (s.callback)
				return s;
			s = s.scope;
		}
	}
	//obj is used in a test condition, substitute server names with download value references
	function enumerateIdentifiers(obj, handler, rename, scope) {
		if (obj.type == 'Identifier') {
			if (isServerFunction(obj, scope)) {
				var o = JSON.parse(JSON.stringify(obj));
				if (rename) {
					var nn = obj.name + (Math.random() + 1).toString(36).substring(7);
					obj.name = nn;
				}
				handler(obj.name, o, obj);
			}
		}
		else if (obj.type == 'BinaryExpression') {
			enumerateIdentifiers(obj.left, handler, rename, scope);
			enumerateIdentifiers(obj.right, handler, rename, scope);
		}
		else if (obj.type == 'MemberExpression') {
			enumerateIdentifiers(obj.object, handler, rename, scope);
		}
	}
	function createDownloadCode(vname, value) {
		return { type: 'ExpressionStatement', expression: { type: 'CallExpression', arguments: [{ type: 'Literal', value: vname, raw: "'" + vname + "'" }, JSON.parse(JSON.stringify(value))], callee: { type: 'MemberExpression', property: { type: 'Identifier', name: 'AddDownloadValue' }, object: { type: 'Identifier', name: 'jsServer' } } } }
	}
	//preserve server values as download values separated from corresponding server variables, as stated in claim 5
	function createClientBranchingCondition(test, serverBody, rename, scope) {
		var ctest = JSON.parse(JSON.stringify(test));
		//find server Identifiers
		enumerateIdentifiers(ctest, function (name, value, clinetValue) {
			useCSAdownloadName(clinetValue);
			if (serverBody) {
				serverBody.push(createDownloadCode(name, value));
			}
		}, rename, scope);
		return ctest;
	}
	function isSameObject(obj1, obj2) {
		if (obj1.type == obj2.type) {
			if (obj1.type == 'CallExpression') {
				if (isSameObject(obj1.callee, obj2.callee)) {
					if (obj1.arguments == null || obj2.arguments.length == 0) {
						return true;
					}
					else if (obj1.arguments.length == obj2.arguments.length) {
						for (var k = 0; k < obj1.arguments.length; k++) {
							if (!isSameObject(obj1.arguments[k], obj2.arguments[k])) {
								return false;
							}
						}
						return true;
					}
				}
			}
			else if (obj1.type == 'Literal') {
				return (obj1.value == obj2.value);
			}
			else if (obj1.type == 'Identifier') {
				return (obj1.name == obj2.name);
			}
			else if (obj1.type == 'MemberExpression') {
				if (isSameObject(obj1.object, obj2.object)) {
					if (isSameObject(obj1.property, obj2.property)) {
						return true;
					}
				}
			}
		}
		return false;
	}
	function findDownloadValueName(obj, scope) {
		var s = scope;
		while (s) {
			if (s.downloadValues) {
				for (var k = 0; k < s.downloadValues.length; k++) {
					if (isSameObject(s.downloadValues[k].obj, obj)) {
						return s.downloadValues[k].name;
					}
				}
			}
			s = s.scope;
		}
	}
	function addDownAndStateValues(obj, tgtbody, scope) {
		var r = gothroughcode(obj, addDownAndStateValuesCall, scope);
		return r.ret;
		function addDownAndStateValuesCall(obj, scope) {
			switch (obj.type) {
				case 'Identifier': //process
					if (!isUploadedFiles(scope, obj.name)) {
						if (isServerFunction(obj, scope)) {
							if (!findDownloadValueName(obj, scope)) {
								var obj2 = JSON.parse(JSON.stringify(obj));
								tgtbody.push(createDownloadCode(obj.name, obj));
								var s = getlowestscope(scope);
								if (!s.downloadValues) {
									s.downloadValues = [];
								}
								s.downloadValues.push({ obj: obj, name: obj.name, origin: obj2 });
							}
						}
					}
					return { processed: true };
					break;
				case 'CallExpression': //process
					if (isServerFunction(obj.callee, scope)) {
						if (!findDownloadValueName(obj, scope)) {
							var obj2 = JSON.parse(JSON.stringify(obj))
							var s = getlowestscope(scope);
							if (!s.downloadValues) {
								s.downloadValues = [];
							}
							var nn = 'v' + (Math.random() + 1).toString(36).substring(7);
							tgtbody.push(createDownloadCode(nn, obj));
							s.downloadValues.push({ obj: obj, name: nn, origin: obj2 });
						}
						return { processed: true };
					}
					return { CalleeProcessed: true };
					break;
				case 'AssignmentExpression': //process
					if (isServerFunction(obj.left, scope)) {
						return { processed: true };
					}
					return { leftProcessed: true };
					break;
				case 'ExpressionStatement': //process
					if (!(obj.expression && obj.expression.type == 'AssignmentExpression')) {
						return { processed: true };
					}
					break;
				case 'MemberExpression': //process
					if (obj.computed) {
						if (!(obj.object && isUploadedFiles(scope, obj.object.name))) {
							if (isServerFunction(obj.object, scope)) {
								if (!findDownloadValueName(obj, scope)) {
									var obj2 = JSON.parse(JSON.stringify(obj))
									var s = getlowestscope(scope);
									if (!s.downloadValues) {
										s.downloadValues = [];
									}
									var nn = newname();
									tgtbody.push(createDownloadCode(nn, obj));
									s.downloadValues.push({ obj: obj, name: nn, origin: obj2 });
								}
							}
						}
						return { processed: true };
					}
					break;
				case 'VariableDeclarator': //process
					if (isServerFunction(obj.id, scope)) {
						return { processed: true };
					}
					break;
				case 'NewExpression': //process
					if (isServerFunction(obj.callee, scope)) {
						return { processed: true };
					}
					return { CalleeProcessed: true };
					break;
				default:
					return {};
			}
			return {};
		}
	}
	function searchLibFiles(obj, handler, scope) {
		var r = gothroughcode(obj, searchLibFilesCall, scope);
		return r.ret;
		function searchLibFilesCall(obj, scope) {
			switch (obj.type) {
				case 'Identifier': //process
					if (isServerFunction(obj, scope)) {
						for (var i = 0; i < libFileToObjectMapping.length; i++) {
							if (libFileToObjectMapping[i].objname == obj.name || libFileToObjectMapping[i].objname == obj.serverLibfor) {
								handler(libFileToObjectMapping[i].filename, libFileToObjectMapping[i].servertype);
								break;
							}
						}
					}
					return { processed: true }
					break;
				case 'CallExpression': //process
					if (!isServerFunction(obj.callee, scope)) {
						return { CalleeProcessed: true }
					}
					break;
				default:
					return {};
			}
			return {};
		}
	}
	function collectUploads(obj, handler, scope) {
		var r = gothroughcode(obj, collectUploadsCall, scope);
		return r.ret;
		function collectUploadsCall(obj, scope) {
			switch (obj.type) {
				case 'Identifier':
					if (obj.name == '_FILES_') {
						return { processed: true };
					}
					if (canRun2sides(obj))
						return { processed: true };
					var s0 = isServerFunction(obj, scope);
					if (s0) {
						var s2 = getlowestscope(scope);
						if (scope != s0 && s2 != s0) {
							//obj is a state value previously downloaded. it needs to be uploaded
							if (s0.downloadValues && s0.downloadValues.length > 0) {
								for (var i = 0; i < s0.downloadValues.length; i++) {
									if (isSameObject(s0.downloadValues[i].origin, obj)) {
										handler({ name: s0.downloadValues[i].name, value: JSON.parse(JSON.stringify(s0.downloadValues[i].obj)) });
										break;
									}
								}
							}
						}
					}
					else {
						var s0 = getlowestscope(scope);
						if (s0.localVariable) {
							if (s0.localVariable[obj.name]) {
								return { processed: true };
							}
						}
						handler({ name: obj.name, value: JSON.parse(JSON.stringify(obj)) });
					}
					return { processed: true };
					break;
				case 'NewExpression':
					return { CalleeProcessed: true };
					break;
				case 'CallExpression':
					if (canRun2sides(obj.callee))
						return { processed: true };
					if (isFileListReference(scope, obj.callee)) {
						return { processed: true };
					}
					var s0 = isServerFunction(obj.callee, scope);
					if (!s0) {
						var nn = newname();
						handler({ name: nn, value: JSON.parse(JSON.stringify(obj)), origin: JSON.parse(JSON.stringify(obj)) });
						obj.type = 'Identifier';
						delete obj.callee;
						delete obj.arguments;
						obj.name = nn;
						return { processed: true };
					}
					else {
						var s2 = getlowestscope(scope);
						if (scope != s0 && s2 != s0) {
							//obj is a state value previously downloaded. it needs to be uploaded
							if (s0.downloadValues && s0.downloadValues.length > 0) {
								for (var i = 0; i < s0.downloadValues.length; i++) {
									if (isSameObject(s0.downloadValues[i].origin, obj)) {
										handler({ name: s0.downloadValues[i].name, value: JSON.parse(JSON.stringify(s0.downloadValues[i].obj)), origin: JSON.parse(JSON.stringify(s0.downloadValues[i].obj)) });
										break;
									}
								}
							}
						}
						return { CalleeProcessed: true };
					}
					break;
				case 'AssignmentExpression':
					return { leftProcessed: true };
					break;
				case 'MemberExpression':
					if (obj.computed) {
					}
					else {
						if (isFileListReference(scope, obj)) {
							return {processed:true};
						}
						return { propProcessed: true };
					}
					break;
				case 'VariableDeclarator':
					var s0 = getlowestscope(scope);
					if (!s0.localVariable) {
						s0.localVariable = {};
					}
					if (!s0.localVariable[obj.id.name]) {
						s0.localVariable[obj.id.name] = { init: obj.init };
					}
					break;
				default:
					return {};
			}
			return {};
		}
	}
	function enumerateUploads(obj, handler, scope, stop) {
		var r = gothroughcode(obj, enumerateUploadsCall, scope);
		return r.ret;
		function enumerateUploadsCall(obj, scope) {
			switch (obj.type) {
				case 'Identifier':
					for (var i = 0; i < scope.uploads.length; i++) {
						if (obj.name == scope.uploads[i].name) {
							handler(obj, scope.uploads[i].name);
							break;
						}
					}
					return { processed: true };
					break;
				case 'CallExpression':
					//check to see if it is a state value
					var s = stop;
					var handled = false;
					while (s && s != scope) {
						if (s.downloadValues) {
							for (var k = 0; k < s.downloadValues.length; k++) {
								if (isSameObject(obj, s.downloadValues[k].origin)) {
									handled = true;
									handler(obj, s.downloadValues[k].name);
									break;
								}
							}
						}
						s = s.scope;
					}
					if (handled) {
						return { processed: true };
					}
					else {
						return {
							between: function () {
								for (var i = 0; i < scope.uploads.length; i++) {
									if (scope.uploads[i].origin && isSameObject(obj, scope.uploads[i].origin)) {
										handler(obj, scope.uploads[i].name);
										break;
									}
								}
							}
						};
					}
					break;
				case 'NewExpression':
					return { CalleeProcessed: true };
					break;
				case 'AssignmentExpression':
					return { leftProcessed: true };
					break;
				case 'MemberExpression':
					if (obj.computed) {
					}
					else {
						return { propProcessed: true };
					}
					break;
			}
			return {};
		}
	}
	//tgtbody0 is server code
	function finishContextSwitchingPair(tgtbody0, scope0) {
		//replace FileList to prevent uploading
		scope0.forServer = true;
		var srvFile = { type: 'Identifier', name: '_FILES_' };
		for (var i = 0; i < tgtbody0.length; i++) {
			replaceFileListObject(scope0, tgtbody0[i], srvFile);
		}
		var useFileList = scope0.useFileList;
		delete scope0.forServer;
		delete scope0.useFileList;
		//find server library files
		var s = getlowestscope(scope0);
		if (!s.libfiles) {
			s.libfiles = [];
		}
		if (!s.libtypes) {
			s.libtypes = [];
		}
		if (!s.uploads) {
			s.uploads = [];
		}
		if (useFileList) {
			s.libfiles.push('FileAPIserver.js');
			s.libtypes.push('FileAPI.STI_ServerFileAPI');
			if (!s.fileUpload) {
				//Find the parent scope with File Upload action; throw exception if not found
				var scopeFileupload;
				var s0 = scope0;
				while (s0) {
					if (s0.fileUpload) {
						scopeFileupload = s0;
					}
					s0 = s0.scope;
				}
				if (!scopeFileupload)
					throw 'Using of FileList at server without Upload';
				//Add download of _FILES_ in that scope’s server code
				var dncode = {
					type: 'ExpressionStatement',
					expression: {
						type: 'CallExpression',
						arguments: [
							{ type: 'Literal', value: '_FILES_', raw: "'_FILES_'" },
							{ type: 'Identifier', name: '_FILES_' }
						],
						callee: {
							type: 'MemberExpression',
							property: { type: 'Identifier', name: 'AddDownloadValue' },
							object: { type: 'Identifier', name: 'jsServer' }
						}
					}
				};
				scopeFileupload.servercode.body.push(dncode);
				//Starting from the next scope of file upload, add CSA.values._FILE_ to upload list, 
				//add a call to retrieveFileList at the beginning of the server code
				s0 = scopeFileupload.scope;
				var upcode = {
					type: 'Property',
					method: false,
					kind: 'init',
					key: { type: 'Identifier', name: '_FILES_' },
					value: {
						type: 'MemberExpression',
						property: { type: 'Identifier', name: '_FILES_' },
						object: {
							type: 'MemberExpression',
							property: { type: 'Identifier', name: 'values' },
							object: { type: 'Identifier', name: 'CSA' }
						}
					}
				};
				var callrf = {
					type: 'ExpressionStatement',
					expression: {
						type: 'CallExpression',
						arguments: [],
						callee: {
							type: 'Identifier', name: 'retrieveFileList', isServerFunction: true
						}
					}
				}
				while (s0) {
					if (s0.servercall) {
						s0.servercall.expression.arguments[0].properties[2].value.properties.push(upcode);
					}
					if (s0.servercode) {
						s0.servercode.body.unshift(callrf);
					}
					s0 = s0.scope;
				}
			}
		}
		//find upload values
		function addupload(v) {
			var b = false;
			for (var i = 0; i < s.uploads.length; i++) {
				if (s.uploads[i].name == v.name) {
					b = true;
					break;
				}
			}
			if (!b) {
				if (v.value.type == 'CallExpression') {
					if (v.value.callee.type == 'Identifier' && v.value.callee.name == 'Date') {
						//use CSA.datetime.toIso
						v.value = { type: 'CallExpression', arguments: [v.value], callee: { type: 'MemberExpression', property: { type: 'Identifier', name: 'toIso' }, object: { type: 'MemberExpression', property: { type: 'Identifier', name: 'datetime' }, object: {type:'Identifier', name:'CSA'}}} }
					}
				}
				s.uploads.push(v);
			}
		}
		for (var i = 0; i < tgtbody0.length; i++) {
			collectUploads(tgtbody0[i], addupload, scope0)
		}
		var added;
		if (s.uploads.length > 0) {
			for (var i = 0; i < s.uploads.length; i++) {
				added = false;
				for (var k = 0; k < s.servercall.expression.arguments[0].properties[2].value.properties.length; k++) {
					if (s.uploads[i].name == s.servercall.expression.arguments[0].properties[2].value.properties[k].key.name) {
						added = true;
						break;
					}
				}
				if (!added) {
					s.servercall.expression.arguments[0].properties[2].value.properties.push(
						{
							type: 'Property',
							key: { type: 'Identifier', name: s.uploads[i].name },
							kind: 'init', method: false,
							value: s.uploads[i].value
						});
				}
			}
			//switch uploaded values in the server code to be clientvalues.{name}
			if (s.servercode) {
				for (var k = 0; k < s.servercode.body.length; k++) {
					enumerateUploads(s.servercode.body[k], function (obj, uploadValueName) {
						obj.type = 'MemberExpression';
						obj.property = { type: 'Identifier', name: uploadValueName };
						obj.object = { type: 'Identifier', name: 'clientvalues' };
						delete obj.name;
					}, s, scope0);
				}
			}
		}
		function addlibfile(f, n) {
			var b = false;
			for (var i = 0; i < s.libfiles.length; i++) {
				if (s.libfiles[i] == f) {
					b = true;
					break;
				}
			}
			if (!b) {
				s.libfiles.push(f);
			}
			b = false;
			for (var i = 0; i < s.libtypes.length; i++) {
				if (s.libtypes[i] == n) {
					b = true;
					break;
				}
			}
			if (!b) {
				s.libtypes.push(n);
			}
		}
		for (var i = 0; i < tgtbody0.length; i++) {
			searchLibFiles(tgtbody0[i], addlibfile, scope0);
		}
		//add library file names
		for (var i = 0; i < s.libfiles.length; i++) {
			added = false;
			for (var k = 0; k < s.servercall.expression.arguments[0].properties[1].value.elements.length; k++) {
				if (s.libfiles[i] == s.servercall.expression.arguments[0].properties[1].value.elements[k].value) {
					added = true;
					break;
				}
			}
			if (!added) {
				s.servercall.expression.arguments[0].properties[1].value.elements.push({ type: 'Literal', value: s.libfiles[i], raw: "'" + s.libfiles[i] + "'" });
			}
		}
		//add server code file name
		var sn = _webname + "_server" + (s.servercallIndex + 1) + ".js";
		added = false;
		for (var i = 0; i < s.servercall.expression.arguments[0].properties[1].value.elements.length; i++) {
			if (sn == s.servercall.expression.arguments[0].properties[1].value.elements[i].value) {
				added = true;
				break;
			}
		}
		if (!added) {
			s.servercall.expression.arguments[0].properties[1].value.elements.push({ type: 'Literal', value: sn, raw: "'" + sn + "'" });
		}
		for (var i = 0; i < s.libtypes.length; i++) {
			added = false;
			for (var k = 0; k < s.servercall.expression.arguments[0].properties[0].value.elements.length; k++) {
				if (s.libtypes[i] == s.servercall.expression.arguments[0].properties[0].value.elements[k].value) {
					added = true;
					break;
				}
			}
			if (!added) {
				s.servercall.expression.arguments[0].properties[0].value.elements.push({ type: 'Literal', value: s.libtypes[i], raw: "'" + s.libtypes[i] + "'" });
			}
		}
	}
	function findDownloadAndStateValues(srcbody0, tgtbody0, k, scope0) {
		//k is start index for srcbody, download code is to be added to tgtbody
		//search download and state values and add download code to server code generated
		for (var i = k; i < srcbody0.length; i++) {
			addDownAndStateValues(srcbody0[i], tgtbody0, scope0)
		}
		//substitute references to server values with download and state values
		substituteServerNames(srcbody0, k, scope0);
	}
	function useCSAdownloadName(obj) {
		if (obj.type == 'Identifier') {
			//use CSA.values.{obj.name}
			obj.type = 'MemberExpression';
			obj.property = { type: 'Identifier', name: obj.name };
			obj.object = { type: 'MemberExpression', object: { type: 'Identifier', name: 'CSA' }, property: { type: 'Identifier', name: 'values' } };
			delete obj.name;
		}
	}
	function substituteDownloadNames(obj, scope) {
		var r = gothroughcode(obj, substituteDownloadNamesCall, scope);
		return r.ret;
		function substituteDownloadNamesCall(obj, scope) {
			switch (obj.type) {
				case 'Identifier':
					if (isServerFunction(obj, scope)) {
						var nn = findDownloadValueName(obj, scope);
						if (nn) {
							obj.name = nn;
							useCSAdownloadName(obj);
						}
					}
					return { processed: true };
					break;
				case 'CallExpression':
					if (isServerFunction(obj.callee, scope)) {
						var nn = findDownloadValueName(obj, scope);
						if (nn) {
							obj.type = 'Identifier';
							delete obj.callee;
							delete obj.arguments;
							obj.name = nn;
							useCSAdownloadName(obj);
						}
						return { processed: true };
					}
					else {
						return { CalleeProcessed: true };
					}
					break;
				case 'AssignmentExpression':
					if (!isServerFunction(obj.left, scope)) {
						return { leftProcessed: true };
					}
					return { processed: true };
					break;
				case 'MemberExpression':
					if (obj.computed) {
						if (isServerFunction(obj.object, scope)) {
							var nn = findDownloadValueName(obj, scope);
							if (nn) {
								obj.type = 'Identifier';
								delete obj.object;
								delete obj.property;
								delete obj.computed;
								obj.name = nn;
								useCSAdownloadName(obj);
							}
						}
						return { processed: true };
					}
					else {
						return { propProcessed: true };
					}
					break;
				case 'VariableDeclarator':
					substituteDownloadNamesCall(obj.id, scope);
					break;
			}
			return {};
		}
	}
	function substituteServerNames(srcbody, i, scope) {
		//i is start index for srcbody which is for a callback function
		for (; i < srcbody.length; i++) {
			if (srcbody[i].type == 'IfStatement') {
				substituteDownloadNames(srcbody[i].test, scope);
				if (srcbody[i].consequent) {
					substituteServerNames(srcbody[i].consequent.body, 0, scope)
				}
				if (srcbody[i].alternate) {
					substituteServerNames(srcbody[i].alternate.body, 0, scope)
				}
			}
			else {
				substituteDownloadNames(srcbody[i], scope)
			}
		}
	}
	function duplicateBranches(codeBranch, clientBody, cb, serverBody, outerLoop, scope) {
		//duplicate code branching at client side:
		var cbc = { type: 'IfStatement' };//code branching duplicated at client side
		//preserve server values as download values separated from corresponding server variables
		cbc.test = createClientBranchingCondition(codeBranch.test, serverBody, true, scope);
		clientBody.push(cbc);
		//finish server side branch by branch:
		//cb is server side code branching
		cb.test = codeBranch.test;
		serverBody.push(cb);
		var clientBranches = [];
		if (codeBranch.consequent) {
			cb.consequent = {};
			cb.consequent.type = codeBranch.consequent.type;
			cb.consequent.body = [];
			cbc.consequent = {};
			cbc.consequent.type = codeBranch.consequent.type;
			cbc.consequent.body = [];
			for (var k = 0; k < codeBranch.consequent.body.length; k++) {
				if (codeBranch.consequent.body[k].type == 'IfStatement') {
					//check if it is a situation 2 branching
					var c = determineBranchType(codeBranch.consequent.body[k], scope);
					if (c == CODEBRANCH_2) {
						//duplicate it
						var cb2 = { type: 'IfStatement' };
						duplicateBranches(codeBranch.consequent.body[k], cb2, cbc.consequent.body, cb.consequent.body, outerLoop, scope);
						//cb.consequent.body.push(cb2);
						scope.currentContext = SERVER_CONTEXT;
					}
					else if (c == CODEBRANCH_6) {
						//treat it as a single server operation
						cb.consequent.body.push(codeBranch.consequent.body[k]);
					}
					else {
						//other situation, treated it as a client operation
						//thus a server to client execution context switching point
						clientBranches.push({ sourcebody: codeBranch.consequent.body, tgtserverbody: cb.consequent.body, tgtclientbody: cbc.consequent.body ,sourceIndex:k});
						break;
					}
				}
				else {
					if (isServerFunction(codeBranch.consequent.body[k], scope)) {
						cb.consequent.body.push(codeBranch.consequent.body[k]);
					}
					else {
						//a server to client execution point is identified
						//
						clientBranches.push({ sourcebody: codeBranch.consequent.body, tgtserverbody: cb.consequent.body, tgtclientbody: cbc.consequent.body, sourceIndex: k });
						break;
					}
				}
			}
		}
		if (codeBranch.alternate) {
			scope.currentContext = SERVER_CONTEXT; //put it back in case processing of other branches changes it
			cb.alternate = {};
			cb.alternate.type = codeBranch.alternate.type;
			cb.alternate.body = [];
			cbc.alternate = {};
			cbc.alternate.type = codeBranch.alternate.type;
			cbc.alternate.body = [];
			for (var k = 0; k < codeBranch.alternate.body.length; k++) {
				if (codeBranch.alternate.body[k].type == 'IfStatement') {
					//check if it is a situation 2 branching
					var c = determineBranchType(codeBranch.alternate.body[k], scope);
					if (c == CODEBRANCH_2) {
						//duplicate it
						var cb2 = { type: 'IfStatement' };
						duplicateBranches(codeBranch.alternate.body[k], cb2, cb.alternate.body, outerLoop, scope);
						//cb.alternate.body.push(cb2);
					}
					else {
						//not a situation 2, treated it as a client operation
						//thus a server to client execution context switching point
						clientBranches.push({ sourcebody: codeBranch.alternate.body, tgtserverbody: cb.alternate.body, tgtclientbody: cbc.alternate.body, sourceIndex: k });
						break;
					}
				}
				else {
					if (isServerFunction(codeBranch.alternate.body[k], scope)) {
						cb.alternate.body.push(codeBranch.alternate.body[k]);
					}
					else {
						//a server to client execution point is identified
						//
						clientBranches.push({ sourcebody: codeBranch.alternate.body, tgtserverbody: cb.alternate.body, tgtclientbody: cbc.alternate.body, sourceIndex: k });
						break;
					}
				}
			}
		}
		finishContextSwitchingPair(serverBody, scope);
		for (var k = 0; k < clientBranches.length; k++) {
			findDownloadAndStateValues(clientBranches[k].sourcebody, clientBranches[k].tgtserverbody, clientBranches[k].sourceIndex, scope);
			var s = appendscope(scope);
			scope.currentContext = CLIENT_CONTEXT;
			processFunctionBody(clientBranches[k].sourcebody, clientBranches[k].tgtclientbody, clientBranches[k].sourceIndex, outerLoop, scope);
			delete s.scope;
		}
	}
	function copyTo(frm, dest) {
		if (compareObjs(frm, dest)) {
			dest.type = frm.type;
			if (frm.type == 'Identifier') {
				dest.name = frm.name;
			}
			else if (frm.type == 'MemberExpression') {
				dest.property = {};
				copyTo(frm.property, dest.property);
				dest.object = {};
				copyTo(frm.object, dest.object);
			}
			else {
				throw 'Unhandled type in copyTo:' + frm.type;
			}
		}
	}
	function copyVariable(obj) {
		var v = {};
		v.type = obj.type;
		if (obj.type == 'Identifier') {
			v.name = obj.name;
		}
		else if (obj.type == 'MemberExpression') {
			v.computed = obj.computed;
			v.property = copyVariable(obj.property);
			v.object = copyVariable(obj.object);
		}
		else if (obj.type == 'CallExpression') {
			v.callee = copyVariable(obj.callee);
			if (obj.arguments) {
				v.arguments = [];
				for (var i = 0; i < obj.arguments.length; i++) {
					v.arguments.push(copyVariable(obj.arguments[i]));
				}
			}
		}
		else if (obj.type == 'Literal') {
			v.raw = obj.raw;
			v.value = obj.value;
		}
		else {
			throw 'unhandled type in copyVariable:' + obj.type;
		}
		return v;
	}
	function isSameVariable(obj1, obj2) {
		if (obj1.type == obj2.type) {
			if (obj1.type == 'Identifier')
				return obj1.name == obj2.name;
			else if (obj1.type == 'MemberExpression') {
				if (isSameVariable(obj1.property, obj1.property)) {
					return isSameVariable(obj1.object, obj2.object);
				}
			}
		}
		return false;
	}
	function replaceVariable(obj, src, tgt) {
		if (obj == null || obj.type == 'Literal') return;
		if (obj.type == 'BlockStatement') {
			for (var i = 0; i < obj.body.length; i++) {
				replaceVariable(obj.body[i], src, tgt);
			}
		}
		else if (obj.type == 'VariableDeclarator') {
			replaceVariable(obj.init, src, tgt);
		}
		else if (obj.type == 'MemberExpression') {
			if (isSameVariable(obj, src)) {
				copyTo(tgt, obj);
			}
			else {
				replaceVariable(obj.object, src, tgt);
			}
		}
		else if (obj.type == 'ForStatement') {
			replaceVariable(obj.init, src, tgt);
			replaceVariable(obj.test, src, tgt);
			replaceVariable(obj.update, src, tgt);
			replaceVariable(obj.body, src, tgt);
		}
		else if (obj.type == 'ExpressionStatement') {
			replaceVariable(obj.expression, src, tgt);
		}
		else if (obj.type == 'VariableDeclaration') {
			for (var j = 0; j < obj.declarations.length; j++) {
				replaceVariable(obj.declarations[j], src, tgt);
			}
		}
		else if (obj.type == 'BinaryExpression') {
			replaceVariable(obj.left, src, tgt);
			replaceVariable(obj.right, src, tgt);
		}
		else if (obj.type == 'Identifier') {
			if (isSameVariable(obj, src)) {
				copyTo(tgt, obj);
			}
		}
		else if (obj.type == 'UpdateExpression') {
			replaceVariable(obj.argument, src, tgt);
		}
		else if (obj.type == 'AssignmentExpression') {
			replaceVariable(obj.left, src, tgt);
			replaceVariable(obj.right, src, tgt);
		}
		else if (obj.type == 'CallExpression') {
			replaceVariable(obj.callee, src, tgt);
			if (obj.arguments) {
				for (var j = 0; j < obj.arguments.length; j++) {
					replaceVariable(obj.arguments[j], src, tgt);
				}
			}
		}
		else {
			throw 'unhandled type:' + obj.type;
		}
	}
	function replaceFileListObject(scope, obj, tgt) {
		var r = gothroughcode(obj, replaceFileListObjectCall, scope);
		return r.ret;
		function replaceFileListObjectCall(obj, scope) {
			if (obj == null || obj.type == 'Literal') return { processed: true };
			switch (obj.type) {
				case 'MemberExpression':
					/*if (isFileListObject(scope, obj)) {
						copyTo(tgt, obj);
						scope.useFileList = true;
						return { processed: true };
					}
					else */if (isFileListReference(scope, obj)) {
						copyTo(tgt, obj);
						scope.useFileList = true;

						return { processed: true };
					}
					else {
						return { propProcessed: true };
					}
					break;
				case 'Identifier':
					if (scope.forServer) {
						if (isFileListVariableName(scope, obj.name)) {
							copyTo(tgt, obj);
							scope.useFileList = true;
						}
					}
					return { processed: true };
					break;
			}
			return {};
		}
	}
	function generateServerCall(scope, serverFolder) {
		var cn = { type: 'ExpressionStatement' };
		cn.expression = { type: 'CallExpression' };
		cn.expression.callee = { type: 'MemberExpression' };
		cn.expression.callee.computed = false;
		cn.expression.callee.property = { type: 'Identifier', name: 'callServer' }
		cn.expression.callee.object = { type: 'Identifier', name: 'CSA' };
		cn.expression.arguments = [{ type: 'ObjectExpression', properties: [] },
			{ type: 'Literal', value: null, raw: 'null' },
			{ type: 'Literal', value: null, raw: 'null' },
			{ type: 'Identifier', name: newname('callback_') }];
		cn.expression.arguments[0].properties.push({ type: 'Property', method: false, kind: 'init', key: { type: 'Identifier', name: 'ServerTypes' }, value: { type: 'ArrayExpression', elements: [] } });
		cn.expression.arguments[0].properties.push({ type: 'Property', method: false, kind: 'init', key: { type: 'Identifier', name: 'ServerFiles' }, value: { type: 'ArrayExpression', elements: [] } });
		cn.expression.arguments[0].properties.push({ type: 'Property', method: false, kind: 'init', key: { type: 'Identifier', name: 'clientvalues' }, value: { type: 'ObjectExpression', properties: [] } });
		cn.expression.arguments[0].properties.push({ type: 'Property', method: false, kind: 'init', key: { type: 'Identifier', name: 'code' }, value: { type: 'Literal', value: null, raw: 'null' } });
		var fs = null;
		var fsDecl = null;
		var fsRef = null;
		if (serverFolder) {
			if (isFileListObject(scope, serverFolder.callee.object)) {
				fs = { type: 'Identifier', name: newname() };
				fsDecl = {
					type: 'VariableDeclaration',
					kind: 'var',
					declarations: [
						{
							type: 'VariableDeclarator',
							id: fs,
							init: serverFolder.callee.object
						}
					]
				};
			}
			else {
				fs = copyVariable(serverFolder.callee.object);
			}
			//notify callServer to do file upload
			cn.expression.arguments.push(fs);
			fsRef = fs;
		}
		//generate a callback function
		var cb = { type: 'FunctionDeclaration', params: [] };
		cb.id = { type: 'Identifier', name: cn.expression.arguments[3].name };
		cb.body = { type: 'BlockStatement', body: [] };
		//create server code for the server connection
		var servercode = { type: 'Program', body: [] };
		_serverCodeIndex++;
		var cm = '\r\n\tserver code for the ' + (_serverCodeIndex == 0 ? 'first' : (_serverCodeIndex == 1 ? 'second' : (_serverCodeIndex == 2 ? 'third' : _serverCodeIndex + 'th'))) + ' client to server connection\r\n\tgenerated from JavaScript code included in ' + _webname + '.html by client-server-automation preprocessor\r\n';
		servercode.comments = [{ type: 'Block', value: cm, range: [0, cm.length + 4] }];
		servercode.range = [cm.length + 5, cm.length + 1000];
		_serverCodes.push(servercode);
		if (serverFolder) {
			//replace Upload call with a call of GetUploadedFiles at server
			serverFolder.callee = { type: 'Identifier', name: 'GetUploadedFiles', isServerFunction: true/*, serverLibfor: 'FileDescription'*/ };
			//create a "for" loop for form file URL
			cb.body.body.unshift({
				type: 'ForStatement',
				init: {
					type: 'VariableDeclaration',
					kind: 'var',
					declarations: [
						{
							type: 'VariableDeclarator',
							id: { type: 'Identifier', name: 'i' },
							init: { type: 'Literal', raw: "0", value: 0 }
						}
					]
				},
				test: {
					type: 'BinaryExpression',
					left: { type: 'Identifier', name: 'i' },
					operator: '<',
					right: {
						type: 'MemberExpression',
						computed: false,
						property: { type: 'Identifier', name: 'length' },
						object: fs
					}
				},
				update: {
					type: 'UpdateExpression',
					prefix: false,
					operator: '++',
					argument: { type: 'Identifier', name: 'i' }
				},
				body: {
					type: 'BlockStatement',
					body: [
						{
							type: 'ExpressionStatement',
							expression: {
								type: 'AssignmentExpression',
								operator: '=',
								left: {
									type: 'MemberExpression',
									computed: false,
									property: { type: 'Identifier', name: 'URL' },
									object: {
										type: 'MemberExpression',
										computed: true,
										property: { type: 'Identifier', name: 'i' },
										object: fs
									}
								},
								right: {
									type: 'CallExpression',
									callee: {
										type: 'MemberExpression',
										computed: false,
										property: {
											type: 'Identifier',
											name: 'formFleURL'
										},
										object: { type: 'Identifier', name: 'CSA' }
									},
									arguments: [
										serverFolder.arguments[0],
										{
											type: 'MemberExpression',
											computed: false,
											property: { type: 'Identifier', name: 'name' },
											object: {
												type: 'MemberExpression',
												computed: true,
												property: { type: 'Identifier', name: 'i' },
												object: fs
											}
										}
									]
								}
							}
						}
					]
				}
			});
			//the first property is an array for server types
			cn.expression.arguments[0].properties[0].value.elements.push({ type: 'Literal', raw: "'FileAPI.STI_ServerFileAPI'", value: 'FileAPI.STI_ServerFileAPI' });
			//the second property is an array for server files
			cn.expression.arguments[0].properties[1].value.elements.unshift({ type: 'Literal', raw: "'FileAPIserver.js'", value: 'FileAPIserver.js' });
		}
		return {
			callServer: cn,
			callback: cb,
			servercode: servercode,
			servercodeIndex: _serverCodeIndex,
			fsDecl: fsDecl,
			fsRef: fsRef
		};
	}
	function appendscope(scope) {
		var s = getlowestscope(scope);
		s.scope = {};
		return s;
	}
	function inCallback(scope) {
		var s = scope;
		while (s) {
			if (s.callback)
				return true;
			s = s.scope;
		}
		return false;
	}
	function getVariableDeclararion(obj, list, scope) {
		if (obj.type == 'VariableDeclaration') {
			var sv = [];
			for (var k = 0; k < obj.declarations.length; k++) {
				if (!isServerFunction(obj.declarations[k], scope)) {
					list.push(obj.declarations[k]);
					obj.declarations[k].used = true;
				}
				else {
					sv.push(obj.declarations[k]);
				}
			}
			if (sv.length == 0)
				obj.used = true;
			else {
				obj.declarations = sv;
			}
		}
		else if (obj.type == 'BlockStatement') {
			for (var k = 0; k < obj.body.length; k++) {
				getVariableDeclararion(obj.body[k], list, scope);
			}
		}
		else {
			throw 'unhandled type in getVariableDeclararion:' + obj.type;
		}
	}
	function findVariableDeclarations(fbody, scope) {
		var ret = [];
		for (var k = 0; k < fbody.length; k++) {
			getVariableDeclararion(fbody[k], ret, scope);
		}
		return ret;
	}
	function generateForInLoopServer(funcBody, fdbody, i, outerLoop, scope) {
		//funcBody[i] is a server side "for in" loop
		var forLoop = funcBody[i];
		//create usedkeys array
		var usedkeys = newname('usedkeys_');
		fdbody.push({ type: 'VariableDeclaration', kind: 'var', declarations: [{ type: 'VariableDeclarator', id: { type: 'Identifier', name: usedkeys }, init: { type: 'ArrayExpression', elements: [] } }] });
		//create loop function
		var loopFuncName = newname('loop_');
		var loopFunc = { type: 'ExpressionStatement', expression: { type: 'CallExpression', arguments: [], callee: { type: 'FunctionExpression', ret: null, generator: false, expression: false, defaults: [] } } };
		loopFunc.expression.callee.id = { type: 'Identifier', name: loopFuncName };
		loopFunc.expression.callee.params = [];
		loopFunc.expression.callee.body = { type: 'BlockStatement', body: [] };
		fdbody.push(loopFunc);
		//forming loop function body to be processed
		var sourcebody = [];
		//remove downloaded key
		sourcebody.push({ type: 'ExpressionStatement', expression: { type: 'UnaryExpression', operator: 'delete', prefix: true, argument: { type: 'MemberExpression', property: { type: 'Identifier', name: 'itemkey' }, object: { type: 'MemberExpression', property: { type: 'Identifier', name: 'values' }, object: { type: 'Identifier', name: 'CSA' } } } } });
		//make client to server execution context switch
		sourcebody.push({ type: 'ClientToServerContextSwitch' });
		//insert user programming code
		sourcebody = sourcebody.concat(forLoop.body.body);
		//process loop function body
		var target = []; //client code for loop function body
		var s = appendscope(scope);
		s.scope.serverVariables = {};
		s.scope.serverVariables[forLoop.left.declarations[0].id.name] = { init: forLoop.left.declarations[0].init };
		var firstServerCodeIndex = _serverCodeIndex+1;
		processFunctionBody(sourcebody, target, 0, outerLoop, scope);
		//modify server code for the first server connection
		var sc = [];
		//create a server side for in
		var forin = { type: 'ForInStatement', left: forLoop.left, right: forLoop.right, body: { type: 'BlockStatement', body: [] } };
		sc.push(forin);
		//add a type checking
		var cond = {
			type: 'IfStatement', test: {
				type: 'BinaryExpression',
				operator: '==',
				left: { type: 'Literal', value: 'function', raw: 'function' },
				right: {
					type: 'UnaryExpression', operator: 'typeof', prefix: true,
					argument: {
						type: 'MemberExpression', computed: true, property: { type: 'Identifier', name: forLoop.left.declarations[0].id.name },
						object: { type: 'Identifier', name: forLoop.right.name }
					}
				}
			},
			alternate: null,
			consequent: { type: 'BlockStatement', body: [{type:'ContinueStatement',label:null}] }
		};
		forin.body.body.push(cond);
		//find unused key
		var keyused = newname('keyused_');
		forin.body.body.push({
			type: 'VariableDeclaration', kind: 'var',
			declarations: [{
				type: 'VariableDeclarator',
				id: { type: 'Identifier', name: keyused },
				init: {
					type: 'Literal', value: false, raw: 'false'
				}
			}]
		});
		//use for loop to search unused key
		var forkeys = {
			type: 'ForStatement',
			init: { type: 'VariableDeclaration', kind: 'var', declarations: [{ type: 'VariableDeclarator', id: { type: 'Identifier', name: 'i' }, init: { type: 'Literal', value: 0, raw: '0' } }] },
			test: {
				type: 'BinaryExpression', left: { type: 'Identifier', name: 'i' }, operator: '<',
				right: {
					type: 'MemberExpression',
					property: { type: 'Identifier', name: 'length' },
					object: { type: 'MemberExpression', property: { type: 'Identifier', name: 'usedkeys' }, object: {type:'Identifier',name:'clientvalues'} }
				}
			},
			update: { type: 'UpdateExpression', operator: '++', prefix: false, argument: { type: 'Identifier', name: 'i' } },
			body: { type: 'BlockStatement', body: [] }
		};
		forin.body.body.push(forkeys);
		//check key usage
		var chk = {
			type: 'IfStatement',
			test: {
				type: 'BinaryExpression',
				operator: '==',
				left: { type: 'Identifier', name: forLoop.left.declarations[0].id.name },
				right: {
					type: 'MemberExpression', computed: true,
					property: { type: 'Identifier', name: 'i' },
					object: { type: 'MemberExpression', computed: false, property: { type: 'Identifier', name: 'usedkeys' }, object: {type:'Identifier',name:'clientvalues'} }
				}
			},
			alternate: null,
			consequent: {type:'BlockStatement',body:[]}
		};
		forkeys.body.body.push(chk);
		chk.consequent.body.push({
			type: 'ExpressionStatement',
			expression: {
				type: 'AssignmentExpression',
				operator: '=',
				left: { type: 'Identifier', name: keyused },
				right: {type:'Literal',value:true,raw:'true'}
			}
		});
		chk.consequent.body.push({ type: 'BreakStatement', label: null });
		forin.body.body.push({
			type: 'IfStatement',
			test: { type: 'Identifier', name: keyused },
			alternate: null,
			consequent: { type: 'BlockStatement', body: [{type:'ContinueStatement',label:null}]}
		});
		//insert generated code here
		forin.body.body = forin.body.body.concat(_serverCodes[firstServerCodeIndex].body);
		//download key used
		forin.body.body.push({
			type: 'ExpressionStatement',
			expression: {
				type: 'CallExpression',
				arguments: [
					{type:'Literal',value:'itemkey',raw:'itemkey'},
					{ type: 'Identifier', name: forLoop.left.declarations[0].id.name }
				],
				callee: {
					type: 'MemberExpression',
					property: { type: 'Identifier', name: 'AddDownloadValue' },
					object: { type: 'Identifier', name: 'jsServer' }
				}
			}
		});
		//break the for in loop
		forin.body.body.push({ type: 'BreakStatement', label: null });
		//replace the server code
		_serverCodes[firstServerCodeIndex].body = sc;
		//modify client code
		//find first server call and its callback function
		var firstCallback;
		var firstCallbackName;
		for (var m = 0; m < target.length; m++) {
			if (target[m].type == 'ExpressionStatement'
				&& target[m].expression.type == 'CallExpression'
				&& target[m].expression.callee.type == 'MemberExpression'
				&& target[m].expression.callee.property.type == 'Identifier'
				&& target[m].expression.callee.property.name == 'callServer'
				&& target[m].expression.callee.object.type == 'Identifier'
				&& target[m].expression.callee.object.name == 'CSA'
				) {
				//upload usedkeys
				target[m].expression.arguments[0].properties.push({ type: 'Property', method: false, kind: 'init', key: { type: 'Identifier', name: 'usedkeys' }, value: { type: 'Identifier', name: usedkeys } });
				firstCallbackName = target[m].expression.arguments[3].name;
				break;
			}
		}
		for (var m = 0; m < target.length; m++) {
			if (target[m].type == 'FunctionDeclaration'
				&& target[m].id.name == firstCallbackName
				) {
				firstCallback = target[m];
				break;
			}
		}
		var cc = [];//client code
		var afterFuncName = newname('after_');
		//check download key
		var chkdn = {
			type: 'IfStatement',
			test: {
				type:'BinaryExpression',
				operator:'!=',
				left:{
					type: 'UnaryExpression', operator: 'typeof', prefix: true,
					argument: {
					type: 'MemberExpression', computed: false, property: { type: 'Identifier', name: 'itemkey' },
					object: { type: 'MemberExpression', property: { type: 'Identifier', name: 'values' }, object: {type:'Identifier',name:'CSA'} }
					}},
				right:{type:'Literal',value:'undefined',raw:'undefined'}
			},
			consequent: { type: 'BlockStatement', body: [] },
			alternate:{
				type:'BlockStatement',
				body:[
					{
						type:'ExpressionStatement',
						expression:{
							type:'CallExpression',arguments:[],
							callee:{
								type: 'Identifier', name: afterFuncName
							}
						}
					}
				]
			}
		};
		chkdn.consequent.body = chkdn.consequent.body.concat(firstCallback.body.body);
		//remember downloaded key
		chkdn.consequent.body.push({
			type: 'ExpressionStatement', expression: {
				type: 'CallExpression',
				arguments: [{ type: 'MemberExpression', property: { type: 'Identifier', name: 'itemkey' }, object: { type: 'MemberExpression', property: { type: 'Identifier', name: 'values' }, object: { type: 'Identifier', name: 'CSA' } } }],
				callee: { type: 'MemberExpression', property: { type: 'Identifier', name: 'push' }, object: { type: 'Identifier', name: usedkeys } }
			}
		});
		//make a recursive call
		chkdn.consequent.body.push({
			type: 'ExpressionStatement', expression: {
				type: 'CallExpression',
				arguments: [{ type: 'Identifier', name: loopFuncName }],
				callee: { type: 'Identifier', name: 'setTimeout' }
			}
		});
		firstCallback.body.body = [chkdn];
		loopFunc.expression.callee.body.body = target;
		delete s.scope;
		//generate after function
		var afterFunc = { type: 'FunctionDeclaration', id: { type: 'Identifier', name: afterFuncName }, params: [], body: { type: 'BlockStatement', body: [] } };
		fdbody.push(afterFunc);
		//process after function
		var s2 = appendscope(scope);
		processFunctionBody(funcBody, afterFunc.body.body, ++i, outerLoop, scope);
		delete s2.scope;
	}
	function generateForInLoopClient(funcBody, fdbody, i, outerLoop, scope) {
		//funcBody[i] is a client side "for in" loop
		var forLoop = funcBody[i];
		//create usedkeys array
		var usedkeys = newname('usedkeys_');
		fdbody.push({ type: 'VariableDeclaration', kind: 'var', declarations: [{ type: 'VariableDeclarator', id: { type: 'Identifier', name: usedkeys }, init: {type:'ArrayExpression', elements:[]}}]});
		//create loop function
		var loopFuncName = newname('loop_');
		var loopFunc = { type: 'ExpressionStatement', expression: { type: 'CallExpression', arguments: [], callee: { type: 'FunctionExpression', ret: null, generator: false, expression: false, defaults: [] } } };
		loopFunc.expression.callee.id = { type: 'Identifier', name: loopFuncName };
		loopFunc.expression.callee.params = [];
		loopFunc.expression.callee.body = { type: 'BlockStatement', body: [] };
		fdbody.push(loopFunc);
		//declare finished flag
		var loopBody = loopFunc.expression.callee.body.body;
		var finished = newname('finished_');
		loopBody.push({ type: 'VariableDeclaration', kind: 'var', declarations: [{ type: 'VariableDeclarator', id: { type: 'Identifier', name: finished }, init: { type: 'Literal', value: true, raw: 'true' } }] });
		//use for in to search unused key
		var forin = { type: 'ForInStatement', left: forLoop.left, right: forLoop.right, body: { type: 'BlockStatement', body: [] } };
		loopBody.push(forin);
		//call afterloop if finished
		var afterloopName = newname('after_');
		var iffinish = { type: 'IfStatement', test: { type: 'Identifier', name: finished }, consequent: { type: 'BlockStatement', body: [] } };
		iffinish.consequent.body.push({ type: 'ExpressionStatement', expression: { type: 'CallExpression', arguments: [], callee: { type: 'Identifier', name: afterloopName } } });
		loopBody.push(iffinish);
		//search in usedkeys
		var hasused = newname('hasused_');
		forin.body.body.push({ type: 'VariableDeclaration', kind: 'var', declarations: [{ type: 'VariableDeclarator', id: { type: 'Identifier', name: hasused }, init: { type: 'Literal', value: false, raw: 'false' } }] });
		//use a for loop to go through usedkeys
		var forkeys = {
			type: 'ForStatement',
			init: { type: 'VariableDeclaration', kind: 'var', declarations: [{ type: 'VariableDeclarator', id: { type: 'Identifier', name: 'i' }, init: { type: 'Literal', value: 0, raw: '0' } }] },
			test: { type: 'BinaryExpression', left: { type: 'Identifier', name: 'i' }, operator: '<', right: { type: 'MemberExpression', property: { type: 'Identifier', name: 'length' }, object: { type: 'Identifier', name: usedkeys } } },
			update: { type: 'UpdateExpression', operator: '++', prefix: false, argument: { type: 'Identifier', name: 'i' } },
			body: {type:'BlockStatement',body:[]}
		};
		forin.body.body.push(forkeys);
		//check usedkeys
		var cond = { type: 'IfStatement', test: { type: 'BinaryExpression', operator: '==', left: { type: 'Identifier', name: forLoop.left.declarations[0].id.name }, right: { type: 'MemberExpression', computed: true, property: { type: 'Identifier', name: 'i' }, object: { type: 'Identifier', name: usedkeys } } } };
		cond.alternate = null;
		cond.consequent = { type: 'BlockStatement', body: [] };
		cond.consequent.body.push({ type: 'ExpressionStatement', expression: { type: 'AssignmentExpression',operator:'=', left: { type: 'Identifier', name: hasused }, right: { type: 'Literal', value: true, raw: 'true' } } });
		cond.consequent.body.push({ type: 'BreakStatement', label: null });
		forkeys.body.body.push(cond);
		//use check result
		var chk = { type: 'IfStatement', test: { type: 'Identifier', name: hasused } };
		forin.body.body.push(chk);
		chk.consequent = { type: 'BlockStatement', body: [] };
		chk.consequent.body.push({ type: 'ContinueStatement', label: null });
		chk.alternate = { type: 'BlockStatement', body: [] };
		chk.alternate.body.push({ type: 'ExpressionStatement', expression: { type: 'CallExpression', arguments: [{ type: 'Identifier', name: forLoop.left.declarations[0].id.name }], callee: { type: 'MemberExpression', property: { type: 'Identifier', name: 'push' }, object: {type:'Identifier',name:usedkeys}} } });
		chk.alternate.body.push({ type: 'ExpressionStatement', expression: { type: 'AssignmentExpression',operator:'=', left: { type: 'Identifier', name: finished }, right: { type: 'Literal', value: false, raw: 'false' } } });
		//form body of for in loop to be processed
		var sourceBody = [];
		sourceBody = sourceBody.concat(forLoop.body.body);
		//make recursive call
		sourceBody.push({ type: 'ExpressionStatement', expression: { type: 'CallExpression', arguments: [{ type: 'Identifier', name: loopFuncName }], callee: { type: 'Identifier', name: 'setTimeout' } } });
		//process for in loop body
		var s = appendscope(scope);
		processFunctionBody(sourceBody, chk.alternate.body, 0, outerLoop, scope);
		delete s.scope;
		//break for in loop
		forin.body.body.push({ type: 'BreakStatement', label: null });
		//generate after function
		var afterFunc = { type: 'FunctionDeclaration', id: { type: 'Identifier', name: afterloopName }, params: [], body: { type: 'BlockStatement', body: [] } };
		loopBody.push(afterFunc);
		//process after function
		var s = appendscope(scope);
		processFunctionBody(funcBody, afterFunc.body.body, ++i, outerLoop, scope);
		delete s.scope;
	}
	function generateForLoop(funcBody, fdbody, i, outerLoop, scope) {
		//funcBody[i] is a "for" loop
		var forLoop = funcBody[i];
		//create loopScope function
		var loopScopeName = newname('loopScope_');
		var loopScope = { type: 'ExpressionStatement', expression: { type: 'CallExpression', arguments: [], callee: { type: 'FunctionExpression', ret: null, generator: false, expression: false, defaults: [] } } };
		loopScope.expression.callee.id = { type: 'Identifier', name: loopScopeName };
		loopScope.expression.callee.params = [];
		loopScope.expression.callee.body = { type: 'BlockStatement', body: [] };
		fdbody.push(loopScope);
		//form loopScope body to be processed
		var loopScopeBody = [];
		//process initial statements
		//find loop scope variable declarations
		var loopScopeVars = findVariableDeclarations([forLoop.init], scope);
		if (loopScopeVars && loopScopeVars.length > 0) {
			for (var k = 0; k < loopScopeVars.length; k++) {
				loopScopeBody.push({type:'VariableDeclaration',kind:'var',declarations:[loopScopeVars[k]]});
			}
		}
		if (forLoop.init && !forLoop.init.used) {
			loopScopeBody.push({ type: 'ExpressionStatement', expression: forLoop.init });
		}
		//make a call to loop function
		var loopFuncName = newname('loop_');
		var statement = { type: 'ExpressionStatement', expression: { type: 'CallExpression', arguments:[], callee:{type:'Identifier', name:loopFuncName} } };
		loopScopeBody.push(statement);
		processFunctionBody(loopScopeBody, loopScope.expression.callee.body.body, 0, outerLoop, scope);
		//create loop function
		var loopFunc = { type: 'FunctionDeclaration', id: { type: 'Identifier', name: loopFuncName }, params: [], body: { type: 'BlockStatement', body: [] } };
		loopScope.expression.callee.body.body.push(loopFunc);
		//generate after function name
		var afterFuncName = newname('after_');
		//generate increment function name
		var incFuncName = newname('inc_');
		//form loop body to be processed
		//create a IF statement
		var conditionA = { type: 'IfStatement', test: forLoop.test };
		conditionA.alternate = { type: 'BlockStatement', body: [{ type: 'ExpressionStatement', expression: { type: 'CallExpression', arguments: [], callee: { type: 'Identifier', name: afterFuncName } } }] };
		conditionA.consequent = { type: 'BlockStatement', body: [] };
		conditionA.consequent.body = conditionA.consequent.body.concat(forLoop.body.body);
		//make a call to increment
		conditionA.consequent.body.push({ type: 'ExpressionStatement', expression: { type: 'CallExpression', arguments: [], callee: { type: 'Identifier', name: incFuncName } } });
		//make a recursive call
		conditionA.consequent.body.push({ type: 'ExpressionStatement', expression: { type: 'CallExpression', arguments: [{ type: 'Identifier', name: loopFuncName }], callee: { type: 'Identifier', name: 'setTimeout' } } });
		//process loop function body
		var s = appendscope(scope);
		processFunctionBody([conditionA], loopFunc.body.body, 0, { incFuncName: incFuncName, loopFuncName: loopFuncName }, scope);
		delete s.scope;
		//create increment function
		var incFunc = { type: 'FunctionDeclaration', id: { type: 'Identifier', name: incFuncName }, params: [], body: { type: 'BlockStatement', body: [] } };
		loopScope.expression.callee.body.body.push(incFunc);
		//process increment function
		processFunctionBody([{ type: 'ExpressionStatement', expression: forLoop.update }], incFunc.body.body, 0, outerLoop, scope);
		//create afterLoop function
		var afterFunc = { type: 'FunctionDeclaration', id: { type: 'Identifier', name: afterFuncName }, params: [], body: { type: 'BlockStatement', body: [] } };
		loopScope.expression.callee.body.body.push(afterFunc);
		//process after function
		processFunctionBody(funcBody, afterFunc.body.body, i + 1, outerLoop, scope);
	}
	function isClientAsyncCall(obj, scope) {
		var name;
		if (obj.type == 'ExpressionStatement') {
			if (obj.expression.type == 'CallExpression') {
				if (obj.expression.callee.type == 'Identifier') {
					name = obj.expression.callee.name;
				}
			}
		}
		else if (obj.type == 'VariableDeclarator') {
			if (obj.init && obj.init.type == 'CallExpression') {
				if (obj.init.callee.type == 'Identifier') {
					name = obj.init.callee.name;
					
				}
			}
		}
		if (name) {
			var s = scope;
			while (s) {
				if (s.asyncFuncs) {
					for (var i = 0; i < s.asyncFuncs.length; i++) {
						if (s.asyncFuncs[i] == name) {
							return true;
						}
					}
				}
				if (s.func && s.func.params) {
					for (var i = 0; i < s.func.params.length; i++) {
						if (name == s.func.params[i].name) {
							return true;
						}
					}
				}
				s = s.scope;
			}
		}
	}
	function isAnonymousFunction(expression) {
		if (expression.type == 'AssignmentExpression') {
			if (expression.right.type == 'FunctionExpression') {
				return expression.right;
			}
			else if (expression.right.type == 'AssignmentExpression') {
				return isAnonymousFunction(expression.right);
			}
		}
		return null;
	}
	function isHtmlElement(scope, obj) {
		if (obj.type == 'MemberExpression') {
			if (obj.property.type == 'Identifier'){
				if (obj.property.name == 'getElementById') {
					if (obj.object.type == 'Identifier' && obj.object.name == 'document') {
						return scope;
					}
				}
			}
		}
		else if(obj.type=='Identifier'){
			var scopes = [scope];
			var s = scope;
			while (s.scope) {
				scopes.push(s.scope);
				s = s.scope;
			}
			for (var i = scopes.length - 1; i >= 0; i--) {
				if (scopes[i].variables) {
					var v = scopes[i].variables[obj.name];
					if (v && v.isHtmlElement) {
						return scopes[i];
					}
				}
			}
		}
		return null;
	}
	function isGettingHtmlElement(scope, exp) {
		if (exp.type == 'CallExpression') {
			if (isHtmlElement(scope, exp.callee)) {
				return exp.arguments[0];
			}
		}
		return null;
	}
	function isInputFileList(scope, obj) {
		if (obj.type == 'MemberExpression') {
			if (obj.property.type == 'Identifier' && obj.property.name == 'files') {
				if (isHtmlElement(scope, obj.object)) {
					return true;
				}
				else if (isGettingHtmlElement(scope, obj.object)) {
					return true;
				}
			}
		}
		return null;
	}
	function isUploadedFiles(scope, varname) {
		var scopes = [scope];
		var s = scope;
		while (s.scope) {
			scopes.push(s.scope);
			s = s.scope;
		}
		for (var i = scopes.length - 1; i >= 0; i--) {
			if (scopes[i].variables) {
				var v = scopes[i].variables[varname];
				if (v && v.isUploadedFileList) {
					return scopes[i];
				}
			}
		}
		return null;
	}
	//check if obj is {function parameter}.dataTransfer.files
	function isFileListObject(scope, obj) {
		if (obj.type == 'MemberExpression') {
			if (obj.property.type=='Identifier' ){
				if (obj.property.name == 'files') {
					var s = isDataTransferObject(scope, obj.object);
					if (s) {
						s.fileEvent = s.dtEvent;
						return s;
					}
				}
			}
		}
		return null;
	}
	//check if variable name is for a FileList
	function isFileListVariableName(scope, varname) {
		var scopes = [scope];
		var s = scope;
		while (s.scope) {
			scopes.push(s.scope);
			s = s.scope;
		}
		for (var i = scopes.length - 1; i >= 0; i--) {
			if (scopes[i].variables) {
				var v = scopes[i].variables[varname];
				if (v && v.isFileList) {
					return scopes[i];
				}
			}
		}
		return null;
	}
	function isDataTransferVariableName(scope, varname) {
		var scopes = [scope];
		var s = scope;
		while (s.scope) {
			scopes.push(s.scope);
			s = s.scope;
		}
		for (var i = scopes.length - 1; i >= 0; i--) {
			if (scopes[i].variables) {
				var v = scopes[i].variables[varname];
				if (v && v.isDataTransfer) {
					return scopes[i];
				}
			}
		}
		return null;
	}
	//check if obj is a variable referencing a FileList
	function isFileListVariable(scope, obj) {
		if (obj.type == 'Identifier') {
			var s = isFileListVariableName(scope, obj.name);
			if (s) {
				return s;
			}
		}
		return null;
	}
	function isDataTransferVariable(scope, obj) {
		if (obj.type == 'Identifier') {
			var s = isDataTransferVariableName(scope, obj.name);
			if (s) {
				return s;
			}
		}
		return null;
	}
	function isDataTransferObject(scope, obj) {
		if (obj.type == 'MemberExpression') {
			if (obj.property.type == 'Identifier' && obj.property.name == 'dataTransfer') {
				if (obj.object.type == 'Identifier') {
					var s = isFunctionParam(obj.object.name, scope);
					if (s) {
						s.dtEvent = obj.object.name;
						return s;
					}
				}
			}
		}
		return null;
	}
	function isFileUploadExpression(scope, exp) {
		if (exp.type == 'CallExpression') {
			if (exp.arguments && exp.arguments.length == 1) {
				if (exp.callee && exp.callee.property && exp.callee.property.type=='Identifier' && exp.callee.property.name == 'Upload') {
					if (exp.callee.object) {
						if (isFileListReference(scope, exp.callee.object))
							return true;
					}
				}
			}
		}
		return false;
	}
	function isFunctionParam(name, scope) {
		var scopes = [scope];
		var s = scope;
		while (s.scope) {
			scopes.push(s.scope);
			s = s.scope;
		}
		for (var i = scopes.length - 1; i >= 0; i--) {
			if (scopes[i].variables) {
				var v = scopes[i].variables[name];
				if (v) {
					if (v.isParam) {
						return scopes[i];
					}
					else {
						return null;
					}
				}
			}
		}
		return null;
	}
	function isFunctionParamOrigin(name, scope) {
		var scopes = [scope];
		var s = scope;
		while (s.scope) {
			scopes.push(s.scope);
			s = s.scope;
		}
		for (var i = scopes.length - 1; i >= 0; i--) {
			if (scopes[i].variables) {
				var v = scopes[i].variables[name];
				if (v) {
					if (v.isParamOrigin) {
						return scopes[i];
					}
					else {
						return null;
					}
				}
			}
		}
		return null;
	}
	function isFileListReference(scope, obj) {
		var s = isFileListObject(scope, obj);
		if (s)
			return s;
		s = isFileListVariable(scope, obj);
		if (s)
			return s;
		if (obj.type == 'MemberExpression') {
			if (obj.property.type == 'Identifier' && obj.property.name == 'files') {
				s = isDataTransferReference(scope, obj.object);
				if (s)
					return s;
			}
		}
		if (isInputFileList(scope, obj)) {
			return scope;
		}
		return null;
	}
	function isDataTransferReference(scope, obj) {
		var s = isDataTransferObject(scope, obj);
		if (s)
			return s;
		s = isDataTransferVariable(scope, obj);
		if (s)
			return s;
		return null;
	}
	//check if a variable declarator is initialized with a FileList
	function checkIsFileList(scope, decl) {
		if (decl.init) {
			if (isFileListReference(scope, decl.init))
				return true;
		}
		return false;
	}
	function checkIsDataTransfer(scope, decl) {
		if (decl.init) {
			if (isDataTransferReference(scope, decl.init))
				return true;
		}
		return false;
	}
	function checkIsParam(scope, decl) {
		if (decl.init) {
			if (decl.init.type == 'Identifier') {
				if (isFunctionParam(decl.init.name, scope))
					return true;
				else {

				}
			}
		}
		return false;
	}
	function getFileListEventParam(scope) {
		var scopes = [scope];
		var s = scope;
		while (s.scope) {
			scopes.push(s.scope);
			s = s.scope;
		}
		for (var i = scopes.length - 1; i >= 0; i--) {
			if (scopes[i].fileEvent) {
				if (scopes[i].variables) {
					for (var n in scopes[i].variables) {
						if (scopes[i].variables[n].isParamOrigin) {
							return n;
						}
					}
					for (var j = 0; j < scopes[i].variables.length; j++) {
						if (scopes[i].variables[j].isParamOrigin) {
						}
					}
				}
				return scopes[i].fileEvent;
			}
			else if (scopes[i].dtEvent) {
				if (scopes[i].variables) {
					for (var n in scopes[i].variables) {
						if (scopes[i].variables[n].isParamOrigin) {
							return n;
						}
					}
					for (var j = 0; j < scopes[i].variables.length; j++) {
						if (scopes[i].variables[j].isParamOrigin) {
						}
					}
				}
				return scopes[i].dtEvent;
			}
		}
		return null;
	}
	function registerVarToScope(v, scope0) {
		if (v.declarations && v.declarations.length > 0) {
			var scope = getlowestscope(scope0);
			if (typeof (scope.variables) == 'undefined') {
				scope.variables = {};
			}
			for (var i = 0; i < v.declarations.length; i++) {
				var d = v.declarations[i];
				if (d.id && d.id.name) {
					if (typeof (scope.variables[d.id.name]) == 'undefined') {
						var va = { decl: d };
						var a;
						if (d.init) {
							a = isGettingHtmlElement(scope, d.init);
							if (a) {
								va.isHtmlElement = a; //it is the argument of getElementById
							}
						}
						a = checkIsFileList(scope0, d);
						if (a) {
							va.isFileList = a;
						}
						a = checkIsDataTransfer(scope0, d);
						if (a) {
							va.isDataTransfer = a;
						}
						a = checkIsParam(scope, d);
						if (a) {
							va.isParam = a;
						}
						scope.variables[d.id.name] = va;
					}
				}
			}
		}
	}
	function registerFunctionParams(func, scope) {
		if (func.params && func.params.length > 0) {
			if (typeof (scope.variables) == 'undefined') {
				scope.variables = {};
			}
			for (var i = 0; i < func.params.length; i++) {
				if (func.params[i].name) {
					if (typeof (scope.variables[func.params[i].name]) == 'undefined') {
						scope.variables[func.params[i].name] = { isParam: true, isParamOrigin: true };
					}
				}
			}
		}
	}
	function isVariableReferenced(scope, obj, tgt) {
		if (tgt.isReferenced || obj == null || obj.type == 'Literal') return;
		var r = gothroughcode(obj, isVariableReferencedCall, scope);
		return r.ret;
		function isVariableReferencedCall(obj, scope) {
			if (tgt.isReferenced)
				return { processed: true };
			if (obj == null || obj.type == 'Literal')
				return { processed: true };
			switch (obj.type) {
				case 'Literal': return { processed: true };
				case 'Identifier':
					if (obj.name == tgt.name) {
						tgt.isReferenced = true;
						return { finish: true };
					}
					return { processed: true };
					break;
			}
			return {};
		}
	}
	//when this function is called the scope for the servercode already removed
	function addServerObjCreations(scope, connect) {
		var servercode = connect.servercode
		//collect all server variables declared and initialized in all levels of scopes
		var s = scope;
		var srvObjs = [];
		while (s) {
			if (s.serverVariables) {
				for (var n in s.serverVariables) {
					if (s.serverVariables[n] && s.serverVariables[n].init) {
						if (s.serverVariables[n].init.type == 'NewExpression') {
							srvObjs.push({name:n,init:s.serverVariables[n].init});
						}
					}
				}
			}
			s = s.scope;
		}
		//mark referenced server objects
		for (var i = 0; i < srvObjs.length; i++) {
			isVariableReferenced(scope, servercode, srvObjs[i]);
		}
		//add server object creation at the beginning of the server code
		for (var i = 0; i < srvObjs.length; i++) {
			if (srvObjs[i].isReferenced) {
				var v = { type: 'VariableDeclaration', kind: 'var', declarations: [{ type: 'VariableDeclarator', kind: 'var', id: { type: 'Identifier', name: srvObjs[i].name }, init: srvObjs[i].init }] };
				servercode.body.unshift(v);
				//add server type and server file to connect.callServer
				function addSrvLib(filename, servertype) {
					var found;
					for (var k = 0; k < connect.callServer.expression.arguments[0].properties[0].value.elements.length; k++) {
						if (connect.callServer.expression.arguments[0].properties[0].value.elements[k].value == servertype) {
							found = true;
							break;
						}
					}
					if (!found) {
						connect.callServer.expression.arguments[0].properties[0].value.elements.unshift({
							type: 'Literal', raw: '"' + servertype + '"', value: servertype
						});
					}
					found = false;
					for (var k = 0; k < connect.callServer.expression.arguments[0].properties[1].value.elements.length; k++) {
						if (connect.callServer.expression.arguments[0].properties[1].value.elements[k].value == filename) {
							found = true;
							break;
						}
					}
					if (!found) {
						connect.callServer.expression.arguments[0].properties[1].value.elements.unshift({
							type: 'Literal', raw: '"' + filename + '"', value: filename
						});
					}
				}
				searchLibFiles(srvObjs[i].init, addSrvLib, scope);
			}
		}
	}
	function processFunctionBody(funcBody, fdbody, i, outerLoop, scope) {
		for (; i < funcBody.length; i++) {
			switch (funcBody[i].type) {
				case 'IfStatement':
					var cb = { type: 'IfStatement' };
					var situation = determineBranchType(funcBody[i], scope);
					if (situation == CODEBRANCH_1) {
						//a server to client execution switching point is identified
						//code branching is placed at client
						findDownloadAndStateValues(funcBody, fdbody, i, scope);
						var s = getlowestscope(scope);
						finishContextSwitchingPair(s.servercode.body, scope);
						var s2 = appendscope(scope);
						scope.currentContext = CLIENT_CONTEXT;
						processFunctionBody(funcBody, s.callback.body.body, i, outerLoop, scope);
						delete s2.scope;
						return;
					}
					else if (situation == CODEBRANCH_2) {
						//code branching is duplicated at both server side and client side
						var s = getlowestscope(scope);
						duplicateBranches(funcBody[i], s.callback.body.body, cb, fdbody, outerLoop, scope);
					}
					else if (situation == CODEBRANCH_3) {
						//process each branch seperately
						cb.test = funcBody[i].test;
						if (funcBody[i].consequent) {
							cb.consequent = {};
							cb.consequent.type = funcBody[i].consequent.type;
							var s = appendscope(scope);
							processCodeBranch(funcBody[i].consequent, cb.consequent, outerLoop, scope);
							delete s.scope;
						}
						if (funcBody[i].alternate) {
							cb.alternate = {};
							cb.alternate.type = funcBody[i].alternate.type;
							var s = appendscope(scope);
							processCodeBranch(funcBody[i].alternate, cb.alternate, outerLoop, scope);
							delete s.scope;
						}
						fdbody.push(cb);
					}
					else if (situation == CODEBRANCH_4) {
						if (inCallback(scope)) {
							//in a callback, treat it as situation 3
							cb.test = createClientBranchingCondition(funcBody[i].test, null, false, scope);
							if (funcBody[i].consequent) {
								cb.consequent = {};
								cb.consequent.type = funcBody[i].consequent.type;
								var s = appendscope(scope);
								processCodeBranch(funcBody[i].consequent, cb.consequent, outerLoop, scope);
								delete s.scope;
							}
							if (funcBody[i].alternate) {
								cb.alternate = {};
								cb.alternate.type = funcBody[i].alternate.type;
								var s = appendscope(scope);
								processCodeBranch(funcBody[i].alternate, cb.alternate, outerLoop, scope);
								delete s.scope;
							}
							fdbody.push(cb);
						}
						else {
							//not in a callback, a client to server execution context is identified
							var connect = generateServerCall(scope);
							fdbody.push(connect.callback);
							fdbody.push(connect.callServer);
							var s = appendscope(scope);
							s.scope.servercall = connect.callServer;
							s.scope.callback = connect.callback;
							s.scope.servercallIndex = connect.servercodeIndex;
							s.scope.servercode = connect.servercode;
							scope.currentContext = SERVER_CONTEXT;
							processFunctionBody(funcBody, connect.servercode.body, i, outerLoop, scope);
							delete s.scope;
							addServerObjCreations(scope, connect);
						}
					}
					else if (situation == CODEBRANCH_5) {
						//treat it as an expression
						fdbody.push(funcBody[i]);
					}
					else if (situation == CODEBRANCH_6) {
						//client operations are not involved
						fdbody.push(funcBody[i]);
					}
					else {
						throw 'Unsupported code branching';
					}
					break;
				case 'VariableDeclaration':
					if (scope.currentContext == CLIENT_CONTEXT) {
						registerVarToScope(funcBody[i], scope);
						//checking for client to server execution context switching point
						var vd = { type: 'VariableDeclaration' };
						vd.kind = funcBody[i].kind;
						vd.range = funcBody[i].range;
						vd.declarations = [];
						var servervs = [];
						var async;
						for (var k = 0; k < funcBody[i].declarations.length; k++) {
							var isServer = false;
							if (funcBody[i].declarations[k].type == 'VariableDeclarator') {
								if (involveServerValue(funcBody[i].declarations[k].init, scope)) {
									servervs.push(funcBody[i].declarations[k]);
									isServer = true;
								}
							}
							if (!isServer) {
								if (async) {
									vd.declarations.push(funcBody[i].declarations[k]);
								}
								else if (isClientAsyncCall(funcBody[i].declarations[k], scope)) {
									async = funcBody[i].declarations[k];
								}
								else {
									vd.declarations.push(funcBody[i].declarations[k]);
								}
							}
						}
						if (async) {
							//a potantial asynch call
							//declare the variable without init
							var vd0 = {
								type: 'VariableDeclaration',
								kind: 'var',
								declarations: [{
									type: 'VariableDeclarator',
									id: async.id
								}]
							};
							fdbody.push(vd0);
							//make an "after function"
							var afterFuncName = newname('after_');
							var afterFunc = { type: 'FunctionDeclaration', id: { type: 'Identifier', name: afterFuncName }, params: [], body: { type: 'BlockStatement', body: [] } };
							fdbody.push(afterFunc);
							//check clientToServer flag
							var chk = {
								type: 'IfStatement',
								test: {
									type: 'MemberExpression',
									property: { type: 'Identifier', name: 'clientToServer' },
									object: { type: 'Identifier', name: async.init.callee.name }
								},
								alternate: {
									type: 'BlockStatement',
									body: [{
										type: 'ExpressionStatement',
										expression: {
											type: 'AssignmentExpression',
											operator: '=',
											left: async.id,
											right: async.init
										}
									}, {
										type: 'ExpressionStatement',
										expression: {
											type: 'CallExpression',
											arguments: [],
											callee: { type: 'Identifier', name: afterFuncName }
										}
									}]
								},
								consequent: { type: 'BlockStatement', body: [] }
							};
							chk.consequent.body.push({
								type: 'ExpressionStatement',
								expression: {
									type: 'AssignmentExpression',
									operator: '=',
									left: {
										type: 'MemberExpression',
										property: { type: 'Identifier', name: 'next' },
										object: { type: 'Identifier', name: async.init.callee.name }
									},
									right: {
										type: 'FunctionExpression',
										id: null,
										defaults: [],
										expression: false,
										generator: false,
										rest: null,
										params: [],
										body: {
											type: 'BlockStatement', body: [{
												type: 'ExpressionStatement',
												expression: {
													type: 'AssignmentExpression',
													operator: '=',
													left: async.id,
													right: {
														type: 'MemberExpression',
														property: { type: 'Identifier', name: 'ret' },
														object: { type: 'Identifier', name: async.init.callee.name }
													}
												}
											}, {
												type: 'ExpressionStatement',
												expression: {
													type: 'CallExpression',
													arguments: [],
													callee: { type: 'Identifier', name: afterFuncName }
												}
											}]
										}
									}
								}
							});
							chk.consequent.body.push({
								type: 'ExpressionStatement',
								expression: {
									type: 'CallExpression',
									arguments: async.init.arguments,
									callee: async.init.callee
								}
							});
							fdbody.push(chk);
							//process "after function"
							var s = appendscope(scope);
							processFunctionBody(funcBody, afterFunc.body.body, ++i, outerLoop, scope);
							delete s.scope;
							return;
						}
						else {
							if (vd.declarations.length > 0) {
								if (isClientAsyncCall(vd, scope)) {
								}
								else {
									fdbody.push(vd);
								}
							}
							if (servervs.length > 0) {
								//a client to server execution context switching point is found, make it one end of code path.
								var connect = generateServerCall(scope);
								fdbody.push(connect.callback);
								fdbody.push(connect.callServer);
								var s = appendscope(scope);
								s.scope.servercall = connect.callServer;
								s.scope.callback = connect.callback;
								s.scope.servercallIndex = connect.servercodeIndex;
								s.scope.servercode = connect.servercode;
								s.scope.serverVariables = {};
								connect.servercode.body = [{
									type: 'VariableDeclaration',
									kind: 'var',
									declarations: servervs
								}];
								for (var k = 0; k < servervs.length; k++) {
									s.scope.serverVariables[servervs[k].id.name] = { init: servervs[k].init };//.push({ name: servervs[k].id.name });
								}
								scope.currentContext = SERVER_CONTEXT;
								processFunctionBody(funcBody, connect.servercode.body, ++i, outerLoop, scope);
								delete s.scope;
								addServerObjCreations(scope, connect);
								return;
							}
						}
					}
					else {
						//checking for server to client execution context switching point
						var s = getlowestscope(scope);
						var vd = { type: 'VariableDeclaration' };
						vd.kind = funcBody[i].kind;
						vd.range = funcBody[i].range;
						vd.declarations = [];
						var clientvs = [];
						for (var k = 0; k < funcBody[i].declarations.length; k++) {
							if (funcBody[i].declarations[k].type == 'VariableDeclarator') {
								if (isServerFunction(funcBody[i].declarations[k].init, scope)) {
									vd.declarations.push(funcBody[i].declarations[k]);
									if (!s.serverVariables) {
										s.serverVariables = {};
									}
									s.serverVariables[funcBody[i].declarations[k].id.name] = { init: funcBody[i].declarations[k].init };
								}
								else {
									clientvs.push(funcBody[i].declarations[k]);
								}
							}
							else {
								vd.declarations.push(funcBody[i].declarations[k]);
							}
						}
						if (vd.declarations.length > 0) {
							fdbody.push(vd);
						}
						if (clientvs.length > 0) {
							//a server to client execution context switching point is found
							findDownloadAndStateValues(funcBody, fdbody, i, scope);
							var s = getlowestscope(scope);
							finishContextSwitchingPair(s.servercode.body, scope);
							var s2 = appendscope(scope);
							scope.currentContext = CLIENT_CONTEXT;
							processFunctionBody(funcBody, s.callback.body.body, i, outerLoop, scope);
							delete s2.scope;
							return;
						}
					}
					break;
				case 'ExpressionStatement':
					if (isServerFunction(funcBody[i].expression, scope)) {
						if (scope.currentContext == CLIENT_CONTEXT) {
							//detect a client to server execution context switching point
							var isfileupload;
							//var filelistname;
							var serverFolder;
							isfileupload = isFileUploadExpression(scope, funcBody[i].expression);
							if (isfileupload) {
								serverFolder = funcBody[i].expression;
							}
							var connect = generateServerCall(scope, serverFolder);
							if (connect.fsDecl) {
								fdbody.push(connect.fsDecl);
							}
							fdbody.push(connect.callback);
							fdbody.push(connect.callServer);
							var s = appendscope(scope);
							s.scope.servercall = connect.callServer;
							s.scope.callback = connect.callback;
							s.scope.servercallIndex = connect.servercodeIndex;
							s.scope.servercode = connect.servercode;
							if (serverFolder) {
								s.scope.fileUpload = serverFolder;
							}
							scope.currentContext = SERVER_CONTEXT;
							processFunctionBody(funcBody, connect.servercode.body, i, outerLoop, scope);
							delete s.scope;
							if (connect.fsRef) {
								replaceFileListObject(scope, connect.callback.body, connect.fsRef);
							}
							if (isfileupload) {
								//replace FileList with _FILES_
								scope.forServer = true;
								var srvFile = { type: 'Identifier', name: '_FILES_' };
								replaceFileListObject(scope, connect.servercode, srvFile);
								delete scope.forServer;
							}
							addServerObjCreations(scope, connect);
							return;
						}
						else {
							fdbody.push(funcBody[i]);
						}
					}
					else {
						//if it is an anonymous function assignment then the function needs to be processed
						var exp = isAnonymousFunction(funcBody[i].expression);
						if (exp) {
							var s = appendscope(scope); //s.scope is the newly added scope property
							registerFunctionParams(exp, s.scope);
							var targetBody = [];
							processFunctionBody(exp.body.body, targetBody, 0, outerLoop, scope);
							delete s.scope;//remove the scope property on finishing processing code in the scope
							exp.body.body = targetBody;
							fdbody.push(funcBody[i]);
						}
						else if (scope.currentContext == CLIENT_CONTEXT) {
							fdbody.push(funcBody[i]);
						}
						else {
							//detect a server to client execution context switching point
							findDownloadAndStateValues(funcBody, fdbody, i, scope);
							var s = getlowestscope(scope);
							if (s.servercode) {
								finishContextSwitchingPair(s.servercode.body, scope);
							}
							var s2 = appendscope(scope);
							scope.currentContext = CLIENT_CONTEXT;
							if (s.callback && s.callback.body) {
								processFunctionBody(funcBody, s.callback.body.body, i, outerLoop, scope);
							}
							delete s2.scope;
							return;
						}
					}
					break;
				case 'ForStatement':
					if (scope.currentContext == CLIENT_CONTEXT) {
						if (involveServerValue(funcBody[i], scope)) {
							generateForLoop(funcBody, fdbody, i, outerLoop, scope);
							return;
						}
						else {
							fdbody.push(funcBody[i]);
						}
					}
					else {
						fdbody.push(funcBody[i]);
					}
					break;
				case 'ForInStatement':
					if (isServerFunction(funcBody[i].right, scope)) {
						//server object enumeration
						generateForInLoopServer(funcBody, fdbody, i, outerLoop, scope);
						return;
					}
					else if (involveServerValue(funcBody[i], scope)) {
						generateForInLoopClient(funcBody, fdbody, i, outerLoop, scope);
						return;
					}
					else {
						fdbody.push(funcBody[i]);
					}
					break;
				case 'ClientToServerContextSwitch':
					var connect = generateServerCall(scope);
					fdbody.push(connect.callback);
					fdbody.push(connect.callServer);
					var s = appendscope(scope);
					s.scope.servercall = connect.callServer;
					s.scope.callback = connect.callback;
					s.scope.servercallIndex = connect.servercodeIndex;
					s.scope.servercode = connect.servercode;
					scope.currentContext = SERVER_CONTEXT;
					processFunctionBody(funcBody, connect.servercode.body, ++i, outerLoop, scope);
					delete s.scope;
					addServerObjCreations(scope, connect);
					return;
					break;
				case 'FunctionDeclaration':
					processFuncDecl(funcBody[i], fdbody, outerLoop, scope);
					break;
				default:
					fdbody.push(funcBody[i]);
					break;
			}
		}
	}
	
	function processCodeBranch(source, target, outerLoop, scope) {
		if (source.type == 'BlockStatement') {
			target.body = [];
			processFunctionBody(source.body, target.body, 0, outerLoop, scope);
		}
	}
	function createAsynReturn(name, arg) {
		var ret = { type: 'BlockStatement', body: [] };
		if (arg) {
			ret.body.push({
				type: 'ExpressionStatement',
				expression: {
					type: 'AssignmentExpression',
					operator: '=',
					left: {
						type: 'MemberExpression',
						property: { type: 'Identifier', name: 'ret' },
						object: { type: 'Identifier', name: name }
					},
					right: {
						type: 'MemberExpression', property: { type: 'Identifier', name: arg.name }, object: {
							type: 'MemberExpression', property: { type: 'Identifier', name: 'values' }, object: {type:'Identifier',name:'CSA'}
						}
					}
				}
			});
		}
		ret.body.push({
			type: 'IfStatement',
			test: { type: 'MemberExpression', property: { type: 'Identifier', name: 'next' }, object: { type: 'Identifier', name: name } },
			alternate: null,
			consequent: {
				type: 'BlockStatement', body: [{
					type: 'ExpressionStatement', expression: {
						type: 'CallExpression',
						arguments: [],
						callee: {
							type: 'MemberExpression',
							property: { type: 'Identifier', name: 'next' },
							object: { type: 'Identifier', name: name }
						}
					}
				}]
			}
		});
		ret.body.push({ type: 'ReturnStatement', argument: null });
		return ret;
	}
	function adjustAsynReturn(fdbody,name,append, scope) {
		for (var i = 0; i < fdbody.length; i++) {
			if (fdbody[i].type == 'ReturnStatement') {
				fdbody[i] = createAsynReturn(name,fdbody[i].argument);
				return;
			}
			else if (fdbody[i].type == 'IfStatement') {
				if (fdbody[i].consequent) {
					adjustAsynReturn(fdbody[i].consequent.body, name, false, scope)
				}
				if (fdbody[i].alternate) {
					adjustAsynReturn(fdbody[i].alternate.body, name,false, scope)
				}
			}
			else if (fdbody[i].type == 'ForStatement') {
				adjustAsynReturn(fdbody[i].body, name,false, scope);
			}
			else if (fdbody[i].type == 'ForInStatement') {
				adjustAsynReturn(fdbody[i].body, name, false, scope);
			}
			else if (fdbody[i].type == 'WhileStatement' || fdbody[i].type == 'DoWhileStatement') {
				adjustAsynReturn(fdbody[i].body, name, false, scope);
			}
		}
		//missing return, add one
		if (append) {
			fdbody.push(createAsynReturn(name));
		}
	}
	function adjustAsyncFunction(fd, scope) {
		if (fd.type == 'FunctionDeclaration') {
			var target = fd.body.body;
			var s0 = appendscope(scope);
			var s = s0.scope;
			s.callbacks = [];
			for (var m = 0; m < target.length; m++) {
				if (target[m].type == 'ExpressionStatement'
					&& target[m].expression.type == 'CallExpression'
					&& target[m].expression.callee.type == 'MemberExpression'
					&& target[m].expression.callee.property.type == 'Identifier'
					&& target[m].expression.callee.property.name == 'callServer'
					&& target[m].expression.callee.object.type == 'Identifier'
					&& target[m].expression.callee.object.name == 'CSA'
					) {
					s.callbacks.push({ name: target[m].expression.arguments[3].name });
				}
			}
			for (var m = 0; m < target.length; m++) {
				if (target[m].type == 'FunctionDeclaration') {
					for (var i = 0; i < s.callbacks.length; i++) {
						if (target[m].id.name == s.callbacks[i].name) {
							s.callbacks[i].func = target[m];;
						}
					}
				}
			}
			if (s.callbacks.length == 0) {
				//no more callbacks
				if (s0.callbacks && s0.callbacks.length > 0) {
					var funcName;
					var sp = scope;
					while (sp) {
						if (sp.func) {
							funcName = sp.func.id.name;
						}
						sp = sp.scope;
					}
					for (var i = 0; i < s0.callbacks.length; i++) {
						adjustAsynReturn(s0.callbacks[i].func.body.body, funcName, true, scope);
					}
				}
			}
			else {
				for (var i = 0; i < s.callbacks.length; i++) {
					adjustAsyncFunction(s.callbacks[i].func, scope);
				}
			}
		}
		
	}
	function processFuncDecl(func, funcDecls,outerLoop, scope) {
		if (func.body.type == 'BlockStatement') {
			var fd = {};
			fd.type = func.type;
			fd.defaults = func.defaults;
			fd.expression = func.expression;
			fd.generator = func.generator;
			fd.id = func.id;
			fd.params = func.params;
			fd.range = func.range;
			fd.rest = func.rest;
			fd.body = {};
			fd.body.type = func.body.type;
			fd.body.range = func.body.range;
			fd.body.body = [];
			scope.currentContext = CLIENT_CONTEXT;
			var isAsyn = involveServerValue(func.body, scope);
			var s = appendscope(scope);
			s.scope.func = fd;
			processFunctionBody(func.body.body, fd.body.body, 0, outerLoop, scope);
			if (isAsyn) {
				adjustAsyncFunction(fd, scope);
				//add clientToServer attribute
				funcDecls.push({
					type: 'ExpressionStatement',
					expression: {
						type: 'AssignmentExpression',
						operator: '=',
						left: {
							type: 'MemberExpression',
							property: {
								type: 'Identifier',
								name: 'clientToServer'
							},
							object: {
								type: 'Identifier',
								name: fd.id.name
							}
						},
						right: {
							type: 'Literal',
							value: true,
							raw: 'true'
						}
					}
				});
			}
			funcDecls.push(fd);
			delete s.scope;
		}
	}
	
	function compareArray(obj1, obj2) {
		if (obj1 == null && obj2 != null)
			return 'obj1 == null, obj2 != null';
		if (obj1 != null && obj2 == null)
			return 'obj1 != null, obj2 == null';
		if (obj1 == null && obj2 == null)
			return '';
		if (obj1.length != obj2.length)
			return 'array length mismatch. ' + obj1.length + ' vs ' + obj2.length;
		for (var i = 0; i < obj1.length; i++) {
			var err = compareObjs(obj1[i], obj2[i]);
			if (err)
				return err;
		}
		return '';
	}
	//for checking test cases
	function compareObjs(obj1, obj2) {
		if (obj1 == null && obj2 != null)
			return 'obj1 == null, obj2 != null';
		if (obj1 != null && obj2 == null)
			return 'obj1 != null, obj2 == null';
		if (obj1 == null && obj2 == null)
			return '';
		if (obj1.type != obj2.type) {
			return 'type mismatch: ' + obj1.type + ' vs ' + obj2.type;
		}
		else {
			switch (obj1.type) {
				case 'ArrayExpression':
					if (obj1.elements.length != obj2.elements.length) {
						return 'array size different. ' + obj1.elements.length + ' vs ' + obj2.elements.length;
					}
					for (var i = 0; i < obj1.elements.length; i++) {
						var err = compareObjs(obj1.elements[i], obj2.elements[i]);
						if (err)
							return 'ArrayExpression [' + i + '] mismatch. ' + err;
					}
					break;
				case 'ArrowFunctionExpression':
					var err = compareArray(obj1.params, obj2.params);
					if (err) {
						return 'ArrowFunctionExpression parameters mismatch. ' + err;
					}
					err = compareObjs(obj1.body, obj2.body);
					if (err) {
						return 'ArrowFunctionExpression body mismatch. ' + err;
					}
					break;
				case 'AssignmentExpression':
					if (obj1.operator != obj2.operator) {
						return 'Assignment operator mismatch. ' + obj1.operator + ' vs ' + obj2.operator;
					}
					var err = compareObjs(obj1.left, obj2.left);
					if (err) {
						return 'Assignment left mismatch. ' + err;
					}
					err = compareObjs(obj1.right, obj2.right);
					if (err) {
						return 'Assignment right mismatch. ' + err;
					}
					break;
				case 'BlockStatement':
					if (obj1.body.length != obj2.body.length) {
						return 'block body length mismatch. ' + obj1.body.length + ' vs ' + obj2.body.length;
					}
					for (var i = 0; i < obj1.body.length; i++) {
						var err = compareObjs(obj1.body[i], obj2.body[i]);
						if (err) {
							return 'BlockStatement body['+i+'] mismatch. ' + err;
						}
					}
					break;
				case 'BinaryExpression':
					if (obj1.operator != obj2.operator) {
						return 'binary operator mismatch. ' + obj1.operator + ' vs ' + obj2.operator;
					}
					var err = compareObjs(obj1.left, obj2.left);
					if (err)
						return 'BinaryExpression left mismatch. ' + err;
					err = compareObjs(obj1.right, obj2.right);
					if (err)
						return 'BinaryExpression right mismatch. ' + err;
					break;
				case 'BreakStatement':
					if (obj1.label != obj2.label) {
						return 'BreakStatement label mismatch. ' + obj1.label + ' vs ' + obj2.label;
					}
					break;

				case 'CallExpression':
					if (obj1.arguments.length != obj2.arguments.length) {
						return 'CallExpression arguments length mismatch. ' + obj1.arguments.length + ' vs ' + obj2.arguments.length;
					}
					for (var i = 0; i < obj1.arguments.length; i++) {
						var err = compareObjs(obj1.arguments[i], obj2.arguments[i]);
						if (err) {
							return 'CallExpression arguments[' + i + '] mismatch. ' + err;
						}
					}
					var err = compareObjs(obj1.callee, obj2.callee);
					if (err) {
						return 'CallExpression callee mismatch. ' + err;
					}
					break;
				case 'CatchClause':
					var err = compareObjs(obj1.param, obj2.param);
					if (err) {
						return 'CatchClause param mismatch. ' + err;
					}
					err = compareObjs(obj1.body, obj2.body);
					if (err) {
						return 'CatchClause body mismatch. ' + err;
					}
					break;
				case 'ConditionalExpression':
					err = compareObjs(obj1.test, obj2.test);
					if (err) {
						return 'ConditionalExpression test mismatch. ' + err;
					}
					err = compareObjs(obj1.consequent, obj2.consequent);
					if (err) {
						return 'ConditionalExpression consequent mismatch. ' + err;
					}
					err = compareObjs(obj1.alternate, obj2.alternate);
					if (err) {
						return 'ConditionalExpression alternate mismatch. ' + err;
					}
					break;
				case 'ContinueStatement':
					if (obj1.label != obj2.label) {
						return 'ContinueStatement label mismatch. ' + obj1.label + ' vs ' + obj2.label;
					}
					break;
				case 'DoWhileStatement':
					var err = compareObjs(obj1.test, obj2.test);
					if (err)
						return 'DoWhileStatement test mismatch. ' + err;
					err = compareObjs(obj1.body, obj2.body);
					if (err)
						return 'DoWhileStatement body mismatch. ' + err;
					break;
				case 'DebuggerStatement':
					break;
				case 'EmptyStatement':
					break;
				case 'ExpressionStatement':
					var err = compareObjs(obj1.expression, obj2.expression);
					if (err)
						return 'ExpressionStatement expression mismatch. ' + err;
					break;
				case 'ForInStatement':
					if (obj1.each != obj2.each) {
						return 'ForInStatement each mismatch. ' + obj1.each + ' vs ' + obj2.each;
					}
					var err = compareObjs(obj1.body, obj2.body);
					if (err)
						return 'ForInStatement body mismatch. ' + err;
					err = compareObjs(obj1.left, obj2.left);
					if (err)
						return 'ForInStatement left mismatch. ' + err;
					err = compareObjs(obj1.right, obj2.right);
					if (err)
						return 'ForInStatement right mismatch. ' + err;
					break;
				case 'ForStatement':
					var err = compareObjs(obj1.body, obj2.body);
					if (err)
						return 'ForStatement body mismatch. ' + err;
					err = compareObjs(obj1.init, obj2.init);
					if (err)
						return 'ForStatement init mismatch. ' + err;
					err = compareObjs(obj1.test, obj2.test);
					if (err)
						return 'ForStatement test mismatch. ' + err;
					err = compareObjs(obj1.update, obj2.update);
					if (err)
						return 'ForStatement update mismatch. ' + err;
					break;

				case 'FunctionDeclaration':
					var err = compareObjs(obj1.id, obj2.id);
					if (err) {
						return 'FunctionDeclaration id mismatch. ' + obj1.id + ' vs ' + obj2.id;
					}
					if (obj1.expression != obj2.expression) {
						return 'FunctionDeclaration expression mismatch. ' + obj1.expression + ' vs ' + obj2.expression;
					}
					if (obj1.generator != obj2.generator) {
						return 'FunctionDeclaration generator mismatch. ' + obj1.generator + ' vs ' + obj2.generator;
					}
					err = compareArray(obj1.params, obj2.params);
					if (err) {
						return 'FunctionDeclaration mismatch. ' + err;
					}
					err = compareObjs(obj1.body, obj2.body);
					if (err) {
						return 'FunctionDeclaration body. ' + err;
					}
					break;
				case 'FunctionExpression':
					if (obj1.id != null) {
						if (obj2.id != null) {
							var err = compareObjs(obj1.id, obj2.id);
							if (err)
								return 'FunctionExpression id mismatch. ' + err;
						}
						else {
							return 'FunctionExpression id mismatch (1)';
						}
					}
					else if (obj2.id != null) {
						return 'FunctionExpression id mismatch (2)';
					}
					if (obj1.expression != obj2.expression) {
						return 'FunctionExpression expression mismatch';
					}
					if (obj1.generator != obj2.generator) {
						return 'FunctionExpression generator mismatch';
					}
					if (obj1.rest != null) {
						if (obj2.rest != null) {
							var err = compareObjs(obj1.rest, obj2.rest);
							if (err)
								return 'FunctionExpression rest mismatch. ' + err;
						}
						else {
							return 'FunctionExpression rest mismatch (1)';
						}
					}
					else if (obj2.rest != null) {
						return 'FunctionExpression rest mismatch (2)';
					}
					if (obj1.params.length != obj2.params.length) {
						return 'FunctionExpression params length mismatch. ' + obj1.params.length + ' vs ' + obj2.params.length;
					}
					for (var i = 0; i < obj1.params.length; i++) {
						var err = compareObjs(obj1.params[i], obj2.params[i]);
						if (err)
							return 'FunctionExpression params[' + i + '] mismatch. ' + err;
					}
					if (obj1.defaults.length != obj2.defaults.length) {
						return 'FunctionExpression defaults length mismatch. ' + obj1.defaults.length + ' vs ' + obj2.defaults.length;
					}
					for (var i = 0; i < obj1.defaults.length; i++) {
						var err = compareObjs(obj1.defaults[i], obj2.defaults[i]);
						if (err)
							return 'FunctionExpression defaults [' + i + '] mismatch. ' + err;
					}
					err = compareObjs(obj1.body, obj2.body);
					if (err) {
						return 'FunctionExpression body mismatch. ' + err;
					}
					break;
				case 'Identifier':
					if (obj1.name != obj2.name) {
						if (namemap) {
							if (typeof (namemap[obj1.name]) == 'undefined') {
								namemap[obj1.name] == obj2.name;
							}
							else {
								if (namemap[obj1.name] != obj2.name) {
									return 'name mismatch. ' + obj1.name + ' or ' + namemap[obj1.name] + ' vs ' + obj2.name;
								}
							}
						}
						else {
							return 'name mismatch. ' + obj1.name + ' vs ' + obj2.name;
						}
					}
					break;
				case 'IfStatement':
					var err = compareObjs(obj1.test, obj2.test);
					if (err)
						return 'IfStatement test mismatch. ' + err;
					if (obj1.alternate != null) {
						if (obj2.alternate != null) {
							err = compareObjs(obj1.alternate, obj2.alternate);
							if (err)
								return 'IfStatement alternate mismatch. ' + err;
						}
						else {
							return 'IfStatement alternate mismatch (1).';
						}
					}
					else {
						if (obj2.alternate != null) {
							return 'IfStatement alternate mismatch (2).';
						}
					}
					if (obj1.consequent != null) {
						if (obj2.consequent != null) {
							err = compareObjs(obj1.consequent, obj2.consequent);
							if (err)
								return 'IfStatement consequent mismatch. ' + err;
						}
						else {
							return 'IfStatement consequent mismatch (1).';
						}
					}
					else {
						if (obj2.consequent != null) {
							return 'IfStatement consequent mismatch (2).';
						}
					}
					break;

				case 'Literal':
					if (obj1.raw == obj2.raw)
						return '';
					if (obj1.value != obj2.value) {
						if (typeof (obj1.value) == 'string' && typeof (obj2.value) == 'string') {
							if (obj1.value.length > 1 && obj2.value.length > 1) {
								if (typeof (namemap[obj1.value]) == 'undefined') {
									namemap[obj1.value] == obj2.value;
									return '';
								}
								else {
									if (namemap[obj1.value] != obj2.value) {
										return 'Literal mismatch. ' + obj1.value + ' or ' + namemap[obj1.value] + ' vs ' + obj2.value;
									}
									else {
										return '';
									}
								}
							}
						}
						return 'Literal mismatch: ' + obj1.raw + ' vs ' + obj2.raw;
					}
					break;
				case 'LogicalExpression':
					if (obj1.operator != obj2.operator) {
						return 'LogicalExpression operator mismatch. ' + obj1.operator + ' vs ' + obj2.operator;
					}
					var err = compareObjs(obj1.left, obj2.left);
					if (err)
						return 'LogicalExpression left mismatch. ' + err;
					err = compareObjs(obj1.right, obj2.right);
					if (err)
						return 'LogicalExpression right mismatch. ' + err;
					break;

				case 'MemberExpression':
					var err = compareObjs(obj1.property, obj2.property);
					if (err) {
						return 'MemberExpression property mismatch. ' + err;
					}
					err = compareObjs(obj1.object, obj2.object);
					if (err) {
						return 'MemberExpression object mismatch. ' + err;
					}
					break;
				case 'NewExpression':
					if (obj1.arguments.length != obj2.arguments.length) {
						return 'NewExpression arguments length mismatch. ' + obj1.arguments.length + ' vs ' + obj2.arguments.length;
					}
					for (var i = 0; i < obj1.arguments.length; i++) {
						var err = compareObjs(obj1.arguments[i], obj2.arguments[i]);
						if (err)
							return 'NewExpression arguments['+i+'] mismatch. ' + err;
					}
					var err = compareObjs(obj1.callee, obj2.callee);
					if (err) {
						return 'NewExpression callee mismatch. ' + err;
					}
					break;
				case 'ObjectExpression':
					if (obj1.properties.length != obj2.properties.length) {
						return 'ObjectExpression properties length mismatch.' + obj1.properties.length + ' vs ' + obj2.properties.length;
					}
					else {
						for (var i = 0; i < obj1.properties.length; i++) {
							var err = compareObjs(obj1.properties[i], obj2.properties[i]);
							if (err)
								return 'ObjectExpression properties['+i+'] mismatch. ' + err;
						}
					}
					break;

				case 'Program':
					if (obj1.body.length != obj1.body.length) {
						return 'Program body length mismatch';
					}
					else {
						for (var i = 0; i < obj1.body.length; i++) {
							var err = compareObjs(obj1.body[i], obj2.body[i]);
							if (err) {
								return 'Program body [' + i + '] mismatch. ' + err;
							}
						}
					}
					break;
				case 'Property':
					if (obj1.kind != obj2.kind) {
						return 'Property kind mismatch. ' + obj1.kind + ' vs ' + obj2.kind;
					}
					if (obj1.method != obj2.method) {
						return 'Property method mismatch. ' + obj1.method + ' vs ' + obj2.method;
					}
					var err = compareObjs(obj1.key, obj2.key);
					if (err)
						return 'Property key mismatch. ' + err;
					err = compareObjs(obj1.value, obj2.value);
					if (err)
						return 'Property value mismatch. ' + err;
					break;

				case 'ReturnStatement':
					if (obj1.argument != null) {
						if (obj2.argument != null) {
							var err = compareObjs(obj1.argument, obj2.argument);
							if (err)
								return 'ReturnStatement argument mismatch. ' + err;
						}
						else {
							return 'ReturnStatement argument mismatch (1).';
						}
					}
					else {
						if (obj2.argument != null) {
							return 'ReturnStatement argument mismatch (2).';
						}
					}
					break;
				case 'SequenceExpression':
					var err = compareArray(obj1.expressions, obj2.expressions);
					if (err) {
						return 'SequenceExpression mismatch. ' + err;
					}
					break;
				case 'SwitchStatement':
					var err = compareObjs(obj1.discriminant, obj2.discriminant);
					if (err) {
						return 'SwitchStatement discriminant mismatch. ' + err;
					}
					err = compareArray(obj1.cases, obj2.cases);
					if (err) {
						return 'SwitchStatement cases mismatch. ' + err;
					}
					break;
				case 'SwitchCase':
					var err = compareObjs(obj1.test, obj2.test);
					if (err) {
						return 'SwitchCase test mismatch. ' + err;
					}
					err = compareArray(obj1.consequent, obj2.consequent);
					if (err) {
						return 'SwitchCase consequent mismatch. ' + err;
					}
					break;
				case 'ThisExpression':
					break;
				case 'ThrowStatement':
					var err = compareObjs(obj1.argument, obj2.argument);
					if (err) {
						return 'ThrowStatement argument mismatch. ' + err;
					}
					break;
				case 'TryStatement':
					var err = compareObjs(obj1.block, obj2.block);
					if (err) {
						return 'TryStatement block mismatch. ' + err;
					}
					err = compareObjs(obj1.finalizer, obj2.finalizer);
					if (err) {
						return 'TryStatement finalizer mismatch. ' + err;
					}
					err = compareArray(obj1.handlers, obj2.handlers);
					if (err) {
						return 'TryStatement handlers mismatch. ' + err;
					}
					err = compareArray(obj1.guardedHandlers, obj2.guardedHandlers);
					if (err) {
						return 'TryStatement guardedHandlers mismatch. ' + err;
					}
					break;
				case 'UnaryExpression':
					if (obj1.prefix != obj2.prefix) {
						return 'UnaryExpression prefix mismatch. ' + obj1.prefix + ' vs ' + obj2.prefix;
					}
					if (obj1.operator != obj2.operator) {
						return 'UnaryExpression operator mismatch. ' + obj1.operator + ' vs ' + obj2.operator;
					}
					var err = compareObjs(obj1.argument, obj2.argument);
					if (err) {
						return 'UnaryExpression argument mismatch. ' + err;
					}
					break;
				case 'UpdateExpression':
					if (obj1.prefix != obj2.prefix) {
						return 'UpdateExpression prefix mismatch. ' + obj1.prefix + ' vs ' + obj2.prefix;
					}
					if (obj1.operator != obj2.operator) {
						return 'UpdateExpression operator mismatch. ' + obj1.operator + ' vs ' + obj2.operator;
					}
					var err = compareObjs(obj1.argument, obj2.argument);
					if (err) {
						return 'UpdateExpression argument mismatch. ' + err;
					}
					break;
				case 'VariableDeclaration':
					if (obj1.kind != obj2.kind) {
						return 'variable kind mismatch. ' + obj1.kind + ' vs ' + obj2.kind;
					}
					if (obj1.declarations.length != obj2.declarations.length) {
						return 'VariableDeclaration length mismatch. ' + obj1.declarations.length + ' vs ' + obj2.declarations.length;
					}
					for (var i = 0; i < obj1.declarations.length; i++) {
						var err = compareObjs(obj1.declarations[i], obj2.declarations[i]);
						if (err) {
							return 'declarations[' + i + '] mismatch. ' + err;
						}
					}
					break;
				case 'VariableDeclarator':
					var err = compareObjs(obj1.id, obj2.id);
					if (err) {
						return 'VariableDeclarator id mismatch. ' + err;
					}
					if (obj1.init != null) {
						if (obj2.init != null) {
							err = compareObjs(obj1.init, obj2.init);
							if (err) {
								return 'VariableDeclarator init mismatch. ' + err;
							}
						}
						else {
							return 'VariableDeclarator init mismatch (1)';
						}
					}
					else {
						if (obj2.init != null) {
							return 'VariableDeclarator init mismatch (2)';
						}
					}
					break;
				case 'WhileStatement':
					var err = compareObjs(obj1.test, obj2.test);
					if (err)
						return 'WhileStatement test mismatch. ' + err;
					err = compareObjs(obj1.body, obj2.body);
					if (err)
						return 'WhileStatement body mismatch. ' + err;
					break;
				case 'WithStatement':
					return 'WithStatement is not supported.';
				default:
					return 'Unhandled type in compareObjs:' + obj1.type;
			}
		}
		return '';
	}
	function _cleanup() {
		libObjs = [];
		namemap = {};
	}
	function _compareCodes() {
		if (libObjs && libObjs.length == 2) {
			namemap = {};
			return compareObjs(libObjs[0], libObjs[1]);
		}
		else {
			return 'codes are not loaded properly';
		}
	}
	function _start(webname) {
		_webname = webname;
		_error = '';
		if (prgObj) {
			clientCode = {};//client side code to be generated
			_serverCodes = []; //server codes to be generated
			_serverCodeIndex = -1; //index to the server code being generated; by claim 3, server connection is generated one by one and thus one index is enough to keep track of current server code being generated.
			if (prgObj.type == 'Program') {
				var c = '\r\n\tclient code for ' + _webname + '.html\r\n\tgenerated from JavaScript code included in ' + _webname + '.html by client-server-automation preprocessor\r\n'
				clientCode.comments = [{ type: 'Block', value: c, range: [0, c.length + 4] }];
				clientCode.range = prgObj.range;
				clientCode.tokens = prgObj.tokens;
				clientCode.type = prgObj.type;
				clientCode.body = [];
				var scope = { currentContext: CLIENT_CONTEXT };//default execution context is client
				scope.asyncFuncs = [];
				for (var i = 0; i < prgObj.body.length; i++) {
					if (prgObj.body[i].type == 'FunctionDeclaration') {
						if (involveServerValue(prgObj.body[i], scope)) {
							scope.asyncFuncs.push(prgObj.body[i].id.name);
						}
					}
				}
				processFunctionBody(prgObj.body, clientCode.body, 0, null, scope);
			}
			clientCode = window.escodegen.attachComments(clientCode, clientCode.comments, clientCode.tokens);
			option = {
				comment: true,
				format: {
					indent: {
						style: '\t'
					},
					quotes: 'single'
				}
			};
			var code = window.escodegen.generate(clientCode, option);
			setText('editor', code);
		}
		else {
			_error = 'Programming code to be processed is not given.';
		}
		return _error;
	}
	return {
		csaPreprocessorVersion: function () {
			return CSAVERSION;
		},
		loadCode: function (code, isLib, filename) {
			try {
				var syntax = window.esprima.parse(code, { raw: true, tokens: true, range: true, comment: true });
				if (isLib) {
					libObjs.push(syntax);
					if (filename) {
						for (var k = 0; k < syntax.body.length; k++) {
							if (syntax.body[k].type == 'ExpressionStatement') {
								var e = syntax.body[k].expression;
								if (e.operator == '=') {
									if (e.right.type == 'Literal' && e.right.value === true) {
										if (e.left.type == 'MemberExpression') {
											if (e.left.property.type == 'Identifier') {
												if (e.left.property.name == 'RunAt') {
													if (e.left.object.type == 'MemberExpression') {
														if (e.left.object.property.type == 'Identifier') {
															if (e.left.object.property.name == 'prototype') {
																if (e.left.object.object.type == 'Identifier') {
																	var b = false;
																	for (var n = 0; n < libFileToObjectMapping.length; n++) {
																		if (libFileToObjectMapping[n].objname == e.left.object.object.name) {
																			libFileToObjectMapping[n].filename = filename;
																			b = true;
																			break;
																		}
																	}
																	if (!b) {
																		libFileToObjectMapping.push({ objname: e.left.object.object.name, filename: filename });
																	}
																}
															}
														}
													}
												}
											}
										}
									}
									else if (e.right.type == 'ArrayExpression') {
										if (e.left.type == 'MemberExpression') {
											if (e.left.property.type == 'Identifier') {
												if (e.left.property.name == 'ServerTypes') {
													if (e.left.object.type == 'MemberExpression') {
														if (e.left.object.property.type == 'Identifier') {
															if (e.left.object.property.name == 'prototype') {
																if (e.left.object.object.type == 'Identifier') {
																	var b = false;
																	for (var n = 0; n < libFileToObjectMapping.length; n++) {
																		if (libFileToObjectMapping[n].objname == e.left.object.object.name) {
																			libFileToObjectMapping[n].servertype = arrayFromCodeElements(e.right.elements);
																			b = true;
																			break;
																		}
																	}
																	if (!b) {
																		libFileToObjectMapping.push({ objname: e.left.object.object.name, servertype: arrayFromCodeElements(e.right.elements) });
																	}
																}
															}
														}
													}
												}
											}
										}
									}
									else if (e.right.type == 'FunctionExpression') {
										if (e.left.type == 'MemberExpression') {
											if (e.left.property.type == 'Identifier' && e.left.property.name == 'GetRunAt' && e.left.object.type == 'Identifier') {
												if (e.right.body.type == 'BlockStatement' && e.right.body.body.length > 0) {
													for (var n = 0; n < e.right.body.body.length; n++) {
														if (e.right.body.body[n].type == 'ReturnStatement') {
															if (e.right.body.body[n].argument.type == 'ObjectExpression') {
																for (var m = 0; m < e.right.body.body[n].argument.properties.length; m++) {
																	if (e.right.body.body[n].argument.properties[m].type == 'Property') {
																		if (e.right.body.body[n].argument.properties[m].key.type == 'Identifier') {
																			if (e.right.body.body[n].argument.properties[m].key.name == 'RunAt') {
																				if (e.right.body.body[n].argument.properties[m].value.type == 'Literal' &&
																					e.right.body.body[n].argument.properties[m].value.value == true) {
																					//found a server object
																					var b = false;
																					for (var h = 0; h < libFileToObjectMapping.length; h++) {
																						if (libFileToObjectMapping[h].objname == e.left.object.name) {
																							libFileToObjectMapping[h].filename = filename;
																							b = true;
																							break;
																						}
																					}
																					if (!b) {
																						libFileToObjectMapping.push({ objname: e.left.object.name, filename: filename });
																					}
																				}
																			}
																			else if (e.right.body.body[n].argument.properties[m].key.name == 'ServerTypes') {
																				if (e.right.body.body[n].argument.properties[m].value.type == 'ArrayExpression') {
																					var b = false;
																					for (var h = 0; h < libFileToObjectMapping.length; h++) {
																						if (libFileToObjectMapping[h].objname == e.left.object.name) {
																							libFileToObjectMapping[h].servertype = arrayFromCodeElements(e.right.body.body[n].argument.properties[m].value.elements);
																							b = true;
																							break;
																						}
																					}
																					if (!b) {
																						libFileToObjectMapping.push({ objname: e.left.object.name, servertype: arrayFromCodeElements(e.right.body.body[n].argument.properties[m].value.elements) });
																					}
																				}
																			}
																		}
																	}
																}
															}
														}
													}
												}
											}
										}
									}
								}
							}
						}
					}
				}
				else {
					prgObj = syntax;
				}
				setText('info', (isLib ? 'Lib ' : 'Prg ') + ' code loaded');
				return '';
			}
			catch (e) {
				return e.toString() + '. line:' + e.lineNumber + '. column:' + e.column + '. index:' + e.index+'. stack:'+e.stack;
			}
		},
		start: function (webname) {
			return _start(webname);
		},
		compareCodes: function () {
			return _compareCodes();
		},
		cleanup: function () {
			_cleanup();
		},
		getServerCodeCount: function () {
			return _serverCodes.length;
		},
		getServerCode: function (index) {
			if (index >= 0 && index < _serverCodes.length) {
				option = {
					comment: true,
					format: {
						indent: {
							style: '\t'
						},
						quotes: 'single'
					}
				};
				var code = window.escodegen.generate(_serverCodes[index], option);
				code = '/*' + _serverCodes[index].comments[0].value + '*/\r\n' + code;
				setText('editor',code);
				return code;
			}
		},
		getClientCode: function () {
			option = {
				comment: true,
				format: {
					indent: {
						style: '\t'
					},
					quotes: 'single'
				}
			};
			var code = window.escodegen.generate(clientCode, option);
			setText('editor',code);
			return code;
		},
		getLibObjMap: function () {
			return JSON.stringify(libFileToObjectMapping);
		}
	}
})();
//===interface for web control===
function getPreprocessorVersion() {
	return CSAPREPROC.csaPreprocessorVersion();
}
//filename is HTML file name without extension, it is used only for isLib=false
function loadProgrammingCode(code, isLib, filename) {
	setText('editor', code);
	return CSAPREPROC.loadCode(code, isLib, filename);
}
//start client-server-automation preprocessing
function processProgrammingCode(webname) {
	var ret = CSAPREPROC.start(webname);
	if (ret && ret.length > 0) {
		setText('info', ret);
	}
	else {
		setText('info', 'Client Server Automation Preprocessing succeeded.');
	}
	return ret;
}
function compareCodes() {
	return CSAPREPROC.compareCodes();
}
function compare_codes(code1, code2) {
	CSAPREPROC.cleanup();
	var err = CSAPREPROC.loadCode(code1, true, 'Code1')
	if (err) {
		err = 'Error loading code1. ' + err;
	}
	else {
		err = CSAPREPROC.loadCode(code2, true, 'Code2')
		if (err) {
			err = 'Error loading code2. ' + err;
		}
		else {
			return CSAPREPROC.compareCodes();
		}
	}
	return err;
}
function getServerCodeCount() {
	return CSAPREPROC.getServerCodeCount();
}
function getServerCode(index) {
	return CSAPREPROC.getServerCode(index);
}
function getClientCode() {
	return CSAPREPROC.getClientCode();
}
function getLibObjMap() {
	return CSAPREPROC.getLibObjMap();
}
//===end of interface for web control===
/*jslint sloppy:true browser:true */
/*global sourceRewrite:true */
window.onload = function () {
	var bt = id('rewritebutton');
	if (bt) {
		bt.onclick = sourceRewrite;
	}
	try {
		require(['custom/editor'], function (editor) {
			window.editor = editor({ parent: 'editor', lang: 'js' });
			window.editor.getTextView().getModel().addEventListener("Changed", function () {
				document.getElementById('info').innerHTML = 'Ready.';
			});
		});
		window.external.OnWebPageStarted();//notify web browser control for standalone CSA Preprocessor utility
	} catch (e) {
	}
};
