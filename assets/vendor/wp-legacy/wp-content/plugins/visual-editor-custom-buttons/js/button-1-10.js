// JavaScript Document

function getBaseURL () {
   return location.protocol + '//' + location.hostname + 
      (location.port && ':' + location.port) + '/';
}

(function() {
    tinymce.create('tinymce.plugins.vecb_button10', {
        init : function(ed, url) {
            ed.addButton('vecb_button10', {
                title : 'Box Blue',image : url+'/icons/box_blue.png',onclick : function() {
                     ed.selection.setContent('<div class="box-blue">' + ed.selection.getContent() + '</div>');
                }
            });
        },
        createControl : function(n, cm) {
            return null;
        },
    });
    tinymce.PluginManager.add('vecb_button10', tinymce.plugins.vecb_button10);
})();