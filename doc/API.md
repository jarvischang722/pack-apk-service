# pack-service v1.0.0

Tripleonetech package service 

- [APK](#apk)
	- [Build client apk](#build-client-apk)
	- [Get APK detail  information](#get-apk-detail--information)
	- [Get APK download url](#get-apk-download-url)
	


# APK

## Build client apk



	POST /apk/build


### Parameters

| Name    | Type      | Attribute      | Description                          |
|---------|-----------|--------------------------------------|
| apk_name			| String	| Required|  <p>APK name</p>							|
| apk_name_en			| String	| Required|  <p>APK english name</p>							|
| logo			| File	| Required|  <p>APK's logo</p>							|
| apk_url			| String	| Required|  <p>URL</p>							|
| hidden_action_btn			| Boolean	| Optional|  <p>Whether to hidden Floating Action Button</p>							|
| auto_connect_vpn			| Boolean	| Optional|  <p>Whether to enable auto connect vpn</p>							|
| version_name			| String	| Required|  <p>APK version name</p>							|


### Success 200
| Field    | Type        | Description                          |
|---------|-----------|--------------------------------------|
| success| Boolean| |
| message| String| |
| apkUrl| String| <p>Build API url completed</p>|

### Success Response

Success-Response:

```
HTTP Status: 200
{
  "success": true,
  "message": '',
  "apkUrl": 'https://www.xxx.yyy/build/xxxx.apk',

}
```

## Get APK detail  information



	POST /apk/getApkInfo


### Parameters

| Name    | Type      | Attribute      | Description                          |
|---------|-----------|--------------------------------------|
| apkFileName			| String	| Required|  <p>APK name</p>							|


### Success 200
| Field    | Type        | Description                          |
|---------|-----------|--------------------------------------|
| success| Boolean| |
| apkInfo| Object| |

### Success Response

Success-Response:

```
HTTP Status: 200
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
        "logo": "http://35.201.204.2:7101/download/tripleoneTest/tripleoneTest_20181003_v307.png",
        "kernel": "chromium"
    }
}
```

## Get APK download url



	POST /apk/getBuildedList



### Success 200
| Field    | Type        | Description                          |
|---------|-----------|--------------------------------------|
| data| Array[]| |
| data.name| String| |
| data.filename| String| |
| data.url| String| |
| data.createTime| String| |
| data.kernel| String| |
| data.logo_url| String| |

### Success Response

Success-Response:

```
HTTP Status: 200
{
 "data": [
   [
     "lanhai",
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
   ]
 ]
   ....
}
```


