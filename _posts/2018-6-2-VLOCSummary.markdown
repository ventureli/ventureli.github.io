---
layout:     post
title:      "如何从0开始写一个OC语言的编译器和虚拟机(1)"
subtitle:   "前奏"
date:       2017-61-11 12:00:00
author:     "VentureLi"
header-img: "img/post-bg-ios9-web.jpg"
header-mask:  0.3
catalog:      true
tags:
    - VLOCInterpreter
    - 编译器
    - 虚拟机
    - OC
---
 

# 如何从0开始写一个OC语言的编译器和虚拟机（1）-前奏
> 经过了半年的时间终于决定把我之前写一个OC语言的编译器和虚拟机开源出来，具体的原理和技术博客的形式发布出来.
> github地址：<a href="https://github.com/ventureli/VLOCInterpreter">
https://github.com/ventureli/VLOCInterpreter
</a>


之所以做这么个东西，是因为之前苹果审核太慢了，有很多动态化的需求，包括解决bug和ABTest，甚至需要像发布HTML一样发布一个模块和页面，后来出了JSPatch和RN，Weex，WAX这种动态框架，这些都是非常好的动态话框架，但是却没有一个事原声提供的编译器，大部分都是基于JSCore的，这样在性能上和针对强WebView交互的场景限制比较大（比如，浏览器这种APP），ventureli之前只专注于iOS的平台，在之前公司的时候完成了一个初步的OC语言解释器，离职后原框架留给公司，自己重新写了一个新的框架VLOCInterpreter 。
VLOCInterpreter 采用OC语法，可以直接解析“.m”文件，原生实现解释器和虚拟机，

一个动态化脚本实例如下（虽然和OC一样，但是不是OC偶）：


```

@interface VLOCcell : UICollectionViewCell
@property(nonatomic ,strong)UILabel *  namelabel;
@property(nonatomic ,strong)UILabel *  contentlabel;
@property(nonatomic ,strong)UIImageView *  imageView;
@end


//这里设置一个环境变量，代表只定义一次

@implementation VLOCcell

- (VLOCcell *)initWithFrame:(CGRect)frame
{
    self = [super initWithFrame:frame];
    if(self)
    {
        [self setBackgroundColor:[UIColor purpleColor]];
        UILabel * label = [[UILabel alloc] initWithFrame:CGRectMake(0, self.bounds.size.height -54, self.bounds.size.width, 40)];
        label.font = [UIFont systemFontOfSize:15];
        label.textColor =[UIColor orangeColor];
        label.text = @"短视频A短视频A短视频A短视频A短视频A短视频A短视频A短视频A短视频A短视频A短视频A短视频A短视频A短视频A短视频A短视频A短视频A短视频A";
        label.numberOfLines = 0;
        label.lineBreakMode = 0;
        [self addSubview:label];
        
        UILabel * labelB = [[UILabel alloc] initWithFrame:CGRectMake(0, self.bounds.size.height -12, self.bounds.size.width, 12)];
        labelB.font = [UIFont systemFontOfSize:15];
        labelB.textColor =[UIColor blackColor];
        labelB.text = @"详细信息，详细信息";
        [self addSubview:labelB];
        
        
        UIImageView * imageView = [[UIImageView alloc] initWithFrame:CGRectMake(0, 0, self.bounds.size.width, self.bounds.size.height - 65)];
        imageView.backgroundColor = [UIColor whiteColor];
        [self addSubview:imageView];
        self.imageView = imageView;
        
    }
    
    void (^blockA)()
    {
        id data = [NSData dataWithContentsOfURL:[NSURL URLWithString:@"http://desk.fd.zol-img.com.cn/t_s1920x1080c5/g5/M00/0F/04/ChMkJlbegiyIaSExAAh2hrdk6UsAAM7xQOueUQACHae442.jpg"]];
        if(data)
        {
            UIImage * image = [UIImage imageWithData:data];
            void (^blockB)()
            {
                self.imageView.image = image;
            }
            dispatch_async_main(blockB);
            
        }
    }
    
    dispatch_async_global_queue(blockA);
    
    return self;
    
}

- (void)dealloc
{
//    NSLog(@"cell dealloc");
//    id newself =  self;
//    NSLog(@"self is:%@",newself);
    [[NSNotificationCenter defaultCenter] removeObserver:self];
    
}
@end



@interface myView:UIView <UICollectionViewDelegateFlowLayout,UICollectionViewDataSource>

@end

@implementation myView

- (myView *)initWithFrame:(CGRect)frame
{
    self =  [super initWithFrame:frame];
    
    
    UICollectionViewFlowLayout * lay = [[UICollectionViewFlowLayout alloc] init];
    
    UICollectionView * collctionView =  [[UICollectionView alloc] initWithFrame:CGRectMake(0, 100, self.bounds.size.width, self.bounds.size.height -100) collectionViewLayout:lay];
    
    [self setVLOCProp:lay forKey:@"layout"];
    [self setVLOCProp:collctionView forKey:@"collctionView"];
    
    
    [collctionView setBackgroundColor:[UIColor orangeColor]];
    collctionView.autoresizingMask = 18;
    [collctionView registerClass:[VLOCcell class] forCellWithReuseIdentifier:@"cell"]; //注册cell信息
    
    collctionView.delegate = self;
    collctionView.dataSource = self;
    collctionView.alwaysBounceVertical = 1;
    [self addSubview:collctionView];
    [collctionView reloadData];
    
    
    return self;
}



- (int)numberOfSectionsInCollectionView:(UICollectionView *)collectionView
{

    return 3;
}

- (int)collectionView:(UICollectionView *)collectionView numberOfItemsInSection:(int)section
{
    
    return 30;
}

- (id )collectionView:(UICollectionView *)collectionView cellForItemAtIndexPath:(NSIndexPath *)indexPath
{
    id cell = [collectionView dequeueReusableCellWithReuseIdentifier:@"cell" forIndexPath:indexPath];
    id color = [UIColor redColor];
    [cell setBackgroundColor:color];
    return cell;
}

- (CGSize) collectionView:(id )collectionView layout:(UICollectionView * )collectionViewLayout sizeForItemAtIndexPath:(NSIndexPath *)indexPath
{
   // NSLog(@"hahha");
    return  CGSizeMake(118 , 108);
}

@end

id theobj =baseView;
id contentView = [[myView alloc] initWithFrame:theobj.bounds];
[contentView setBackgroundColor:[UIColor blackColor]];
contentView.layer.borderWidth = 4.0;
contentView.layer.borderColor = [UIColor orangeColor].CGColor;
contentView.tag = 0;
contentView.autoresizingMask = 18;
return contentView;

```
你一定以为这是OC代码对吗？是的，这也是VLOCLanguage，上面的源代码当作字符串输入给VLOCInterpreter 就可以 运行出下面的结果。
<div  align="center" >    
<img src="../img/postimg/vloc/qianzou/1.png" width="500px" />
</div>

