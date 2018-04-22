---
layout:     post
title:      "<酷酷头像>图片转文字云的算法"
subtitle:   " \"酷酷头像算法\""
date:       2016-06-05 12:00:00
author:     "VentureLi"
header-img: "img/home-bg-art.jpg"
catalog: true
tags:
    - iOS
    - android
    - 酷酷头像
    - 图形图像处理
---

# 图片转文字云算法
>venture（作者自称：腾讯rtx：fatboyli）在自己的小APP酷酷头像，在写的时候，需要写一个图片转文字云的算法，这里进行一个详细的介绍。
效果主要如下：
<div  align="center" >    
<img src="/img/postimg/wordcloud/0.png" width="500px" />
</div>

**那么这样一个效果的话在需要怎样实现呢？**

## 算法概括
>在进行算法详细解释之前先说下算法总的步骤，如下：
> 
> * 1.把原图转为像素
> * 2.把图片像素马赛克
> * 3.图片像素二值化
> * 4.对相连的黑色像素进行长度探索，把黑色区域切分成一不同小方块集合
> * 5.记录小方块后，遍历小方块，对每个小方块进行文字填充
>

## 算法详细讲解
### 1图片转为像素
>这一步其实是最简单的了，只要利用iOS 中CoreGrphics中的库，这里有一个注意事项，venture在做的过程中发现图片的尺寸大小不一，这样用一套算法出来后，对特别小的图片处理的轮廓非常粗糙，所以这里做了一个简单的标准化，如果长度不足1200像素的，都按照1200像素进行了扩大。

```
- (NSMutableArray *)createKPTPixelsWithUIImage:(UIImage *)oldimage outsize:(CGSize *)size
{
    if (!oldimage)
    {
        return nil;
    }
    int width = oldimage.size.width;
    int height = oldimage.size.height;
    CGFloat rate = (height+0.0)/(width + 0.0);
    if (width < 1200)
    {
        width = 1200;
        height = width *rate;
    }
    size->width = width;
    size->height = height;
    //fill the pixels
    u_int32_t *pixelsraw= (u_int32_t *) malloc(width * height * sizeof(u_int32_t));
    
    CGImageRef spriteImage = oldimage.CGImage;
    
    CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
    CGContextRef context = CGBitmapContextCreate(pixelsraw, width, height, 8, width * sizeof(u_int32_t), colorSpace,kCGBitmapByteOrder32Little | kCGImageAlphaPremultipliedLast);
    CGContextSetBlendMode(context, kCGBlendModeCopy);
    CGContextDrawImage(context, CGRectMake(0, 0, width, height), spriteImage);
    
    
    NSMutableArray * RGBPixels = nil;
    RGBPixels = [[NSMutableArray alloc] initWithCapacity:height];
    //init the Data
    int count  = width * height;
    long graySum = 0;
    
    
    //转换成ventureli自己定义的像素对象，可以比较好的存取数据
    for(int y = 0; y < height; y++)
    {
        NSMutableArray * array = [[NSMutableArray alloc] initWithCapacity:width];
        
        for(int x = 0; x < width; x++)
        {
            uint8_t *rgbaPixelAlgha =(uint8_t *)((uint32_t *) &pixelsraw[y * width + x]);
            uint8_t *rgbaPixel =(uint8_t *)((uint32_t *) &pixelsraw[y * width + x]);
            KPTRGBPixel *pixel = [KPTRGBPixel new];
            pixel.RED = rgbaPixel[RED];
            pixel.GREEN =rgbaPixel[GREEN];
            pixel.BLUE = rgbaPixel[BLUE];
            pixel.ALPHA = rgbaPixel[ALPHA];
            [array addObject:pixel];
            graySum += pixel.GRAY;
        }
        [RGBPixels addObject:array];
        
    }
    ** 后续处理略过 **
    ...

```
这里我自己自己定义了个新的KPTRGBPixel对象供整个酷酷头像项目公用，对象定义如下：

