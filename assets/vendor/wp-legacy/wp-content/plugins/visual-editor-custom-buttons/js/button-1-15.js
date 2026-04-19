// JavaScript Document

function getBaseURL () {
   return location.protocol + '//' + location.hostname + 
      (location.port && ':' + location.port) + '/';
}

(function() {
    tinymce.create('tinymce.plugins.vecb_button15', {
        init : function(ed, url) {
            ed.addButton('vecb_button15', {
                title : 'List Dot Orange',image : url+'/icons/list_dot_orange.png',onclick : function() {
                     ed.selection.setContent('<div class="listdot_orange">' + ed.selection.getContent() + '</div>');
                }
            });
        },
        createControl : function(n, cm) {
            return null;
        },
    });
    tinymce.PluginManager.add('vecb_button15', tinymce.plugins.vecb_button15);
})();