具体的使用方法如下：

```
#import "ViewController.h"
//引入VLOC解释器
#import <VLOCInterpreterFramework/VLOCInterpreterFramework.h>
#import "ViewControllerShareView.h"
#import "TestCollectionView.h"

@interface testView : UIView

@end
@implementation testView


@end

@interface ViewController ()
@property(nonatomic ,strong)UIView *contentView;
@end

@implementation ViewController

- (void)viewDidLoad {
    
    [super viewDidLoad];
    self.automaticallyAdjustsScrollViewInsets = NO;
    [[ViewControllerShareView shareInstance] testOverrider];
    
    NSString *theStr = [[NSBundle mainBundle] pathForResource:@"mScriptFiles/source_UI" ofType:@"m"];
    VLOCCompiler *interpreter = [[VLOCCompiler alloc] init];
    NSArray *codes =  [interpreter VLOC_TranslateWithFile:theStr];
    //注册环境变量
    id contentView=  [[VLOCVM shareInstance] evalCode:codes withInitEnvVar:@{@"baseView":self.view}];
    [self.view addSubview:contentView];
    self.contentView = contentView;
}
@end
```


VLOC 对OC进行最大限度的支持，另外还支持C语言的内存操作。 语言的其他特性如下
具体如下。
具体的语法规则，请看：

<a href="https://github.com/ventureli/VLOCInterpreter">
https://github.com/ventureli/VLOCInterpreter
</a>

<div  align="center" >    
<img src="/img/postimg/vloc/qianzou/2.png" width="500px" />
<img src="/img/postimg/vloc/qianzou/3.png" width="500px" />
<img src="/img/postimg/vloc/qianzou/4.png" width="500px" />
<img src="/img/postimg/vloc/qianzou/5.png" width="500px" />
<img src="/img/postimg/vloc/qianzou/6.png" width="500px" />
<img src="/img/postimg/vloc/qianzou/7.png" width="500px" />
<img src="/img/postimg/vloc/qianzou/8.png" width="500px" />
</div>