```
@interface KPTRGBPixel : NSObject

@property (nonatomic ,assign)RGBINT             RED;
@property (nonatomic ,assign)RGBINT             GREEN;
@property (nonatomic ,assign)RGBINT             BLUE;
@property (nonatomic ,assign)RGBINT             ALPHA;
@property (nonatomic ,assign)int                tag;
@property (nonatomic ,assign,readonly)RGBINT    GRAY;

+ (instancetype) pixelWithR:(RGBINT)red G:(RGBINT)green B:(RGBINT)blue A:(RGBINT)alpha;

@end

@implementation KPTRGBPixel

- (instancetype)init
{
    self  = [super init];
    if(self)
    {
        self.tag = 0;
    }
    return self;
}

+ (instancetype) pixelWithR:(RGBINT)red G:(RGBINT)green B:(RGBINT)blue A:(RGBINT)alpha
{
    KPTRGBPixel *res = [KPTRGBPixel new];
    res.RED = red;
    res.GREEN = green;
    res.BLUE = blue;
    res.ALPHA = alpha;
    
    return res;
}

- (RGBINT)GRAY
{
    uint32_t gray = 0.3 * self.RED + 0.59 * self.GREEN + 0.11*self.BLUE;
    return (RGBINT)gray;
}
@end

```

### 2图片像素马赛克 与 3二值化
>马赛克算法其实非常简单，就是把图片每个 step *step 像素内部取一个平均值，然后把这个区域所有像素全部设定为此平均值，（针对rgb 三个通道分别取得平均值）venture在这里直接对马赛克和二值化进行了一步处理，因为知道每个区域的平均值也就知道了这个区域是二值化后是取得白色还是黑色
>
>算法代码如下：

```

    - (NSMutableArray *)createKPTPixelsWithUIImage:(UIImage *)oldimage outsize:(CGSize *)size
{
	**之前内容略过**
	...
	 
    //马塞克
    [self.indexTable removeAllObjects];
    
    int totalRED = 0;
    int totalGreen = 0;
    int totalBLUE = 0;
    int totalAlpha = 0;
    int stepcount = 0;
    int stepWidth = MASAIKE_STEP;
    int perGray  = (int) (graySum/count);
    for(int y = 0 ; y < height ; y +=stepWidth)
    {
        NSMutableArray *lineArray = [NSMutableArray new];
        for (int x = 0 ; x < width; x +=stepWidth)
        {
            
            //
            totalRED = 0;
            totalGreen = 0;
            totalBLUE = 0;
            totalAlpha = 0;
            stepcount = 1;
            int finalY = (y + stepWidth) < height?(y + stepWidth) :height;
            int finalX = (x +stepWidth) < width ? (x +stepWidth):width;
            for(int i = y ; i < finalY; i ++)
            {
                for (int j = x; j < finalX; j ++)
                {
                    KPTRGBPixel *pixel = RGBPixels[i][j];
                    totalRED += pixel.RED;
                    totalBLUE += pixel.BLUE;
                    totalGreen += pixel.GREEN;
                    totalAlpha += pixel.ALPHA;
                    stepcount +=1;
                }
            }
            int perRED = totalRED/stepcount;
            int perGreen = totalGreen/stepcount;
            int perBlue = totalBLUE/stepcount;
            
            int resTag = 0;
            
            for(int i = y ; i < finalY; i ++)
            {
                for (int j = x ; j < finalX; j ++)
                {
                    KPTRGBPixel *pixel = RGBPixels[i][j];
                    pixel.RED = perRED;
                    pixel.GREEN = perGreen;
                    pixel.BLUE = perBlue;
                    
                    if(pixel.GRAY < perGray)
                    {
                        pixel.RED = 0;
                        pixel.GREEN = 0;
                        pixel.BLUE = 0;
                        pixel.ALPHA = 255;
                        pixel.tag = 1; //1 代表可以用
                        
                        resTag = 1;
                        
                    }else{
                        pixel.RED = 255;
                        pixel.GREEN = 255;
                        pixel.BLUE = 255;
                        pixel.ALPHA = 255;
                        pixel.tag = 0; //0 代表不可以用
                        
                    }
                    
                }
            }
            [lineArray addObject:@(resTag)];
        }
        [self.indexTable addObject:lineArray];
    }
    
```
**注意这里我们看到是利用pixel.GRAY进行计算的，这个方法的具体实现在上面的KPTRGBPixel.m中**

