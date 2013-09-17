$.widget('itm.wroll', {
    options: {
        /**
         * Использовать touch
         * @type Boolean
         */
        touch: true,
        /**
         * Метод обработки touch
         * @type {String|Number}
         * @example
         * 50% - переключение при смещении кадра на половину
         * @example
         * 50 - переключение при смещении кадра на 50px
         */
        touchbound: '25%',
        /**
         * e.prevent method
         * @type String
         * @example
         * smart - отключаем одну ось, когда активна другая
         * @example
         * both - работают обе оси
         */
        tochmode: 'smart',
        /**
         * Автообновление при ресайзе
         * @type String
         */
        autoresize: false
    },
    /**
     * Шырина звена
     * @type Number
     */
    width: 0,
    /**
     * Смещение галереи
     * @type Number
     */
    position: 0,
    /**
     * Максимальный шаг
     * @type Number
     */
    limit: 0,
    /**
     * @see http://api.jqueryui.com/jQuery.widget/#method-_create
     */
    _create: function() {
    	this.element.addClass('wroll');
        this.ribbon = $('.' + this.widgetName + '-ribbon', this.element);
        
        this.next = $('.' + this.widgetName + '-next', this.element).bind('click' + this.eventNamespace, $.proxy(this, 'scroll', 1, true));
        this.prev = $('.' + this.widgetName + '-prev', this.element).bind('click' + this.eventNamespace, $.proxy(this, 'scroll', 1, false));
        this.controls = this.next.add(this.prev);
        
        Object.defineProperty(this, 'notransition', {
            get: function() {
                this.ribbon.is('.notransition');
            },
            set: function(value) {
                this.ribbon.toggleClass('notransition', !!value);
            }
        });
        
        this.update();
        
        this._toggleControls();
        
        this._touch();
        this._autoresize();
    },
    _init: function() {
    	this.update();
    },
    /**
     * Рассчет значений (ширина, высота, длина)
     */
    update: function() {
        this.notransition = true;
        
        this.ribbon.add(this.chains).removeAttr('style');
        this.width = this.ribbon.width();
        
        this.chains = this.ribbon.children('li').css('width', this.width).wcropper();
        this.ribbon.css('width', this.width * this.chains.length);
        
        this.limit = this.chains.length - 1;
        
        this.roll(this.position, true);
        
        this.notransition = false;
    },
    _autoresize: function() {
        if (this.options.autoresize) {
            $(window).bind('resize' + this.eventNamespace + '-autoresize', $.proxy(this, 'update'));
        } else {
            $(window).unbind(this.eventNamespace + '-autoresize');
        }
    },
    /**
     * Относительное смещение ленты
     * @param {Number} offset
     * @param {Boolean} direction
     * @param {Boolean} force - даже если позиция не изменилась
     * @return {Boolean}
     */
    scroll: function(offset, direction, force) {
        this.roll(this.position + (offset || 1) * (!!direction ? 1 : -1), force);
        
        return false;
    },
    /**
     * Абсолютное смещение ленты
     * @param {Number} position
     * @param {Boolean} force - даже если позиция не изменилась
     */
    roll: function(position, force) {
        if (position < 0) position = 0;
        if (position > this.limit - 1) position = this.limit;
        
        if (position !== this.position || force === true) {
            this.position = position;
            this._roll();
        }
    },
    /**
     * Напосредственный скроллинг
     */
    _roll: function() {
        this.ribbon.css('marginLeft', -this.width * this.position);
        
        this._toggleControls();
    },
    /**
     * Переход к блидайшему положению
     */
    nearest: function() {
        var m = -parseInt(this.ribbon.css('marginLeft'), 10);
        
        this.roll(((m / this.width) | 0) + (m % this.width > (this.width / 2) ? 1 : 0), true);
    },
    /**
     * Обновляет состояние элементов управления
     */
    _toggleControls: function() {
        if (this.chains.length > 1) {
            this.controls.removeClass('hidden');
            
            this.next.toggleClass('disabled', this.position === this.limit);
            this.prev.toggleClass('disabled', this.position === 0);
        } else {
            this.controls.addClass('hidden');
        }
    },
    /**
     * Включает и выключает обработку тач
     * @param {boolean} toggle
     */
    _touch: function() {
        if (this.options.touch) {
            this.element.bind('touchstart' + this.eventNamespace + '-touch', $.proxy(function(e) {
                this.notransition = true;
                this.t = {
                    x: e.originalEvent.touches[0].pageX,
                    y: e.originalEvent.touches[0].clientY,
                    m: parseInt(this.ribbon.css('marginLeft'), 10)
                }
                
            }, this)).bind('touchmove' + this.eventNamespace + '-touch', $.proxy(this, '_onMove')).bind('touchend' + this.eventNamespace + '-touch', $.proxy(function(e) {
                this.notransition = false;
                
                if (this.options.touchbound === 'nearest') {
                	this.nearest();
                } else {   
                    var offset = this.t.m - parseInt(this.ribbon.css('marginLeft'), 10), // смещение ленты
                    bound = this.options.touchbound.indexOf('%') >= 0 ? parseInt(this.options.touchbound, 10) * this.width / 100 : parseInt(this.options.touchbound, 10) // предел;
                    
                    if (Math.abs(offset) > bound) {
                        $('button').text('other');
                        this.scroll(1, offset > 0, true);
                    } else {
                        this.roll(this.position, true);
                        $('button').text('same');
                    }
                }
            }, this));
        } else {
            this.element.unbind(this.eventNamespace + '-touch');
        }
    },
    /**
     * Обработка тыкаьня пальцем
     * @param {event} e
     */
    _onMove: function(e) {
        if (this.options.tochmode == 'both') e.preventDefault();
        var x = e.originalEvent.touches[0].pageX, y = e.originalEvent.touches[0].clientY;
        
        if (this.t.x !== x) {
            var o = x - this.t.x;
            
            if (Math.abs(o) > 20 && this.options.tochmode == 'smart') e.preventDefault();
            
            var m = parseInt(this.ribbon.css('marginLeft'), 10);
            
            this.ribbon.css('marginLeft', m + o);
        }
        
        if (this.options.tochmode == 'both' && this.t.y !== y) {
            var s = $(window).scrollTop(), ms = $(document).height() - $(window).height();
            s -= y - this.t.y;
            
            if (s < 0) s = 0;
            if (s > ms) s = ms;
            $(window).scrollTop(s);
        }
        
        this.t.x = x;
        this.t.y = y;
    },
    /**
     * @see http://api.jqueryui.com/jQuery.widget/#method-_setOption
     * @param {String} key
     * @param {Object} value
     */
    _setOption: function(key, value) {
        if (key === 'touch') {
            if (this.options.touch !== value) {
                this.options[key] = value;
                this._touch();
            }
        }
        
        if (key === 'autoresize') {
            if (this.options.touch !== value) {
                this.options[key] = value;
                this._autoresize();
            }
        }
        
        this._super(key, value);
    }
});

