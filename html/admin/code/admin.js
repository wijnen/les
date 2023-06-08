var server, error, login, content, groups, group, chapter, current_chapter, program, current, responses, blocked, option_list;

function reset_password(user) {
	if (!confirm('Do you want to reset the password for ' + responses[user].name + '?'))
		return;
	server.call('reset_password', [user]);
}

function button(label, click, items) {
	var ret = Create('button');
	ret.type = 'button';
	ret.AddText(label);
	ret.AddEvent('click', function() { click.call(this); });
	if (items) {
		for (i in items)
			ret[i] = items[i];
	}
	return ret;
}

function EditableList(data, cbs, element) {
	// This is a class which provides an editable list.
	// data is an array which contains the rows.
	// data is updated when editing.
	// cbs contains callbacks:
	//	add is a callback to handle a click on the "add" button.
	//	create is a callback to create one element in the list.
	//	edit is a callback to start editing. If undefined, the button is not shown.
	// The return value is an Element which should be inserted into the DOM.
	var ret = element === undefined ? Create('table') : element.ClearAll();
	ret.data = data;
	ret.options = [];
	var final_tr = ret.AddElement('tr');
	var td = final_tr.AddElement('td');
	td.colSpan = cbs['edit'] ? 5 : 4;
	td.Add(button('➕', function() {
		cbs.add(data);
	}, {'className': 'list_add'}));
	ret.add = function(content, idx) {
		// Add an item to the list. If idx is undefined, also add it to data.
		if (idx === undefined) {
			idx = data.length;
			data.push(content);
		}
		var tr = Create('tr');
		ret.insertBefore(tr, final_tr);
		ret.options.push(tr);
		if (idx == 0)
			tr.AddClass('first');
		else
			ret.options[idx - 1].RemoveClass('last');
		tr.AddClass('last');
		if (idx & 1)
			tr.AddClass('odd');
		tr.td = tr.AddElement('td');
		tr.td.idx = idx;
		cbs.create(tr.td, content);
		tr.AddElement('td').Add(button('❌', function() {
			if (cbs.remove !== undefined)
				cbs.remove(tr.td, idx, content);
			else
				ret.remove(tr.td);
		}));
		tr.AddElement('td').Add(button('↑', function() {
			if (cbs.up !== undefined)
				cbs.up(tr.td, idx, content);
			else
				ret.up(tr.td);
		}, {'className': 'up'}));
		tr.AddElement('td').Add(button('↓', function() {
			if (cbs.down !== undefined)
				cbs.down(tr.td, idx, content);
			else
				ret.down(tr.td);
		}, {'className': 'down'}));
		if (cbs.edit !== undefined) {
			tr.AddElement('td').Add(button('✎', function() {
				cbs.edit(tr.td, idx, content);
			}));
		}
		if (cbs.save !== undefined) {
			tr.AddElement('td').Add(button('💾', function() {
				cbs.save(tr.td, idx, content);
			}));
		}
	};
	for (var i = 0; i < data.length; ++i)
		ret.add(data[i], i);
	ret.set = function(obj, value) {
		// Set value in data which corresponds to obj to value.
		data[obj.idx] = value;
	};
	ret.get = function(obj) {
		// Get value in data which corresponds to obj.
		return data[obj.idx];
	};
	ret.remove = function(obj) {
		// Remove item idx from the list. Also remove it from data.
		var idx = obj.idx;
		ret.removeChild(ret.options.splice(idx, 1)[0]);
		data.splice(idx, 1);
		for (var i = idx; i < data.length; ++i) {
			ret.options[i].td.idx = i;
			if (i & 1)
				ret.options[i].AddClass('odd');
			else
				ret.options[i].RemoveClass('odd');
		}
		if (ret.options.length > 0) {
			ret.options[0].AddClass('first');
			ret.options[ret.options.length - 1].AddClass('last');
		}
	};
	ret.up = function(obj) {
		var idx = obj.idx;
		console.assert(idx > 0);
		var item = ret.options.splice(idx, 1)[0];
		ret.removeChild(item);
		ret.insertBefore(item, ret.options[idx - 1]);
		data.splice(idx - 1, 0, data.splice(idx, 1));
		ret.options[idx].idx = idx;
		ret.options[idx - 1].idx = idx - 1;
		if (idx & 1) {
			ret.options[idx].AddClass('odd');
			ret.options[idx - 1].RemoveClass('odd');
		}
		else {
			ret.options[idx].RemoveClass('odd');
			ret.options[idx - 1].AddClass('odd');
		}
		if (idx == 1) {
			ret.options[0].AddClass('first');
			ret.options[1].RemoveClass('first');
		}
		if (idx == ret.options.length - 1) {
			ret.options[idx].AddClass('last');
			ret.options[idx - 1].RemoveClass('last');
		}
	};
	ret.down = function(obj) {
		var idx = obj.idx;
		console.assert(idx < data.length - 1);
		var item = ret.options.splice(idx, 1);
		ret.removeChild(item);
		ret.insertBefore(item, ret.options[idx + 1]);
		data.splice(idx, 0, data.splice(idx, 1));
		ret.options[idx].idx = idx;
		ret.options[idx + 1].idx = idx + 1;
		if (idx & 1) {
			ret.options[idx].AddClass('odd');
			ret.options[idx + 1].RemoveClass('odd');
		}
		else {
			ret.options[idx].RemoveClass('odd');
			ret.options[idx + 1].AddClass('odd');
		}
		if (idx == 0) {
			ret.options[0].AddClass('first');
			ret.options[1].RemoveClass('first');
		}
		if (idx == ret.options.length - 2) {
			ret.options[idx].AddClass('last');
			ret.options[idx - 1].RemoveClass('last');
		}
	};
	return ret;
}