```
- (RGBINT)GRAY
{
    uint32_t gray = 0.3 * self.RED + 0.59 * self.GREEN + 0.11*self.BLUE;
    return (RGBINT)gray;
}
//这是一个比较通用的计算rgb灰度值的算法，就像我们把彩色图片变成黑白图片后还是能够保留
原来很自然的图片内容，就是用的此算法
```
在图片马赛克和二值化后我们就能知道所能需要用文字填充的区域了，此时的图片效果如下：
<div  align="center" >    
<img src="/img/postimg/wordcloud/4.png" width="500px" />
</div>


### 4计算文字填充区域
> 这一步其实是算法的核心，很多事情都是这一部分决定，比如我们可以设置最大的文字是多大，一行最多填充多少字，每串字符是横着排列还是竖着排列都在此算法，venture实现了一个简单的版本所有的文字都是横向排列的，文字个数从1到5
> 从上一步骤我们初始化了indextable这个变量，这个变量根据马赛克的尺寸不一样而不一样，如果图片宽度100 * 100，马赛克的尺寸是 5x5 那么indextable这个二位数字就是 20x20的。现在我们根据indextable，开始用贪心算法获取从一个马赛克块开始能够获得的最大的输入框。
> 算法思路如下：
>
> *  遍历indexTable，针对当前需要遍历的（x，y），从x，y开始先进行最大的长度测试,也就是y不变，x++ ，如果当前的方块已经被用了，那么退出当前遍历，记录长度，因为我们支持长度为1的文字，所以最少也能放下一个文字。
> * 在获取起点x开始，最大长度y的后，开始遍历高度h，注意要选择y+h 这一段中所有的方块都没有被使用过，同时要处理好x和y的比例关系，比如：我们可以支持1-5个文字，同时支持最大的字号倍数是7倍的话，那么我们x最大的长度其实5*7，再长了我们也不需要了，所以这里注意退出条件。
> * 遍历所有的方块，直到所有的马赛克块都被使用了。

**注意以上算法先从长度开始计算限制高度，也可以先从y计算然后限制长度那么就会成为竖着排版了，也可以横竖混交叉着来，那么就是横竖排版就都有啦**

代码如下

```

- (void)processIndexTable
{
    
    int rowCount = [self.indexTable count];
    for(int indexY = 0 ; indexY < [self.indexTable count]; indexY ++)
    {
        NSMutableArray *lineArray = self.indexTable[indexY];
        int linCount = (int)[lineArray count];
        for (int indeX = 0; indeX < linCount; indeX ++)
        {
            int tag = (int)[lineArray[indeX] integerValue];
            if(tag != 1)
            {
                continue;
            }else  //当前是1 对吧
            {
                NSMutableArray *sizeList = [NSMutableArray new];
                int nMaxWidth =   0;

                //先计算能够获得最大长度
                for(int nX = 0 ; nX  < MAX_ZOOM && nX < (linCount - indeX); nX ++)
                {
                    int tag = (int)[self.indexTable[indexY][indeX+nX] integerValue];
                    if(tag != 1)
                    {
                        break;
                    }
                    nMaxWidth = nX+1;
                }
                //在已经有长度的情况下，计算最大的高度，然后所有indexTable都设置为1
                for (int nX = 0; nX < nMaxWidth; nX ++)
                {
                    
                    for(int nY = 0; nY < MAX_ZOOM && nY < (rowCount - indexY) && nY < nMaxWidth && nY <= nX; nY ++)
                    {
                        if(nX != 0 && nY !=0 && ((nX+1) %(nY+1) != 0) ) //不能整除，不行，比如 3:2 我怎么填充？
                        {
                            continue;
                        }
                        
                        if(nX == nY)
                        {
                            continue;
                        }
                        
                        int tag = (int)[self.indexTable[indexY][indeX+nX] integerValue];
                        if(tag == 0)
                        {
                            break;//有一个位0 就挂掉了
                        }else
                        {
                            [sizeList addObject:[WordSize sizeWithWidth:nX+1 height:nY+1]];
                        }
                        
                    }
                    
                }
                
                if([sizeList count] ==0)
                {
                    continue;//不应该出现的
                }
                //从中选一个
                int sizeIndex = arc4random() % [sizeList count];
                WordSize *size = sizeList[sizeIndex];
                WordRect *rect = [WordRect new];
                rect.startX = indeX * MASAIKE_STEP;
                rect.startY = indexY *MASAIKE_STEP;
                rect.lenghtX = size.lenghtX * MASAIKE_STEP;
                rect.lengthY = size.lengthY * MASAIKE_STEP;
                rect.wordCount =  size.lenghtX/size.lengthY;
                [self.wordRectArray addObject:rect];

                for(int nY = 0; nY < size.lengthY ; nY ++)
                {
                    for (int nX = 0; nX < size.lenghtX; nX ++)
                    {
                        self.indexTable[indexY+nY][indeX+nX] = @(0);  //这些不可用
                        
                    }
                    
                }
                
                [sizeList removeAllObjects];
            }
            
            
        }
        
    }
}
```

