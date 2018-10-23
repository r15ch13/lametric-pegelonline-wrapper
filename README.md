# LaMetric Pegelonline Wrapper
This is a small wrapper for the [pegelonline.wsv.de REST API](https://pegelonline.wsv.de/webservice/dokuRestapi) used by my LaMetric App

## Usage

```
λ yarn
λ yarn run dev
```

## Available routes

* http://localhost:8080/?station=Oberwinter&maxGaugeLevel=640
* http://localhost:8080/Oberwinter/640

## Result

```json
{
   "frames":[
      {
         "icon":"i17893",
         "goalData":{
            "start":0,
            "current":11,
            "end":640,
            "unit":"cm"
         }
      },
      {
         "text":"low",
         "icon":"i401"
      },
      {
         "index":1,
         "chartData":[
            5,
            5.5,
            6,
            6,
            6,
            6,
            6.75,
            7,
            7.75,
            8,
            8.75,
            8.25,
            8.5,
            8,
            8,
            8,
            8.75,
            9,
            9,
            9,
            9.5,
            10,
            10,
            11,
            11
         ]
      }
   ]
}
```

# License
[The MIT License (MIT)](https://r15ch13.mit-license.org/)
