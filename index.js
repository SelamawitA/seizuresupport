
"use strict";

let Alexa = require("alexa-sdk");
let AWS = require('aws-sdk');
const APP_ID = 'amzn1.ask.skill.6f4eefbb-f0aa-474f-82c6-9394bcb2335c';
let ddb = new AWS.DynamoDB.DocumentClient();
let userLocation
let handlers = {
  'LaunchRequest': function(){
    //this.emit(":ask", "Welcome to seizure support, a voice enabled seizure tracker, say your location to complete setup.");
    this.response.speak("Welcome to seizure support, a voice enabled seizure tracker, say your location to complete setup.")
    this.emit(':responseReady');
  },
  // 'citiesIntent': function(){
  //   //////////////////////////////////////////////////////////////////////
  //   // user responds with their city location after the onLaunch event.  //
  //   // After this point, the stopRecordingIntent doesn't work - recordIntent and seizureTypeIntent both still function //
  //   ////////////////////////////////////////////////////////////////////////////////////////////////////////

  //     // var map = [ this.event.request.intent.slots.UScity.value, this.event.request.intent.slots.GBcity.value, this.event.request.intent.slots.Europe.value ];

  //     // for (var i=0; i < map.length; i++){
  //     //   if (map[i]!= null){
  //     //     userLocation = map[i];
  //     //   }
  //     // }


  //     userLocation = this.event.request.intent.slots.UScity.value;

  //     this.response.speak(userLocation + " has been set");
  //     this.emit(':responseReady');
  //   },
  'recordIntent': async function() {
    let date = new Date();
    let startTime = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    let dateStamp = `${date.getMonth()}-${date.getDate()}-${date.getFullYear()}`;

    this.attributes['startTime'] = startTime;
    this.attributes['date'] = dateStamp;
    let params = {
      TableName: 'seizureActivity',
      Item:{
        "startTime": this.attributes['startTime'],
        "date": dateStamp,
      }
    };
    await ddb.put(params,(err,data)=>{
      if (err){
        console.log(err)
      }else{
        console.log(data)
      }
    }).promise();
    this.emit(":ask", "Recording");

  },
  'stopRecordingintent': async function(){
    //failure here//
    let date = new Date();
    let endTime = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    let params = {
      TableName:'seizureActivity',
      Key:{
        startTime : this.attributes['startTime'],
        date      : this.attributes['date']
      },
      UpdateExpression: "set endTime =:endTime",
      ExpressionAttributeValues:{
        ":endTime":endTime
      },
      ReturnValues:"UPDATED_NEW"
    };
    await ddb.update(params,(err,data)=>{
      if (err){
        this.response.speak(err);
        this.emit(':responseReady');
      }else{
        this.emit(":ask", "Ending recording, say seizure type or skip to end session.");
      }
    }).promise();

  },'seizureTypeintent': async function(){
    let date = new Date();
    let seizureCategory = this.event.request.intent.slots.seizure.value;

    let params = {
      TableName:'seizureActivity',
      Key:{
        startTime : this.attributes['startTime'],
        date      : this.attributes['date']
      },
      UpdateExpression: "set seizureType =:seizureType",
      ExpressionAttributeValues:{
        ":seizureType": seizureCategory
      },
      ReturnValues:"UPDATED_NEW"
    };

    await ddb.update(params,(err,data)=>{
      if (err){
        console.log(err)
      }else{
        this.response.speak("Information has been recorded.")
        this.emit(':responseReady');
      }
    }).promise();

    //end
  }
}

exports.handler = function(event, context, callback){
  let alexa = Alexa.handler(event, context);
  alexa.appId = APP_ID;
  alexa.registerHandlers(handlers);
  alexa.execute();

};
