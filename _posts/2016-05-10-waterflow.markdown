---
layout:     post
title:      "基于线段树思路实现iOS瀑布流控件"
subtitle:   " \"iOS组件\""
date:       2016-05-09 12:00:00
author:     "VentureLi"
header-img: "img/post-bg-ios9-web.jpg"
catalog: true
tags:
    - iOS
    - 组件
---


# 基于线段思路实现iOS瀑布流控件

## 遇到的问题
在过去的快乐的两年的日子里,venture 在QQ浏览器iOS端，一直做UI相关方面的工作，说起做UI，iOS有两个几乎每个人都用到的控件。UICollectionView 和UITableView他们的都是UIScrollView的子类，继承结构如下。

<div  align="center">     
<img src="/img/postimg/waterflow/0.png" width="300px" />
</div>

*	简单来说UITableView 可以干这个一行一行，这种，外加一个Header，Footer，比如两种。当然可以做一个横竖方向的transform做一个变换，可以显示一列一列的。基本上的能做的事情类似于朋友圈这个样子的。

<div  align="center">     
<img src="/img/postimg/waterflow/1.png" height="400px" style="display:inline;"  />
<img src="/img/postimg/waterflow/2.png" height="400px" style="display:inline;"  />
</div>

* collectionView比tableView 灵活一点，可以做很多的排版，比较常用的flowLayout，其实针对collectionView ，只要自定义Layout几乎可以做所有的拍版。就是要受限于它的delegte的那个几个方法，不太灵活。基本上collectionView可以做这样的东西。

<div  align="center">     
<img src="/img/postimg/waterflow/3.png" width="700px" style="display:inline;"  /> 
</div>

**tableVIew除非自己去计算每行的排版，否则是没办法做到这种按照cell去排版的。天真的我以为，IOS这两个方便，高度集成的控件足够了，知道有一天看到了，这样一个需求。**
<div  align="center">     
<img src="/img/postimg/waterflow/4.png" width="700px" style="display:inline;"  /> 
</div>

**呐尼！！！！？ 这里竟然又一个跨列排版，UITableView 和collectionView 都无法完美解决，（因为要考虑到重用）**

这样一个需求，虽然后来，大神庄总用UITableView实现了，但是还是打击了我对UITablView 和collectionView的信心。后来又看到，好多这种蘑菇街的瀑布流UI设计，感觉确实需要一个能像UItbleView和CollectionView 这种简单接口又完善的瀑布流控件啊了。
<div  align="center">     
<img src="/img/postimg/waterflow/5.png" width="300px" style="display:inline;"  /> 
</div>

## 最终实现效果
系统没有的话，我门就要自己写一个，基本上是利用之前学到的线段树的思想设计了全新的瀑布流控件，我门看看最终的效果图。
<div  align="center">     
<img src="/img/postimg/waterflow/6.png" width="700px" style="display:inline;"  /> 
<img src="/img/postimg/waterflow/7.png" width="700px" style="display:inline;"  /> 
<img src="/img/postimg/waterflow/8.png" width="700px" style="display:inline;"  /> 
<img src="/img/postimg/waterflow/9.png" width="700px" style="display:inline;"  /> 
</div>

控件的接口和UICollectionView完全一样，如下：

