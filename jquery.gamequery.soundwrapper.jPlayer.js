/**
 * gameQuery rev. $Revision$
 *
 * Copyright (c) 2008 Selim Arsever (gamequery.onaluf.org)
 * licensed under the MIT (MIT-LICENSE.txt)
 */

 /**
  * To use this wrapper you will need:
  * 1) Include SoundManager2.js before this script
  * 2) Give SoundManager2 the position of the swf ie. : soundManager.url = './path/to/swf'
  * 3) Optionally deactivate the debug mode from SoundManager2
  */

// this allows use of the convenient $ notation in a plugin
(function($) {
    soundManager.url = './'
    // Here is a bogus soundWrapper written as an example
    $.extend($.gameQuery, {
        SoundWrapper: function(url, loop) {

            // start loading the sound. Should turn this.ready to true once done.
            this.load  = function(){
                this.sound = soundManager.createSound({
                    id: this.id,
                    url: url,
                    autoplay: false,
                    autoLoad: true
                });
            };

            // plays the sound if this.ready == true
            this.play  = function(){
                if(loop){
                    this.sound.play({
                        onfinish: function() {
                            this.play();
                        }
                    });
                } else {
                    this.sound.play();
                }
            };

            // pauses the sound if it is playing
            this.pause = function(){
                this.sound.pause();
            };

            // stops the sound if it is playing, rewind (even if paused)
            this.stop  = function(){
                this.sound.stop();
            };

            // mutes the sound without stopping it
            this.muted = function(mute){
                if(mute){
                    this.sound.mute()
                } else {
                    this.sound.unmute();
                }
            }

            // returns true if the sound is ready to be played
            this.ready = function(){
                return this.sound.readyState==3
            };

            // add the sound to the manager
            this.id = 'sound_'+$.gameQuery.resourceManager.sounds.length;
            $.gameQuery.resourceManager.addSound(this);

            return true;
        }});
})(jQuery);