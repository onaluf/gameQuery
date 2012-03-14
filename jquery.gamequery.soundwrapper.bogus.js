/**
 * gameQuery rev. $Revision$
 *
 * Copyright (c) 2008 Selim Arsever (gamequery.onaluf.org)
 * licensed under the MIT (MIT-LICENSE.txt)
 */
// this allows use of the convenient $ notation in a plugin
(function($) {
    // Here is a bogus soundWrapper written as an example
    $.extend({
        SoundWrapper: function(url, loop) {
            this.soundready = false;

            // start loading the sound. Should turn this.ready to true once done.
            this.load  = function(){this.soundready = true};

            // plays the sound if this.ready == true
            this.play  = function(){};

            // pauses the sound if it is playing
            this.pause = function(){};

            // stops the sound if it is playing, rewind (even if paused)
            this.stop  = function(){};

            // mutes the sound without stopping it
            this.muted = function(mute){}

            // returns true if the sound is ready to be played
            this.ready = function(){return this.soundready};

            // add the sound to the manager
            $.gameQuery.resourceManager.addSound(this);
            return true;
        }},$.gameQuery);
})(jQuery);