```
@protocol FBLWatherFlowViewDataSource <NSObject>

@required
- (NSInteger)numberOfSections;                                                          //有多少个section
- (NSInteger)numberOfItemsInSection:(NSInteger)section;                                 //每个section中有多好个ITM
- (FBLWatherFlowReuseView *)FBLWatherFlowView:(FBLWatherFlowView *)watherFlowView  cellForItemAtIndexPath:(NSIndexPath *)indexPath;            //取得cell
- (CGSize)FBLWatherFlowView:(FBLWatherFlowView *)watherFlowView sizeForItemAtIndexPath:(NSIndexPath *)indexPath;            //item size ,size 的单位是 行列
@optional
- (FBLWatherFlowReuseView *)headerForSection:(NSInteger )section;                       //取得header
- (FBLWatherFlowReuseView *)footerForSection:(NSInteger )section;                       //取得footer

- (UIEdgeInsets)FBLWatherFlowView:(FBLWatherFlowView *)watherFlowView insetForSectionAtIndex:(NSInteger)section;            //sectionInsert
- (CGFloat)FBLWatherFlowView:(FBLWatherFlowView *)watherFlowView rowSpacingForSectionAtIndex:(NSInteger)section;            //topmargin最小值
- (CGFloat)FBLWatherFlowView:(FBLWatherFlowView *)watherFlowView columSpacingForSectionAtIndex:(NSInteger)section;          //rightmarigin最小值
- (CGFloat)FBLWatherFlowView:(FBLWatherFlowView *)watherFlowView heightForHeaderInSection:(NSInteger)section;               //header 高度
- (CGFloat)FBLWatherFlowView:(FBLWatherFlowView *)watherFlowView heightForFooterInSection:(NSInteger)section;                //footer 高度
- (FBLWaterFlowAliginType)FBLWatherFlowView:(FBLWatherFlowView *)watherFlowView aliginTypeForSection:(NSInteger)section;



@end

@protocol FBLWatherFlowViewDelegate <NSObject>

- (void)FBLWatherFlowView:(FBLWatherFlowView *)watherFlowView didSelectItemAtIndexPath:(NSIndexPath *)indexPath;            //目前只支持这一个代理方法

@end

```

使用起来也很简单：
先注册cell的class

```
- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view, typically from a nib.
    
    
    [self fixData];
    self.automaticallyAdjustsScrollViewInsets = NO;
    [self.view setBackgroundColor:[UIColor whiteColor]];
    self.mainView = [[FBLWatherFlowView alloc] initWithFrame:self.view.bounds];
    //注册接口
    [self.mainView registerClass:[FBLMyHeaderView class] forIdentify:@"header"];
    [self.mainView registerClass:[FBLMyFooterView class] forIdentify:@"footer"];
    [self.mainView registerClass:[FBLMyCellView class] forIdentify:@"cell"];
    self.mainView.wahterDelegate = self;
    self.mainView.dataSource = self;
    self.mainView.autoresizingMask = UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth;
    [self.view addSubview:self.mainView];
    [self.mainView reloadData];
    }
```
然后添加回调就可以了

