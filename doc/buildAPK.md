## Build APK service

####  ✔ `POST` `/apk/build` - APK builder

+ Parameters:

Field Name       | Scope | Type       | Attributes |   Description
---------------- | ------- | ----------- | ----------- | -----------------------   | -------------
apk_name         | body   | String    | Required   | APK name
apk_name_en         | body   | String    | Required   | APK english name 
apk_url             | body   | String     | Required   |URL
logo        | body/file   | String     | Required   | APK's logo
hidden_action_btn  | body   | Boolean     | Optional   |Whether to  hidden Floating Action Button (**default : false**) 
 auto_connect_vpn        | body   | Boolean     | Optional   | Whether to enable auto connect vpn(**default : false**) 
isHiddenTabHome | body | Boolean     | Optional   | 
isHiddenTabReload | body | Boolean     | Optional   | 
isHiddenTabPrepage | body | Boolean     | Optional   | 
isHiddenTabVpn | body | Boolean     | Optional   | 
isHiddenTabUpdate | body | Boolean     | Optional   | 
isHiddenTabAbout | body | Boolean     | Optional   | 
version_name | body |  String	| Required|  |APK version name |
kernel | body |  String | Optional | 
+ Return: `HTTP Status: 201`


### Success 200
| Field    | Type        | Description                          |
|---------|-----------|--------------------------------------|
| success| Boolean| |
| message| String| |
| apkUrl| String| <p>Build API url completed</p>|

### Success Response

Success-Response: **HTTP Status: 200**

```json
{
  "success": true,
  "message": '',
  "apkUrl": 'https://www.xxx.yyy/build/xxxx.apk'
}
```


----

### Flow

```puml
title Build APK
|Front End|
start
:request build apk;
|Back End|

if( Check if is there any apk building)  then (yes) 

else(no)
    :Create apk dir;
    :Resize logo;
    :Reload gradle file;
    :Start run batch;
|APK builder|  
    :Start build;
|Back End|
    :Create Listener;
    if(platform not equal to 'chromium') then (yes)
        while (Build finished?)  is (No)
          :Check the build time that has been spent;
          note right
            If over 10 mins , then response error to caller.
          end note

          :Check if occure apk's apk in directory;
          note right
             If appears apk apk(Size must be bigger to 0) and a output.json ,
             the representative setup process has been completed.
          end note

        endwhile (no)

        :Move apk to specific path;
    :Update apk json;
    :Stop Listener;

    endif
endif

|Front End|
:Receive result;
```

> Note.
> 1. Platform是'Chromium'不需要等待build完就回傳，因為Chromium版本的通常build的時間過長，可能會使這一個request都timeout了，所以需要先回傳，
> 2. 如果Platform是'webview'版本，建立時間大概落在5~10分內，所以設定10分鐘後才會顯示建立失敗的訊息


----

####  ✔ `POST` `/apk/getBuildedList ` -  Get APK download url

+ Parameters:

Field Name       | Scope | Type       | Attributes | Validation                | Description |
----------- | ------- | ----------- | ----------- | --------------   | -------------|
| none |

### Success 200
| Field    | Type        | Description                          |
|---------|-----------|--------------------------------------|
| data| Array[]| |
| data.name | String |  Always capitalized  |
| data.filename| String| |
| data.url| String| |
| data.createTime| String| |
| data.kernel| String| |
| data.logo_url| String| |

### Success Response

Success-Response: **HTTP Status: 200**

```json
{
 "data": [
   [
     "LANHAI",
     "lanhai_20180829_v306",
     "http://127.0.0.1:7102/download/lanhai/lanhai_20180829_v306.apk",
     "2018/08/29 06:32:05",
     "chromium",
     "http://127.0.0.1:7102/download/lanhai/lanhai_20180829_v306.png"
   ],
   [
     "lanhai",
     "lanhai_20180829_v306",
     "http://127.0.0.1:7102/download/lanhai/lanhai_20180829_v306.apk",
     "2018/08/29 06:32:05",
     "chromium",
     "http://127.0.0.1:7102/download/lanhai/lanhai_20180829_v306.png"
   ],
    ....
 ]
}
```

---------------------


####  ✔ `POST` `/apk/getApkInfo ` -  Get APK detail  information

+ Parameters:

Field Name       | Scope | Type       | Attributes |  Description
---------------- | ------- | ----------- | -----------| -------------
apkFileName         | body   | String    | Required   | APK File name

### Success 200
| Field    | Type        | Description                          |
|---------|-----------|--------------------------------------|
| success| Boolean| |
| apkInfo| Object| |

### Success Response

Success-Response: **HTTP Status: 200**

```json
{
    "success": true,
    "apkInfo": {
        "name": "tripleoneTest",
        "name_en": "tripleoneTest",
        "url": "http://www.tripleone.com",
        "version": "v307",
        "fileName": "tripleoneTest_20181003_v307",
        "hidden_action_btn": true,
        "auto_connect_vpn": true,
        "isHiddenTabHome": true,
        "isHiddenTabReload": true,
        "isHiddenTabPrpage": true,
        "isHiddenTabVpn": true,
        "isHiddenTabUpdate": true,
        "isHiddenTabAbout": true,
        "logo": "http://35.201.204.2:7101/download/tripleoneTest/tripleoneTest_20181003_v307.png",
        "kernel": "chromium"
    }
}
```
---------------------
