// JavaScript Document

function getBaseURL () {
   return location.protocol + '//' + location.hostname + 
      (location.port && ':' + location.port) + '/';
}

(function() {
    tinymce.create('tinymce.plugins.vecb_button7', {
        init : function(ed, url) {
            ed.addButton('vecb_button7', {
                title : 'Box Orange Title',image : url+'/icons/box_orange_title.png',onclick : function() {
                     ed.selection.setContent('<span class="box_orange_ttl">' + ed.selection.getContent() + '</span>');
                }
            });
        },
        createControl : function(n, cm) {
            return null;
        },
    });
    tinymce.PluginManager.add('vecb_button7', tinymce.plugins.vecb_button7);
})();