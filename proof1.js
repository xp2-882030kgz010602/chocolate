var fs=require("fs");
var config=require("./config.json");
var period=config.period;
var ruleperiod=config.ruleperiod;
var horizontal=config.horizontal;
var width=config.width;
var step=config.step;
var length=2*(width+period);
var noprint=config.noprint;
var rt=config.rulethreshold;//RuleThreshold
var transitionintegerslist=eval(fs.readFileSync("./rules.txt",{encoding:"utf8",flag:"r"}));
var indiceslist=eval(fs.readFileSync("./indices.txt",{encoding:"utf8",flag:"r"}));
var evolve=function(x,trans){
  var y=[];
  for(var i=1;i<x.length-1;i++){
    var j=i-1;
    var one=x[i+1];
    var two=x[i];
    var four=x[i-1];
    var pos=one+2*two+4*four;
    y[j]=trans[pos];
  }
  return y;
};
var check1=function(x,transitions){
  var m=JSON.parse(JSON.stringify(x));
  for(var i=0;i<period;i++){
    var ytrans=transitions[i%ruleperiod];
    m=evolve(m,ytrans);
  }
  return m;
}
var pat2bin=function(pat){
  var bin=0;
  for(var i=0;i<pat.length;i++){
    bin*=2;
    bin+=pat[i];
  }
  while(bin%2===0&&bin>0){
    bin/=2;
  }
  return bin;
};
//console.log(pat2bin([0,1,0]));
var bin2pat=function(bin){
  var pat=[];
  while(bin>0){
    pat=[bin%2].concat(pat);
    bin-=bin%2;
    bin/=2;
  }
  return pat;
};
//console.log(bin2pat(11));
var pat2rle=function(pat){
  var rle="";
  var bo=".o";
  for(var i=0;i<pat.length;i++){
    rle+=bo[pat[i]];
  }
  while(rle.length<4*period+length){
    rle="."+rle+".";
  }
  return rle;
}
var rules=[];
var rule2bin=function(r){
    var bin=0;
    for(var i=0;i<8;i++){
        bin*=2;
        bin+=r[7-i];
    }
    return bin;
};
var cycle=function(x,y){
    var cycled=[];
    for(var i=0;i<x.length;i++){
        cycled.push(x[(i+y)%x.length]);
    }
    return cycled;
};
var rule_smaller=function(x,y){
    for(var i=0;i<x.length;i++){
        if(x[i]<y[i]){
            return true;
        }
        if(x[i]>y[i]){
            return false;
        }
    }
    return true;
};
var rule_largest=function(r){
    for(var i=1;i<r.length;i++){
        if(rule_smaller(r,cycle(r,i))){
            return false;
        }
    }
    return true;
};
var seen=[];//If we see each right end, we know exactly what rules we need to search.
//console.log("Test");
var visible=Math.pow(2,period-horizontal-1+width);
if(indiceslist.length>0){
  visible=0;
  var s=[];
  for(var i=0;i<indiceslist.length;i++){
    if(s.indexOf(indiceslist[i]%Math.pow(2,period-horizontal-1+width))===-1){
      s.push(indiceslist[i]%Math.pow(2,period-horizontal-1+width));
    }
  }
  visible=s.length;
}
var rer=[];//Right End Rules
var converted=false;
var check=function(pat,z,w){
  //The first <horizontal> entries MUST have B1c (16 possibilities), and the others don't care (32 possibilities).
  //Frontend transitions:
  //B1c B1e B2a B2c B3i
  //var hfab=false;//Has Front And Back
  var l=false;
  var r=false;
  var lr=false;
  var nre=false;//New Right End
  var transitionintegers=[];
  var x=0;
  if(transitionintegerslist.length>0){
    transitionintegers=transitionintegerslist[x];
    x+=1;
    if(rt===-1){
      console.log("Rules searched: 1/"+transitionintegerslist.length);
    }
  }else{
    for(var i=0;i<ruleperiod;i++){
      transitionintegers.push(0);
    }
  }
  //console.log("Test");
  var rs=0;//Rules Searched
  while(true){
    var transitionslist=[];
    var unbounded=0;
    var B1cs=0;
    transitionintegers[0]+=16;
    var large=rule_largest(transitionintegers);//Why check both rule cycle 1,2,3,4 and rule cycle 2,3,4,1?
    transitionintegers[0]-=16;
    if(large){
      if(!converted&&seen.indexOf(z%Math.pow(2,period-horizontal-1+width))===-1){
        seen.push(z%Math.pow(2,period-horizontal-1+width));
        nre=true;
        //console.log(seen.length);
        //console.log(Math.pow(2,period-horizontal-1+width));
      }
      for(var i=0;i<period;i++){
        var B1c;
        var B1e;
        var B2a;
        var B2c;
        var B3i;
        var transitions=bin2pat(transitionintegers[i%ruleperiod]);
        if((i%ruleperiod)*period/ruleperiod<horizontal){
          while(transitions.length<4){
            transitions=[0].concat(transitions);
          }
          B1c=1;
          B1e=transitions[0];
          B2a=transitions[1];
          B2c=transitions[2];
          B3i=transitions[3];
        }else{
          while(transitions.length<5){
            transitions=[0].concat(transitions);
          }
          B1c=transitions[0];
          B1e=transitions[1];
          B2a=transitions[2];
          B2c=transitions[3];
          B3i=transitions[4];
        }
        B1cs+=B1c;
        unbounded+=B1c||(B1e&&B2a);
        transitionslist.push([0,B1c,B1e,B2a,B1c,B2c,B2a,B3i]);
      }
    }
    if(unbounded<period&&B1cs>=horizontal&&large){//If <unbounded> equals <period>, then B1c or B1e2a exist in all generations, so the pattern explodes. If <B1cs> is less than <horizontal>, there isn't enough B1c to have the desired horizontal displacement.
      var pat1=check1(pat,transitionslist);//&&Math.abs(pat.indexOf(1)-pat1.indexOf(1)+period)===horizontal
      for(var i=0;i<period;i++){
        pat1=[0].concat(pat1);
        pat1.push(0);
      }
      var l0=[];
      var l1=[];
      var r0=[];
      var r1=[];
      for(var dx=0;dx<width;dx++){
        l0.push(pat[2*period+dx]);
        l1.push(pat1[2*period+dx+horizontal]);
      }
      for(var dx=0;dx<width;dx++){
        r0.push(pat[2*period+length+dx-width]);
        r1.push(pat1[2*period+length+dx+horizontal-width]);
      }
      //console.log(2*period+length+horizontal-width);
      var leakl=false;
      var leakr=false;
      for(var i=0;i<2*period+horizontal;i++){
        if(pat1[i]){
          leakl=true;
          break;
        }
      }
      for(var i=2*period+length+horizontal;i<4*period+length;i++){
        if(pat1[i]){
          leakr=true;
          break;
        }
      }
      var matchl=(JSON.stringify(l0)===JSON.stringify(l1)&&!leakl);
      var matchr=(JSON.stringify(r0)===JSON.stringify(r1)&&!leakr);
      l=l||matchl;
      r=r||matchr;
      lr=lr||(matchl&&matchr);
      if(matchr){
        if(!converted){
          //console.log(incomplete+" "+seen.length+" "+visible);
          rer.push(JSON.stringify(transitionintegers));
          //console.log(transitionintegers);
        }
      }
      if(matchl&&matchr){
        var pat2=JSON.parse(JSON.stringify(pat));
        if(!noprint){
          for(var i=0;i<period;i++){
            //console.log(pat2);
            console.log(pat2rle(pat2));
            pat2=evolve(pat2,transitionslist[i]);
          }
          console.log(pat2rle(pat2));
        }
        var ruleints=JSON.parse(JSON.stringify(transitionslist));
        for(var i=0;i<period;i++){
            ruleints[i]=rule2bin(ruleints[i]);
        }
        if(!noprint){
          if(w===-1){
            console.log("Pattern "+z+"/"+Math.pow(2,length-1));
          }else{
            console.log("Pattern "+z+"("+w+"/"+indiceslist.length+")");
          }
          console.log(JSON.stringify(ruleints));
          console.log(JSON.stringify(transitionintegers));
          console.log(JSON.stringify(transitionslist));
        }
        if(rules.indexOf(JSON.stringify(transitionintegers))===-1){
          rules.push(JSON.stringify(transitionintegers));
        }
        //hfab=true;
        //console.log(pat2);
        /*console.log(pat);
        console.log(pat1);
        console.log(transitionslist);
        console.log(f0);
        console.log(f1);
        hfab=true;*/
      }
    }
    var i=0;
    //console.log(transitionintegers);
    if(transitionintegerslist.length>0){
      if(x===transitionintegerslist.length){
        if(transitionintegerslist.length>=16*Math.pow(32,rt-1)){
          console.log("Rules searched for this pattern: "+x+"/"+transitionintegerslist.length);
        }
        return [l,r,lr];
      }
      transitionintegers=transitionintegerslist[x];
      x+=1;
      if(x%(16*Math.pow(32,rt-1))===0){
        console.log("Rules searched for this pattern: "+x+"/"+transitionintegerslist.length);
      }
    }else{
      transitionintegers[i]+=1;
      //Uncomment if you actually need this
      //if(rt===0&&i===0){
        //rs+=1;
        //console.log("Rules searched for this pattern: "+rs+"/"+16*Math.pow(32,ruleperiod-1));
      //}
      while((i<horizontal&&transitionintegers[i]===16)||(i>=horizontal&&transitionintegers[i]===32)){
       transitionintegers[i]=0;
       i+=1;
       if(i===rt&&rt>0){
         rs+=16*Math.pow(32,i-1);
         //rs=Math.ceil(rs);
         console.log("Rules searched for this pattern: "+rs+"/"+16*Math.pow(32,ruleperiod-1));
       }
       if(i===ruleperiod){
         return [l,r,lr];
       }
       transitionintegers[i]+=1;
      }
    }
  }
  return [l,r,lr];
}
//console.log(check1([0,0,0,0,1,1,0,1,0,0,0,0],[1,0,1,0],[1,0,1,0]));
//console.log("Test");
var i=0;
var indices=[];
if(indiceslist.length>0&&indiceslist[0]>0){
  i=indiceslist[0];
  //console.log(0+"/"+indiceslist.length);
}
var bannedrightends=[];//These right ends work in NO rules
while(i<Math.pow(2,length-2)){
  //console.log(rer.length);
  if(seen.length===visible&&!converted){
    //console.log("Test");
    converted=true;
    console.log("Deduping right end rules to achieve speedup. This will happen only once per search, after all right end rules have been found. THIS MAY TAKE A WHILE.");
    transitionintegerslist=[];
    rer.sort();
    //console.log(rer);
    for(var j=0;j<rer.length;j++){
      //rer[j]=JSON.parse(rer[j]);
      if(j===0||rer[j]!==rer[j-1]){
        transitionintegerslist.push(rer[j]);
      }
    }
    //console.log(transitionintegerslist);
    for(var j=0;j<transitionintegerslist.length;j++){
      transitionintegerslist[j]=JSON.parse(transitionintegerslist[j]);
    }
    //transitionintegerslist=JSON.parse(JSON.stringify(rer));
  }
  //console.log(i);
  var pat=bin2pat(i);
  while(pat.length<length-2){
    pat=[0].concat(pat);
  }
  pat=[1].concat(pat);
  pat.push(1);
  for(var j=0;j<2*period;j++){
    pat=[0].concat(pat);
    pat.push(0);
  }
  //console.log(pat);
  if(i%step===0&&indiceslist.length===0){
    console.log(i+"/"+Math.pow(2,length-2));
  }else if(indiceslist.indexOf(i)%step===0){
    console.log(Math.max(0,indiceslist.indexOf(i))+"/"+indiceslist.length+" (Pattern "+i+"/"+Math.pow(2,length-2)+")");
  }
  var match=check(pat,i,indiceslist.indexOf(i));
  if(match[2]){
    indices.push(i);
    //console.log("Test");
  }
  if(!match[1]){
    bannedrightends.push(i%Math.pow(2,period-horizontal-1+width));
  }
  if(indiceslist.length>0){
    var x=indiceslist.indexOf(i);
    x+=1;
    var left=i-i%Math.pow(2,period-horizontal-1+width);
    //var il=(!match[0]&&left===(indiceslist[x]-indiceslist[x]%Math.pow(2,period-horizontal-1+width)));
    //var ir=(bannedrightends.indexOf(indiceslist[x]%Math.pow(2,period-horizontal-1+width)));
    while(x<indiceslist.length&&((!match[0]&&left===(indiceslist[x]-indiceslist[x]%Math.pow(2,period-horizontal-1+width)))||bannedrightends.indexOf(indiceslist[x]%Math.pow(2,period-horizontal-1+width))>-1)){
      x+=1;
    }
    if(x>=indiceslist.length){
      i=Infinity;
    }else{
      i=indiceslist[x];
    }
  }else{
    if(match[2]||match[0]){
      i+=1;
    }else{
      if(!match[0]){//Illegal left end, skip to the next one
        i-=i%Math.pow(2,period-horizontal-1+width);
        i+=Math.pow(2,period-horizontal-1+width);
      }
    }
    while(i<Math.pow(2,length-2)&&bannedrightends.indexOf(i%Math.pow(2,period-horizontal-1+width))>-1){
      i+=1;
    }
  }
}
if(indiceslist.length===0){
  console.log(i+"/"+Math.pow(2,length-2));
}else{
  console.log(Math.max(0,indiceslist.indexOf(i))+"/"+indiceslist.length+" (Pattern "+i+"/"+Math.pow(2,length-2)+")");
}
if(!noprint){
  console.log(JSON.stringify(indices));
}
fs.writeFileSync("./indices.txt",JSON.stringify(indices));
for(var i=0;i<rules.length;i++){
  rules[i]=JSON.parse(rules[i]);
}
if(!noprint){
  console.log(JSON.stringify(rules));
}
fs.writeFileSync("./rules.txt",JSON.stringify(rules));
console.log("Indices: "+indices.length);
console.log("Rules: "+rules.length);
console.log("Extending patterns from w"+width+" to w"+(width+1)+"...");
var exec = require('child_process').exec,child;
child = exec('node ./extend.js',
function (error, stdout, stderr) {
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if (error !== null) {
        console.log(error);
    }
});