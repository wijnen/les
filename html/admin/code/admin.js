var server, error, login, content, groups, group, chapter, current_chapter, program, current, responses, blocked;

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

function EditableList(data, cbs) {
	// This is a class which provides an editable list.
	// data is an array which contains the rows.
	// data is updated when editing.
	// cbs contains callbacks:
	//	add is a callback to handle a click on the "add" button.
	//	create is a callback to create one element in the list.
	//	edit is a callback to start editing. If undefined, the button is not shown.
	// The return value is an Element which should be inserted into the DOM.
	var ret = Create('table');
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
			cbs.remove(tr.td, idx, content);
		}));
		tr.AddElement('td').Add(button('↑', function() {
			cbs.up(tr.td, idx, content);
		}, {'className': 'up'}));
		tr.AddElement('td').Add(button('↓', function() {
			cbs.down(tr.td, idx, content);
		}, {'className': 'down'}));
		if (cbs.edit != undefined) {
			tr.AddElement('td').Add(button('✎', function() {
				cbs.edit(tr.td, idx, content);
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
		ret.removeChild(ret.options.splice(idx, 1));
		data.splice(idx, 1);
		for (var i = idx; i < data.length; ++i) {
			ret.options[i].idx = i;
			if (i & 1)
				ret.options[i].AddClass('odd');
			else
				ret.options[i].RemoveClass('odd');
		}
		ret.options[0].AddClass('first');
		ret.options[ret.options.length - 1].AddClass('last');
	};
	ret.up = function(obj) {
		var idx = obj.idx;
		console.assert(idx > 0);
		var item = ret.options.splice(idx, 1);
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
					server.call('run', parent.idx);
				});
				input.id = 'q' + parent.idx;
				input.name = 'question';
				parent.body = parent.AddElement('span');
				parent.body.innerHTML = data.arg;
				parent.body.title = data.title;
				parent.editing = false;
			},
			'edit': function(parent, idx, data) {
				// Edit question.
				if (parent.editing) {
					server.call('q_edit', [idx, parent.typeselect.options[parent.typeselect.selectedIndex].value, parent.casesensitive.checked, parent.box.value, data.option]);
				}
				else {
					parent.body.ClearAll();
					parent.typeselect = parent.body.AddElement('select');
					var types = ['Title', 'Term', 'Terms', 'Word', 'Words', 'Choice', 'Choices'];
					for (var o = 0; o < types.length; ++o) {
						var option = parent.typeselect.AddElement('option');
						option.value = types[o];
						option.AddText(types[o]);
						if (data.cmd == types[o].toLowerCase())
							option.selected = true;
					}
					var clabel = parent.body.AddElement('label');
					parent.casesensitive = clabel.AddElement('input');
					parent.casesensitive.type = 'checkbox';
					parent.casesensitive.checked = data['case'];
					clabel.AddText('Case Sensitive');
					parent.box = parent.body.AddElement('textarea');
					parent.box.value = data.markdown;
					if (data.option === undefined)
						data.option = [];
					parent.optlist = EditableList(data.option, {
						'add': function(data) {
							parent.optlist.add('');
						},
						'create': function(parent2, data) {
							var input = parent2.AddElement('input');
							input.type = 'text';
							input.value = data;
							input.AddEvent('change', function() {
								parent.optlist.set(parent2, input.value);
							});
							input.focus();
						},
						'up': function(item, idx, data) {
							parent.optlist.up(idx);
						},
						'down': function(item, idx, data) {
							parent.optlist.down(idx);
						},
						'remove': function(item, idx, data) {
							parent.optlist.remove(idx);
						}
					});
					parent.Add(parent.optlist);
					parent.update = function() {
						var mc = parent.typeselect.options[parent.typeselect.selectedIndex].value[0] == 'C';
						if (mc)
							parent.optlist.style.display = '';
						else
							parent.optlist.style.display = 'none';
						parent.editing = true;
					};
					parent.typeselect.AddEvent('change', parent.update);
					parent.update();
				}
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
