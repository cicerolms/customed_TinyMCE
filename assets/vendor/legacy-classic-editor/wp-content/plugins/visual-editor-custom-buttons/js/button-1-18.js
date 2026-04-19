// JavaScript Document

function getBaseURL () {
   return location.protocol + '//' + location.hostname + 
      (location.port && ':' + location.port) + '/';
}

(function() {
    tinymce.create('tinymce.plugins.vecb_button18', {
        init : function(ed, url) {
            ed.addButton('vecb_button18', {
                title : '',image : url+'/icons/none.png',onclick : function() {
                     ed.selection.setContent('' + ed.selection.getContent() + '');
                }
            });
        },
        createControl : function(n, cm) {
            return null;
        },
    });
    tinymce.PluginManager.add('vecb_button18', tinymce.plugins.vecb_button18);
})();