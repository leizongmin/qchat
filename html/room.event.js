/**
 * room.event
 *
 */

/** 连接成功 */
socket.on('connect', function () {
	$('.room #connecting').fadeOut();
	$('.room #chat').fadeIn();
	room.clearMessage();
	room.showMessage('系统', '已进入房间!输入 $help 查看使用帮助', 'system');
});

/** 出错 */
socket.on('error', function (err) {
	console.error(err);
	room.showMessage('系统', err.toString(), 'system');
});

/** 接收到公共消息 */
socket.on('public message', function (from, msg) {
	room.showMessage(from, msg);
});

/** 接收到私人信息 */
socket.on('private message', function (from, msg) {
	room.showMessage(from, msg, 'private');
});

/** 接收到系统信息 */
socket.on('system message', function (msg) {
	room.showMessage('系统', msg, 'system');
});

/** 刷新在线列表 */
socket.on('online list', function (ns) {
	room.showOnline(ns);
});
