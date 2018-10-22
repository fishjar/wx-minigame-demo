import Player from './player/index'
import Enemy from './npc/enemy'
import BackGround from './runtime/background'
import GameInfo   from './runtime/gameinfo'
import Music      from './runtime/music'
import DataBus from './databus' //全局状态管理器

// canvas 定义在 weapp-adapter 中
// 通过 Canvas.getContext('2d') 接口可以获取 CanvasRenderingContext2D 对象。
// CanvasRenderingContext2D 实现了 HTML The 2D rendering context 定义的大部分属性、方法。
// 通过 Canvas.getContext('webgl') 接口可以获取 WebGLRenderingContext 对象。 
// WebGLRenderingContext 实现了 WebGL 1.0 定义的所有属性、方法、常量。
let ctx = canvas.getContext('2d')

// 全局状态管理器，大部分画面改变均通过此对象改变，并绘制此对象中属性来实现
let databus = new DataBus()

/**
 * 游戏主函数
 */
export default class Main {
  constructor() {
    this.restart()
  }

  restart() {
    // 状态初始化
    databus.reset()

    // 解除 "重新开始" 按钮事件监听
    canvas.removeEventListener(
      'touchstart',
      this.touchHandler
    )

    this.bg = new BackGround(ctx) // 背景生成，并绘制到画布
    this.player = new Player(ctx) // 本机生成，并添加触摸事件
    this.gameinfo = new GameInfo() // 主要是文字提示等信息
    this.music = new Music() // 全局音乐对象

    // requestAnimationFrame是浏览器用于定时循环操作的一个接口，
    // 类似于setTimeout，主要用途是按帧对网页进行重绘。
    // requestAnimationFrame的优势，在于充分利用显示器的刷新机制，比较节省系统资源。
    // 显示器有固定的刷新频率（60Hz或75Hz），也就是说，每秒最多只能重绘60次或75次
    // requestAnimationFrame使用一个回调函数作为参数。
    // 这个回调函数会在浏览器重绘之前调用。
    // 相当于:
    // function( callback ){
    //   window.setTimeout(callback, 1000 / 60);
    // };
    // Chrome 的方法还支持第二个参数，表示属性发生改变的 DOM 元素，
    // 这样渲染会局限在该元素中，提高效率
    // cancelAnimationFrame方法用于取消重绘。
    // 它的参数是requestAnimationFrame返回的一个代表任务ID的long整数值。
    window.requestAnimationFrame(
      this.loop.bind(this),
      canvas
    )
  }

  /**
   * 随着帧数变化的敌机生成逻辑
   * 帧数取模定义成生成的频率
   */
  enemyGenerate() {
    if (databus.frame % 30 === 0) {
      // 从对象池中取出，没有会自动 new Enemy() 创建
      // Enemy 继承自 Animation ，因此一生成实例便会将动画推入databus动画列表
      let enemy = databus.pool.getItemByClass('enemy', Enemy)
      enemy.init(6) // 6 为速度值，每帧移动6个像素
      // 将 从对象池中取出的对象 加入 databus
      databus.enemys.push(enemy)
    }
  }

  // 全局碰撞检测
  collisionDetection() {
    let that = this

    // 计算所有 子弹 与 敌机 是否碰撞
    databus.bullets.forEach((bullet) => {
      for (let i = 0, il = databus.enemys.length; i < il; i++) {
        let enemy = databus.enemys[i]

        // ！敌机对象动画播放中 && 发生碰撞
        if (!enemy.isPlaying && enemy.isCollideWith(bullet)) {
          // 设置该敌机不可见，同时播放敌机爆炸动画
          // playAnimation 方法继承自 animation ，所有敌机动画一样
          // 该方法并不是播放动画的意思，而是准备动画，
          // 相当于reset实例动画实例，并标志状态为播放中
          // 并隔一段时间改变动画实例的图片序号 index，如果播放完毕会自动标志动画为结束状态
          // 真正的绘制动画图片在全局的render中执行
          enemy.playAnimation()

          that.music.playExplosion() // 播放声音，全局声音方法

          // 该子弹对象不可见，但尚未回收
          // 回收在 bullet.update 中判断，超出屏幕才会回收
          bullet.visible = false
          databus.score += 1 // 分数+1

          // 发生碰撞，该子弹已失效，没有必要继续检测与其他敌机是否碰撞
          // 跳出一层循环，继续检查其他子弹与所有敌机的碰撞
          break
        }
      }
    })

    // 计算 敌机 与 本机 是否碰撞
    for (let i = 0, il = databus.enemys.length; i < il; i++) {
      let enemy = databus.enemys[i]

      // 如果发生碰撞
      if (this.player.isCollideWith(enemy)) {
        // 游戏结束
        databus.gameOver = true

        break
      }
    }
  }

