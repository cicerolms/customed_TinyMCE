// JavaScript Document

function getBaseURL () {
   return location.protocol + '//' + location.hostname + 
      (location.port && ':' + location.port) + '/';
}

(function() {
    tinymce.create('tinymce.plugins.vecb_button11', {
        init : function(ed, url) {
            ed.addButton('vecb_button11', {
                title : 'Box Blue Title',image : url+'/icons/box_blue_title.png',onclick : function() {
                     ed.selection.setContent('<p class="box-blue-title">' + ed.selection.getContent() + '<p>');
                }
            });
        },
        createControl : function(n, cm) {
            return null;
        },
    });
    tinymce.PluginManager.add('vecb_button11', tinymce.plugins.vecb_button11);
})();