'use strict'

exports.init = function () {
  Homey.manager('speech-input').on('speech', onSpeech)

  Homey.log('WolframAlpha started')
}

function requestWolfram (query) {
  var appId = Homey.manager('settings').get('appId')
  if (!appId) {
    Homey.error('Missing appId');
    speak(__('no_app_id'));
    return
  }
  var format = query.format
  if (!format && Homey.manager('settings').get('speakWait') !== false) {
    var msg = [__('searching1'), __('searching2'), __('searching3'), __('searching4')]
    speak(msg[Math.floor(Math.random() * msg.length)])
  }

  var Client = require('node-wolfram')
  var Wolfram = new Client(appId)
  Wolfram.query(query, function (err, result) {
    if (err) {
      Homey.error(err)
      return
    }
    var success = result.queryresult.$.success
    var pod
    var a
    var b
    if (success === 'false') {
      for (a = 0; a < result.queryresult.didyoumeans.length; a++) {
        var didyoumeans = result.queryresult.didyoumeans[a]
        for (b = 0; b < didyoumeans.didyoumean.length; b++) {
          Homey.manager('speech-input').ask(__('did_you_mean', {term: didyoumeans.didyoumean[b]._}))
        }
      }
    } else if (format === 'sound') {
      pod = result.queryresult.pod[0]
      // Homey.log(pod.$.title + ': ')
      for (b = 0; b < pod.sounds.length; b++) {
        var sounds = pod.sounds[b]
        for (var c = 0; c < sounds.sound.length; c++) {
          // console.log(sounds.sound[c])
          var url = sounds.sound[c].$.url
          Homey.log('playmusic', url)
          playSound(url)
        }
      }
    } else if (success === 'true') {
      for (a = 0; a < result.queryresult.pod.length; a++) {
        pod = result.queryresult.pod[a]
        for (b = 0; b < pod.subpod.length; b++) {
          // Homey.log(pod)
          if (pod.$.scanner === 'Music' || pod.$.scanner === 'PlaySound') {
            // Homey.log('Yes it is sound!')
            requestWolfram({
              input: query,
              format: 'sound'
            })
            return
          }
        }
      }
      var interpertation
      pod = result.queryresult.pod[0]
      for (b = 0; b < pod.subpod.length; b++) {
        interpertation = pod.subpod[b].plaintext[0]
        break
      }

      pod = result.queryresult.pod[0]
      for (b = 0; b < pod.subpod.length; b++) {
        var res = pod.subpod[b].plaintext[0]
        if (res.indexOf('|') !== -1) {
          speak('The ' + pod.$.title + ' information about ' + interpertation + ' is the following: ' + res + '. Do you want to specify your question?')
        } else {
          speak(interpertation + ' is ' + res)
        }
        return
      }
      speak(__('could_not_find'))
    }
  })
}

function onSpeech (speech) {
  speech.triggers.some(function (trigger) {
    var spokenText = removeTriggerText(speech.transcript, trigger)
    // Homey.log('spokenText: ' + spokenText)
    requestWolfram(spokenText)
    return true
  })
}

function speak (text) {
  Homey.manager('speech-output').say(text)
}

function playSound (url) {
  Homey.manager('media').setTrack({
    id: 'wolframURI:' + url,
    title: 'title',
    album: 'album',
    artist: 'artist',
    artwork: 'artwork',
    duration: 1,
    stream_url: url
  })
}

function removeTriggerText (text, trigger) {
  return text.slice(0, trigger.position) + text.slice(trigger.position + trigger.text.length)
}
