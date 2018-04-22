---
layout:     post
title:      "<酷酷头像>乐高拼图算法"
subtitle:   " \"酷酷头像算法\""
date:       2016-06-09 12:00:00
author:     "VentureLi"
header-img: "img/home-bg-art.jpg"
catalog: true
tags:
    - iOS
    - android
    - 酷酷头像
    - 图形图像处理
---

# <酷酷头像>乐高拼图算法
## 介绍
>venture之前介绍了酷酷头像中的文字云算法，这次介绍下乐高拼图算法，这个算法比较简单。如果之前看过我的博客：<a href="https://ventureli.github.io/2017/06/05/wordcloud/"><酷酷头像>文字云算法</a>的话，应该能很快就能写出来这个算

**原图**
<div  align="center" >    
<img src="/img/postimg/legao/3.png" />
</div>
**效果图**

<div  align="center" >    
<img src="/img/postimg/legao/4.png" />
</div>

>这个算法不难，但是效果非常好，看起来酷酷的，下面详细介绍下乐高拼图的算法（iOS实现），其他客户端比如js，android请自行翻译

## 算法概括
>算法总的思路如下：
>
> * 0.修正饱和度
> * 1.图片转为像素
> * 2.像素马赛克
> * 3.加按钮混合
>

## 0修正饱和度和色彩区间 和1图片转像素
>为什么要修正图片的饱和度呢？因为我们很多图片的颜色比较淡，颜色不是十分饱和，也就说颜色不是很鲜艳，我们做乐高拼图可以先增加下饱和度，效果比较好，venture自己写了一个图形图像处理库，直接调用就可以了。同时为了保证能够很好拉开色值差别，还进行了一次通道修正，也就说如果所有的rgb通道都在：100-200区间的时候怎么办呢？，要进行拉伸，扩大rgb空间，这个venture并没有严格的计算，只是简单的与系数相乘进行的处理。
>

``` 
- (void)viewDidLoad {
    [super viewDidLoad];
    [self.view setBackgroundColor:[UIColor whiteColor]];
    
    UIImage *forimage = [UIImage imageNamed:@"huangren.jpg"];
    UIImage *cellImage = [UIImage imageNamed:@"legaocell.jpg"];
    
    UIImage *newImage = [self getNewImageWithImage:cellImage withSize:forimage.size];
    
    //修正饱和度和亮度
    forimage = [KPTImageTool fixImage:forimage withSaturtion:1.8 brightIness:0 contrast:1];
    KPTLayer *kptForLayer= [[KPTLayer alloc] initWithUIImage:forimage];
    
    //颜色值拉伸
    if(kptForLayer.graymax > 240)
    {
        [KPTImageTool fixLayerWithBrigteRate:kptForLayer withRate:0.8];
    }else if(kptForLayer.graymax < 200)
    {
        [KPTImageTool fixLayerWithBrigteRate:kptForLayer withRate:1.1];
    };
 

    [KPTImageTool maSaikeForLegao:kptForLayer width:CELL_SIZE ];

    KPTLayer *forLayer = [[KPTLayer alloc] initWithUIImage:newImage];
    [forLayer addKPTCanvas:kptForLayer withBlendMode:kKPTBlendModeLinearGlow position:CGPointZero];
    
    UIImageView *imageView = [[UIImageView alloc] initWithFrame:CGRectMake(0, 100, self.view.bounds.size.width, self.view.bounds.size.height)];
    imageView.contentMode = UIViewContentModeScaleAspectFit;
    
    UIImage *resImage = [forLayer createUIImage];
   
    imageView.image = resImage;
    [self.view addSubview:imageView];
    
}
    

```
修正饱和度的算法如下：

