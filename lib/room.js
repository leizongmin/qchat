/**
 * socket.io chat
 *
 */
  
var web = require('QuickWeb');
  
// undefined
var _ = undefined; 
  
 /**
  * 创建一个房间
  *
  * @param {string} room 房间名称
  * @param {socket.io} io socket.io实例
  */
var Room = module.exports = function (room, io) {
	// 初始化socket.io实例，仅在第一次创建房间时需要设置io参数
	if (typeof io != 'undefined')
		Room.prototype.io = io;
	var io = this.io;
	
	// 房间成员列表
	var nicknames = this.nicknames = {};
	var onlinesum = this.onlinesum = 0;
	
	// 握手验证，如果是登录用户，则自动获取其昵称
	io.set('authorization', function (handshakeData, callback) {
		// 通过客户端的cookie字符串来获取其session数据
		var sessionObject = handshakeData.sessionObject = web.session.getByCookie(handshakeData.headers.cookie);
		
		// 如果不是登录用户，则自动为其设置一个昵称
		var nickname = sessionObject.data.nickname;
		if (typeof nickname != 'string' || nickname == '')
			nickname = '#' + Math.floor(Math.random() * 1000) + '' + (new Date().getTime() % 86400000);
		sessionObject.data.nickname = nickname;
		
		callback(null, true);
	});
	
	/** 连接处理 */
	var connectionHandle = function (socket) {
		onlinesum++;
		// 获取session
		var session = socket.handshake.sessionObject.data;
		var nickname = session.nickname;
		
		// 保持session，以免session过期
		var hold_session = socket.handshake.sessionObject.hold;
		
		/** 刷新在线列表 */
		refresh_online = function () {
			var n = [];
			for (var i in nicknames)
				n.push(i);
			socket.broadcast.emit('online list', n);
			socket.emit('online list', n);
		}
		
		// 新成员加入时，通知其他成员
		nicknames[nickname] = socket;
		refresh_online();
		socket.broadcast.emit('system message', nickname + '回来了，大家赶紧去喷他~~');
		
		/** 公共消息 */
		socket.on('public message', function (msg, cb) {
			hold_session();
			var timestamp = new Date().getTime();
			socket.broadcast.emit('public message', nickname, msg, timestamp);
			cb();
		});
		
		/** 私人消息 */
		socket.on('private message', function (to, msg, cb) {
			hold_session();
			var timestamp = new Date().getTime();
			var err = '';
			for (var i in to) {
				var target = nicknames[to[i]];
				if (target) {
					cb();
					target.emit('private message', nickname, msg, timestamp);
				}
				else {
					err += '“' + to[i] + '”不在线\n';
				}
			}
			if (err != '')
				cb(err);
		});
		
		/** 断开来连接 */
		 socket.on('disconnect', function () {
			delete nicknames[nickname];
			onlinesum--;
			socket.broadcast.emit('system message', nickname + '悄悄地离开了。。。');
			refresh_online();
		 });
		
		/** 命令 */
		socket.on('command', function (args, cb) {
			if (args.length < 1) {
				cb('无效的命令');
				return;
			}
			switch (args[0]) {
				/* 查询或更改昵称 */
				case 'nick':
					var nick = args[1];
					if (typeof nick == 'undefined')
						cb(_, '你的昵称是：' + nickname);
					else
						if (nick == nickname)
							cb('你的昵称本来就是“' + nick + '”嘛，不需要改');
						else if (nicknameIsUsed(nick))
							cb('昵称“' + nick + '”已被占用');
						else {
							nicknames[nick] = nicknames[nickname];
							delete nicknames[nickname];
							var oldnick = nickname;
							session.nickname = nickname = nick;
							cb(_, '昵称已更改为“' + nick + '”');
							// 通知其他人
							refresh_online();
							socket.broadcast.emit('system message', '“' + oldnick + '”的昵称已改为“' + nick + '”');
						}
					break;
					
				/* 在线人数 */
				case 'online':
					cb(_, '当前共有' + onlinesum + '个人在线');
					break;
					
				/* 帮助 */
				default:
					cb(_, strHelp);
			}
		});
	}
	
	/* 注册聊天室 */
	if (typeof room == 'undefined')
		room = '';
	io.of('/' + room).on('connection', connectionHandle);
	
	
	/** 检查昵称是否被占用 */
	var nicknameIsUsed = function (nickname) {
		for (var i in nicknames)
			if (i == nickname)
				return true;
		return false;
	}
}

var strHelp = '输入$help获取帮助\n\
========= 系统命令 ========\n\
**$nick** [昵称] 查看或更改昵称\n\
**$online** 当前在线人数\n\
**$clear** 清空消息\n\
========= 使用技巧 ========\n\
**给某人发送消息** @对方昵称 消息内容（可同时@多个人）\n\
**发送图片** !图片url\n\
**发送链接** [网址]\n\
';
