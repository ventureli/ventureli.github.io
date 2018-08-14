#!/usr/bin/expect
#scp

set password fatboy*LI

spawn scp -r ./pdd  root@47.92.102.145:/usr/local/nginx/html/
expect "*password:"
send "$password\r"
expect eof
