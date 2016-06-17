import _ from 'underscore';
import Swipe from 'swipe';
import {Stepper} from './stepper';


// Set up jquery if available globaly
// Šito izvākt, jo _ jābūt jQuery free
if (jQuery) {
    _.jQuery(jQuery);
}

export class Slider {
    
    constructor(container, items) {
        this.container = container;
        this.items = items;

        this.stepper = new Stepper();

        // Container platums
        this.width = _.width(this.container);

        // Sākuma swipe x offset
        this.offsetX = 0;

        this.formatItems();
        this.createStrip();

        this.swipe = new Swipe(this.container, {
            direction: 'horizontal'
        });

        this.setEvents();
    }

    /**
     * Formatējam items
     * Viens no soļiem ir uzlikt fixed width, lai procentuālais
     * width netiek izmainīts ievietojot items stripā
     */
    formatItems() {
        var left = 0;
        items.forEach((item) => {
            var w = _.width(item);

            _.css(item, {
                width: w
            });

            _.data(item, 'slider', {
                left: left,
                width: w
            });

            left += w;
        })
    }

    /**
     * Izveidojam div elementu, kurā būs items un kurš tiks slaidots
     */
    createStrip() {
        this.strip = _.createEl('div');
        _.css(this.strip, {
            width: this.calcItemsWidth(this.items),
            height: _.height(this.container)
        });

        this.items.forEach((item) => {
            _.append(this.strip, item);
        })

        _.append(this.container, this.strip);
    }

    calcItemsWidth(items) {
        var t = 0;
        items.forEach((item) => {
            t += _.width(item);
        })
        return t;
    }

    updateOffsetX(x, animate) {
        this.offsetX = x;
        this.positionStripe(this.offsetX, animate);
    }

    handleSwipeMove(t) {
        this.positionStripe(this.offsetX + t.offset.x);
    }

    handleSwipeEnd(t) {
        this.offsetX = this.offsetX + t.offset.x;
        if (t.direction == 'left') {
            this.snapLeft();
        }
        else {
            this.snapRight();    
        }
    }

    snapLeft() {
        var item = this.findLeft(Math.abs(this.offsetX));
        
        this.updateOffsetX(-_.data(item, 'slider').left, true);
    }

    snapRight() {
        var item = this.findRight(Math.abs(this.offsetX) + this.width);

        this.updateOffsetX((-_.data(item, 'slider').left) + this.width, true);
    }

    positionStripe(x, animate) {
        if (!animate) {
            _.css(this.strip, {
                transform: 'translate('+x+'px,0)'
            })
        }
        else {
            this.stepper.run(
                300,
                [0,0,1,1],

                (progress) => {
                    _.css(this.strip, {
                        transform: 'translate('+(x*progress)+'px,0)'
                    })
                },

                () => {}
            );
        }
    }

    /**
     * Atrodam pirmo elementu, kuram left pozīcija ir 
     * lielāka par offsetX
     */
    findLeft(left) {
        var i = null;
        
        this.items.forEach((item) => {
            var s = _.data(item, 'slider');
            if (s.left >= left) {
                if (!i) {
                    i = item;
                }
            }
        })

        return i;
    }

    /**
     * Atrodam pēdējo elementu, kuram left ir mazāks par
     * this.offsetX + this.width
     */
    findRight(right) {
        var i = null;

        this.items.forEach((item) => {
            var s = _.data(item, 'slider');
            if (s.left < right) {
                i = item;
            }
        })

        return i;
    }

    prev() {
        var c = this.findLeft(Math.abs(this.offsetX));
        
        this.updateOffsetX(-(Math.abs(this.offsetX) + _.data(c, 'slider').width), true);
    }

    next() {
        var c = this.findRight(Math.abs(this.offsetX) + this.width);
        var d = _.data(c, 'slider');

        this.updateOffsetX(  -(d.left + d.width) + this.width  );
    }

    setEvents() {
        // Swipe events
        this.swipe.on('move', (t) => {
            this.handleSwipeMove(t)
        })
        this.swipe.on('end', (t) => {
            this.handleSwipeEnd(t)
        })
    }

}