```

#pragma mark -WatherFlowView delegate
- (NSInteger)numberOfSections
{
    return [self.listData count];
}
- (NSInteger)numberOfItemsInSection:(NSInteger)section
{
    NSArray *array = self.listData[section];
    return [array count];
}
- (FBLWatherFlowReuseView *)FBLWatherFlowView:(FBLWatherFlowView *)watherFlowView cellForItemAtIndexPath:(NSIndexPath *)indexPath
{
    FBLMyCellView *view = (FBLMyCellView *)[watherFlowView dequeueReusablecellWithIdentify:@"cell"];
    view.titlelabel.text = [NSString stringWithFormat:@"%ld" ,indexPath.row];
    [view setBackgroundColor:[UIColor colorWithRed:((indexPath.row *50 )%255)/255.0 green:(indexPath.row *20 )/255.0  blue:(indexPath.row *10 )/255.0  alpha:0.5]];
    return  view;//这里在测试情况下不用
}
- (FBLWatherFlowReuseView *)headerForSection:(NSInteger )section
{
    
    FBLMyHeaderView *view = (FBLMyHeaderView *)[self.mainView dequeueReusablecellWithIdentify:@"header"];
    view.titlelabel.text = [NSString stringWithFormat:@" header section:%ld" ,section];
    [view setBackgroundColor:[UIColor colorWithRed:((section *50 )%255)/255.0 green:(section *20 )/255.0  blue:(section *10 )/255.0  alpha:0.5]];
    return  view;//这里在测试情况下不用

}
- (FBLWatherFlowReuseView *)footerForSection:(NSInteger )section
{
    FBLMyFooterView *view = (FBLMyFooterView *)[self.mainView dequeueReusablecellWithIdentify:@"footer"];
    view.titlelabel.text = [NSString stringWithFormat:@" footer section:%ld" ,section];
    [view setBackgroundColor:[UIColor colorWithRed:((section *50 )%255)/255.0 green:(section *20 )/255.0  blue:(section *10 )/255.0  alpha:0.5]];
    
    return  view;//这里在测试情况下不用
}
- (FBLWaterFlowAliginType)FBLWatherFlowView:(FBLWatherFlowView *)watherFlowView aliginTypeForSection:(NSInteger)section
{
    return FBLWaterFlowAliginTypeCenter;
}
- (CGSize)FBLWatherFlowView:(FBLWatherFlowView *)watherFlowView sizeForItemAtIndexPath:(NSIndexPath *)indexPath;
{
    NSValue * value = ((NSArray *)self.listData[indexPath.section])[indexPath.row];
    return value.CGSizeValue;
}
- (UIEdgeInsets)FBLWatherFlowView:(FBLWatherFlowView *)watherFlowView insetForSectionAtIndex:(NSInteger)section
{
    return UIEdgeInsetsMake(10, 0, 10, 0);
}
- (CGFloat)FBLWatherFlowView:(FBLWatherFlowView *)watherFlowView rowSpacingForSectionAtIndex:(NSInteger)section;
{
    return 10.0;
}
- (CGFloat)FBLWatherFlowView:(FBLWatherFlowView *)watherFlowView columSpacingForSectionAtIndex:(NSInteger)section
{
    return 10.0;
}
- (CGFloat)FBLWatherFlowView:(FBLWatherFlowView *)watherFlowView heightForHeaderInSection:(NSInteger)section
{
    return 80;
}
- (CGFloat)FBLWatherFlowView:(FBLWatherFlowView *)watherFlowView heightForFooterInSection:(NSInteger)section
{
    return 50;
}

- (void)FBLWatherFlowView:(FBLWatherFlowView *)watherFlowView didSelectItemAtIndexPath:(NSIndexPath *)indexPath
{
    NSString *meessage = [NSString stringWithFormat:@"section %ld , row:%ld", indexPath.section ,indexPath.row];
    UIAlertView *alertView = [[UIAlertView alloc] initWithTitle:@"点击" message:meessage delegate:nil cancelButtonTitle:@"取消" otherButtonTitles:@"确定", nil];
    [alertView show];
}
```

## 实现方案
这个控件的本身实现方案很简单，其实就几个难点：

* 控件的复用 
* 寻找当前控件的要存放的位置
* 更新每次排版后线段的状态

### 控件的复用
说起对UIScrollView的里面的cell的复用，可能大部分人首先想到的是在delegate的didscroll中去处理，但是我们这是写一个控件给别人用，所以我们必须要把delegate暴露出来给调用者，就比如UITableView和UICollectionView一样，所以这里我们要在layoutsubviews这个方法处理，为什么用这个呢？我们看看layoutsubview的调用时机。
>一：当view的frame或bounds发生改变

> * 1：直接改view的frame或bounds 会调用view中layoutsubview

> * 2:当屏幕旋转的时候，视图控制器中根view发生变化，会调用视图控制中viewDidLayoutsuview）

>二：在当前view上addsubvie添加子view，会调用view中layoutSubview

>三：改变view的大小的时候，会触发父view的layoutsubview被调用

>四：**当UIScroller中滚动的时候，会调用自身layoutsubview.**

>五：setneedslayout 调用的时候

所以我们看到了第四条，滚动的时候用这个方法就可以了。

