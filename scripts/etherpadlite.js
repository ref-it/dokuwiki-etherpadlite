var ep = { };

ep.imgBase = null;
ep.config = etherpad_lite_config;
ep.aceWasEnabled = false;
ep.isOwner = false;
ep.readOnly = false;
ep.timer = null;
ep.lang = null;

ep.on_disable = function() {
  if (ep.isOwner) {
    window.clearInterval(ep.timer); ep.timer = null;
    jQuery.post(
      DOKU_BASE + 'lib/exe/ajax.php',
      { 'id' : ep.config["id"], "rev" : ep.config["rev"], "call" : "pad_close",
        "prefix" : jQuery('#dw__editform').find('input[name=prefix]').val(),
        "suffix" : jQuery('#dw__editform').find('input[name=suffix]').val(),
        "date" : jQuery('#dw__editform').find('input[name=date]').val()
      },
      function(data) {
          if (data.error) {
             alert(data.error);
          } else {
             jQuery('#wiki__text').val(data.text);
             jQuery('.pad-toggle').hide();
             jQuery('.pad-toggle-off').show();
             jQuery('.pad').html("");
             jQuery('.pad').hide();
             jQuery('#bodyContent').show();
             if (ep.aceWasEnabled) {
                jQuery('img.ace-toggle[src*="off"]:visible').click();
             }
          }
      }
    );
  } else {
     jQuery('.pad-toggle').hide();
     jQuery('.pad-toggle-off').show();
     jQuery('.pad').html("");
     jQuery('.pad').hide();
     jQuery('#bodyContent').show();
     if (ep.aceWasEnabled) {
        jQuery('img.ace-toggle[src*="off"]:visible').click();
     }
  }
};

ep.on_lock = function() {
  var password = prompt("Neues Passwort", "");
  jQuery.post(
      DOKU_BASE + 'lib/exe/ajax.php',
      { 'id' : ep.config["id"], "rev" : ep.config["rev"], "call" : "pad_setpassword", "password" : password },
      function(data) {
          if (data.error) {
             alert(data.error);
          } else {
             if (!data.canPassword) {
                 jQuery('.pad-lock').hide();
             } else {
                 if (data.hasPassword) {
                     jQuery(".pad-lock").attr("src",ep.imgBase+"lock.png");
                 } else {
                     jQuery(".pad-lock").attr("src",ep.imgBase+"nolock.png");
                 }
             }
          }
      }
  );
}

ep.on_enable = function() {
  /* disable ACE, cache it => text is in wiki__text, ace can be restored. */
  ep.aceWasEnabled = (jQuery('img.ace-toggle[src*="on"]:visible').length > 0);
  var text = "";
  if (!ep.readOnly) {
      jQuery('img.ace-toggle[src*="on"]:visible').click();
      text = jQuery('#wiki__text').val();
  }
  /* set cookie domain for wiki.stura + box.stura */
  document.domain = "stura.tu-ilmenau.de";
  /* commit */
  jQuery.post(
      DOKU_BASE + 'lib/exe/ajax.php',
      { 'id' : ep.config["id"], "rev" : ep.config["rev"], "call" : "pad_open", "text" : text, "readOnly": ep.readOnly },
      function(data) {
          if (data.error) {
             alert(data.error);
          } else {
             ep.isOwner = data.isOwner;
             document.cookie="sessionID="+data.sessionID+";domain=stura.tu-ilmenau.de;path=/";
             jQuery('.pad-toggle').hide();
             jQuery('.pad-toggle-on').show();
             jQuery('.pad').show();
             var htext = (ep.isOwner ? ep.lang.padowner : ep.lang.padnoowner);
             htext = htext.replace(/%s/, ep.config["id"]);
             htext = htext.replace(/%d/, ep.config["rev"]);

             jQuery('<div/>').addClass("pad-toolbar").html(htext).appendTo(jQuery('.pad'));
             jQuery("<img/>").addClass("pad-close").attr("src",ep.imgBase+"close.png").appendTo(jQuery(".pad-toolbar")).click(ep.on_disable);
             jQuery("<img/>").addClass("pad-lock").attr("src",ep.imgBase+"nolock.png").appendTo(jQuery(".pad-toolbar")).click(ep.on_lock);
             jQuery('#bodyContent').hide();
             jQuery('<iframe/>').attr("src",data.url).appendTo(jQuery('.pad'));
             if (!data.canPassword) {
                 jQuery('.pad-lock').hide();
             } else {
                 if (data.hasPassword) {
                     jQuery(".pad-lock").attr("src",ep.imgBase+"lock.png");
                 } else {
                     jQuery(".pad-lock").attr("src",ep.imgBase+"nolock.png");
                 }
             }
             if (ep.isOwner) {
                 ep.timer = window.setInterval(ep.refresh, 5 * 60 * 1000);
             }
          }
      }
  );
};

ep.refresh = function() {
  jQuery.post(
      DOKU_BASE + 'lib/exe/ajax.php',
      { 'id' : ep.config["id"], "rev" : ep.config["rev"], "call" : "pad_getText" },
      function(data) {
          if (data.error) {
             alert(data.error);
          } else {
             dw_locktimer.refresh();
             jQuery('#wiki__text').val(data.text);
          }
      }
    );
}

ep.initialize = function() {
  ep.lang = LANG.plugins.etherpadlite;
  ep.imgBase = ep.config["base"] + "/img/";
  ep.readOnly = (ep.config["act"] == "locked");
  jQuery("<img/>").addClass("pad-toggle pad-toggle-off").attr("src",ep.imgBase+"toggle_off.png").insertAfter(jQuery("#size__ctl")).click(ep.on_enable);
  jQuery("<img/>").addClass("pad-toggle pad-toggle-on").attr("src",ep.imgBase+"toggle_on.png").insertAfter(jQuery("#size__ctl")).click(ep.on_disable);
  jQuery("<div/>").addClass("pad").insertAfter(jQuery("#bodyContent"));
  jQuery('.pad-toggle').hide();
  jQuery('.pad-toggle-off').show();
  jQuery('.pad').hide();
};

jQuery(document).ready(ep.initialize);