import _ from 'underscore';
import Swipe from 'swipe';
import {Stepper} from './stepper';
import {Items} from './items';

// Set up jquery if available globaly
// Šito izvākt, jo _ jābūt jQuery free
if (jQuery) {
    _.jQuery(jQuery);
}

export class Slider {
    
    constructor(container, items, settings) {
        settings = typeof settings == 'undefined' ? {} : settings;

        this.container = container;

        this.elastic = 0.65;
        this.animationDuration = 200;
        this.animationBezierCurve = [.25,.1,.25,1];

        this.settings = _.extend({
            align: 'center',
            navigationStatus: null
        }, settings);
        
        this.items = new Items(items);
        this.stepper = new Stepper();
        this.swipe = new Swipe(this.container, {
            direction: 'horizontal'
        });

        this.stripePositionX = 0;
        // Sākuma swipe x offset
        this.offsetX = 0;
        // Katru reizi update swipe pieglabājam pēdējo uzstādīto offsetX
        this.lastOffsetX = 0;
        // Strip width
        this.stripWidth = this.items.totalWidth();

        this.createStrip();
        this.setEvents();

        this.initView();
    }

    /**
     * Nolasam esošo container platumu
     * Pielāgojam swipe limits
     * Align items - ja items ir īsāki par container, tad alignējam, ja nē, tad iedarbinam swipe
     * Paziņojam par navigācijas pogu redzamību
     */
    initView() {
        // Container platums
        this.width = _.width(this.container);
        // Offset limits
        this.offsetXLimits = this.getOffsetXLimits();
        this.alignItems();
        this.announceNavigationStatus();
    }

    /**
     * Izveidojam div elementu, kurā būs items un kurš tiks slaidots
     */
    createStrip() {
        this.strip = _.createEl('div');
        _.css(this.strip, {
            overflow: 'hidden',
            width: this.stripWidth,
        });

        this.items.appendTo(this.strip);

        _.append(this.container, this.strip);
    }

    updateOffsetX(x) {
        this.positionStripeAnimated(this.offsetX, x, (x) => {
            this.offsetX = x;
        });
    }

    positionStripe(x) {
        this.stripePositionX = x;

        _.css(this.strip, {
            transform: 'translate('+this.stripePositionX+'px,0)'
        })
    }

    positionStripeAnimated(from, to, cb) {
        var d = to - from;

        this.stepper.run(
            this.animationDuration,
            this.animationBezierCurve,

            (progress) => {
                var x = from + (d*progress);

                this.positionStripe(x);
                
                cb(x);
            },

            () => {
                this.announceNavigationStatus();
            }
        );
    }

    getOffsetXLimits() {
        return {
            from: -(this.stripWidth-this.width),
            to: 0
        }
    }

    getStripePosition() {
        return this.stripePositionX;
    }

    snapLeft() {
        var x = Math.abs(this.validateOffsetX(this.offsetX));

        // Atrodam visus, kuriem left > x
        var items = this.items.filter((item) => {
            return item.left >= x;
        });

        // Ņemam pirmo
        if (items.length > 0) {
            x = this.validateOffsetX(-items[0].left);
            this.updateOffsetX(x);
        }        
    }

    snapRight() {
        var x = Math.abs(this.validateOffsetX(this.offsetX));

        // Atrodam visus, kuriem left < x
        var items = this.items.filter((item) => {
            return item.left <= x;
        });

        // Ņemam pēdējo
        if (items.length > 0) {
            x = this.validateOffsetX(-items[items.length-1].left);
            this.updateOffsetX(x);
        }
    }

    prev() {
        var x = Math.abs(this.offsetX);

        var items = this.items.filter((item) => {
            return item.left < (x-4);
        });

        if (items.length > 0) {
            x = this.validateOffsetX(-items[items.length-1].left);
            this.updateOffsetX(x);
            this.announceNavigationStatus();
        }
    }

    next() {
        var x = Math.abs(this.offsetX);

        var items = this.items.filter((item) => {
            return item.left > (x+4);
        });

        if (items.length > 0) {
            x = this.validateOffsetX(-items[0].left);
            this.updateOffsetX(x);
            this.announceNavigationStatus();
        }
    }

    alignItems() {
        if (this.isOverflow()) {
            this.positionStripe(0);
        }
        else {
            this.positionStripe(-(this.stripWidth - this.width)/2);
        }
    }

    handleResize() {
        this.initView();
    }

    handleSwipeMove(t) {
        this.lastOffsetX = this.offsetX + t.offset.x;

        if (!this.isValidOffsetX(this.lastOffsetX)) {
            // Make swipe elastic to give feeling of boundry
            var d = this.getOffsetXOverlap(this.lastOffsetX);
            var compensation = d * this.elastic;

            if (this.lastOffsetX >= 0) {
                compensation *= -1;
            }

            this.lastOffsetX = this.lastOffsetX + compensation;
        }
        
        this.positionStripe(this.lastOffsetX);
    }

    handleSwipeEnd(t) {
        this.offsetX = this.lastOffsetX;

        // Validējam offsetX

        if (t.direction == 'left') {
            this.snapLeft();
        }
        else {
            this.snapRight();    
        }
    }

    setEvents() {
        _.on(window, 'resize', _.debounce(this.handleResize, 200, this));

        // Swipe events
        this.swipe.on('move', (t) => {
            if (this.isOverflow()) {
                this.handleSwipeMove(t)
            }
        })
        this.swipe.on('end', (t) => {
            if (this.isOverflow()) {
                this.handleSwipeEnd(t)
            }
        })
    }

    /**
     * Paziņojam par navigācijas pogu redzamību
     */
    announceNavigationStatus() {
        if (!this.settings.navigationStatus) {
            return;
        }

        var nav = {
            next: false,
            prev: false
        }

        if (this.isOverflow()) {
            nav.next = (Math.abs(this.getStripePosition()) + this.width) < (this.stripWidth - 4)
            nav.prev = this.getStripePosition() < 0;
        }

        this.settings.navigationStatus(nav)
    }

    /**
     * Pārbaudām vai padotais x ir offsetXlimit robežās
     */
    isValidOffsetX(x) {
        if (x >= this.offsetXLimits.from && x <= this.offsetXLimits.to) {
            return true;
        }
        else {
            return false;
        }
    }

    validateOffsetX(x) {
        if (x < this.offsetXLimits.from) {
            return this.offsetXLimits.from;
        }
        else if (x > this.offsetXLimits.to) {
            return this.offsetXLimits.to;
        }
        else {
            return x;
        }
    }

    /**
     * Aprēķinam par cik padotais x ir ārpus offsetXlimit robežām
     */
    getOffsetXOverlap(x) {
        if (x < this.offsetXLimits.from) {
            return Math.abs(x - this.offsetXLimits.from);
        }
        else if (x > this.offsetXLimits.to) {
            return Math.abs(x - this.offsetXLimits.to);
        }
        else {
            return 0;
        }
    }

    /**
     * Atgriež pazīmi vai stripWidth ir lielāks par container width
     */
    isOverflow() {
        return this.width < this.stripWidth;
    }
}
