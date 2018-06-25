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