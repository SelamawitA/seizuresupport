

"use strict";

let Alexa = require("alexa-sdk");
let AWS = require('aws-sdk');
const APP_ID = 'amzn1.ask.skill.6f4eefbb-f0aa-474f-82c6-9394bcb2335c';
let ddb = new AWS.DynamoDB.DocumentClient();
let userLocation;
let handlers = {
  'LaunchRequest': function(){
    // this.emit(":ask", "Welcome to seizure support, a voice enabled seizure tracker.");
    this.response.speak("Welcome to seizure support a voice enabled seizure tracker.")
    this.emit(':responseReady');
  },
  'recordIntent': function() {
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
    ddb.put(params,(err,data)=>{
      if (err){
        console.log(err)
      }else{
        this.emit(":ask", "Recording");
      }
    });

  },

  'stopRecordingintent': function(){
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
    ddb.update(params,(err,data)=>{
      if (err){
        this.response.speak(err);
        this.emit(':responseReady');
      }else{
        this.emit(":ask", "Ending recording, say seizure type or skip to end session.");
      }
    });

  },'seizureTypeintent': function(){
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

    ddb.update(params,(err,data)=>{
      if (err){
        console.log(err)
        this.response.speak("An error has occured.")
        this.emit(':responseReady');
      }else{
        this.response.speak("Information has been recorded.")
        this.emit(':responseReady');
      }
    });
    //end
  }
}

exports.handler = function(event, context, callback){
  let alexa = Alexa.handler(event, context);
  alexa.appId = APP_ID;
  alexa.registerHandlers(handlers);
  alexa.execute();

};