```
 -(BOOL)isInScreen:(CGRect)frame
{
    BOOL isInscreen = ((CGRectGetMaxY(frame)>=self.contentOffset.y)&&(CGRectGetMaxY(frame) <= self.contentOffset.y+self.frame.size.height))
    || ( (CGRectGetMinY(frame)>=self.contentOffset.y)&&(CGRectGetMinY(frame)<=self.contentOffset.y+self.frame.size.height))
    || ( (CGRectGetMaxY(frame) >= (self.contentOffset.y + self.frame.size.height)) && (CGRectGetMinY(frame) <= self.contentOffset.y));
    return isInscreen;
}
- (void)layoutSubviews
{
    [super layoutSubviews];
    
    if(self.lastReloadWidth != self.bounds.size.width)
    {
        [self reloadData];
        self.lastReloadWidth = self.bounds.size.width;
    }
 
    for(NSInteger sectionIndex = 0 ;sectionIndex < [self.frameAttributes count] ;sectionIndex ++)
    {
        NSDictionary *dict = self.frameAttributes[sectionIndex];
        
        CGRect headerFrame = ((NSValue *)dict[KEY_HEADERFRAMES_NAME]).CGRectValue;
        NSString *headerkey =[NSString stringWithFormat:@"%ld-%@", sectionIndex,KEY_DISPLAYDICT_HEADERPREFIX];
        [self progressReuseViewWithKey:headerkey withFrame:headerFrame withType:KEY_VIEWTYPE_HEADER WithIndexPath:[NSIndexPath indexPathForItem:0 inSection:sectionIndex]];
        NSArray *cellFrames = dict[KEY_CELLFRAMES_NAME];
        for(NSInteger cellIndex = 0 ; cellIndex < [cellFrames count] ;cellIndex ++)
        {
            CGRect cellFrame = ((NSValue *)cellFrames[cellIndex]).CGRectValue;
            NSString *key =[NSString stringWithFormat:@"%ld-%ld", sectionIndex ,cellIndex];
            [self progressReuseViewWithKey:key withFrame:cellFrame withType:KEY_VIEWTYPE_CELL WithIndexPath:[NSIndexPath indexPathForItem:cellIndex inSection:sectionIndex]];
            
        }
        //footer
        CGRect  footerFrame = ((NSValue *)dict[KEY_FOOTERERFRAMES_NAME]).CGRectValue;
        NSString *footerkey =[NSString stringWithFormat:@"%ld-%@", sectionIndex, KEY_DISPLAYDICT_FOOTERPREFIX];
        [self progressReuseViewWithKey:footerkey withFrame:footerFrame withType:KEY_VIEWTYPE_FOOTER WithIndexPath:[NSIndexPath indexPathForItem:0 inSection:sectionIndex]];
    }
   
}


- (void)progressReuseViewWithKey:(NSString *)key withFrame:(CGRect)frame withType:(NSString *)type WithIndexPath:(NSIndexPath *)path
{
    
    FBLWatherFlowReuseView * viewCell = self.displayingCells[key];    //这里来设置key
    if([self isInScreen:frame])
    {
        if(viewCell == nil)
        {
            if([type isEqualToString:KEY_VIEWTYPE_CELL])
            {
                viewCell =  [self.dataSource FBLWatherFlowView:self cellForItemAtIndexPath:path];
 
            }else if([type isEqualToString:KEY_VIEWTYPE_HEADER])
            {
                viewCell =  [self.dataSource headerForSection:path.section];
            }else if([type isEqualToString:KEY_VIEWTYPE_FOOTER])
            {
                viewCell =  [self.dataSource footerForSection:path.section];
            }

            viewCell.frame = frame;
            [self addSubview:viewCell];
            self.displayingCells[key] = viewCell;
        }
    }else{
        if(viewCell)
        {
            [viewCell removeFromSuperview];
            [self.displayingCells removeObjectForKey:key];
            NSMutableArray *array = self.dequeueCellDict[viewCell.reuseIdentify][KEY_DEQUE_OBJECTARRAY]; //这里是identify
             NSLog(@" add to cache with identify:%@", viewCell.reuseIdentify);
            [array addObject:viewCell];
        }
    }
    

}
```


### 添加cell的时候计算每个控件的位置和线段更新

**这两个步骤在一起处理了**
这个的主要思路是通过线段分裂和合并的方式进行计算的，比如最开始的时候，线段的状态的 [0-1024]->0  如果此时来了一个 200x200 的大小的像素线段就会进行分裂为两个线段
[0-200]->200, 【200-1024]->0, 

**注意，这里线段的含义是：这个区间往下排列可以用最小y，也就是这一段的y轴起始点。**另外这里对cell的space做了一个小的track的处理，如果一个cell是100x100，cellspace是20的话，那么这个cell，默认就占用，110 *100，其他的也是这么占用的，两个加在一起就正好是20的cell，边框的部分不进行处理。这里的细节比较多实际应用的时候就会发现了。


这个代码如下：

