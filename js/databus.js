import Pool from './base/pool'

let instance

/**
 * 全局状态管理器
 */
export default class DataBus {
  constructor() {
    // 确保只生成一次实例
    if ( instance )
      return instance

    instance = this

    this.pool = new Pool() // 对象池

    this.reset()
  }

  reset() {
    this.frame      = 0 // 帧数
    this.score      = 0 // 分数
    this.bullets    = [] // 子弹对象列表
    this.enemys     = [] // 敌机对象列表
    this.animations = [] // 
    this.gameOver   = false // 游戏结束
  }

  /**
   * 回收敌人，进入对象池
   * 此后不进入帧循环
   */
  removeEnemey(enemy) {
    let temp = this.enemys.shift()

    temp.visible = false

    this.pool.recover('enemy', enemy)
  }

  /**
   * 回收子弹，进入对象池
   * 此后不进入帧循环
   */
  removeBullets(bullet) {
    let temp = this.bullets.shift()

    temp.visible = false

    this.pool.recover('bullet', bullet)
  }
}
