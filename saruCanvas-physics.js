// saruCanvas-physics.js - 物理引擎扩展：物体管理器和重力系统

(function() {
    'use strict';
    
    // 确保saruCanvas已加载
    if (typeof window.saruCanvas === 'undefined') {
        console.error('saruCanvas-physics.js 需要先加载 saruCanvas.js');
        return;
    }
    
    // ========== 组件基类 ==========
    
    class Component {
        constructor(name) {
            this.name = name;
            this.gameObject = null;
            this.enabled = true;
        }
        
        // 组件初始化（当添加到游戏对象时调用）
        init(gameObject) {
            this.gameObject = gameObject;
        }
        
        // 每帧更新
        update(deltaTime) {
            // 子类重写此方法
        }
        
        // 渲染
        render(ctx) {
            // 子类重写此方法
        }
        
        // 组件销毁
        destroy() {
            this.gameObject = null;
        }
        
        // 启用/禁用组件
        setEnabled(enabled) {
            this.enabled = enabled;
        }
    }
    
    // ========== 变换组件 ==========
    
    class Transform extends Component {
        constructor(x = 0, y = 0, rotation = 0, scaleX = 1, scaleY = 1) {
            super('Transform');
            this.x = x;
            this.y = y;
            this.rotation = rotation;
            this.scaleX = scaleX;
            this.scaleY = scaleY;
            this.velocity = { x: 0, y: 0 };
            this.acceleration = { x: 0, y: 0 };
        }
        
        update(deltaTime) {
            if (!this.enabled) return;
            
            const dt = deltaTime / 1000; // 转换为秒
            
            // 更新速度
            this.velocity.x += this.acceleration.x * dt;
            this.velocity.y += this.acceleration.y * dt;
            
            // 更新位置
            this.x += this.velocity.x * dt;
            this.y += this.velocity.y * dt;
            
            // 重置加速度（每帧重新计算）
            this.acceleration.x = 0;
            this.acceleration.y = 0;
        }
        
        // 设置位置
        setPosition(x, y) {
            this.x = x;
            this.y = y;
        }
        
        // 设置速度
        setVelocity(x, y) {
            this.velocity.x = x;
            this.velocity.y = y;
        }
        
        // 设置加速度
        setAcceleration(x, y) {
            this.acceleration.x = x;
            this.acceleration.y = y;
        }
        
        // 添加力
        addForce(x, y) {
            this.acceleration.x += x;
            this.acceleration.y += y;
        }
        
        // 获取世界坐标
        getWorldPosition() {
            return { x: this.x, y: this.y };
        }
    }
    
    // ========== 重力组件 ==========
    
    class Gravity extends Component {
        constructor(gravityForce = 980) { // 默认重力加速度 980 像素/秒²
            super('Gravity');
            this.gravityForce = gravityForce;
            this.affectedByGravity = true;
        }
        
        update(deltaTime) {
            if (!this.enabled || !this.affectedByGravity) return;
            
            const transform = this.gameObject.getComponent('Transform');
            if (transform) {
                // 在左下角坐标系中，向下的重力应该是负Y方向
                // 直接修改加速度而不是累加
                transform.acceleration.y -= this.gravityForce;
            }
        }
        
        // 设置重力强度
        setGravityForce(force) {
            this.gravityForce = force;
        }
        
        // 启用/禁用重力影响
        setAffectedByGravity(affected) {
            this.affectedByGravity = affected;
        }
    }
    
    // ========== 碰撞器组件 ==========
    
    class BoxCollider extends Component {
        constructor(width, height, offsetX = 0, offsetY = 0) {
            super('BoxCollider');
            this.width = width;
            this.height = height;
            this.offsetX = offsetX;
            this.offsetY = offsetY;
            this.isTrigger = false;
            this.onCollisionEnter = null;
            this.onCollisionExit = null;
            this.onTriggerEnter = null;
            this.onTriggerExit = null;
        }
        
        // 获取碰撞边界
        getBounds() {
            const transform = this.gameObject.getComponent('Transform');
            if (!transform) return null;
            
            return {
                left: transform.x + this.offsetX,
                right: transform.x + this.offsetX + this.width,
                bottom: transform.y + this.offsetY,
                top: transform.y + this.offsetY + this.height
            };
        }
        
        // 检查与另一个碰撞器的碰撞
        checkCollision(otherCollider) {
            const bounds1 = this.getBounds();
            const bounds2 = otherCollider.getBounds();
            
            if (!bounds1 || !bounds2) return false;
            
            return !(bounds1.right < bounds2.left || 
                    bounds1.left > bounds2.right || 
                    bounds1.top < bounds2.bottom || 
                    bounds1.bottom > bounds2.top);
        }
        
        // 渲染碰撞边界（调试用）
        render(ctx) {
            if (!this.enabled) return;
            
            const bounds = this.getBounds();
            if (!bounds) return;
            
            const canvas = window.saruCanvas.getCanvas();
            if (!canvas) return;
            
            ctx.save();
            ctx.strokeStyle = this.isTrigger ? '#00ff00' : '#ff0000';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            
            // 转换为canvas坐标系（左下角为原点转换为左上角为原点）
            const canvasY = canvas.height - bounds.top;
            ctx.strokeRect(bounds.left, canvasY, this.width, this.height);
            
            ctx.restore();
        }
    }
    
    // ========== 渲染器组件 ==========
    
    class SpriteRenderer extends Component {
        constructor(imageId = null, color = '#ff0000', width = 50, height = 50) {
            super('SpriteRenderer');
            this.imageId = imageId;
            this.color = color;
            this.width = width;
            this.height = height;
            this.alpha = 1.0;
            this.flipX = false;
            this.flipY = false;
        }
        
        render(ctx) {
            if (!this.enabled) return;
            
            const transform = this.gameObject.getComponent('Transform');
            if (!transform) return;
            
            if (this.imageId) {
                // 渲染图片
                window.saruCanvas.drawPic(this.imageId, transform.x, transform.y, {
                    width: this.width * transform.scaleX,
                    height: this.height * transform.scaleY,
                    rotation: transform.rotation,
                    alpha: this.alpha,
                    flipX: this.flipX,
                    flipY: this.flipY,
                    clearPrevious: false // 由ObjectManager统一管理清除
                });
            } else {
                // 渲染矩形 - 使用canvas原生坐标系
                const canvas = window.saruCanvas.getCanvas();
                if (canvas) {
                    const canvasY = canvas.height - transform.y - this.height * transform.scaleY;
                    ctx.fillStyle = this.color;
                    ctx.fillRect(transform.x, canvasY, 
                        this.width * transform.scaleX, 
                        this.height * transform.scaleY);
                }
            }
        }
        
        // 设置图片
        setImage(imageId) {
            this.imageId = imageId;
        }
        
        // 设置颜色
        setColor(color) {
            this.color = color;
        }
        
        // 设置尺寸
        setSize(width, height) {
            this.width = width;
            this.height = height;
        }
    }
    
    // ========== 游戏对象类 ==========
    
    class GameObject {
        constructor(name = 'GameObject') {
            this.name = name;
            this.id = GameObject.generateId();
            this.components = new Map();
            this.active = true;
            this.tag = '';
            
            // 默认添加Transform组件
            this.addComponent(new Transform());
        }
        
        static generateId() {
            return 'go_' + Math.random().toString(36).substr(2, 9);
        }
        
        // 添加组件
        addComponent(component) {
            if (!(component instanceof Component)) {
                console.error('只能添加Component类型的组件');
                return false;
            }
            
            this.components.set(component.name, component);
            component.init(this);
            console.log(`组件已添加: ${component.name} 到 ${this.name}`);
            return true;
        }
        
        // 获取组件
        getComponent(componentName) {
            return this.components.get(componentName) || null;
        }
        
        // 移除组件
        removeComponent(componentName) {
            const component = this.components.get(componentName);
            if (component) {
                component.destroy();
                this.components.delete(componentName);
                console.log(`组件已移除: ${componentName} 从 ${this.name}`);
                return true;
            }
            return false;
        }
        
        // 检查是否有组件
        hasComponent(componentName) {
            return this.components.has(componentName);
        }
        
        // 更新所有组件
        update(deltaTime) {
            if (!this.active) return;
            
            this.components.forEach(component => {
                if (component.enabled) {
                    component.update(deltaTime);
                }
            });
        }
        
        // 渲染所有组件
        render(ctx) {
            if (!this.active) return;
            
            this.components.forEach(component => {
                if (component.enabled && typeof component.render === 'function') {
                    component.render(ctx);
                }
            });
        }
        
        // 设置活跃状态
        setActive(active) {
            this.active = active;
        }
        
        // 设置标签
        setTag(tag) {
            this.tag = tag;
        }
        
        // 销毁游戏对象
        destroy() {
            this.components.forEach(component => {
                component.destroy();
            });
            this.components.clear();
        }
        
        // 便捷方法：获取Transform组件
        get transform() {
            return this.getComponent('Transform');
        }
    }
    
    // ========== 物体管理器 ==========
    
    class ObjectManager {
        constructor() {
            this.gameObjects = new Map();
            this.gameObjectsByTag = new Map();
            this.isUpdating = false;
            this.showColliders = false;
            this.gravity = { x: 0, y: -980 }; // 全局重力
        }
        
        // 创建游戏对象
        createGameObject(name = 'GameObject') {
            const gameObject = new GameObject(name);
            this.addGameObject(gameObject);
            return gameObject;
        }
        
        // 添加游戏对象
        addGameObject(gameObject) {
            if (!(gameObject instanceof GameObject)) {
                console.error('只能添加GameObject类型的对象');
                return false;
            }
            
            this.gameObjects.set(gameObject.id, gameObject);
            
            // 按标签分类
            if (gameObject.tag) {
                if (!this.gameObjectsByTag.has(gameObject.tag)) {
                    this.gameObjectsByTag.set(gameObject.tag, []);
                }
                this.gameObjectsByTag.get(gameObject.tag).push(gameObject);
            }
            
            console.log(`游戏对象已添加: ${gameObject.name} (${gameObject.id})`);
            return true;
        }
        
        // 移除游戏对象
        removeGameObject(gameObjectId) {
            const gameObject = this.gameObjects.get(gameObjectId);
            if (!gameObject) return false;
            
            // 从标签分类中移除
            if (gameObject.tag && this.gameObjectsByTag.has(gameObject.tag)) {
                const taggedObjects = this.gameObjectsByTag.get(gameObject.tag);
                const index = taggedObjects.indexOf(gameObject);
                if (index > -1) {
                    taggedObjects.splice(index, 1);
                }
            }
            
            gameObject.destroy();
            this.gameObjects.delete(gameObjectId);
            console.log(`游戏对象已移除: ${gameObject.name} (${gameObjectId})`);
            return true;
        }
        
        // 根据名称查找游戏对象
        findGameObjectByName(name) {
            for (const gameObject of this.gameObjects.values()) {
                if (gameObject.name === name) {
                    return gameObject;
                }
            }
            return null;
        }
        
        // 根据标签查找游戏对象
        findGameObjectsByTag(tag) {
            return this.gameObjectsByTag.get(tag) || [];
        }
        
        // 获取所有游戏对象
        getAllGameObjects() {
            return Array.from(this.gameObjects.values());
        }
        
        // 更新所有游戏对象
        update(deltaTime) {
            this.isUpdating = true;
            
            // 更新所有游戏对象
            this.gameObjects.forEach(gameObject => {
                gameObject.update(deltaTime);
            });
            
            // 碰撞检测
            this.checkCollisions();
            
            this.isUpdating = false;
        }
        
        // 渲染所有游戏对象
        render(ctx) {
            // 清空画布
            window.saruCanvas.clearCanvas();
            
            // 渲染所有游戏对象
            this.gameObjects.forEach(gameObject => {
                gameObject.render(ctx);
            });
            
            // 渲染碰撞器边界（调试用）
            if (this.showColliders) {
                this.gameObjects.forEach(gameObject => {
                    const collider = gameObject.getComponent('BoxCollider');
                    if (collider) {
                        collider.render(ctx);
                    }
                });
            }
        }
        
        // 碰撞检测
        checkCollisions() {
            const colliders = [];
            
            // 收集所有碰撞器
            this.gameObjects.forEach(gameObject => {
                const collider = gameObject.getComponent('BoxCollider');
                if (collider && collider.enabled) {
                    colliders.push({ gameObject, collider });
                }
            });
            
            // 检查碰撞
            for (let i = 0; i < colliders.length; i++) {
                for (let j = i + 1; j < colliders.length; j++) {
                    const obj1 = colliders[i];
                    const obj2 = colliders[j];
                    
                    if (obj1.collider.checkCollision(obj2.collider)) {
                        this.handleCollision(obj1, obj2);
                    }
                }
            }
        }
        
        // 处理碰撞
        handleCollision(obj1, obj2) {
            // 触发碰撞事件
            if (obj1.collider.isTrigger || obj2.collider.isTrigger) {
                // 触发器事件
                if (obj1.collider.onTriggerEnter) {
                    obj1.collider.onTriggerEnter(obj2.gameObject);
                }
                if (obj2.collider.onTriggerEnter) {
                    obj2.collider.onTriggerEnter(obj1.gameObject);
                }
            } else {
                // 碰撞事件
                if (obj1.collider.onCollisionEnter) {
                    obj1.collider.onCollisionEnter(obj2.gameObject);
                }
                if (obj2.collider.onCollisionEnter) {
                    obj2.collider.onCollisionEnter(obj1.gameObject);
                }
            }
        }
        
        // 设置全局重力
        setGlobalGravity(x, y) {
            this.gravity.x = x;
            this.gravity.y = y;
        }
        
        // 显示/隐藏碰撞器边界
        setShowColliders(show) {
            this.showColliders = show;
        }
        
        // 清除所有游戏对象
        clear() {
            this.gameObjects.forEach(gameObject => {
                gameObject.destroy();
            });
            this.gameObjects.clear();
            this.gameObjectsByTag.clear();
            console.log('所有游戏对象已清除');
        }
        
        // 创建带重力的物体
        createPhysicsObject(name, x, y, width, height, options = {}) {
            const gameObject = this.createGameObject(name);
            
            // 设置位置和尺寸
            gameObject.transform.setPosition(x, y);
            
            // 添加渲染器
            const renderer = new SpriteRenderer(
                options.imageId || null,
                options.color || '#ff0000',
                width,
                height
            );
            gameObject.addComponent(renderer);
            
            // 添加碰撞器
            const collider = new BoxCollider(width, height);
            gameObject.addComponent(collider);
            
            // 添加重力组件
            const gravity = new Gravity(options.gravityForce || 980);
            gameObject.addComponent(gravity);
            
            // 设置标签
            if (options.tag) {
                gameObject.setTag(options.tag);
            }
            
            return gameObject;
        }
    }
    
    // ========== 扩展saruCanvas ==========
    
    // 创建全局物体管理器实例
    const objectManager = new ObjectManager();
    
    // 扩展saruCanvas
    Object.assign(window.saruCanvas, {
        // 物体管理器
        objectManager: objectManager,
        
        // 组件类
        Component: Component,
        Transform: Transform,
        Gravity: Gravity,
        BoxCollider: BoxCollider,
        SpriteRenderer: SpriteRenderer,
        GameObject: GameObject,
        ObjectManager: ObjectManager,
        
        // 便捷方法
        createGameObject: (name) => objectManager.createGameObject(name),
        createPhysicsObject: (name, x, y, width, height, options) => 
            objectManager.createPhysicsObject(name, x, y, width, height, options),
        
        // 物理世界更新（需要在动画循环中调用）
        updatePhysics: (deltaTime) => objectManager.update(deltaTime),
        renderPhysics: (ctx) => objectManager.render(ctx)
    });
    
    console.log('saruCanvas物理引擎扩展已加载');
    
})();