function qedit_update() {
	var select = document.getElementById('qedit_type');
	var mc = select.options[select.selectedIndex].value[0] == 'c';
	document.getElementById('qedit_options').style.display = mc ? '' : 'none';
}

function build_content() {
	// Build group selection.
	var list = document.getElementById('students');
	list.ClearAll();
	if (groups !== undefined) {
		for (var g = 0; g < groups.length; ++g) {
			var li = list.AddElement('li');
			var label = li.AddElement('label');
			var input = label.AddElement('input');
			label.AddText(groups[g]);
			input.type = 'radio';
			input.name = 'group';
			input.idx = g;
			input.checked = groups[g] == group;
			input.AddEvent('click', function(event) {
				event.preventDefault();
				server.call('group', [this.idx]);
			});
		}
	}
	// Build chapter selection.
	var list = document.getElementById('chapters');
	list.ClearAll();
	if (chapter !== undefined) {
		for (var c = 0; c < chapter.length; ++c) {
			var li = list.AddElement('li');
			var label = li.AddElement('label');
			var input = li.AddElement('input');
			label.AddText(chapter[c]);
			input.type = 'radio';
			input.name = 'chapter';
			input.idx = c;
			input.checked = c == current_chapter;
			input.AddEvent('click', function(event) {
				event.preventDefault();
				server.call('chapter', [this.idx]);
			});
		}
	}
	// Build question selection.
	var qdiv = document.getElementById('questions');
	qdiv.ClearAll();
	if (program !== undefined) {
		qdiv.Add(EditableList(program, {
			'remove': function(parent, idx, data) { server.call('q_remove', [parent.idx]) },
			'up': function(parent, idx, data) { server.call('q_move_up', [parent.idx]) },
			'down': function(parent, idx, data) { server.call('q_move_up', [parent.idx]) },
			'add': function(data) { server.call('new_question'); },
			'create': function(parent, data) {
				var input = parent.AddElement('input');
				input.type = 'radio';
				input.checked = parent.idx == current;
				input.AddEvent('click', function() {
					event.preventDefault();
					server.call('run', [parent.idx]);
				});
				input.id = 'q' + parent.idx;
				input.name = 'question';
				parent.body = parent.AddElement('span');
				parent.body.innerHTML = data.arg;
				parent.body.title = data.title;
			},
			'edit': function(parent, idx, data) {
				// Copy question to edit box.
				var select = document.getElementById('qedit_type');
				for (var o = 0; o < select.options.length; ++o) {
					var option = select.options[o];
					if (option.value == data.cmd) {
						option.selected = true;
						break;
					}
				}
				document.getElementById('qedit_case').checked = data['case'];
				var question = document.getElementById('qedit_question');
				question.value = data.markdown;
				while (option_list.data.length > 0)
					option_list.remove(option_list.data[0]);
				for (var idx = 0; idx < data.option.length; ++idx) {
					option_list.add(data.option[idx]);
				}
				qedit_update();
				question.focus();
			},
			'save': function(parent, idx, data) {
				var select = document.getElementById('qedit_type');
				var cs = document.getElementById('qedit_case');
				var q = document.getElementById('qedit_question');
				var options = document.getElementById('qedit_options');
				server.call('q_edit', [idx, select.options[select.selectedIndex].value, cs.checked, q.value, options.data]);
			}
		}));
	}
	// Build response section.
	var table = document.getElementById('results');
	table.ClearAll();
	var tr = table.AddElement('tr');
	tr.AddElement('th').AddText('Name');
	tr.AddElement('th').AddText('State');
	tr.AddElement('th').AddText('Use');
	tr.AddElement('th').AddText('Answer');
	if (responses !== undefined) {
		for (var r = 0; r < responses.length; ++r) {
			tr = table.AddElement('tr');
			tr.AddElement('td').AddText(responses[r].name);
			if (responses[r].state == 'offline' || responses[r].state == 'disconnected') {
				var button = tr.AddElement('td').AddElement('button').AddText(responses[r].state);
				button.idx = r;
				button.type = 'button';
				button.AddClass(responses[r].state);
				button.AddEvent('click', function() {
					reset_password(this.idx);
				});
			}
			else
				tr.AddElement('td').AddText(responses[r].state).AddClass(responses[r].state);
			var use = tr.AddElement('td').AddElement('input');
			use.type = 'checkbox';
			use.checked = !responses[r].blocked;
			use.idx = r;
			use.AddEvent('change', function() {
				server.call('block', [this.idx, !this.checked]);
			});
			tr.AddElement('td').AddText(responses[r].answer);
		}
	}
}

