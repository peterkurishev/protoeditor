$(window).load(function() {
    $('.editor').editor();
});

$.widget('proto.editor', {
    _create: function() {
        this.body = $('.editor-body', this.element);
        
        this.menu = $('.editor-menu', this.element).delegate('> li > a', 'click' + this.eventNamespace, $.proxy(this, '_onMenu'));
        this.context = $('.editor-context').remove().appendTo('body').bind('mouseleave' + this.eventNamespace, $.proxy(function(e) {
            this.context.hide();
        }, this)).menu().hide().delegate('> li > a', 'click' + this.eventNamespace, $.proxy(this, '_onMenu'));
        
        this.body.sortable({
            containment: 'parent',
            items: '.editable',
            placeholder: 'editable editable-placeholder',
            cancel: '.editable-content'
        }).children('div').editable({
            editor: this
        });
        
        Object.defineProperty(this, 'selected', {
            get: function() {
                return $('.editable-selected', this.element).first();
            }
        });
        
        var forms = {}
        $('form', this.element).each(function() {
            forms[$(this).attr('action').substr(1)] = $(this);
        });
        this.forms = forms;
        
        $('form', this.element).bind('submit' + this.eventNamespace, $.proxy(this, '_onForm')).dialog({
            modal: true
        }).dialog('close');
    },
    /**
     * @param {event} e
     */
    _onMenu: function(e) {
        e.preventDefault();
        
        var t = $(e.target), method = t.attr('href').substr(1);
        
        switch (method) {
            case 'add' :
                this[method]();
            break;
            case 'edit' :
                this.selected.editable('editable', true);
            break;
            case 'background' :
            case 'clear' :
            case 'font' :
                var selected = this.selected;
                
                $('input[type="text"]', this.forms[method]).each(function() {
                    $(this).val(selected.css($(this).attr('name')));
                });
                
                $('input[type="radio"]', this.forms[method]).each(function() {
                    $(this).prop('checked', $(this).val() === selected.css($(this).attr('name')));
                });
                
                this.forms[method].dialog('open');
            break;
        }
    },
    /**
     * @param {event} e
     */
    _onForm: function(e) {
        e.preventDefault();
        
        var t = $(e.target), method = t.attr('action').substr(1), data = {};
        $('input[type="text"], input[type="radio"]:checked', t).each(function() {
            var i = $(this), n = i.attr('name'), v = i.val();
            
            if (v) {
                switch (n) {
                    case 'background-image' :
                        v = v == 'none' ? '' : (v.indexOf('url(') === 0 ? v : 'url(' + v + ')');
                    break;
                }
                data[n] = v;
            }
        });
        
        switch (method) {
            case 'background' :
            case 'clear' :
            case 'font' :
                this.selected.css(data);
            break;
        }
        
        if (t.is(':data("ui-dialog")')) t.dialog('close');
    },
    add: function() {
        this._add('div')
    },
    _add: function(tag) {
        $('<' + tag + '>').prependTo(this.body).editable({
            editor: this
        });
        this.body.sortable('refresh');
    },
    getHtml: function() {
        var temp = $('<div>').html(this.body.html()), html = '';
        
        temp.children().each(function() {
            var child = $(this);
            
            child.html($('.proto-editable-content', child).html());
            child.removeAttr('class');
        });
        
        html = temp.html();
        
        temp.remove();
        
        return html;
    },
    getBlocks: function() {
    	var blocks = [];
    	$('.editable', this.body).each(function() {
    		var b = $(this);
    		blocks.push({
    			width: b.width(),
    			height: b.height(),
    			background: {
    				color: b.css('background-color'),
    				image: b.css('background-image'),
    				position: b.css('background-position')
    			},
    			font: {
    				color: b.css('color')
    			},
    			float: b.css('float'),
    			html: b.html()
    		});
    	});
    	
    	return blocks;
    },
    retrive: function() {
    	return {
    		html: this.getHtml(),
    		total: $('.editable', this.body).length,
    		blocks: this.getBlocks()
    	}
    }
});

$.widget("proto.editable", {
    options: {
        editor: null
    },
    html: '',
    _create: function() {
        
        this.element.parent().bind('click' + this.eventNamespace, $.proxy(this, '_blur'));
        
        this.element.addClass(this.widgetName + ' ' + this.widgetFullName + ' ' + this.widgetFullName + '-active');
        
        this.html = this.element.html();
        
        this._super();
        this._wrap();
        
        this._on(this.element, {
            click: $.proxy(this, '_select'),
            dblclick: $.proxy(this, 'editable', true)
            // редактирование по даблклику
        });
        
        this.element.resizable({
            containment: "parent",
            handles: 'all',
            start: $.proxy(this, 'moveToTop'),
            stop: $.proxy(this, '_resizeStop'),
            resize: $.proxy(this, '_resize')
        });
        
        this.element.bind('contextmenu' + this.eventNamespace, $.proxy(this, '_context'));
        
        Object.defineProperty(this, '_editable', {
            get: function() {
                return this.element.is('.editable-content');
            },
            set: function(value) {
                this.element.toggleClass('editable-content', value);
                !!value ? this.content.attr('contenteditable', true).focus() : this.content.removeAttr('cntenteditable');
            }
        });
    },
    /**
     * @param {event} e
     */
    _blur: function(e) {
        var t = $(e.target);
        if (!t.is(this.element) && !t.parents('.editable').is(this.element)) {
            this.editable(false);
        }
    },
    /**
     * Обработчик resizable stop
     * @param {event} e
     * @param {object} ui
     */
    _resizeStop: function(e, ui) {
        this.element.removeAttr('data-width').removeAttr('data-height');
    },
    /**
     * Обработчик resizable resize
     * @param {event} e
     * @param {ui} ui
     */
    _resize: function(e, ui) {
        var str = (ui.size.width <= (ui.size.height > 99 ? 100 : 70)) ? '' : 'px';
        
        this.element.attr({ // размеры выводятся над блоком
            'data-width': ui.size.width + str,
            'data-height': ui.size.height + str
        });
    },
    /**
     * Внутренний html оборачивается в div
     */
    _wrap: function() {
        this.content = $('<div>').addClass(this.widgetFullName + '-content').html(this.html);
        
        this.element.html('').append(this.content);
    },
    /**
     * Отключает виджет
     */
    disable: function() {
        this.element.resizable('disable').removeClass(this.widgetFullName + '-active');
    },
    /**
     * Включает виджет
     */
    enable: function() {
        this.element.resizable('enable').addClass(this.widgetFullName + '-active');
    },
    /**
     * Режим редактирования текста
     * @param {Boolean} mode
     */
    editable: function(mode) {
        if (mode !== this._editable) {
            if (mode) {
                this.disable();
            } else {
                this.enable();
            }
            
            this._editable = mode;
        }
    },
    destroy: function() {
        this.element.removeClass(this.widgetFullName);
        this.element.resizable('destroy');
        this._super();
    },
    /**
     * @param {event} e
     */
    _context: function(e) {
        e.preventDefault();
        this._select();
        
        this.options.editor.context.show().position({
            my: 'left-5 top-5',
            of: e
        });
    },
    _select: function() {
        this.element.siblings().removeClass(this.widgetName + '-selected');
        this.element.addClass(this.widgetName + '-selected');
    }
});