---
layout:     post
title:      "图形图像处理-给有Alpha通道的图片加夜间遮罩方法"
subtitle:   " \"混合模式\""
date:       2017-01-01 12:00:00
author:     "VentureLi"
header-img: "img/post-bg-ios9-web.jpg"
catalog: true
tags:
    - iOS
    - 图形图像处理
---

# 给有Alpha通道的图片加夜间遮罩

## 问题产生
ventureli 在负责ipadQQ浏览器的首页快链接的时候遇到需要给有透明图片加夜间遮罩的问题，如下图
![](/img/postimg/alphaaddmask/1.png)
由于QQ浏览器支持夜间版本，整个首页在夜间模式下如下图
![](/img/postimg/alphaaddmask/yejian.png)
这个看起来很简单，问题是我们的图片并不都是完全的方形的，有时候是有Alpha通道的，比如漫画模块的图标就有很多图标可以选，如下图
<div  align="center">    
<!--![](../img/postimg/alphaaddmask/3.png) -->
<img src="/img/postimg/alphaaddmask/3.png" width="400px" />

此时需要的效果是这样的。

<img src="/img/postimg/alphaaddmask/4.png" width="360px" />
<!--![](../img/postimg/alphaaddmask/4.png) -->
</div>

根据以往的经验，给图片加夜间遮罩只需要给图片加上一个透明度50%黑色的mask即可，此时写出来代码后，结果如下。
<div  align="center" >    
<img src="/img/postimg/alphaaddmask/5.png" width="300px" />
</div>

**那么要如何解决这个问题呢？**

## 解决方案
### 方案1
解决方案一比较简单了。我们只需要利用简单的图形图像处理，在每次拿到图片的时候仔后台重新生成一个夜间的遮罩对应的图片即可。方案如下

<div  align="center" >    
<img src="/img/postimg/alphaaddmask/6.png" width="500px" />
</div>
**此方法当然可行，就是要用到额外的存储空间，而且我们的icon分了好几个尺寸分别应对横竖屏，分屏模式等情况，占用的额外存储空间要更多。**

### 方案2
解决方案二我们是最先想到的，但是没有采用，这个方案就是针对整个window添加一个黑色遮罩，这样就不会有了其他的图片问题的，也就是说在整个APP层面加上黑色遮罩，然后在调整其他的空间的底色。但是这个方法是不可用的。原因如下：

 * 当时我们的设计的所有标注都是按照各个控件和区域独立标注的，并没有整体遮罩的概念，如果这样做的话，所有其他部分的控件都要进行颜色更新，因为给全局加上遮罩，其他已开发号的模块必然变得更黑。
 * 我们开发成员每个人负责了一个模块，不仅仅是夜间模式，而且我们还有皮肤的概念，夜间模式更像是一种皮肤，这样把整体情况搞得更加复杂。成员之间每个人的实现方法不一样，该起来时间成本也是很好的。
 
**由于以上两个原因，我放弃了这种实现方案。**

### 方案3
这种方案是我在深入理解iOS CoreGraphics中的混合模式之后想到了，首先我们需要知道iOS中的混合模式，整个iOS的混合模式列表在CGContent.h 中定义，具体的内容我会再开一个博客专门介绍混合模式和酷酷头像的实现方案。学过PS的都知道，PS中不同的图层之间有一个混合模式，iOS中的和这个是一样的。
<div  align="center" >    
<img src="/img/postimg/alphaaddmask/7.png" width="500px" />
<img src="/img/postimg/alphaaddmask/8.png" width="500px" />
</div>

而我们平时在iOS中不同的色值的View叠加后的颜色就是用的正常的kCGblendModeNormal模式，相当于在背景色上加上一个有alpha通道的计算公式如下：

		C2 = 背景色
		a2 = 1.0
		C1 = 前景色
		a1=  前景色透明度
		C2 = 结果颜色
		针对rgb三个通道分别计算：
		C3 = C1 * a1 + C2 *a2
		也就是说 如果一个底色为白色的View（rgba：255，255，255,1.0） 加上一个rgba(100,100,100,0.3)的颜色时候，那么结果颜色是什么呢？
		结果：r=g=b = 100*0.3 + 255*(1-0.3）
**注意：这里我们默认背景色是不透明的(alpha = 1.0)如果也透明的话，公式如下：我就不为大家推导了**
<div  align="center" >    
<img src="/img/postimg/alphaaddmask/10.png" width="200px" />
</div>

根据以上的共识我们其实是可以通过公式计算出一个特殊的色值给imageView的backgroundcolor，让imageview的backgroudcolor和mask一起叠加后形成整个快链区域的背景色：同时给透明像素也加上了遮罩：

		假如我们要给图片加一个黑色0.5的遮罩（rgba：0，0，0，0.5），整个黑色背景的颜色为：rgba（20，20，20，1.0），那么我们怎么算给imageView的背景色呢？流程如下：
<div  align="center" >    
	<img src="/img/postimg/alphaaddmask/11.png" width="500px" />
</div>
所以我们只需要在夜间模式的时候给透明ImageView的颜色设置成：RGB（40，40，40，1.0）同时加上一个（rgb：0，0，0.5）的遮罩就可以了。最后结果如下：

* 日间模式 不加遮罩，imageView的backgroundcolor为clearcolor
* 夜间模式 加（0，0，0，0.5）遮罩，同时imageView的backgroundcolor 为：（40，40，40，1.0）


最后我才用这种方式来实现有透明度图片的遮罩问题，完美解决，没有任何的额外存储空间使用，我们需要的只是一个magic color。 
		

