import { Position, Transform } from '../translater'
import Base from './Base'
import {
  getNow,
  Probe,
  requestAnimationFrame,
  cancelAnimationFrame,
  ease,
  EaseFn
} from '../util'

export default class Animation extends Base {
  constructor(
    element: HTMLElement,
    translater: Position | Transform,
    options: {
      bounceTime: number
      probeType: number
    }
  ) {
    super(element, translater, options)
  }

  scrollTo(x: number, y: number, time: number, easingFn: EaseFn) {
    // time is 0
    if (!time) {
      this.translater.updatePosition(x, y, this.translater.scale)

      this.hooks.trigger(this.hooks.eventTypes.scroll, {
        x,
        y
      })
      // force reflow to put everything in position
      this._reflow = document.body.offsetHeight
      if (!this.resetPosition(this.options.bounceTime)) {
        this.hooks.trigger(this.hooks.eventTypes.scrollEnd, {
          x: this.translater.x,
          y: this.translater.y
        })
      }
      return
    }
    this.animate(x, y, time, easingFn)
  }

  private animate(
    destX: number,
    destY: number,
    duration: number,
    easingFn: EaseFn
  ) {
    let startX = this.translater.x
    let startY = this.translater.y
    let startScale = this.translater.lastScale
    let destScale = this.translater.scale
    let startTime = getNow()
    let destTime = startTime + duration

    const step = () => {
      let now = getNow()

      if (now >= destTime) {
        this.pending = false
        this.translate(destX, destY, destScale)

        this.callHooks(this.hooks.eventTypes.scroll)

        if (!this.resetPosition(this.options.bounceTime)) {
          this.callHooks(this.hooks.eventTypes.scrollEnd)
        }
        return
      }
      now = (now - startTime) / duration
      let easing = easingFn(now)
      let newX = (destX - startX) * easing + startX
      let newY = (destY - startY) * easing + startY
      let newScale = (destScale - startScale) * easing + startScale

      this.translate(newX, newY, newScale)

      if (this.pending) {
        this.timer = requestAnimationFrame(step)
      }

      if (this.options.probeType === Probe.Realtime) {
        this.callHooks(this.hooks.eventTypes.scroll)
      }
    }

    this.pending = true
    cancelAnimationFrame(this.timer)
    step()
  }

  stop(x: number, y: number) {
    // still in requestFrameAnimation
    if (this.pending) {
      this.pending = false
      cancelAnimationFrame(this.timer)
      this.hooks.trigger(this.hooks.eventTypes.scrollEnd, {
        x,
        y
      })
      this.stopFromTransition = true
    }
  }

  resetPosition(time = 0, easing = ease.bounce.fn) {
    return this._resetPosition(time, easing)
  }
}
