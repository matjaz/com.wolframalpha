"use strict";

function App() 
{
    this.cache = {};
    this.woeid = undefined;
}

module.exports = App;
var app = new App();

App.prototype.init = function(){
    console.log ("App started");

    this.events.speech();
    //this.testWolfram();
};

App.prototype.requestWolfram = function( spoken_text ) {
    console.log ("Request Wolfram Alpha")

    var found = 0;
    var sound = spoken_text.format; //Check if the object spoken_text contains the format sound
    var interpertation;
    var Client = require('node-wolfram');
    //var variables = {"input": "C major", "format": "sound"}; //Could also instead of spoken_text
    var Wolfram = new Client("8V9EP3-29229H3WUK"); //AppId
    Wolfram.query(spoken_text, function(err, result) {
        if(err) {
            console.log(err);
            app.speakOutput ("Sorry, Homey ran into an error!");
        }
        else if (sound == null) { //If not yet checked if it contains sound
            for(var a=0; a<result.queryresult.pod.length; a++)
            {
                var pod = result.queryresult.pod[a];
                  console.log ("Is it sound?");
                  for(var b=0; b<pod.subpod.length; b++) //Read all content step by step (most of the time one)
                  {
                      console.log(pod.$.scanner);
                      if (pod.$.scanner == "Music") {
                        console.log ("Yes it is sound!");
                        app.requestWolfram ({"input": spoken_text , "format": "sound"});
                      }
                  }
            }
        }
        else if (sound == "sound") { //If there is sound, play it!         
            for(var a=0; a<result.queryresult.pod.length; a++)
            {
                var pod = result.queryresult.pod[a];
                console.log(pod.$.title,": ");
                for(var b=0; b<pod.sounds.length; b++)
                {
                    var sounds = pod.sounds[b];
                    //console.log(sounds); 
                    for(var c=0; c<sounds.sound.length; c++)
                    {
                        var text = sounds.sound[c].$.url;
                        console.log('\t', text);
                    }
                }
            }
        }
        else { // Else it is just text, read it out!
            for(var a=0; a<1; a++) //Check how Wolfram interperted the text
            {
                var pod = result.queryresult.pod[a];
                  console.log ("get interpertation");
                  for(var b=0; b<pod.subpod.length; b++) //Read all content step by step (most of the time one)
                  {
                      var subpod = pod.subpod[b];
                      for(var c=0; c<1; c++)
                      {
                          interpertation = subpod.plaintext[c];
                          //console.log(text); //display plaintext content
                      }
                  }
            }
            for(var a=1; a<2; a++) //Read second pod, which is most of the time the result
            {
                var pod = result.queryresult.pod[a];
                var title = pod.$.title;
                console.log (pod.$.title);
                  console.log ("found result");
                  for(var b=0; b<pod.subpod.length; b++) //Read all content step by step (most of the time one)
                  {
                      var subpod = pod.subpod[b];
                      for(var c=0; c<1; c++)
                      {
                          var result = subpod.plaintext[c];
                          if (result.indexOf('|') >= 0) {
                            var sentence = "The " + title + " information about " + interpertation + " is the following: " + result + ". Do you want to specify your question?";
                          } else {
                            var sentence = interpertation + " is " + result;
                          }
                          //console.log(result); //display plaintext content
                          app.speakOutput (sentence);
                          found = 1;
                      }
                  }
            }

            if (found == 0) {
                app.speakOutput ("Sorry, Homey coudn't found what you are looking for!");
            }
        }

    });
};


App.prototype.testWolfram = function( callback ) {
    console.log ("Test Request Wolfram Alpha")

    var Client = require('node-wolfram');
    var Wolfram = new Client('8V9EP3-29229H3WUK'); //AppId
    Wolfram.query("tides Boston October 2005", function(err, result) {
        if(err)
            console.log(err);
        else
        {
            console.log(text);
            console.log("I am here!");
            for(var a=0; a<result.queryresult.pod.length; a++) //Read all pod results step by step
            {
                var pod = result.queryresult.pod[a];
                console.log(pod.$.title,": "); //display title
                for(var b=0; b<pod.subpod.length; b++) //Read all content step by step (most of the time one)
                {
                    var subpod = pod.subpod[b];
                    for(var c=0; c<subpod.plaintext.length; c++)
                    {
                        var text = subpod.plaintext[c];
                        console.log('\t', text); //display plaintext content
                    }
                }
            }
        }

    });
};

App.prototype.events = {};
App.prototype.events.speech = function() {
    console.log("Speech is triggered");

    var spoken_text;
    var format;

    speech.triggers.forEach(function(trigger){
        spoken_text = trigger.text;
    });

    console.log (spoken_text);
    app.requestWolfram (spoken_text);
}

App.prototype.speakOutput = function( output ){
    console.log("speakWeather");
    console.log(output);

    //Homey.manager('speech-output').say( __(output );
}

App.prototype.askOutput = function( output ){
    console.log("askWeather");
    console.log(output);

    //Homey.manager('speech-output').ask( __(output );
}

var speech = {
   "transcript": "two plus two",
   "language": "en",
   "triggers": [
     {
       "id": "text",
       "position": 15,
       "text": "C major"
     },
   ],
   "zones": [],
   "time": false,
   "agent": "homey:app:wolframalpha"
};

app.init(); //call init function