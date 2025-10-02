// physics-demo.js - 物理引擎演示脚本

let isAnimating = false;
let objectCount = 0;
let showColliders = false;

// 初始化
function init() {
    const canvas = saruCanvas.getCanvas();
    if (!canvas) {
        console.error('Canvas未创建');
        return;
    }
    
    // 设置canvas尺寸
    canvas.width = 800;
    canvas.height = 600;
    
    // 创建地面平台
    createGround();
    
    // 添加点击事件监听
    saruCanvas.addGlobalClickListener(handleCanvasClick);
    
    // 开始物理模拟
    startPhysicsSimulation();
    
    console.log('物理引擎演示初始化完成');
}

// 创建地面
function createGround() {
    const ground = saruCanvas.createPhysicsObject('Ground', 0, 0, 800, 50, {
        color: '#8B4513',
        tag: 'ground'
    });
    
    // 移除重力组件（地面不受重力影响）
    ground.removeComponent('Gravity');
    
    // 设置碰撞回调
    const collider = ground.getComponent('BoxCollider');
    if (collider) {
        collider.onCollisionEnter = function(otherObject) {
            console.log(`${otherObject.name} 撞到了地面`);
            
            // 简单的反弹效果
            const otherTransform = otherObject.getComponent('Transform');
            if (otherTransform && otherTransform.velocity.y < 0) {
                otherTransform.velocity.y = -otherTransform.velocity.y * 0.6; // 反弹并减少能量
                otherTransform.y = 50; // 确保物体在地面上方
            }
        };
    }
}

// 创建方块
function createBox() {
    const x = Math.random() * 700 + 50;
    const y = 200 + Math.random() * 300; // 在地面上方创建
    const size = 30 + Math.random() * 40;
    
    const box = saruCanvas.createPhysicsObject(`Box_${objectCount++}`, x, y, size, size, {
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        tag: 'box'
    });
    
    // 不设置初始速度，让重力自然作用
    box.transform.setVelocity(0, 0);
    
    console.log(`创建方块: ${box.name} at (${x}, ${y})`);
}

// 创建圆球
function createBall() {
    const x = Math.random() * 700 + 50;
    const y = 200 + Math.random() * 300; // 在地面上方创建
    const radius = 15 + Math.random() * 25;
    
    const ball = saruCanvas.createPhysicsObject(`Ball_${objectCount++}`, x, y, radius * 2, radius * 2, {
        color: `hsl(${Math.random() * 360}, 80%, 60%)`,
        tag: 'ball'
    });
    
    // 修改渲染器为圆形
    const renderer = ball.getComponent('SpriteRenderer');
    if (renderer) {
        renderer.render = function(ctx) {
            if (!this.enabled) return;
            
            const transform = this.gameObject.getComponent('Transform');
            if (!transform) return;
            
            // 绘制圆形 - 使用canvas原生坐标系
            const canvas = saruCanvas.getCanvas();
            if (canvas) {
                const centerX = transform.x + this.width / 2;
                const centerY = canvas.height - (transform.y + this.height / 2);
                
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(centerX, centerY, this.width / 2, 0, 2 * Math.PI);
                ctx.fill();
            }
        };
    }
    
    // 不设置初始速度，让重力自然作用
    ball.transform.setVelocity(0, 0);
    
    console.log(`创建圆球: ${ball.name} at (${x}, ${y})`);
}

// 创建平台
function createPlatform() {
    const x = Math.random() * 600 + 100;
    const y = 150 + Math.random() * 300;
    const width = 100 + Math.random() * 200;
    
    const platform = saruCanvas.createPhysicsObject(`Platform_${objectCount++}`, x, y, width, 20, {
        color: '#654321',
        tag: 'platform'
    });
    
    // 移除重力组件（平台不受重力影响）
    platform.removeComponent('Gravity');
    
    console.log(`创建平台: ${platform.name} at (${x}, ${y})`);
}