此步骤以后真个算法基本完成了，venture用颜色把文字框填充下图片应该是这样的如下
<div  align="center" >    
<img src="/img/postimg/wordcloud/3.png" width="500px" />
</div>



### 5文字填充
>最后一步就简单了，只要针对不同的文字框，找到相应数量的文字填写进入方块就可以了。代码如下：
>

```

- (UIImage *)createResImge:(CGSize )size
{
    UIGraphicsBeginImageContextWithOptions(size, YES, 0);
    
    CGContextRef  context = UIGraphicsGetCurrentContext();
    //drawtext
    [[UIColor whiteColor] setFill];
    CGContextFillRect(context, CGRectMake(0, 0, size.width, size.height));
    for(int i = 0 ;i < [self.wordRectArray count]; i ++)
    {
        WordRect *rect = self.wordRectArray[i];
        NSString *str = [self getStrByWordCount:rect.wordCount];
        UIFont *font = [UIFont boldSystemFontOfSize:rect.lengthY -1];
//        [[UIColor colorWithRed:((i%10)/10.0 *200)/255.0 green:((i%100)/100.0 *200)/255.0 blue:((i%30)/30.0 *200)/255.0 alpha:1.0] setFill];
//
////        [[[UIColor redColor] colorWithAlphaComponent:(i %10)/15.0 + 0.2] setFill];
//        CGContextFillRect(context, CGRectMake(rect.startX, rect.startY, rect.lenghtX, rect.lengthY));
        
        [str drawInRect:CGRectMake(rect.startX, rect.startY, rect.lenghtX, rect.lengthY) withAttributes:@{
                                                                                                          NSFontAttributeName:font,
                                                                                                          NSForegroundColorAttributeName:[UIColor blackColor],
        
                                                                                                          }];
        
    }
    UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();
    return image;
}

- (NSArray *)oneWords
{
    return @[@"我",@"天下",@"她",@"赞"];
}

- (NSArray *)twoWords
{
    return @[@"李白",@"打击",@"人人",@"腾讯",@"QQ",@"百度",@"阿里",@"小米",@"锤子"];
}
- (NSArray *)threeWords
{
    return @[@"李文强",@"好好人",@"小胖蜂",@"李彦宏",@"马化腾",@"王安石",@"赵忠祥",@"赵本山",@"小沈阳"];
}

- (NSArray *)foueWords
{
    return @[@"一丘之貉",@"天下太平",@"断袖之癖",@"青青子衿",@"悠悠我心",@"厚积薄发",@"热爱社会"];
}

- (NSArray *)fiveWords
{
    return @[@"空山不见人",@"但闻人语响",@"独坐幽篁里",@"深林人不知",@"山中相送罢",@"红豆生南国",@"此物最相思"];
}
- (NSArray *)sixWords
{
    return @[@"驴头不对马嘴",@"天机不可泄露",@"看人下菜碟儿",@"疾雷不暇掩耳",@"河水不犯井水",@"英雄所见略同"];
}

- (NSString *)getStrByWordCount:(int)wordCount
{
    NSArray *array = nil ;
    if(wordCount == 1)
    {
        array = [self oneWords];
    }else if(wordCount ==2)
    {
        
        array = [self twoWords];
    }else if(wordCount ==3)
    {
        
        array = [self threeWords];
    }else if(wordCount ==4)
    {
        
        array = [self foueWords];
    }else if(wordCount ==5)
    {
        array = [self fiveWords];
    }else
    {
        array = [self sixWords];
    }
    int sizeIndex = arc4random() % [array count];
    return array[sizeIndex];
    
}


```
**最后放两张生成好的的女神图**

<div  align="center" >    
<img src="/img/postimg/wordcloud/5.png" width="100%" />
<img src="/img/postimg/wordcloud/6.png" width="100%" />
</div>

