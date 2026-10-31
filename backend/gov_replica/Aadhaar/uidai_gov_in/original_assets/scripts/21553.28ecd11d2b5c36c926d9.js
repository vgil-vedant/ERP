"use strict";
(self["webpackChunkmyaadhaar_revamp_ui_integrated"] = self["webpackChunkmyaadhaar_revamp_ui_integrated"] || []).push([[21553],{

/***/ 97441
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(89482);
var _path;
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
;
var SvgCopy = function SvgCopy(props) {
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0__.createElement("svg", _extends({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24"
  }, props), _path || (_path = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0__.createElement("path", {
    d: "M9.058 17.5q-.758 0-1.283-.525a1.75 1.75 0 0 1-.525-1.283V4.308q0-.758.525-1.283T9.058 2.5h8.384q.758 0 1.283.525t.525 1.283v11.384q0 .758-.525 1.283t-1.283.525zm0-1.5h8.384a.3.3 0 0 0 .212-.096.3.3 0 0 0 .096-.212V4.308a.3.3 0 0 0-.096-.212.3.3 0 0 0-.212-.096H9.058a.3.3 0 0 0-.212.096.3.3 0 0 0-.096.212v11.384q0 .116.096.212a.3.3 0 0 0 .212.096m-3.5 5q-.758 0-1.283-.525a1.75 1.75 0 0 1-.525-1.283V6.308h1.5v12.884q0 .116.096.212a.3.3 0 0 0 .212.096h9.884V21z"
  })));
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (SvgCopy);
/* harmony export */ __webpack_require__.d(__webpack_exports__, [
/* harmony export */   "A", 0, __WEBPACK_DEFAULT_EXPORT__
/* harmony export */ ]);


/***/ },

/***/ 21553
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _src_common_reusableComponents_tooltip_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(74013);

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_src_common_reusableComponents_tooltip_index_js__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .A);
/* harmony export */ __webpack_require__.d(__webpack_exports__, [
/* harmony export */   "default", 0, __WEBPACK_DEFAULT_EXPORT__
/* harmony export */ ]);


/***/ },

/***/ 74013
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(89482);
/* harmony import */ var _index_module_scss__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(13676);
/* harmony import */ var _assets_icons_copy_svg__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(97441);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(74848);
var _index_module_scss__WEBPACK_IMPORTED_MODULE_1___namespace_object = {};
__webpack_require__.r(_index_module_scss__WEBPACK_IMPORTED_MODULE_1___namespace_object);
__webpack_require__.d(_index_module_scss__WEBPACK_IMPORTED_MODULE_1___namespace_object, {
	copyIcon: () => (_index_module_scss__WEBPACK_IMPORTED_MODULE_1__.nJ),
	"default": () => (_index_module_scss__WEBPACK_IMPORTED_MODULE_1__.Ay),
	tooltip: () => (_index_module_scss__WEBPACK_IMPORTED_MODULE_1__.YL),
	tooltipBottom: () => (_index_module_scss__WEBPACK_IMPORTED_MODULE_1__.L_),
	tooltipFadeIn: () => (_index_module_scss__WEBPACK_IMPORTED_MODULE_1__.ho),
	tooltipLeft: () => (_index_module_scss__WEBPACK_IMPORTED_MODULE_1__.Lf),
	tooltipRight: () => (_index_module_scss__WEBPACK_IMPORTED_MODULE_1__.Uu),
	tooltipTop: () => (_index_module_scss__WEBPACK_IMPORTED_MODULE_1__.dn),
	tooltipWrapper: () => (_index_module_scss__WEBPACK_IMPORTED_MODULE_1__.Jn)
});




// Sample Usage
// -------------------------------------------------
// const [isCopied, setIsCopied] = useState(false); State needed in parent component to manage tooltip visibility
// -------------------------------------------------

// <Tooltip
//   text="Copied!"
//   position={"bottom"}
//   isCopied={isCopied}
//   showDuration={2000}
//   setIsCopied={setIsCopied}
//   data={"helloooooooooook"}
// />;

const Tooltip = /*#__PURE__*/(0,react__WEBPACK_IMPORTED_MODULE_0__.forwardRef)(({
  text = "Copied !",
  position = "top",
  isCopied = false,
  className = "",
  showDuration = 2000,
  setIsCopied,
  data,
  iconColor = "#191636"
}, ref) => {
  const timeoutRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const handleCopy = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(() => {
    setIsCopied(true);
    navigator.clipboard.writeText(data);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsCopied(false);
    }, showDuration);
  }, [showDuration]);
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
    ref: ref,
    tabIndex: 0,
    className: `${_index_module_scss__WEBPACK_IMPORTED_MODULE_1__/* .tooltipWrapper */ .Jn} ${className}`,
    title: "Click to copy",
    onClick: e => {
      e.stopPropagation();
      handleCopy();
    },
    onKeyDown: e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        handleCopy();
      }
    },
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_assets_icons_copy_svg__WEBPACK_IMPORTED_MODULE_2__/* ["default"] */ .A, {
      width: 20,
      height: 20,
      "aria-label": "Copy Data",
      className: _index_module_scss__WEBPACK_IMPORTED_MODULE_1__/* .copyIcon */ .nJ,
      fill: iconColor
    }), isCopied && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("div", {
      className: `${_index_module_scss__WEBPACK_IMPORTED_MODULE_1__/* .tooltip */ .YL} ${_index_module_scss__WEBPACK_IMPORTED_MODULE_1___namespace_object[`tooltip${position.charAt(0).toUpperCase() + position.slice(1)}`]}`,
      children: text
    })]
  });
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Tooltip);
/* harmony export */ __webpack_require__.d(__webpack_exports__, [
/* harmony export */   "A", 0, __WEBPACK_DEFAULT_EXPORT__
/* harmony export */ ]);


