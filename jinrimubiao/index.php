<?php
/***************************************************************************
 * 
 * Copyright (c) 2016 zhilukeji.com, Inc. All Rights Reserved
 * $Id$ 
 * 
 **************************************************************************/
 
 /**
 * @file index.php
 * @author wushaoyun(wushaoyun@zhilukeji.com)
 * @date 2016/06/10 21:47:39
 * @version $Revision$ 
 * @brief 
 *  
 **/

$ua = $_SERVER['HTTP_USER_AGENT'];

$res = '';

//if (strpos($ua, 'iPhone')) {
//    if (strpos($ua, 'MicroMessenger')) {
//        $res = file_get_contents('/alidata/www/website/index_wap_ios_wechat.html');
//    } else {
//        $res = file_get_contents('/alidata/www/website/index_wap_ios.html');
//    }
//} else if (strpos($ua, 'Android')) {
//    if (strpos($ua, 'weixin')) {
//        $res = file_get_contents('/alidata/www/website/index_wap_android_wechat.html');
//    } else {
//        $res = file_get_contents('/alidata/www/website/index_wap_android.html');
//    }
//} else {
//    $res = file_get_contents('/alidata/www/website/index_pc.html');
//}

if (strpos($ua, 'iPhone') || strpos($ua, 'Android')) {
    $res = file_get_contents('./index.html');
} else {
    $res = file_get_contents('./index_pc.html');
}

echo $res;

/* vim: set ts=4 sw=4 sts=4 tw=100 */
?>