$.widget('itm.wcropper', {
	
    options: {
        selector: 'img',
        /**
         * Метод обрезки по вертикали
         * @type String
         */
        vcrop: 'default', // center||top||bottom
        /**
         * Метод обрезки по горизонтали
         * @type String
         */
        hcrop: 'default', // center||left||right
        /**
         * Обновлять в ::init()
         * @type Boolean
         */
        autoupdate: true
    },
    /**
     * Соотношение сторон обрамляемого элемента
     * @type float
     */
    ar: null,
    /**
     * Соотношение сторон обрамляющего элемента
     * @type float
     */
    ar: null,
    _create: function() {
    	this.element.addClass(this.widgetName);
    	
        this.cropped = $(this.options.selector, this.element).first().addClass(this.widgetName + '-cropped');
        
        this.src = this.cropped.attr('src')
        
        if (this.options.vcrop == 'default') {
            this.options.vcrop = this.element.data('vcrop') || 'center'
        }
        
        if (this.options.hcrop == 'default') {
            this.options.hcrop = this.element.data('hcrop') || 'center'
        }
        
        this.update();
        
        if (this.src) {
        	var i = new Image();
            i.onload = $.proxy(this, 'update');
            i.src = this.src;
        }
        
        $(window).load($.proxy(this, 'update'));
    },
    _init: function() {
        if (this.options.autoupdate) this.update();
    },
    /**
     * Рассчет ориентации Если изменилась - crop
     */
    update: function() {
        var ar = this.cropped.width() / this.cropped.height(), _ar = this.element.width() / this.element.height();
        if (this.ar !== ar || this._ar !== _ar) {
        	this.ar = ar;
        	this._ar = _ar;
            
            this.element.toggleClass(this.widgetName + '-landscape', (ar <= _ar)).toggleClass(this.widgetName + '-portrait', !(ar <= _ar));
            
            this.crop();
        }
    },
    /**
     * Обрезка
     */
    crop: function() {
        this.cropped.removeAttr('style');
        
        switch (this.options.vcrop) {
            case 'top' :
            case 'bottom' :
                this.cropped.css(this.options.vcrop, 0);
            break;
            default :
                this.cropped.css({
                    top: '50%',
                    marginTop: -this.cropped.height() / 2
                });
            break;
        }
        
        switch (this.options.hcrop) {
            case 'left' :
            case 'right' :
                this.cropped.css(this.options.hcrop, 0);
            break;
            default :
                this.cropped.css({
                    left: '50%',
                    marginLeft: -this.cropped.width() / 2
                });
            break;
        }
        
    },
    /**
     * @see http://api.jqueryui.com/jQuery.widget/#method-_setOption
     * @param {String} key
     * @param {Object} value
     */
    _setOption: function(key, value) {
        if (key === 'vcrop' || key === 'hcrop') {
            if (this.options.touch !== value) {
                this.options[key] = value;
                this.crop();
            }
        }
        
        this._super(key, value);
    }
});