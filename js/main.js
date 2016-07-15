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
            align: 'center'
        }, settings);
        
        this.items = new Items(items);
        this.stepper = new Stepper();
        this.swipe = new Swipe(this.container, {
            direction: 'horizontal'
        });

        // Container platums
        this.width = _.width(this.container);
        // Strip width
        this.stripWidth = this.items.totalWidth();

        // Sākuma swipe x offset
        this.offsetX = 0;
        // Katru reizi update swipe pieglabājam pēdējo uzstādīto offsetX
        this.lastOffsetX = 0;
        
        this.offsetXLimits = {
            from: -(this.stripWidth-this.width),
            to: 0
        }

        this.createStrip();
        this.setEvents();
        this.alignItems();
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
        _.css(this.strip, {
            transform: 'translate('+x+'px,0)'
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

            () => {}
        );
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
            x = -items[items.length-1].left;
            if (this.isValidOffsetX(x-4)) {
                this.updateOffsetX(x);    
            }
        }
    }

    next() {
        var x = Math.abs(this.offsetX);

        var items = this.items.filter((item) => {
            return item.left > (x+4);
        });

        if (items.length > 0) {
            x = -items[0].left;
            if (this.isValidOffsetX(x+4)) {
                this.updateOffsetX(x);    
            }
        }
    }

    alignItems() {
        if (this.isOverflow()) {
            return;
        }

        this.positionStripe(-(this.stripWidth - this.width)/2);
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
