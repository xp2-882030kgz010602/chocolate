var fs=require("fs");
var config=require("./config.json");
var width=config.width;
var period=config.period;
var horizontal=config.horizontal;
var size=width+period-1;
var indiceslist=eval(fs.readFileSync("./indices.txt",{encoding:"utf8",flag:"r"}));
var pat2bin=function(pat){
  var bin=0;
  for(var i=0;i<pat.length;i++){
    bin*=2;
    bin+=pat[i];
  }
  while(bin%2===0&&bin>0){
    bin/=2;
  }
  if(bin>=9007199254740992){
    throw new Error("53-bit limit reached.");//This error is not supposed to be caught. By letting the process crash, this avoids writing incorrect data to the disk.
  }
  return bin;
};
var bin2pat=function(bin){
  var pat=[];
  while(bin>0){
    pat=[bin%2].concat(pat);
    bin-=bin%2;
    bin/=2;
  }
  return pat;
};
var extend=function(index){
  var pat=bin2pat(index);
  while(pat.length<2*size){
    pat=[0].concat(pat);
  }
  var l=pat.slice(0,size+horizontal);
  var r=pat.slice(size+horizontal,2*size);
  var zero=l.concat([0,0],r);
  var one=l.concat([0,1],r);
  var two=l.concat([1,0],r);
  var three=l.concat([1,1],r);
  zero.push(1);
  one.push(1);
  two.push(1);
  three.push(1);
  /*console.log(pat);
  console.log(zero);
  console.log(one);
  console.log(two);
  console.log(three);*/
  return [(pat2bin(zero)-1)/2,(pat2bin(one)-1)/2,(pat2bin(two)-1)/2,(pat2bin(three)-1)/2];
};
var extended=[];
for(var i=0;i<indiceslist.length;i++){
  var x=extend(indiceslist[i]);
  for(var j=0;j<4;j++){
    extended.push(x[j]);
  }
  //extended=extended.concat(extend(indiceslist[i]));
}
extended.sort(function(a,b){
    return a-b;
});
//console.log(JSON.stringify(extended));
fs.writeFileSync("./indices.txt",JSON.stringify(extended));//node ./extend.js > indices.txt doesn't work for some reason
config.width+=1;
config.step*=config.stepfactor;
fs.writeFileSync("./config.json",JSON.stringify(config));
