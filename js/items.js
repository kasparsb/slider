import _ from 'underscore';

export class Items {
    constructor(items) {
        this.items = this.formatItems(items);
    }

    /**
     * Formatējam items
     * Viens no soļiem ir uzlikt fixed width, lai procentuālais
     * width netiek izmainīts ievietojot items stripā
     */
    formatItems(items) {
        var r = [];
        var left = 0;

        items.forEach((el) => {
            var item = {
                el: el,
                left: left,
                width: _.width(el),
            }

            left += item.width;

            _.css(el, {
                width: item.width
            });

            r.push(item);
        })

        return r;
    }

    /**
     * Calculate items total width
     */
    totalWidth() {
        var t = 0;
        this.items.forEach((item) => {
            t += item.width;
        })
        return t;
    }

    /**
     * Append items to new dom element
     */
    appendTo(container) {
        this.items.forEach((item) => {
            _.append(container, item.el);
        })
    }

    /**
     * Atrodam pirmo elementu, kuram left pozīcija ir 
     * lielāka par padoto t
     */
    findLeft(t) {
        var r = null;
        
        console.log('findLeft');
        this.items.forEach((item) => {
            if (item.left >= t && !r) {
                console.log(item.left, t, 'yes');
                r = item;
            }
            else {
                console.log(item.left, t, 'no');
            }
        })

        return r;
    }

    /**
     * Atrodam pēdējo elementu, kuram left ir mazāks par
     * norādīto t
     */
    findRight(t) {
        var r = null;

        console.log('findRight');
        this.items.forEach((item) => {
            if (item.left <= t) {
                console.log(item.left, t, 'yes');
                r = item;
            }
            else {
                console.log(item.left, t, 'no');
            }
        })

        return r;
    }
}