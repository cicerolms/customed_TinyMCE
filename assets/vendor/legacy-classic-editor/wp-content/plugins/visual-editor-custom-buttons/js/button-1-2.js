// JavaScript Document

function getBaseURL () {
   return location.protocol + '//' + location.hostname + 
      (location.port && ':' + location.port) + '/';
}

(function() {
    tinymce.create('tinymce.plugins.vecb_button2', {
        init : function(ed, url) {
            ed.addButton('vecb_button2', {
                title : 'box-frame-orange-title',image : url+'/icons/box-frame-title.png',onclick : function() {
                     ed.selection.setContent('<p class="box-frame-orange-title">' + ed.selection.getContent() + '</p>');
                }
            });
        },
        createControl : function(n, cm) {
            return null;
        },
    });
    tinymce.PluginManager.add('vecb_button2', tinymce.plugins.vecb_button2);
})();