// 处理canvas点击
function handleCanvasClick(clickData) {
    // 在点击位置创建一个随机物体
    const rand = Math.random();
    
    if (rand < 0.5) {
        // 创建方块
        const size = 20 + Math.random() * 30;
        const box = saruCanvas.createPhysicsObject(`ClickBox_${objectCount++}`, 
            clickData.x - size/2, clickData.y - size/2, size, size, {
            color: `hsl(${Math.random() * 360}, 70%, 50%)`,
            tag: 'clickBox'
        });
    } else {
        // 创建圆球
        const radius = 10 + Math.random() * 20;
        createBallAt(clickData.x - radius, clickData.y - radius, radius * 2);
    }
}

// 在指定位置创建圆球
function createBallAt(x, y, size) {
    const ball = saruCanvas.createPhysicsObject(`ClickBall_${objectCount++}`, x, y, size, size, {
        color: `hsl(${Math.random() * 360}, 80%, 60%)`,
        tag: 'clickBall'
    });
    
    // 修改为圆形渲染
    const renderer = ball.getComponent('SpriteRenderer');
    if (renderer) {
        renderer.render = function(ctx) {
            if (!this.enabled) return;
            
            const transform = this.gameObject.getComponent('Transform');
            if (!transform) return;
            
            // 绘制圆形 - 使用canvas原生坐标系
            const canvas = saruCanvas.getCanvas();
            if (canvas) {
                const centerX = transform.x + this.width / 2;
                const centerY = canvas.height - (transform.y + this.height / 2);
                
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(centerX, centerY, this.width / 2, 0, 2 * Math.PI);
                ctx.fill();
            }
        };
    }
    
    // 不设置初始速度，让重力自然作用
    ball.transform.setVelocity(0, 0);
}

// 开始物理模拟
function startPhysicsSimulation() {
    if (isAnimating) return;
    
    isAnimating = true;
    
    saruCanvas.startAnimation(function(deltaTime, frameCount) {
        // 更新物理世界
        saruCanvas.updatePhysics(deltaTime);
        
        // 渲染物理世界
        const ctx = saruCanvas.getContext();
        saruCanvas.renderPhysics(ctx);
        
        // 更新FPS显示
        updateFPSDisplay();
        
    }, 60);
    
    console.log('物理模拟已开始');
}

// 停止物理模拟
function stopPhysicsSimulation() {
    if (!isAnimating) return;
    
    isAnimating = false;
    saruCanvas.stopAnimation();
    console.log('物理模拟已停止');
}

// 更新重力
function updateGravity(value) {
    const gravityForce = parseFloat(value);
    document.getElementById('gravityValue').textContent = gravityForce;
    
    // 更新所有重力组件
    const allObjects = saruCanvas.objectManager.getAllGameObjects();
    allObjects.forEach(gameObject => {
        const gravity = gameObject.getComponent('Gravity');
        if (gravity) {
            gravity.setGravityForce(gravityForce);
        }
    });
    
    console.log(`重力更新为: ${gravityForce}`);
}

// 切换碰撞器显示
function toggleColliders() {
    showColliders = !showColliders;
    saruCanvas.objectManager.setShowColliders(showColliders);
    console.log(`碰撞器显示: ${showColliders ? '开启' : '关闭'}`);
}

// 清除所有物体
function clearAll() {
    saruCanvas.objectManager.clear();
    objectCount = 0;
    
    // 重新创建地面
    createGround();
    
    console.log('所有物体已清除');
}

// 切换动画
function toggleAnimation() {
    if (isAnimating) {
        stopPhysicsSimulation();
    } else {
        startPhysicsSimulation();
    }
}

// 更新FPS显示
function updateFPSDisplay() {
    const fps = saruCanvas.getFps();
    const objectCount = saruCanvas.objectManager.getAllGameObjects().length;
    
    const fpsDisplay = document.getElementById('fpsDisplay');
    if (fpsDisplay) {
        fpsDisplay.innerHTML = `FPS: ${fps}<br>物体数量: ${objectCount}`;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 等待saruCanvas初始化完成
    setTimeout(init, 100);
});