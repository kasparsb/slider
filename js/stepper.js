import {Bezier} from './bezier2.js';

export class Stepper {
    constructor() {
        this.defaultBezierCurve = [0,0,1,1];
        /**
         * Frames per second
         */
        this.fps = 60;
        this.interval = 1000 / this.fps;
        this.precision = 100000;
        this.progress = 0;
        this.current = 0;    
    }
    
    run(duration, bezierCurve, stepCb, doneCb) {
        this.stepCallback = stepCb;
        this.doneCallback = doneCb

        this.easing = this.getEasing(bezierCurve);

        this.duration = isNaN(duration) ? 0 : duration;
        this.current = 0;

        this.start();
        this.step();
    }

    /**
     * Run from given progress
     */
    runFrom(progress, duration, bezierCurve, stepCb, doneCb) {
        this.stepCallback = stepCb;
        this.doneCallback = doneCb

        //this.easing = new KeySpline(bezierCurve[0], bezierCurve[1], bezierCurve[2], bezierCurve[3]);
        this.easing = new Bezier(bezierCurve[0], bezierCurve[1], bezierCurve[2], bezierCurve[3]);
        
        this.duration = duration;

        this.startTime = +new Date();
        this.startTime -= (duration * progress);
        this.progress = progress;

        this.step();
    }

    /**
     * Piefiksējam sākuma laiku
     */
    start() {
        this.startTime = +new Date();
        this.progress = 0;        
    }

    done() {
        this.doneCallback();
    }

    step() {
        var mthis = this;

        mthis.trackProgress();

        if (this.current < this.startTime + this.duration) {

            this.stepCallback(this.progress);

            var cb = function(){
                mthis.step()
            }

            requestAnimationFrame(cb);
            //setTimeout(cb, this.interval);
        }
        else {
            this.stepCallback(1);

            this.done();
        }
    }

    trackProgress() {
        // Current time
        this.current = +new Date();

        var delta = this.current - this.startTime;

        // Animation progress in precents
        this.progress = this.easing.get(delta / this.duration);

        this.progress = Math.round(this.progress*this.precision)/this.precision;
    }

    getEasing(bezierCurve) {
        if (!(bezierCurve && bezierCurve.length && bezierCurve.length == 4)) {
            bezierCurve = this.defaultBezierCurve;
        }
        return new Bezier(bezierCurve[0], bezierCurve[1], bezierCurve[2], bezierCurve[3]);
    }   
}