$(document).ready(function(){
    (function(){
        var $box = $('.js-img-box'),
            $img = $box.find('img'),
            $banner = $('.js-banner'),
            $btnBox = $('.js-btn-box'),
            $btn = $btnBox.find('span'),
            timer;

        changeImg({
            parent: $box,
            slide: $banner,
            slideLi: $img,
            btn: $btn,
            activeClass: 'cur'
        });

        function changeImg(opt){
            var $parent = opt.parent,
                $slide = opt.slide,
                $slideLi = opt.slideLi,
                // $prev = opt.prev,
                // $next = opt.next,
                $btn = opt.btn,
                activeClass = opt.activeClass,
                eventName = opt.eventName || "click",
                isBubble = opt.isBubble || false,
                width = $img[0].offsetWidth,
                height = $img.eq(0).height(),
                index = 0,
                hold = true;

                if($slide.find('img').length == $btn.length){
                    $slide.html($slide.html()+$slide.html());
                }
                $slide.css({'height':height+'px','width':width*$slideLi.length*2+'px'});

                $btn.on(eventName,function(){
                    index = $(this).index();

                    cutTab(index);
                });

                $parent.on({
                    'mouseover': function(){
                        clearInterval(timer);
                    },
                    'mouseout': autoSlide
                });

                $btnBox.on({
                    'mouseover': function(){
                        clearInterval(timer);
                    },
                    'mouseout': autoSlide
                });

                autoSlide();

                function autoSlide(){
                    clearInterval(timer);
                    timer = setInterval(function(){
                        index++;
                        cutTab(index);
                    },2000);
                }

                function cutTab(num){
                    var btnIndex = num;
                    if(btnIndex == $btn.length){
                        btnIndex = 0;
                        $btn.removeClass(activeClass);
                        $btn.eq(btnIndex).addClass(activeClass);
                    }else if(num == -1){
                        $slide.css('left',-$slide[0].offsetWidth/2+'px');
                        num = $btn.length-1;
                        $btn.removeClass(activeClass);
                        $btn.eq(num).addClass(activeClass);
                    }else{
                        $btn.removeClass(activeClass);
                        $btn.eq(num).addClass(activeClass);
                    }

                    $slide.stop().animate({'left':-width*num+'px'},600,function(){
                        if(num == $btn.length){
                            $slide.css('left','0px');
                            num = 0;
                        }
                        index = num;
                        hold = true;
                    });
                }
        }

    })();
});