```
//通过CoreImage图形图像处理库的滤镜进行处理
+ (UIImage *)fixImage:(UIImage *)image withSaturtion:(float)saturation brightIness:(float)brightness contrast:(float)contrast
{
    CIFilter *_colorControlsFilter;//色彩滤镜
    CIContext *_context;//Core Image上下文
    _context=[CIContext contextWithOptions:nil];
    _colorControlsFilter=[CIFilter filterWithName:@"CIColorControls"];
    CIImage *_image=[CIImage imageWithCGImage:image.CGImage];
    [_colorControlsFilter setValue:_image forKey:@"inputImage"];
    [_colorControlsFilter setValue:[NSNumber numberWithFloat:saturation] forKey:@"inputSaturation"];//设置滤镜参数 //1
    [_colorControlsFilter setValue:[NSNumber numberWithFloat:contrast] forKey:@"inputContrast"];           //1
    [_colorControlsFilter setValue:[NSNumber numberWithFloat:brightness] forKey:@"inputBrightness"];//设置滤镜参数 //0
    CIImage *outputImage= [_colorControlsFilter outputImage];//取得输出图像
    CGImageRef temp=[_context createCGImage:outputImage fromRect:[outputImage extent]];
    UIImage *newimage=[UIImage imageWithCGImage:temp];//转化为CGImage显示在界面中    CGImageRelease(temp);//释放CGImage对象
    
    return newimage;
}

+ (void)fixLayerWithBrigteRate:(KPTLayer *)layer withRate:(float) rate
{
    for(int y = 0 ; y < layer.height ; y ++)
    {
        for (int x = 0 ; x < layer.width; x ++)
        {

            KPTRGBPixel *pixel = layer.RGBPixels[y][x];


            pixel.RED = pixel.RED * rate;
            pixel.GREEN = pixel.GREEN * rate;
            pixel.BLUE = pixel.BLUE * rate;
        }
    }
}
```


## 2马赛克
>马赛克简单，就是对step*step的方块内所有像素点的亚瑟根据rgb三个通道都取一个平均值，然后把这个方块内的所有颜色都设定为平均色，但是这里需要有一个注意点
>但是这里有一个注意点，就是当rgb颜色趋近于白色和黑色的时候不能采用这两种颜色，所以不能够完全才有特别接近黑色和特别接近白色的色值

**为什么不是0-255呢？后面混合的时候就会知道答案了**

```

+ (void)maSaikeForLegao:(KPTLayer *)layer width:(int)width
{
    if(width <=1)
    {
        return;
    }
    
    int totalRED = 0;
    int totalGreen = 0;
    int totalBLUE = 0;
    int totalAlpha = 0;
    
    int count = 0;
    for(int y = 0 ; y < layer.height ; y +=width)
    {
        for (int x = 0 ; x < layer.width; x +=width)
        {
            
            //
            totalRED = 0;
            totalGreen = 0;
            totalBLUE = 0;
            totalAlpha = 0;
            count = 1;
            int finalY = (y + width) < layer.height? (y+width):layer.height;
            int finalX = (x +width) < layer.width ?(x+width) :layer.width;
            for(int i = y ; i < finalY; i ++)
            {
                for (int j = x; j < finalX; j ++)
                {
                    KPTRGBPixel *pixel = layer.RGBPixels[i][j];
                    totalRED += pixel.RED;
                    totalBLUE += pixel.BLUE;
                    totalGreen += pixel.GREEN;
                    totalAlpha += pixel.ALPHA;
                    count +=1;
                }
            }
            int perRED = totalRED/count;
            int perGreen = totalGreen/count;
            int perBlue = totalBLUE/count;
            
            float r , g ,b , h , s ,v;
            r  = perRED / 255.0;
            g = perGreen / 255.0;
            b = perBlue / 255.0;
            
            RGBtoHSV(r , g , b , &h, &s, &v);
            int fixb  = 0;
            int fixS = 0;
            if(v < 0.35)
            {
                fixb = 1;
                v = 0.35;
            }
            
            
//            if(x < (int)(layer.width/2 + width) && x > ((int)(layer.width/2) -width ) )
//            {
//                NSLog(@"adafdadf");
//            }
//
            HSVtoRGB(&r, &g, &b, h, s, v);
            for(int i = y ; i < finalY; i ++)
            {
                for (int j = x ; j < finalX; j ++)
                {
                    KPTRGBPixel *pixel = layer.RGBPixels[i][j];
                    if(fixb == 1)
                    {
                        r = 80/255.0;
                        g = 80/255.0;
                        b = 80/255.0;
                    }
                    if(r > 0.9 && g > 0.9 && b > 0.9)
                    {
                        
                        r = 0.9;
                        g = 0.9;
                        b = 0.9;
                    }
                    pixel.RED = (RGBINT)(r * 255.0);
                    pixel.GREEN = (RGBINT)(g * 255.0);
                    pixel.BLUE = (RGBINT)(b * 255.0);
                    
                }
            }
            
        }
    }
    
}
@end
```


