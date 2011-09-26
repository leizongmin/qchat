/**
 * qchat
 *
 * @author 老雷<leizongmin@gmail.com>
 * @version 0.1
 */
 
var web = require('QuickWeb');
var io = require('socket.io');
var mustache = require('mustache');
var Room = require('./lib/room.js');
 
 
/* 配置QuickWeb */
var web = require('QuickWeb');
web.set('home_path', './html');				// 网站根目录
web.set('code_path', './code');				// 处理程序目录
web.set('template_path', './html');			// 模板目录
web.set('tmp_path',	'./tmp');				// 临时目录
// 模板引擎
web.set('render_to_html', function (str, view) {
	console.log(view);
	return mustache.to_html(str, view);
});
// 监听80端口
var s = web.create(80);


/* 配置socket.io */
io = io.listen(s);
// 注册房间
new Room('nodejs', io);
new Room('test');


/* 日志输出 */
web.setLogLevel(3);
//io.set('log level', 1);