```

//这个是最核心的算法了，很复杂。基于线段树的思想,把线段树变成数组，处理逻辑
- (CGRect)addSize:(CGSize)size
{
    NSArray * valueSortArray = [self getValueSortArray];
    //开始遍历
    if(size.width > (self.totalright - self.totalleft))
    {
        size.width = self.totalright - self.totalleft - 1.0;        //不能越界
    }
    BOOL find = NO;
    CGFloat currentY = [valueSortArray[0] floatValue]; // 必须从下一个像素开始
    for (int i = 0 ; i < [valueSortArray count] && !find; i ++)
    {
        currentY = [valueSortArray[i] floatValue];          //开始遍历最大值，肯定有一个是成功的拉
        for(int nodeIndex = 0 ; nodeIndex < [self.nodeArray count] ; nodeIndex ++)
        {
            FBLWatherFlowViewLayoutNode *currentNode = self.nodeArray[nodeIndex];
            if((currentNode.value > currentY)) //这里不能用等于
            {
                ;
            }else{ //小于的话，说明可以开始
                NSInteger endIndex = [self getEndIndeWithCurrentIndex:nodeIndex sizeWidth:size.width];
                //等于-1 说明不够长
                if(endIndex == -1) //已经不够长了
                {
                    break;  //跳出内层荀晗
                }
                BOOL isBadNodeindex = NO;
                for(int j = nodeIndex + 1; j <= endIndex ; j ++) //必须用<= 这里操作都是闭区间的
                {
                    FBLWatherFlowViewLayoutNode *tmpNode = self.nodeArray[j];
                    if(tmpNode.value > currentY)
                    {
                        isBadNodeindex = YES;       //说明后面有比这个高的，不可以
                        break;
                    }
                }
                if(isBadNodeindex)
                {
                    continue;
                }else
                {
                    find = YES;
                    CGRect resRect =  CGRectMake(currentNode.left, currentY, size.width, size.height); //压住的阴影
                    [self splitNodeArrayWithRect:resRect beiginIndex:nodeIndex endIndex:endIndex];
//                    NSLog(@"add size :CGsize(%f,%f) array is:%@", size.width , size.height , [self getNodeStr]);
                    return resRect;
                }
                
            }
        }
    }
    
    return CGRectMake(0, 0, 0, 0);
}


- (void)splitNodeArrayWithRect:(CGRect)shdowRect beiginIndex:(NSInteger)beiginIndex endIndex:(NSInteger)endIndex   //影响的区域是beiginIndex和EndIndex
{
    NSMutableArray * array = [NSMutableArray arrayWithCapacity:[self.nodeArray count]];
    FBLWatherFlowViewLayoutNode *newNode = [FBLWatherFlowViewLayoutNode new];
    newNode.left = shdowRect.origin.x;
    newNode.right = shdowRect.origin.x + shdowRect.size.width;
    newNode.value = shdowRect.origin.y + shdowRect.size.height;
    for(NSInteger i = 0 ;i < beiginIndex ;i ++)
    {
        FBLWatherFlowViewLayoutNode *tmpNode = self.nodeArray[i];
        [array addObject:tmpNode];
    }
    [array addObject:newNode];//把新的node添加上
    FBLWatherFlowViewLayoutNode *endNode = self.nodeArray[endIndex];  //有可能吧endIndex 给截断
    if(endNode.right > newNode.right)
    {
        FBLWatherFlowViewLayoutNode * newPartNode = [FBLWatherFlowViewLayoutNode new];  //有可能吧endIndex 给截断
        newPartNode.left = newNode.right;
        newPartNode.right = endNode.right;
        newPartNode.value = endNode.value;
        [array addObject:newPartNode];
    }
    for(NSInteger i = endIndex+1 ;i < [self.nodeArray count] ;i ++)
    {
        FBLWatherFlowViewLayoutNode *tmpNode = self.nodeArray[i];
        [array addObject:tmpNode];
    }
    [self.nodeArray removeAllObjects];
    self.nodeArray = nil;
    self.nodeArray = array;
}

```

## github 源代码地址
<a href = "https://github.com/ventureli/FBLWaterFlowGridView">
https://github.com/ventureli/FBLWaterFlowGridView
</a>

