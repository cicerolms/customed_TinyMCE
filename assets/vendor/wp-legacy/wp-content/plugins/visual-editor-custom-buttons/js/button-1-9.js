// JavaScript Document

function getBaseURL () {
   return location.protocol + '//' + location.hostname + 
      (location.port && ':' + location.port) + '/';
}

(function() {
    tinymce.create('tinymce.plugins.vecb_button9', {
        init : function(ed, url) {
            ed.addButton('vecb_button9', {
                title : 'Box Green Title',image : url+'/icons/box_green_title.png',onclick : function() {
                     ed.selection.setContent('<span class="box_green_ttl">' + ed.selection.getContent() + '</span>');
                }
            });
        },
        createControl : function(n, cm) {
            return null;
        },
    });
    tinymce.PluginManager.add('vecb_button9', tinymce.plugins.vecb_button9);
})();