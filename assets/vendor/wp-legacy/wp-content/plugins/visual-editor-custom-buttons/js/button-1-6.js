// JavaScript Document

function getBaseURL () {
   return location.protocol + '//' + location.hostname + 
      (location.port && ':' + location.port) + '/';
}

(function() {
    tinymce.create('tinymce.plugins.vecb_button6', {
        init : function(ed, url) {
            ed.addButton('vecb_button6', {
                title : 'Box Organe',image : url+'/icons/box_orange.png',onclick : function() {
                     ed.selection.setContent('<div class="box_orange">' + ed.selection.getContent() + '</div>');
                }
            });
        },
        createControl : function(n, cm) {
            return null;
        },
    });
    tinymce.PluginManager.add('vecb_button6', tinymce.plugins.vecb_button6);
})();