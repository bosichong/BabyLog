function y(o){let e="",I=new Date(o),m=new Date,l=1e3*60,i=l*60,f=i*24,a=f*30,h=a*12,t=m-I,s=t/a,n=t/(7*f),r=t/f,d=t/i,u=t/l,p=t/h;return t<l?e="\u521A\u521A\u53D1\u8868":p>1?e=parseInt(p)+"\u5E74\u524D":s>1?e=parseInt(s)+"\u6708\u524D":n>1?e=parseInt(n)+"\u5468\u524D":r>1?e=parseInt(r)+"\u5929\u524D":d>1?e=parseInt(d)+"\u5C0F\u65F6\u524D":u>1?e=parseInt(u)+"\u5206\u949F\u524D":e="\u521A\u521A\u53D1\u8868",e}export{y as d};
