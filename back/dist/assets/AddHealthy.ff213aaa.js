import{_ as g,k as f,a as h,b as s,o as y,d as v,c as o,w as l,g as u,f as w,e as k,M as i}from"./index.dfad7078.js";const x={class:"register"},H={__name:"AddHealthy",setup(A){const _=f(()=>!(e.height&&e.weight&&e.babys[1][0])),b=()=>{u.post("/v1/blog/create_healthy",{height:e.height,weight:e.weight,babys:e.babys}).then(a=>{a.data?i.info().update({title:"\u63D0\u793A!",content:"\u6DFB\u52A0\u6210\u529F!",onOk:()=>{}}):i.error().update({title:"\u9519\u8BEF!",content:"\u6DFB\u52A0\u5931\u8D25!\u8BF7\u68C0\u67E5\u6743\u9650\u53C2\u6570"})}).catch(function(a){i.error().update({title:"\u9519\u8BEF!",content:"\u6DFB\u52A0\u5931\u8D25!"+a.response.data.detail})})},e=h({height:0,weight:0,babys:[[],[]]});return(()=>{console.log("kaishi"),u.get("/v1/blog/get_baby_names").then(function(a){e.babys=a.data.babys})})(),(a,t)=>{const p=s("a-radio-group"),d=s("a-form-item"),r=s("a-input"),c=s("a-button"),m=s("a-form");return y(),v("div",x,[o(m,{model:e},{default:l(()=>[o(d,null,{default:l(()=>[o(p,{value:e.babys[1],"onUpdate:value":t[0]||(t[0]=n=>e.babys[1]=n),options:e.babys[0]},null,8,["value","options"])]),_:1}),o(d,null,{default:l(()=>[o(r,{value:e.height,"onUpdate:value":t[1]||(t[1]=n=>e.height=n),"addon-before":"Height:"},null,8,["value"])]),_:1}),o(d,null,{default:l(()=>[o(r,{value:e.weight,"onUpdate:value":t[2]||(t[2]=n=>e.weight=n),"addon-before":"Weight:"},null,8,["value"])]),_:1}),o(d,{"wrapper-col":{span:24,offset:0}},{default:l(()=>[o(c,{disabled:w(_),type:"primary",onClick:t[3]||(t[3]=n=>b()),block:""},{default:l(()=>[k("\u63D0\u4EA4")]),_:1},8,["disabled"])]),_:1})]),_:1},8,["model"])])}}},U=g(H,[["__scopeId","data-v-d5bb4481"]]);export{U as default};