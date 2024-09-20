import test from "ava";
import vm from "node:vm";
import { exec as dataUriBlob } from "../data-uri-blob.js";
import { exec as dataUri } from "../data-uri.js";
import { exec as vmModule } from "../vm-module.js";
import { exec as vmScript } from "../vm-script.js";
import { exec as moduleCompile } from "../module-compile.js";

const allTests = {
	"const": {
		code: `const a = 1;`,
		test: function(results, t) {
			t.is(Object.keys(results).length, 0);
			t.is(globalThis.a, undefined);
		},
		expectToPass: [
			"data-uri",
			...["SourceTextModule" in vm ? "vm-module" : undefined],
			"vm-script",
			"module-compile",
		]
	},
	"module.exports": {
		code: `module.exports = { a: 1 };`,
		test: function(results, t) {
			t.is(Object.keys(results).length, 1);
			t.is(results.a, 1);
		},
		expectToPass: [
			"vm-script",
			"module-compile",
		]
	},
	"require": {
		code: `require("@zachleat/noop")`,
		test: function(results, t) {
			t.is(Object.keys(results).length, 0);
		},
		expectToPass: [
			...["SourceTextModule" in vm ? "vm-module" : undefined],
			"vm-script",
			"module-compile",
		]
	},
	"export": {
		code: `const a = 1; export { a };`,
		test: function(results, t) {
			t.is(Object.keys(results).length, 1);
			t.is(results.a, 1);
		},
		expectToPass: [
			"data-uri",
			...["SourceTextModule" in vm ? "vm-module" : undefined],
		]
	},
	"import": {
		code: `import "@zachleat/noop"`,
		test: function(results, t) {
			t.is(Object.keys(results).length, 0);
		},
		expectToPass: [
			...["SourceTextModule" in vm ? "vm-module" : undefined],
		],
	},
	"import (relative)": {
		code: `import "./src/_import.js"`,
		test: function(results, t) {
			t.is(Object.keys(results).length, 0);
		},
		expectToPass: [
			...["SourceTextModule" in vm ? "vm-module" : undefined],
		],
	},
	"top level async/await": {
		code: `await new Promise(resolve => resolve())`,
		test: function(results, t) {
			t.is(Object.keys(results).length, 0);
		},
		expectToPass: [
			"data-uri",
			...["SourceTextModule" in vm ? "vm-module" : undefined],
			"vm-script",
			"module-compile",
		]
	},
	"dynamic import": {
		code: `(async () => await import("@zachleat/noop"))()`,
		test: function(results, t) {
			t.is(Object.keys(results).length, 0);
		},
		expectToPass: [
			...["SourceTextModule" in vm ? "vm-module" : undefined],
			"vm-script",
			"module-compile",
		],
	},
	"doesn’t leak": {
		code: `globalThis.b = 1;`,
		test: function(results, t) {
			t.is(globalThis.b, undefined);
		},
		expectToPass: [
			...["SourceTextModule" in vm ? "vm-module" : undefined],
			"vm-script",
		],
	},
};

function executeTestSuite(methodName, exec) {
	for(let [name, testObj] of Object.entries(allTests)) {
		let fn = (testObj.expectToPass || []).includes(methodName) ? test : test.skip;
		fn(`${methodName}: ${name}`, async t => {
			let results = await exec(testObj.code);
			testObj.test(results, t);
		});
	}
}

executeTestSuite("data-uri-blob", dataUriBlob);
executeTestSuite("data-uri", dataUri);
executeTestSuite("vm-module", vmModule);
executeTestSuite("vm-script", vmScript);
executeTestSuite("module-compile", moduleCompile);