/***/ },

/***/ 53669
(module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Jn: () => (/* binding */ tooltipWrapper),
/* harmony export */   L_: () => (/* binding */ tooltipBottom),
/* harmony export */   Lf: () => (/* binding */ tooltipLeft),
/* harmony export */   Uu: () => (/* binding */ tooltipRight),
/* harmony export */   YL: () => (/* binding */ tooltip),
/* harmony export */   dn: () => (/* binding */ tooltipTop),
/* harmony export */   ho: () => (/* binding */ tooltipFadeIn),
/* harmony export */   nJ: () => (/* binding */ copyIcon)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(31601);
/* harmony import */ var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(76314);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, `.HScQWCb8Xn7bNQ8HZt2n{position:relative;display:inline-block}

.HScQWCb8Xn7bNQ8HZt2n:focus .JFESt9knj69do1BIBpCp{outline:none}

.HScQWCb8Xn7bNQ8HZt2n:focus{outline:none}

.HScQWCb8Xn7bNQ8HZt2n:focus-visible .JFESt9knj69do1BIBpCp{outline:solid 1px var(--primary-navyblue);outline-offset:1px}

.HScQWCb8Xn7bNQ8HZt2n:disabled .JFESt9knj69do1BIBpCp{cursor:auto;opacity:.4}

.HScQWCb8Xn7bNQ8HZt2n:hover:not(:disabled) .JFESt9knj69do1BIBpCp{background-color:#efeef8;fill:#191636 !important}

.We7R3QRLHNqcKo3tqOq1{position:absolute;background-color:#333;color:#fff;padding:8px 12px;border-radius:4px;font-size:12px;white-space:nowrap;z-index:1000;animation:fN58s1hNp_tN3Dr7rQeF .2s ease-in-out;box-shadow:0 2px 8px rgba(0,0,0,.15);font-family:"Noto Sans"}

.We7R3QRLHNqcKo3tqOq1::after{content:"";position:absolute;border:5px solid rgba(0,0,0,0)}

.oLITCCOHpHdOvyEhvpHs{bottom:100%;margin-bottom:8px;border-radius:var(--radius-sm, 6px);background:var(--Grey-950, #323135);display:flex;padding:var(--spacing-12, 12px) var(--radius-md, 8px);flex-direction:column;align-items:flex-start;gap:var(--radius-md, 8px)}

[dir="ltr"] .oLITCCOHpHdOvyEhvpHs{left:50%;transform:translateX(-50%)}

[dir="rtl"] .oLITCCOHpHdOvyEhvpHs{right:50%;transform:translateX(50%)}

.oLITCCOHpHdOvyEhvpHs::after{top:100%;border-top-color:#333}

[dir="ltr"] .oLITCCOHpHdOvyEhvpHs::after{left:50%;transform:translateX(-50%)}

[dir="rtl"] .oLITCCOHpHdOvyEhvpHs::after{right:50%;transform:translateX(50%)}

.JFESt9knj69do1BIBpCp{width:20px;height:20px;border-radius:9999px;display:flex;padding:2px;justify-content:center;align-items:center}

.JFESt9knj69do1BIBpCp:focus-visible{outline:solid 1px var(--primary-navyblue);outline-offset:1px}

.JFESt9knj69do1BIBpCp:focus{outline:none}

.JFESt9knj69do1BIBpCp:disabled{cursor:auto;opacity:.4}

.JFESt9knj69do1BIBpCp:hover:not(:disabled){background-color:#efeef8}

.uC8S9ZcCqs3xCU59Ixpq{top:100%;margin-top:2px;display:flex;padding:var(--spacing-12, 12px) var(--radius-md, 8px);flex-direction:column;align-items:flex-start;gap:var(--radius-md, 8px);border-radius:var(--radius-sm, 6px);background:var(--Grey-950, #323135)}

[dir="ltr"] .uC8S9ZcCqs3xCU59Ixpq{left:50%;transform:translateX(-50%)}

[dir="rtl"] .uC8S9ZcCqs3xCU59Ixpq{right:50%;transform:translateX(50%)}

.uC8S9ZcCqs3xCU59Ixpq::after{bottom:100%;border-bottom-color:#333}

[dir="ltr"] .uC8S9ZcCqs3xCU59Ixpq::after{left:50%;transform:translateX(-50%)}

[dir="rtl"] .uC8S9ZcCqs3xCU59Ixpq::after{right:50%;transform:translateX(50%)}

.EOF8iaHmKbJDf7T7HPKh{top:50%;transform:translateY(-50%);border-radius:var(--radius-sm, 6px);background:var(--Grey-950, #323135);display:flex;padding:var(--spacing-12, 12px) var(--radius-md, 8px);flex-direction:column;align-items:flex-start;gap:var(--radius-md, 8px)}

[dir="ltr"] .EOF8iaHmKbJDf7T7HPKh{right:100%;margin-right:8px}

[dir="rtl"] .EOF8iaHmKbJDf7T7HPKh{left:100%;margin-left:8px}

.EOF8iaHmKbJDf7T7HPKh::after{top:50%;transform:translateY(-50%)}

[dir="ltr"] .EOF8iaHmKbJDf7T7HPKh::after{left:100%;border-left-color:#333}

[dir="rtl"] .EOF8iaHmKbJDf7T7HPKh::after{right:100%;border-right-color:#333}

.ZEe8BPvigg5aKBfQSow_{top:50%;transform:translateY(-50%);border-radius:var(--radius-sm, 6px);background:var(--Grey-950, #323135);display:flex;padding:var(--spacing-12, 12px) var(--radius-md, 8px);flex-direction:column;align-items:flex-start;gap:var(--radius-md, 8px)}

[dir="ltr"] .ZEe8BPvigg5aKBfQSow_{left:100%;margin-left:8px}

[dir="rtl"] .ZEe8BPvigg5aKBfQSow_{right:100%;margin-right:8px}

.ZEe8BPvigg5aKBfQSow_::after{top:50%;transform:translateY(-50%)}

[dir="ltr"] .ZEe8BPvigg5aKBfQSow_::after{right:100%;border-right-color:#333}

[dir="rtl"] .ZEe8BPvigg5aKBfQSow_::after{left:100%;border-left-color:#333}

@keyframes fN58s1hNp_tN3Dr7rQeF{
from{opacity:0}

to{opacity:1}}`, ""]);
// Exports
var tooltipWrapper = `HScQWCb8Xn7bNQ8HZt2n`;
var copyIcon = `JFESt9knj69do1BIBpCp`;
var tooltip = `We7R3QRLHNqcKo3tqOq1`;
var tooltipFadeIn = `fN58s1hNp_tN3Dr7rQeF`;
var tooltipTop = `oLITCCOHpHdOvyEhvpHs`;
var tooltipBottom = `uC8S9ZcCqs3xCU59Ixpq`;
var tooltipLeft = `EOF8iaHmKbJDf7T7HPKh`;
var tooltipRight = `ZEe8BPvigg5aKBfQSow_`;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);

