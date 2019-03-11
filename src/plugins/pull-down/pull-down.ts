import BScroll from '../../index'
import { Probe, Direction, ease } from '../../util'
import { pullDownRefreshConfig, pullDownRefreshOptions } from '../../Options'
import { propertiesProxy } from '../../util/propertiesProxy'
import propertiesProxyConfig from './propertiesConfig'

export default class PullDown {
  static pluginName = 'pullDownRefresh'
  pulling: boolean = false

  constructor(public scroll: BScroll) {
    this._init()

    const prefix = `plugins.${PullDown.pluginName}.`
    propertiesProxyConfig.forEach(({ key, sourceKey }) => {
      propertiesProxy(this.scroll, prefix + sourceKey, key)
    })
  }

  private _init() {
    // 需要设置 probe = 3 吗？
    // must watch scroll in real time
    this.scroll.options.probeType = Probe.Realtime

    // ? 改成 touchEnd ?
    this.scroll.on('end', () => {
      return this.scroll.options.pullDownRefresh && this._checkPullDown()
    })

    this.scroll.registerType(['pullingDown'])
  }

  private _checkPullDown() {
    const { threshold = 90, stop = 40 } = this.scroll.options
      .pullDownRefresh as pullDownRefreshConfig

    // check if a real pull down action
    if (
      this.scroll.directionY !== Direction.Negative ||
      this.scroll.y < threshold
    ) {
      return false
    }
    // TODO preventClick ? 处理 click 事件相关的逻辑
    if (!this.pulling) {
      this.pulling = true
      this.scroll.trigger('pullingDown')
    }
    this.scroll.scrollTo(
      this.scroll.x,
      stop,
      this.scroll.options.bounceTime,
      ease.bounce
    )

    return this.pulling
  }

  finish() {
    this.pulling = false
    this.scroll.resetPosition(this.scroll.options.bounceTime, ease.bounce)
  }

  open(config: pullDownRefreshOptions = true) {
    this.scroll.options.pullDownRefresh = config
    this._init()
  }

  close() {
    this.scroll.options.pullDownRefresh = false
  }

  autoPull() {
    const { threshold = 90, stop = 40 } = this.scroll.options
      .pullDownRefresh as pullDownRefreshConfig

    if (this.pulling) {
      return
    }
    this.pulling = true

    this.scroll.scrollTo(this.scroll.x, threshold)
    this.scroll.trigger('pullingDown')
    this.scroll.scrollTo(
      this.scroll.x,
      stop,
      this.scroll.options.bounceTime,
      ease.bounce
    )
  }
}
