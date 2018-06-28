## Build APK service

####  ✔ `POST` `/apk/build` - APK产出

+ Parameters:

Field Name       | Scope | Type       | Attributes | Validation                | Description      
---------------- | ------- | ----------- | ----------- | -----------------------   | -------------
apk_name         | body   | String    | Required   |                               | APK name
apk_name_en         | body   | String    | Required   |                               | APK english name 
apk_url             | body   | String     | Required   |                               | URL
logo        | body/file   | String     | Required   |                         | APK's logo

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
      "http://xxx.com/yahoo_20180101_v304.apk"
    ],
    [
      "yahoo",
      "yahoo_20180102_v304",
      "http://xxx.com/yahoo_20180101_v304.apk"
    ]
  ]
    ....
}
```
---------------------