var closed = false;
var Connection = {
	replaced: function() {
		closed = true;
		alert('De verbinding is overgenomen door een nieuwe login');
	},
	closed: function() {
		closed = true;
		alert('De verbinding is verbroken door de docent');
	},
	login: function() {
		error.style.display = 'none';
		login.style.display = 'block';
		content.style.display = 'none';
	},
	program: function(ch_list, ch, prog) {
		error.style.display = 'none';
		login.style.display = 'none';
		content.style.display = 'block';
		chapter = ch_list;
		current_chapter = ch;
		program = prog;
		build_content();
	},
	current: function(cur) {
		current = cur;
		document.getElementById('show').checked = false;
		show();
		build_content();
	},
	show: function(show) {
		document.getElementById('show').checked = show;
		build_content();
	},
	freeze: function(freeze) {
		document.getElementById('freeze').checked = freeze;
		build_content();
	},
	responses: function(g_list, g, res) {
		groups = g_list;
		group = g;
		responses = res;
		build_content();
	},
	blocked: function(b) {
		blocked = b;
		build_content();
	},
	cookie: function(n, c) {
		document.cookie = 'name=' + encodeURIComponent(n) + '; sameSite=Strict';
		document.cookie = 'key=' + encodeURIComponent(c) + '; sameSite=Strict';
	},
};

function init() {
	error = document.getElementById('error');
	login = document.getElementById('login');
	content = document.getElementById('content');
	responses = [];
	blocked = {};
	error.style.display = 'block';
	login.style.display = 'none';
	content.style.display = 'none';
	var e = document.getElementById('qedit_options');
	if (e.data === undefined)
		e.data = [];
	option_list = EditableList(e.data, {
		'add': function(data) {
			e.add('');
		},
		'create': function(parent2, data) {
			var input = parent2.AddElement('input');
			input.type = 'text';
			input.value = data;
			input.AddEvent('change', function() {
				e.set(parent2, input.value);
			});
			input.focus();
		}
	}, e);
	server = Rpc(Connection, null, connection_lost);
}
window.AddEvent('load', init);

function connection_lost() {
	if (closed)
		return;
	closed = true;
	alert('The connection was closed.')
	error.style.display = 'block';
	login.style.display = 'none';
	content.style.display = 'none';
}

function log_in() {
	var loginname = document.getElementById('loginname').value;
	var password = document.getElementById('password').value;
	server.call('login', [loginname, password], {}, function(error) {
		if (error)
			alert('Inloggen is mislukt: ' + error);
	});
	return false;
}

function show() {
	var state = document.getElementById('show').checked;
	server.call('show_answers', [state], {}, function() {
		if (!state) {
			document.getElementById('freeze').checked = false;
		}
		document.getElementById('freeze').disabled = state == false;
	});
}

function freeze() {
	var state = document.getElementById('freeze').checked;
	server.call('freeze', [state]);
}

function store_answers() {
	server.call('store_answers');
}

function new_group() {
	var name = document.getElementById('newgname').value;
	if (name == '') {
		alert("Please enter the new group's name");
		return;
	}
	server.call('new_group', [name]);
}

function new_student() {
	var name = document.getElementById('newsname').value;
	if (name == '') {
		alert("Please enter the new student's name");
		return;
	}
	server.call('new_student', [name]);
}

function new_question() {
	server.call('new_question');
}

// vim: set foldmethod=marker foldmarker={,} :
