"use strict";

function App() 
{
    this.cache = {};
    this.woeid = undefined;
}

module.exports = App;
var app = new App();

App.prototype.init = function(){
    Homey.log ("WolframAlpha app started");

    //Listen for speech triggers
    Homey.manager('speech-input').on('speech', onSpeech)
};

App.prototype.playmusic = function (url, callback) {
    Homey.log("Play Music");

    var http = require('http');
    var wav = require('wav');
    var Speaker = require('speaker');

    var makeStream = function(url) { 
      var stream = require('stream')
      var rs = new stream.PassThrough()
      var request = http.get(url, function(res) {
        res.pipe(rs)
      })
      return rs
    }

    var file = makeStream(url);
    var reader = new wav.Reader();

    reader.on('format', function (format) {
      reader.pipe(new Speaker(format)); //Play the WAV file
    });

    file.pipe(reader); //Pipe the WAV file to the Reader

    app.speakOutput ("Do you want to hear the sound it again?");
}

App.prototype.requestWolfram = function( spoken_text ) {
    Homey.log ("Request Wolfram Alpha")

    var config      = require('./config.json');
    var wait = ["Just a sec", "I am looking it up", "Wait a second, Homey is finding your anwser", "I am searching for you"] //Make Homey say that you have to wait for a little while
    Homey.log (wait);

    var found = 0;
    var foundMusic = 0;
    var sound = spoken_text.format; //Check if the object spoken_text  contains the format sound
    var interpertation;
    var Client = require('node-wolfram');
    var Wolfram = new Client(config.appid); //AppId
    Wolfram.query(spoken_text, function(err, result) {
        if(err) {
            Homey.log(err);
            app.speakOutput ("Sorry, Homey ran into an error!");
        }
        var success = result.queryresult.$.success;

        if (success == "false") {
              for(var a=0; a<result.queryresult.didyoumeans.length; a++) //Read all pod results step by step
              {
                  var didyoumeans = result.queryresult.didyoumeans[a];
                  for(var b=0; b<didyoumeans.didyoumean.length; b++) //Read all content step by step (most of the time one)
                  {
                      var didyoumean = didyoumeans.didyoumean[b];
                      //Homey.log (didyoumean._); //Log what you meant
                      app.askOutput ("Did you mean: " + didyoumean._ + "?");
                  }
              }
            }
        else if (sound == null && success == "true") { //If not yet checked if it contains sound
            for(var a=0; a<result.queryresult.pod.length; a++)
            {
                var pod = result.queryresult.pod[a];
                  //Homey.log ("Is it sound?");
                  for(var b=0; b<pod.subpod.length; b++) //Read all content step by step (most of the time one)
                  {
                      //Homey.log(pod.$.scanner);
                      if (pod.$.scanner == "Music" || pod.$.scanner == "PlaySound") {
                        Homey.log ("Yes it is sound!");
                        foundMusic = 1;
                      }
                  }
            }
            if (foundMusic == 1) {
                app.requestWolfram ({"input": spoken_text , "format": "sound"});
            }
            else { // Else it is just text, read it out!
            for(var a=0; a<1; a++) //Check how Wolfram interperted the text
            {
                var pod = result.queryresult.pod[a];
                  Homey.log ("get interpertation");
                  for(var b=0; b<pod.subpod.length; b++) //Read all content step by step (most of the time one)
                  {
                      var subpod = pod.subpod[b];
                      for(var c=0; c<1; c++)
                      {
                          interpertation = subpod.plaintext[c];
                          //Homey.log(text); //display plaintext content
                      }
                  }
            }
            for(var a=1; a<2; a++) //Read second pod, which is most of the time the result
            {
                var pod = result.queryresult.pod[a];
                var title = pod.$.title;
                Homey.log (pod.$.title);
                  Homey.log ("found result");
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
                          //Homey.log(result); //display plaintext content
                          app.speakOutput (sentence);
                          found = 1;
                      }
                  }
            }

            if (found == 0) {
                app.speakOutput ("Sorry, Homey couldn't found what you are looking for!");
            }
        
}        }
        else if (sound == "sound") { //If there is sound, play it!         
            for(var a=0; a<1; a++) //Only open the first pod for 1 sound
            {
                var pod = result.queryresult.pod[a];
                Homey.log(pod.$.title,": ");
                for(var b=0; b<pod.sounds.length; b++)
                {
                    var sounds = pod.sounds[b];
                    //Homey.log(sounds); 
                    for(var c=0; c<sounds.sound.length; c++)
                    {
                        var url = sounds.sound[c].$.url;
                        Homey.log(url);
                        app.playmusic (url);
                    }
                }
            }
        }
    });
};

//Listen for speech
function onSpeech(speech) {
    Homey.log("Speech is triggered");

    var spoken_text;
    var format;

       // loop all triggers
       speech.triggers.forEach(function(trigger){

       Homey.log ("speech.transcript: " + speech.transcript);

       var replace1 = speech.transcript.replace("wolfram", ""); //Replace Wolfram (trigger) with nothing
           spoken_text = replace1.replace("question", ""); //Replace question (trigger) with nothing 
                
       });

    Homey.log ("spoken_text: " + spoken_text);
    app.requestWolfram (spoken_text);
}

App.prototype.speakOutput = function( output ){
    Homey.log("speakOutput");
    Homey.log(output);

    //Homey.manager('speech-output').say( __(output );
}

App.prototype.askOutput = function( output ){
    Homey.log("askOutput");
    Homey.log(output);

    //Homey.manager('speech-output').ask( __(output );
}