## Build APK service

####  ✔ `POST` `/apk/build` - APK builder

+ Parameters:

Field Name       | Scope | Type       | Attributes | Validation                | Description      
---------------- | ------- | ----------- | ----------- | -----------------------   | -------------
apk_name         | body   | String    | Required   |                               | APK name
apk_name_en         | body   | String    | Required   |                               | APK english name 
apk_url             | body   | String     | Required   |                       | URL
logo        | body/file   | String     | Required   |                         | APK's logo
hidden_action_btn  | body   | Boolean     | Optional   |             | Whether to  hidden Floating Action Button (**default : false**) 
 auto_connect_vpn        | body   | Boolean     | Optional   |           | Whether to enable auto connect vpn(**default : false**) 

+ Return: `HTTP Status: 201`

```javascript
{
   success : true
   errorMsg : ''
}
```
---------------------

####  ✔ `POST` `/apk/getBuildedList ` -  Get APK download url

+ Parameters:

Field Name       | Scope | Type       | Attributes | Validation                | Description      
---------------- | ------- | ----------- | ----------- | -----------------------   | -------------
         |    |     |  |                               |  


+ Return: `HTTP Status: 201`

```javascript
{
  "data": [
    [
      "yahoo",
      "yahoo_20180101_v304",
      "http://xxx.com/yahoo_20180101_v304.apk",
      "2018/07/21 21:05:22"
    ],
    [
      "yahoo",
      "yahoo_20180102_v304",
      "http://xxx.com/yahoo_20180101_v304.apk",
      "2018/07/21 21:05:22"
    ]
  ]
    ....
}
```
---------------------


####  ✔ `POST` `/apk/getApkInfo ` -  Get APK detail  information

+ Parameters:

Field Name       | Scope | Type       | Attributes | Validation                | Description      
---------------- | ------- | ----------- | ----------- | -----------------------   | -------------
apkFileName         | body   | String    | Required   |                               | APK  File name


+ Return: `HTTP Status: 201`

```javascript
{
    "success": true,
    "apkInfo": {
        "name": "xxxx",
        "name_en": "xxxx",
        "url": "https://www.xxxx.com/",
        "hidden_action_btn": true,
        "auto_connect_vpn": false
    }
}
```
---------------------