## 3进行按钮混合
>这里我们需要另外一张图片，这张图片就是乐高拼图的关键，图片如下：
>

<div  align="center" >    
<img src="/img/postimg/legao/5.jpg" />
</div>

>然后我们把这张图片屏幕在刚才生成的马赛克图上，混合模式选择：线性光,这个是venture自己实现的混合模式中的一个算法,其实这个算法非常简单
>
>针对每一个通道公式为 C = A+2*B -1.0

>float rgbff = (target.RED + 2 *from.RED - 255.0)/255.0，进行叠加

```
void kKPTBlendModeLinearGlowFunction(KPTRGBPixel *target , const KPTRGBPixel *from)
{
    float fa = from.ALPHA/255.0;
    float ta = target.ALPHA/255.0;
    float ra = fa  + ta*(1.0 - fa);
    
    float rgbf = from.RED/255.0;
    float rgbt = target.RED/255.0;
    //red
    float rgbff = (target.RED + 2 *from.RED - 255.0)/255.0;
    if(rgbff < 0)
    {
        rgbff = 0;
    }
    if(rgbff > 1)
    {
        rgbff =1;
    }
    float rgbr =  (rgbff * fa + rgbt * ta*(1 - fa))/ra;
    target.RED = (RGBINT)(rgbr * 255.0);
    //green
    rgbf = from.GREEN/255.0;
    rgbt = target.GREEN/255.0;
    rgbff = (target.GREEN + 2 *from.GREEN - 255.0)/255.0;
    if(rgbff < 0)
    {
        rgbff = 0;
    }
    if(rgbff > 1)
    {
        rgbff =1;
    }
    rgbr =  (rgbff * fa + rgbt * ta*(1 - fa))/ra;
    target.GREEN = (RGBINT)(rgbr * 255.0);
    //blue
    rgbf = from.BLUE/255.0;
    rgbt = target.BLUE/255.0;
    rgbff = (target.BLUE + 2 *from.BLUE - 255.0)/255.0;
    if(rgbff < 0)
    {
        rgbff = 0;
    }
    if(rgbff > 1)
    {
        rgbff =1;
    }
    rgbr =  (rgbff * fa + rgbt * ta*(1 - fa))/ra;
    target.BLUE = (RGBINT)(rgbr * 255.0);
    target.ALPHA  = (RGBINT)(ra * 255.0);
    
}
```
**注意**把cell和image进行混合后，出现一个问题，就是纯白色和纯黑色附近的色值和legaocell混合后没有出现legaocell的轮廓，依然是白色和黑色,比如下图这种情况
<div  align="center" >    
<img src="/img/postimg/legao/6.png" />
</div>

所以我们对马赛克生成的颜色区域进行了限定，结果如下：
<div  align="center" >    
<img src="/img/postimg/legao/0.png" />

</div>
**这个就比较完美了**
最后放两张女神图，能看出来是谁吗？哈哈
<div  align="center" >    
<img src="/img/postimg/legao/7.png" />
</div>