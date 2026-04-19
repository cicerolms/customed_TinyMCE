// JavaScript Document

function getBaseURL () {
   return location.protocol + '//' + location.hostname + 
      (location.port && ':' + location.port) + '/';
}

(function() {
    tinymce.create('tinymce.plugins.vecb_button14', {
        init : function(ed, url) {
            ed.addButton('vecb_button14', {
                title : 'List Dot Green',image : url+'/icons/list_dot_orange2.png',onclick : function() {
                     ed.selection.setContent('<div class="listdot_orange2">' + ed.selection.getContent() + '</div>');
                }
            });
        },
        createControl : function(n, cm) {
            return null;
        },
    });
    tinymce.PluginManager.add('vecb_button14', tinymce.plugins.vecb_button14);
})();