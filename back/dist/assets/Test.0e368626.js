import{b as s,o as n,d as c,c as i,w as r,g as _,e as p}from"./index.d093a765.js";const l={style:{"text-align":"center",position:"fixed",width:"350px",height:"200px",top:"0",bottom:"0",left:"0",right:"0",margin:"auto"}},u={__name:"Test",setup(d){const e=o=>{_.post("/v1/casbin_rule_test").then(t=>{console.log(t.data)})};return(o,t)=>{const a=s("a-button");return n(),c("div",l,[i(a,{type:"primary",onClick:e},{default:r(()=>[p("test")]),_:1})])}}};export{u as default};
