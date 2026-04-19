// JavaScript Document

function getBaseURL () {
   return location.protocol + '//' + location.hostname + 
      (location.port && ':' + location.port) + '/';
}

(function() {
    tinymce.create('tinymce.plugins.vecb_button17', {
        init : function(ed, url) {
            ed.addButton('vecb_button17', {
                title : 'yellow underline &#038; bold',image : url+'/icons/yellow_underline_bold.png',onclick : function() {
                     ed.selection.setContent('<span class="linebold_yellow">' + ed.selection.getContent() + '</span>');
                }
            });
        },
        createControl : function(n, cm) {
            return null;
        },
    });
    tinymce.PluginManager.add('vecb_button17', tinymce.plugins.vecb_button17);
})();