  // 游戏结束后的触摸事件处理逻辑
  // 全屏幕触摸监听，通过计算触摸点位置来判断
  touchEventHandler(e) {
    e.preventDefault()

    let x = e.touches[0].clientX
    let y = e.touches[0].clientY

    let area = this.gameinfo.btnArea

    if (x >= area.startX
      && x <= area.endX
      && y >= area.startY
      && y <= area.endY)
      this.restart()
  }

  /**
   * canvas重绘函数
   * 每一帧重新绘制所有的需要展示的元素
   */
  render() {
    // clearRect 设置指定矩形区域内（以 点 (x, y) 为起点，范围是(width, height) ）
    // 所有像素变成透明，并擦除之前绘制的所有内容的方法。
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 绘制 背景
    this.bg.render(ctx)

    // 绘制 子弹 及 敌机
    // drawToCanvas 定义在 sprite
    databus.bullets
      .concat(databus.enemys)
      .forEach((item) => {
        item.drawToCanvas(ctx)
      })

    // 绘制 本机
    this.player.drawToCanvas(ctx)

    // 绘制动画列表中图片
    databus.animations.forEach((ani) => {
      // 只有状态为播放中的动画才绘制
      if (ani.isPlaying) {
        // 将播放中的帧绘制到canvas上
        ani.aniRender(ctx)
      }
    })

    // 绘制分数展示
    this.gameinfo.renderGameScore(ctx, databus.score)
  }

  // 游戏逻辑更新主函数
  update() {
    // 更新 bg 的 top 值 +2
    this.bg.update()

    // bullet，enemys对象均部署了update方法
    // 子弹 更新Y值，-speed，超出屏幕顶部会自动回收对象
    // 敌机 更新Y值，+speed，超出屏幕底部会自动回收对象
    databus.bullets
      .concat(databus.enemys)
      .forEach((item) => {
        item.update()
      })

    this.enemyGenerate() // 生成敌机

    this.collisionDetection() // 碰撞检查
  }

  // 实现游戏帧循环
  loop() {
    databus.frame++ // 帧数加一

    this.update() // 更新数据及参数等，主要是更新 databus 对象
    this.render() // 绘制画面

    // 每20帧发射一颗子弹及播放子弹声音
    // 此段代码可考虑放入 this.update 中
    if (databus.frame % 20 === 0) {
      // 从对象池中取出子弹，初始化位置速度等参数后，推入databus
      // player、bullet、enemy、main 的 databus 分别实例化，不是同一个对象？
      this.player.shoot()

      // 播放子弹声音
      this.music.playShoot()
    }

    // 游戏结束停止帧循环
    if (databus.gameOver) {
      // 绘制游戏结束信息
      this.gameinfo.renderGameOver(ctx, databus.score)

      // 将游戏结束处理函数，赋值给touchHandler
      // 当做绑定 touchstart 事件的参数
      // 相当于 touchstart 点击事件的回调函数
      this.touchHandler = this.touchEventHandler.bind(this)

      // canvas 及 addEventListener 定义在 weapp-adapter 中
      // 给全局的 canvas 绑定 touchstart 事件，这里主要用来重新开始游戏
      canvas.addEventListener('touchstart', this.touchHandler)

      // 跳出动画递归，相当于暂停了动画
      return
    }

    // 游戏未结束，迭代执行下一帧
    window.requestAnimationFrame(
      this.loop.bind(this),
      canvas
    )
  }
}