/* harmony export */ __webpack_require__.d(__webpack_exports__, [
/* harmony export */   "Ay", 0, __WEBPACK_DEFAULT_EXPORT__
/* harmony export */ ]);


/***/ },

/***/ 76314
(module) {



/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
module.exports = function (cssWithMappingToString) {
  var list = [];

  // return the list of modules as css string
  list.toString = function toString() {
    return this.map(function (item) {
      var content = "";
      var needLayer = typeof item[5] !== "undefined";
      if (item[4]) {
        content += "@supports (".concat(item[4], ") {");
      }
      if (item[2]) {
        content += "@media ".concat(item[2], " {");
      }
      if (needLayer) {
        content += "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {");
      }
      content += cssWithMappingToString(item);
      if (needLayer) {
        content += "}";
      }
      if (item[2]) {
        content += "}";
      }
      if (item[4]) {
        content += "}";
      }
      return content;
    }).join("");
  };

  // import a list of modules into the list
  list.i = function i(modules, media, dedupe, supports, layer) {
    if (typeof modules === "string") {
      modules = [[null, modules, undefined]];
    }
    var alreadyImportedModules = {};
    if (dedupe) {
      for (var k = 0; k < this.length; k++) {
        var id = this[k][0];
        if (id != null) {
          alreadyImportedModules[id] = true;
        }
      }
    }
    for (var _k = 0; _k < modules.length; _k++) {
      var item = [].concat(modules[_k]);
      if (dedupe && alreadyImportedModules[item[0]]) {
        continue;
      }
      if (typeof layer !== "undefined") {
        if (typeof item[5] === "undefined") {
          item[5] = layer;
        } else {
          item[1] = "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {").concat(item[1], "}");
          item[5] = layer;
        }
      }
      if (media) {
        if (!item[2]) {
          item[2] = media;
        } else {
          item[1] = "@media ".concat(item[2], " {").concat(item[1], "}");
          item[2] = media;
        }
      }
      if (supports) {
        if (!item[4]) {
          item[4] = "".concat(supports);
        } else {
          item[1] = "@supports (".concat(item[4], ") {").concat(item[1], "}");
          item[4] = supports;
        }
      }
      list.push(item);
    }
  };
  return list;
};

