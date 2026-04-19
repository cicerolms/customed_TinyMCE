// JavaScript Document

function getBaseURL () {
   return location.protocol + '//' + location.hostname + 
      (location.port && ':' + location.port) + '/';
}

(function() {
    tinymce.create('tinymce.plugins.vecb_button16', {
        init : function(ed, url) {
            ed.addButton('vecb_button16', {
                title : 'List Number Orange',image : url+'/icons/list_number_orange.png',onclick : function() {
                     ed.selection.setContent('<div class="listnumber">' + ed.selection.getContent() + '</div>');
                }
            });
        },
        createControl : function(n, cm) {
            return null;
        },
    });
    tinymce.PluginManager.add('vecb_button16', tinymce.plugins.vecb_button16);
})();