//格式化时间
function formatTime(timer, fmt) {
  var date = new Date(timer);
  var o = {
    "M+": date.getMonth() + 1,               //月份
    "D+": date.getDate(),                    //日
    "h+": date.getHours(),                   //小时
    "m+": date.getMinutes(),                 //分
    "s+": date.getSeconds(),                 //秒
    "q+": Math.floor((date.getMonth() + 3) / 3), //季度
    "w": date.getDay(),
    "S": date.getMilliseconds()             //毫秒
  };
  if (/(Y+)/.test(fmt)){
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
  }
  for (var k in o){
    if (new RegExp("(" + k + ")").test(fmt))
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  }
  return fmt;
}

//随机生成32位字符串
function randomString(len) {
  var length = len || 32;
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var maxPos = chars.length;
  var str = '';
  for (var i = 0; i < length; i++) {
    //0~32的整数
    str += chars.charAt(Math.floor(Math.random() * (maxPos + 1)));
  }
  return str;
}

//获取URL参数
function getUrlParam(name) {
  var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
  var r = window.location.search.substr(1).match(reg);
  if(r!=null)return  unescape(r[2]); return null;
}

//对象排序的函数
function objKeySort(arys) {
  //先用Object内置类的keys方法获取要排序对象的属性名，再利用Array原型上的sort方法对获取的属性名进行排序，newkey是一个数组
  var newkey = Object.keys(arys).sort();
  //console.log('newkey='+newkey);
  var newObj = {}; //创建一个新的对象，用于存放排好序的键值对
  for(var i = 0; i < newkey.length; i++) {
    //遍历newkey数组
    newObj[newkey[i]] = arys[newkey[i]];
    //向新创建的对象中按照排好的顺序依次增加键值对
  }
  return newObj; //返回排好序的新对象
}

//判断访问终端
var browser = {
  versions: function(){
    var u = navigator.userAgent,
      app = navigator.appVersion;
    return {
      trident: u.indexOf('Trident') > -1, //IE内核
      presto: u.indexOf('Presto') > -1, //opera内核
      webKit: u.indexOf('AppleWebKit') > -1, //苹果、谷歌内核
      gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1,//火狐内核
      mobile: !!u.match(/AppleWebKit.*Mobile.*/), //是否为移动终端
      ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端
      android: u.indexOf('Android') > -1 || u.indexOf('Adr') > -1, //android终端
      iPhone: u.indexOf('iPhone') > -1 , //是否为iPhone或者QQHD浏览器
      iPad: u.indexOf('iPad') > -1, //是否iPad
      webApp: u.indexOf('Safari') == -1, //是否web应该程序，没有头部与底部
      weixin: u.indexOf('MicroMessenger') > -1, //是否微信 （2015-01-22新增）
      qq: u.match(/\sQQ/i) == " qq" //是否QQ
    };
  }(),
  language:(navigator.browserLanguage || navigator.language).toLowerCase()
}

// 拼接请求参数
function parseParam(param){
  var arr = [];
  for (var i in param) {
    arr.push(i + '=' + param[i]);
  }
  return arr.join('&');
}

// 数字补零 
function fullZero(num) {
  if (num < 10) {
    return '0' + num;
  } else {
    return num.toString();
  }
}

/* 添加监听 */
function addEvent(obj,type,fn){
  if(obj.attachEvent){
    obj.attachEvent('on'+type,function(){
      fn.call(obj);
    })
  }else{
    obj.addEventListener(type,fn,false);
  }
}


// 滚动到页面底部 执行函数
function scrollBottom(cb) {
  addEvent(window,'scroll',function(){
    var pageHeight = document.body.offsetHeight - window.innerHeight;
    var scrollTop = window.scrollY + window.innerHeight;
    if ( scrollTop >= pageHeight) {
      cb && cb();
    }
  })
}

/* 返回顶部 */
addEvent(window,'scroll',function(){
  var scrollTop = window.scrollY;
  if (scrollTop > window.innerHeight) {
    document.getElementById('goTop').className = 'bgt-go-top bgt-top-button-show';
  } else {
    document.getElementById('goTop').className = 'bgt-go-top bgt-top-button-hide';
  }
});
document.getElementById('goTop').onclick = function () {
  window.scrollTo(0, 0);
};