/***/ },

/***/ 31601
(module) {



module.exports = function (i) {
  return i[1];
};

/***/ },

/***/ 13676
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Jn: () => (/* reexport safe */ _node_modules_css_loader_dist_cjs_js_node_modules_postcss_loader_dist_cjs_js_ruleSet_1_rules_1_use_2_node_modules_sass_loader_dist_cjs_js_index_module_scss__WEBPACK_IMPORTED_MODULE_6__.Jn),
/* harmony export */   L_: () => (/* reexport safe */ _node_modules_css_loader_dist_cjs_js_node_modules_postcss_loader_dist_cjs_js_ruleSet_1_rules_1_use_2_node_modules_sass_loader_dist_cjs_js_index_module_scss__WEBPACK_IMPORTED_MODULE_6__.L_),
/* harmony export */   Lf: () => (/* reexport safe */ _node_modules_css_loader_dist_cjs_js_node_modules_postcss_loader_dist_cjs_js_ruleSet_1_rules_1_use_2_node_modules_sass_loader_dist_cjs_js_index_module_scss__WEBPACK_IMPORTED_MODULE_6__.Lf),
/* harmony export */   Uu: () => (/* reexport safe */ _node_modules_css_loader_dist_cjs_js_node_modules_postcss_loader_dist_cjs_js_ruleSet_1_rules_1_use_2_node_modules_sass_loader_dist_cjs_js_index_module_scss__WEBPACK_IMPORTED_MODULE_6__.Uu),
/* harmony export */   YL: () => (/* reexport safe */ _node_modules_css_loader_dist_cjs_js_node_modules_postcss_loader_dist_cjs_js_ruleSet_1_rules_1_use_2_node_modules_sass_loader_dist_cjs_js_index_module_scss__WEBPACK_IMPORTED_MODULE_6__.YL),
/* harmony export */   dn: () => (/* reexport safe */ _node_modules_css_loader_dist_cjs_js_node_modules_postcss_loader_dist_cjs_js_ruleSet_1_rules_1_use_2_node_modules_sass_loader_dist_cjs_js_index_module_scss__WEBPACK_IMPORTED_MODULE_6__.dn),
/* harmony export */   ho: () => (/* reexport safe */ _node_modules_css_loader_dist_cjs_js_node_modules_postcss_loader_dist_cjs_js_ruleSet_1_rules_1_use_2_node_modules_sass_loader_dist_cjs_js_index_module_scss__WEBPACK_IMPORTED_MODULE_6__.ho),
/* harmony export */   nJ: () => (/* reexport safe */ _node_modules_css_loader_dist_cjs_js_node_modules_postcss_loader_dist_cjs_js_ruleSet_1_rules_1_use_2_node_modules_sass_loader_dist_cjs_js_index_module_scss__WEBPACK_IMPORTED_MODULE_6__.nJ)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(85072);
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(97825);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(77659);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(55056);
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(10540);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(41113);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_node_modules_postcss_loader_dist_cjs_js_ruleSet_1_rules_1_use_2_node_modules_sass_loader_dist_cjs_js_index_module_scss__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(53669);

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());
options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_node_modules_postcss_loader_dist_cjs_js_ruleSet_1_rules_1_use_2_node_modules_sass_loader_dist_cjs_js_index_module_scss__WEBPACK_IMPORTED_MODULE_6__/* ["default"] */ .Ay, options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_node_modules_postcss_loader_dist_cjs_js_ruleSet_1_rules_1_use_2_node_modules_sass_loader_dist_cjs_js_index_module_scss__WEBPACK_IMPORTED_MODULE_6__/* ["default"] */ .Ay && _node_modules_css_loader_dist_cjs_js_node_modules_postcss_loader_dist_cjs_js_ruleSet_1_rules_1_use_2_node_modules_sass_loader_dist_cjs_js_index_module_scss__WEBPACK_IMPORTED_MODULE_6__/* ["default"] */ .Ay.locals ? _node_modules_css_loader_dist_cjs_js_node_modules_postcss_loader_dist_cjs_js_ruleSet_1_rules_1_use_2_node_modules_sass_loader_dist_cjs_js_index_module_scss__WEBPACK_IMPORTED_MODULE_6__/* ["default"] */ .Ay.locals : undefined);

