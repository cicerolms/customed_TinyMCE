// JavaScript Document

function getBaseURL () {
   return location.protocol + '//' + location.hostname + 
      (location.port && ':' + location.port) + '/';
}

(function() {
    tinymce.create('tinymce.plugins.vecb_button12', {
        init : function(ed, url) {
            ed.addButton('vecb_button12', {
                title : 'Box frame Orange',image : url+'/icons/box_frame_orange.png',onclick : function() {
                     ed.selection.setContent('<div class="box_frame_orange">' + ed.selection.getContent() + '</div>');
                }
            });
        },
        createControl : function(n, cm) {
            return null;
        },
    });
    tinymce.PluginManager.add('vecb_button12', tinymce.plugins.vecb_button12);
})();