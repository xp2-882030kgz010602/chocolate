var fs=require("fs");
var config=require("./config.json");
var period=config.period;
var ruleperiod=config.ruleperiod;
var horizontal=config.horizontal;
var step=config.step;
var noprint=config.noprint;
var transitionintegerslist=eval(fs.readFileSync("./rules.txt",{encoding:"utf8",flag:"r"}));
var indiceslist=[];
//var indiceslist=eval(fs.readFileSync("./indices.txt",{encoding:"utf8",flag:"r"}));
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
var pat2rle=function(pat,length){
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
var known=[];
var check=function(pat,z,w){
  //The first <horizontal> entries MUST have B1c (16 possibilities), and the others don't care (32 possibilities).
  //Frontend transitions:
  //B1c B1e B2a B2c B3i
  var hfab=false;//Has Front And Back
  var transitionintegers=[];
  var x=0;
  if(transitionintegerslist.length>0){
    transitionintegers=transitionintegerslist[x];
    x+=1;
  }else{
    for(var i=0;i<ruleperiod;i++){
      transitionintegers.push(0);
    }
  }
  while(true){
    var transitionslist=[];
    var unbounded=0;
    var B1cs=0;
    transitionintegers[0]+=16;
    var large=rule_largest(transitionintegers);//Why check both rule cycle 1,2,3,4 and rule cycle 2,3,4,1?
    transitionintegers[0]-=16;
    if(large){
      for(var i=0;i<period;i++){
        var B1c;
        var B1e;
        var B2a;
        var B2c;
        var B3i;
        var transitions=bin2pat(transitionintegers[i%ruleperiod]);
        if(i%ruleperiod<horizontal){
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
    //console.log(B1cs);
    if(unbounded<period&&B1cs>=horizontal&&large){///If <unbounded> equals <period>, then B1c or B1e2a exist in all generations, so the pattern explodes. If <B1cs> is less than <horizontal>, there isn't enough B1c to have the desired horizontal displacement.
      //console.log("Test");
      var pat1=check1(pat,transitionslist);//&&Math.abs(pat.indexOf(1)-pat1.indexOf(1)+period)===horizontal
      for(var i=0;i<period;i++){
        pat1=[0].concat(pat1);
        pat1.push(0);
      }
      /*for(var i=0;i<horizontal;i++){
        pat=[0].concat(pat);
        pat1.push(0);
      }*/
      //console.log(2*period+length+horizontal-width);
      //console.log(pat);
      //console.log(pat1);
      if(pat2bin(pat)===pat2bin(pat1)&&pat1.indexOf(1)>pat.indexOf(1)){
        var seq="";
        var pat2=JSON.parse(JSON.stringify(pat));
        for(var i=0;i<period;i++){
          //console.log(pat2);
          var rle=pat2rle(pat2,pat.length);
          //console.log(rle);
          seq+=rle+"\n";
          pat2=evolve(pat2,transitionslist[i]);
        }
        seq+=pat2rle(pat2,pat.length);
        //console.log(pat2rle(pat2,pat.length));
        if(known.indexOf(seq)===-1){
          known.push(seq);
          fs.appendFileSync("./frontends.txt",seq+"\n\n");
          if(!noprint){
            var ruleints=JSON.parse(JSON.stringify(transitionslist));
            for(var i=0;i<period;i++){
                //console.log(rule2bin(ruleints[i]))
                ruleints[i]=rule2bin(ruleints[i]);
            }
            if(w===-1){
              console.log("Pattern "+z);
            }else{
              console.log("Pattern "+z+"("+w+"/"+indiceslist.length+")");
            }
            console.log(seq);
            console.log(ruleints);
            console.log(transitionintegers);
            console.log(transitionslist);
          }
          //if(rules.indexOf(JSON.stringify(transitionintegers))===-1){
            //rules.push(JSON.stringify(transitionintegers));
          //}
          hfab=true;
        }
      }
    }
    var i=0;
    //console.log(transitionintegers);
    if(transitionintegerslist.length>0){
      if(x===transitionintegerslist.length){
        return hfab;
      }
      transitionintegers=transitionintegerslist[x];
      x+=1;
    }else{
      transitionintegers[i]+=1;
      while((i<horizontal&&transitionintegers[i]===16)||(i>=horizontal&&transitionintegers[i]===32)){
       transitionintegers[i]=0;
       i+=1;
       if(i===ruleperiod){
         return hfab;
       }
       transitionintegers[i]+=1;
      }
    }
  }
  return hfab;
}
//console.log(check1([0,0,0,0,1,1,0,1,0,0,0,0],[1,0,1,0],[1,0,1,0]));
//console.log("Test");
var i=1;
var indices=[];
while(i<Infinity){
  var pat=bin2pat(i);
  //pat=[1].concat(pat);
  pat.push(1);
  //console.log(pat);
  for(var j=0;j<2*period;j++){
    pat=[0].concat(pat);
    pat.push(0);
  }
  //console.log(pat);
  if(check(pat,i,indiceslist.indexOf(i))){
    indices.push(i);
  }
  if(i%step===0&&indiceslist.length===0){
    console.log(i);
  }
  if(x%step===0&&indiceslist.length!==0){
    console.log(i);
  }
  if(indiceslist.length>0){
    var x=indiceslist.indexOf(i);
    x+=1;
    if(x>indiceslist.length){
      i=Infinity;
    }else{
      i=indiceslist[x];
    }
  }else{
    i+=1;
  }
}
/*console.log(JSON.stringify(indices));
for(var i=0;i<rules.length;i++){
  rules[i]=JSON.parse(rules[i]);
}
console.log(JSON.stringify(rules));*/