/* harmony export */ __webpack_require__.d(__webpack_exports__, [
/* harmony export */   "Ay", 0, __WEBPACK_DEFAULT_EXPORT__
/* harmony export */ ]);


/***/ },

/***/ 85072
(module) {



var stylesInDOM = [];
function getIndexByIdentifier(identifier) {
  var result = -1;
  for (var i = 0; i < stylesInDOM.length; i++) {
    if (stylesInDOM[i].identifier === identifier) {
      result = i;
      break;
    }
  }
  return result;
}
function modulesToDom(list, options) {
  var idCountMap = {};
  var identifiers = [];
  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var id = options.base ? item[0] + options.base : item[0];
    var count = idCountMap[id] || 0;
    var identifier = "".concat(id, " ").concat(count);
    idCountMap[id] = count + 1;
    var indexByIdentifier = getIndexByIdentifier(identifier);
    var obj = {
      css: item[1],
      media: item[2],
      sourceMap: item[3],
      supports: item[4],
      layer: item[5]
    };
    if (indexByIdentifier !== -1) {
      stylesInDOM[indexByIdentifier].references++;
      stylesInDOM[indexByIdentifier].updater(obj);
    } else {
      var updater = addElementStyle(obj, options);
      options.byIndex = i;
      stylesInDOM.splice(i, 0, {
        identifier: identifier,
        updater: updater,
        references: 1
      });
    }
    identifiers.push(identifier);
  }
  return identifiers;
}
function addElementStyle(obj, options) {
  var api = options.domAPI(options);
  api.update(obj);
  var updater = function updater(newObj) {
    if (newObj) {
      if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap && newObj.supports === obj.supports && newObj.layer === obj.layer) {
        return;
      }
      api.update(obj = newObj);
    } else {
      api.remove();
    }
  };
  return updater;
}
module.exports = function (list, options) {
  options = options || {};
  list = list || [];
  var lastIdentifiers = modulesToDom(list, options);
  return function update(newList) {
    newList = newList || [];
    for (var i = 0; i < lastIdentifiers.length; i++) {
      var identifier = lastIdentifiers[i];
      var index = getIndexByIdentifier(identifier);
      stylesInDOM[index].references--;
    }
    var newLastIdentifiers = modulesToDom(newList, options);
    for (var _i = 0; _i < lastIdentifiers.length; _i++) {
      var _identifier = lastIdentifiers[_i];
      var _index = getIndexByIdentifier(_identifier);
      if (stylesInDOM[_index].references === 0) {
        stylesInDOM[_index].updater();
        stylesInDOM.splice(_index, 1);
      }
    }
    lastIdentifiers = newLastIdentifiers;
  };
};

