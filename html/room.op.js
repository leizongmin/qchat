/**
 * room.op
 *
 */
 
// 命名空间 
if (typeof room != 'object')
	room = {}
 
/** 发送消息 */
room.sendMessage = function () {
	var msg = $('#message').val().trim();
	var op = msg.substr(0, 1);
	// 如果以$开头，则为系统消息
	if (op == '$') {
		room.sendSystemMessage(msg);
		return;
	}
	// 如果以@开头，则为私人信息
	if (op == '@') {
		var p = msg.indexOf(' ');
		if (p > 0) {
			room.sendPrivateMessage(msg);
			return;
		}
	}
	// 发送公共消息
	room.sendPublicMessage(msg);
}
/** 发送私人信息 */
room.sendPrivateMessage = function (msg) {
	to = msg.match(/(@[\u4e00-\u9fa5\w\-]+)/g);
	for (var i in to)
		to[i] = to[i].substr(1);
	socket.emit('private message', to, msg, function (err) {
		if (err) {
			room.showMessage('我', '刚才发送的消息“' + msg + '”不成功！（' + err + '）' , 'error');
		}
		else {
			room.showMessage('我', msg, 'own');
			room.clearInput();
		}
	});		
}
/** 发送公共消息 */
room.sendPublicMessage = function (msg) {
	socket.emit('public message', msg, function (err) {
		if (err) {
			room.showMessage('我', '刚才发送的消息“' + msg + '”不成功！（' + err + '）', 'error');
		}
		else {
			room.showMessage('我', msg, 'own');
			room.clearInput();
		}
	});
}
/** 发送系统消息 */
room.sendSystemMessage = function (msg) {
	var args = msg.substr(1).split(/\s+/);
	title = '命令：' + args[0] + '\n';
	args[0] = args[0].toLowerCase();
	
	// 本地命令
	if (args[0] == 'clear') {
		room.clearMessage();
		room.clearInput();
		return;
	}
	
	// 远程命令
	socket.emit('command', args, function (err, ret) {
		if (err) {
			room.showMessage('系统', title + err, 'error');
		}
		else {
			room.showMessage('系统', title + ret, 'system');
			room.clearInput();
		}
	});
}

/** 显示一条消息 */
room.showMessage = function (from, msg, type) {
	var from = room.formatMessage(from);
	var msg = room.formatMessage(msg);
	if (!type)
		type = '';
	else
		type = 'type-' + type;
	var html = '\
<div class="line ' + type + '">\
	<div class="message-header">\
		<span class="message-from">' + from + '</span>\
		<span class="message-timestamp">' + new Date() + '</span>\
	</div>\
	<div class="message-text">\
		' + msg + '\
	</div>\
</div>';
	$('#lines').append(html);
	$('#lines').get(0).scrollTop = 10000000;
}

/** 显示在线列表 */
room.showOnline = function (n) {
	var html = '';
	n.forEach(function (v) {
		html += '<div class="line" onclick="room.writePrivateMessage(\'' + v + '\')">' + v + '</div>';
	});
	$('#nicknames').html(html);
}

/** 清空所有消息 */
room.clearMessage = function () {
	$('#lines .line').remove();
}

/** 清空输入框 */
room.clearInput = function () {
	$('#message').val('');
}

/** 在输入框中@某人 */
room.writePrivateMessage =function (n) {
	var $m = $('#message');
	if (n.substr(0, 1) != '@')
		n = '@' + n;
	$m.val(n + ' ' + $m.val());
}

/** 格式化消息 */ 
room.formatMessage = function (html) {
	html = html.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/\n/g, '<br>')
		.replace(/(@[\u4e00-\u9fa5\w\-]+)/gi, '<a href="#" onclick="room.writePrivateMessage(\'$1\');">$1</a>')
		.replace(/\[((http|ftp|https|file):\/\/([\w\-]+\.)+[\w\-]+(\/[\w\-\.\/?\@\%\!\&=\+\~\:\#\;\,]*)?)\]/ig, '<a href="$1" target="_blank">$1</a>')
		.replace(/!((http|ftp|https|file):\/\/([\w\-]+\.)+[\w\-]+(\/[\w\-\.\/?\@\%\!\&=\+\~\:\#\;\,]*)?)/ig, '<img src="$1">')
		.replace(/[\*]{2}([^\*]+)[\*]{2}/gi, '<b>$1</b>')
		.replace(/_([^_]+)_/gi, '<i>$1</i>');
	return html;
}
