global.$ = $;

// var abar = require('address_bar');
// var folder_view = require('folder_view');
// var path = require('path');
var gui = require('nw.gui');
var shell = gui.Shell;
var fs = require('fs');
var cp = require('child_process');

var current_page = 'startpage';

var details = {};

var last_d = '';
function startpage_log(d) {
  var texts = (d+'').split('\n');
  while(texts.length > 0) {
    $('#log').prepend($('<span>'+$('<span/>').text(texts.pop()).html()+'</span>'+'<br/>'))
  }
}

function log(d) {
  if (current_page == 'startpage') {
    startpage_log(d);
  }
}

var _gdb_subscriber_funs = [log];
function subscribe_to_gdb_out(fun) {
 _gdb_subscriber_funs.push(fun);
}

var _gdb_subscriber_match_funs = [];
var _gdb_matcher_effects = [];
function subscribe_match_gdb_out(fun,cb) {
  var afterhelper = {};
  _gdb_subscriber_match_funs.push(fun);
  if (cb)
  _gdb_matcher_effects.push(cb);
  else 
  _gdb_matcher_effects.push(function(){});
}

function gdb_out(d) {
  for (var i in _gdb_subscriber_funs)
    _gdb_subscriber_funs[i](d);
  for (var i = 0; i < _gdb_subscriber_match_funs.length; i++) {
    if (_gdb_subscriber_match_funs[i](d)){
      _gdb_subscriber_match_funs.splice(i);
      _gdb_matcher_effects[i]();
      _gdb_matcher_effects.splice(i);
    }
  }
}

function matcher_subscriber_find_entry_point(d) {
  d += '';
  var matches = d.match(/Entry point:\s(0x[0-9a-f]*)/);
  if (matches) {
    details.entry_point = matches[1];
    log("FOUND ENTRY POINT" + details.entry_point);
    return true;
  }
  return false;
}


var _initialized = false;
var _gdb = null;
function gdb(path) {
  if (!_initialized) {
    var gdb = cp.spawn('gdb', [path]);
    startpage_log('gdb started');
    gdb.stdio[1].on('data', function(d) {
      gdb_out(d);
    });
    log("getting entry point address.....");
    subscribe_match_gdb_out(matcher_subscriber_find_entry_point,
    function() {
      // gdb.stdio[0].write('b *'+details.entry_point+'\n');
      // gdb.stdio[0].write('run\n');
      // gdb.stdio[0].write('x/1000i $pc\n');
    })
    gdb.stdio[0].write('info file\n');
  } else {
    return _gdb;
  }
}



function startpageLogic(cb) {
  $('form').on('submit', function(e) {
    e.preventDefault();
    var path = $('#prog-in').val();// TODO: check path exists;
    $('h2').text("Just a moment while we pull apart "+path);
    var analyzer = gdb(path);
  })
}


function loadpage(path, pageLogic) {
  $('#root').children().remove();
  var form = $(fs.readFileSync(path)+'');
  $('#root').append(form);
  pageLogic();
}

$(document).ready(function() {

  loadpage('views/startpage.html', startpageLogic);


  // showstart();
});