/***/ },

/***/ 77659
(module) {



var memo = {};

/* istanbul ignore next  */
function getTarget(target) {
  if (typeof memo[target] === "undefined") {
    var styleTarget = document.querySelector(target);

    // Special case to return head of iframe instead of iframe itself
    if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
      try {
        // This will throw an exception if access to iframe is blocked
        // due to cross-origin restrictions
        styleTarget = styleTarget.contentDocument.head;
      } catch (e) {
        // istanbul ignore next
        styleTarget = null;
      }
    }
    memo[target] = styleTarget;
  }
  return memo[target];
}

/* istanbul ignore next  */
function insertBySelector(insert, style) {
  var target = getTarget(insert);
  if (!target) {
    throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
  }
  target.appendChild(style);
}
module.exports = insertBySelector;

/***/ },

/***/ 10540
(module) {



/* istanbul ignore next  */
function insertStyleElement(options) {
  var element = document.createElement("style");
  options.setAttributes(element, options.attributes);
  options.insert(element, options.options);
  return element;
}
module.exports = insertStyleElement;

/***/ },

/***/ 55056
(module, __unused_webpack_exports, __webpack_require__) {



/* istanbul ignore next  */
function setAttributesWithoutAttributes(styleElement) {
  var nonce =  true ? __webpack_require__.nc : 0;
  if (nonce) {
    styleElement.setAttribute("nonce", nonce);
  }
}
module.exports = setAttributesWithoutAttributes;

/***/ },

/***/ 97825
(module) {



/* istanbul ignore next  */
function apply(styleElement, options, obj) {
  var css = "";
  if (obj.supports) {
    css += "@supports (".concat(obj.supports, ") {");
  }
  if (obj.media) {
    css += "@media ".concat(obj.media, " {");
  }
  var needLayer = typeof obj.layer !== "undefined";
  if (needLayer) {
    css += "@layer".concat(obj.layer.length > 0 ? " ".concat(obj.layer) : "", " {");
  }
  css += obj.css;
  if (needLayer) {
    css += "}";
  }
  if (obj.media) {
    css += "}";
  }
  if (obj.supports) {
    css += "}";
  }
  var sourceMap = obj.sourceMap;
  if (sourceMap && typeof btoa !== "undefined") {
    css += "\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))), " */");
  }

  // For old IE
  /* istanbul ignore if  */
  options.styleTagTransform(css, styleElement, options.options);
}
function removeStyleElement(styleElement) {
  // istanbul ignore if
  if (styleElement.parentNode === null) {
    return false;
  }
  styleElement.parentNode.removeChild(styleElement);
}

/* istanbul ignore next  */
function domAPI(options) {
  if (typeof document === "undefined") {
    return {
      update: function update() {},
      remove: function remove() {}
    };
  }
  var styleElement = options.insertStyleElement(options);
  return {
    update: function update(obj) {
      apply(styleElement, options, obj);
    },
    remove: function remove() {
      removeStyleElement(styleElement);
    }
  };
}
module.exports = domAPI;

/***/ },

/***/ 41113
(module) {



/* istanbul ignore next  */
function styleTagTransform(css, styleElement) {
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css;
  } else {
    while (styleElement.firstChild) {
      styleElement.removeChild(styleElement.firstChild);
    }
    styleElement.appendChild(document.createTextNode(css));
  }
}
module.exports = styleTagTransform;

/***/ }

}]);