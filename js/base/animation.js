import Sprite  from './sprite'
import DataBus from '../databus'

let databus = new DataBus()

const __ = {
  timer: Symbol('timer'),
}

/**
 * 简易的帧动画类实现
 */
export default class Animation extends Sprite {
  constructor(imgSrc, width, height) {
    super(imgSrc, width, height)

    // 当前动画是否播放中
    this.isPlaying = false

    // 动画是否需要循环播放
    this.loop = false

    // 每一帧的时间间隔
    this.interval = 1000 / 60

    // 帧定时器
    this[__.timer] = null

    // 当前播放的帧
    this.index = -1

    // 总帧数
    this.count = 0

    // 帧图片集合
    this.imgList = []

    /**
     * 推入到全局动画池里面
     * 便于全局绘图的时候遍历和绘制当前动画帧
     */
    databus.animations.push(this)
  }

  /**
   * 初始化帧动画的所有帧
   * 为了简单，只支持一个帧动画
   */
  initFrames(imgList) {
    imgList.forEach((imgSrc) => {
      let img = new Image()
      img.src = imgSrc

      this.imgList.push(img)
    })

    this.count = imgList.length
  }

  // 将播放中的帧绘制到canvas上
  aniRender(ctx) {
    ctx.drawImage(
      this.imgList[this.index],
      this.x,
      this.y,
      this.width  * 1.2,
      this.height * 1.2
    )
  }

  // 播放预定的帧动画
  playAnimation(index = 0, loop = false) {
    // 动画播放的时候精灵图不再展示，播放帧动画的具体帧
    this.visible   = false
    
    // 标志实例动画播放中
    this.isPlaying = true

    // 是否循环播放标志
    this.loop      = loop

    // 当前帧数
    this.index     = index

    // 每一帧间隔时间 > 0 && 图片数目大于0
    if ( this.interval > 0 && this.count ) {
      this[__.timer] = setInterval(
        // frameLoop 方法仅更新图片序号 index 的值，以及标志是否执行完毕
        // 绘制动画在全局 main.render 中
        this.frameLoop.bind(this),
        this.interval
      )
    }
  }

  // 停止帧动画播放
  stop() {
    this.isPlaying = false

    if ( this[__.timer] )
      clearInterval(this[__.timer])
  }

  // 帧遍历
  frameLoop() {
    // 序号初+1（始值-1），
    this.index++

    // 如果 序号 大于 (图片数目-1)， 相当于动画执行完毕
    // 假设2帧动画（2张图片），第3次执行，序号为2，即播放完毕
    if ( this.index > this.count - 1 ) {
      // 如果循环，设置序号初始值0
      if ( this.loop ) {
        this.index = 0
      }
      // 非循环动画
      else {
        // 序号减1
        this.index--
        // 停止动画，标志执行完毕
        this.stop()
      }
    }
  }
}
