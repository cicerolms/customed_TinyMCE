// JavaScript Document

function getBaseURL () {
   return location.protocol + '//' + location.hostname + 
      (location.port && ':' + location.port) + '/';
}

(function() {
    tinymce.create('tinymce.plugins.vecb_button8', {
        init : function(ed, url) {
            ed.addButton('vecb_button8', {
                title : 'Box Green',image : url+'/icons/box_green.png',onclick : function() {
                     ed.selection.setContent('<div class="box_green">' + ed.selection.getContent() + '</div>');
                }
            });
        },
        createControl : function(n, cm) {
            return null;
        },
    });
    tinymce.PluginManager.add('vecb_button8', tinymce.plugins.vecb_button8);
})();