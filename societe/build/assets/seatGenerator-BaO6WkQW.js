import{c as d}from"./index-ClJMWCBu.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"7 10 12 15 17 10",key:"2ggqvy"}],["line",{x1:"12",x2:"12",y1:"15",y2:"3",key:"1vk2je"}]],u=d("download",h);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"17 8 12 3 7 8",key:"t8dd8p"}],["line",{x1:"12",x2:"12",y1:"3",y2:"15",key:"widbto"}]],y=d("upload",p);function g(a){const r=[],{rows:c,leftSeats:s,rightSeats:i}=a.structure;for(let o=0;o<c;o++){const n=String.fromCharCode(65+o);for(let t=1;t<=s;t++)r.push(`${n}${t}`);for(let t=1;t<=i;t++)r.push(`${n}${t+s}`)}return r.slice(0,a.totalSeats)}function S(a){const r=[],{rows:c,leftSeats:s,rightSeats:i}=a.structure;for(let o=0;o<c;o++){const n=String.fromCharCode(65+o),t=[];for(let e=1;e<=s;e++)t.push(`${n}${e}`);const l=[];for(let e=1;e<=i;e++)l.push(`${n}${e+s}`);r.push({left:t,right:l})}return{rows:r}}export{u as D,y as U,g as a,S as g};
