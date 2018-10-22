import Animation from '../base/animation'
import DataBus   from '../databus'

const ENEMY_IMG_SRC = 'images/enemy.png'
const ENEMY_WIDTH   = 60
const ENEMY_HEIGHT  = 60

const __ = {
  speed: Symbol('speed')
}

let databus = new DataBus()

function rnd(start, end){
  return Math.floor(Math.random() * (end - start) + start)
}

export default class Enemy extends Animation {
  constructor() {
    super(ENEMY_IMG_SRC, ENEMY_WIDTH, ENEMY_HEIGHT) // 执行父类构造函数

    this.initExplosionAnimation()
  }

  init(speed) {
    // X位置随机。计算好像不大对
    // this.x = rnd(ENEMY_WIDTH, window.innerWidth - ENEMY_WIDTH)
    this.x = rnd(0, window.innerWidth - ENEMY_WIDTH)
    this.y = -this.height // Y位置固定

    this[__.speed] = speed

    this.visible = true
  }

  // 预定义爆炸的帧动画
  initExplosionAnimation() {
    let frames = []

    const EXPLO_IMG_PREFIX  = 'images/explosion'
    const EXPLO_FRAME_COUNT = 19

    for ( let i = 0;i < EXPLO_FRAME_COUNT;i++ ) {
      frames.push(EXPLO_IMG_PREFIX + (i + 1) + '.png')
    }

    // initFrames 为父类方法
    // 初始化动画帧，添加图片列表，图片数量
    this.initFrames(frames)
  }

  // 每一帧更新敌机位置
  update() {
    this.y += this[__.speed]

    // 对象回收
    if ( this.y > window.innerHeight + this.height )
      databus.removeEnemey(this)
  }
}
