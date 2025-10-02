// saruCanvas.js - 创建名为saruCanvas的canvas元素并提供绘制方法

(function() {
    'use strict';
    
    let canvas = null;
    let ctx = null;
    
    // 创建canvas元素
    function createSaruCanvas() {
        if (document.getElementById('saruCanvas')) {
            console.warn('saruCanvas已经存在');
            canvas = document.getElementById('saruCanvas');
            ctx = canvas.getContext('2d');
            initClickSystem();
            return canvas;
        }
        
        canvas = document.createElement('canvas');
        canvas.id = 'saruCanvas';
        canvas.width = 800;
        canvas.height = 600;
        canvas.style.border = '1px solid #ccc';
        canvas.style.display = 'block';
        canvas.style.margin = '20px auto';
        
        ctx = canvas.getContext('2d');
        document.body.appendChild(canvas);
        
        // 初始化点击系统
        initClickSystem();
        
        console.log('saruCanvas创建成功');
        return canvas;
    }
    
    // 通用绘制方法
    function draw(drawFunction) {
        if (!canvas || !ctx) {
            console.error('Canvas未初始化，请先调用createSaruCanvas()');
            return;
        }
        if (typeof drawFunction !== 'function') {
            console.error('draw方法需要传入一个函数');
            return;
        }
        drawFunction(canvas, ctx);
    }
    
    // 绘制矩形
    function drawRect(x, y, width, height, options = {}) {
        if (!canvas || !ctx) {
            console.error('Canvas未初始化，请先调用createSaruCanvas()');
            return;
        }
        
        const defaultOptions = {
            fillColor: '#000000',
            strokeColor: null,
            lineWidth: 1,
            fill: true,
            stroke: false
        };
        
        const opts = { ...defaultOptions, ...options };
        
        ctx.save();
        
        if (opts.fill) {
            ctx.fillStyle = opts.fillColor;
        }
        
        if (opts.stroke) {
            ctx.strokeStyle = opts.strokeColor || opts.fillColor;
            ctx.lineWidth = opts.lineWidth;
        }
        
        if (opts.fill) {
            ctx.fillRect(x, y, width, height);
        }
        
        if (opts.stroke) {
            ctx.strokeRect(x, y, width, height);
        }
        
        ctx.restore();
    }
    
    // 绘制圆形
    function drawCir(x, y, radius, options = {}) {
        if (!canvas || !ctx) {
            console.error('Canvas未初始化，请先调用createSaruCanvas()');
            return;
        }
        
        const defaultOptions = {
            fillColor: '#000000',
            strokeColor: null,
            lineWidth: 1,
            fill: true,
            stroke: false,
            startAngle: 0,
            endAngle: 2 * Math.PI
        };
        
        const opts = { ...defaultOptions, ...options };
        
        ctx.save();
        
        if (opts.fill) {
            ctx.fillStyle = opts.fillColor;
        }
        
        if (opts.stroke) {
            ctx.strokeStyle = opts.strokeColor || opts.fillColor;
            ctx.lineWidth = opts.lineWidth;
        }
        
        ctx.beginPath();
        ctx.arc(x, y, radius, opts.startAngle, opts.endAngle);
        
        if (opts.fill) {
            ctx.fill();
        }
        
        if (opts.stroke) {
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    // 绘制文字
    function makeText(text, x, y, options = {}) {
        if (!canvas || !ctx) {
            console.error('Canvas未初始化，请先调用createSaruCanvas()');
            return;
        }
        
        const defaultOptions = {
            font: '16px Arial',
            fillColor: '#000000',
            strokeColor: null,
            lineWidth: 1,
            textAlign: 'left',
            textBaseline: 'top',
            fill: true,
            stroke: false,
            maxWidth: null,
            rotation: 0,
            alpha: 1.0
        };
        
        const opts = { ...defaultOptions, ...options };
        
        // 转换坐标系（canvas使用左上角为原点，我们使用左下角）
        const canvasY = canvas.height - y;
        
        ctx.save();
        
        // 设置透明度
        ctx.globalAlpha = opts.alpha;
        
        // 设置字体
        ctx.font = opts.font;
        ctx.textAlign = opts.textAlign;
        ctx.textBaseline = opts.textBaseline;
        
        // 如果有旋转，移动到文字位置并旋转
        if (opts.rotation !== 0) {
            ctx.translate(x, canvasY);
            ctx.rotate(opts.rotation);
            // 旋转后相对于原点绘制
            x = 0;
            canvasY = 0;
        }
        
        // 设置填充颜色和绘制填充文字
        if (opts.fill) {
            ctx.fillStyle = opts.fillColor;
            if (opts.maxWidth) {
                ctx.fillText(text, x, canvasY, opts.maxWidth);
            } else {
                ctx.fillText(text, x, canvasY);
            }
        }
        
        // 设置描边颜色和绘制描边文字
        if (opts.stroke) {
            ctx.strokeStyle = opts.strokeColor || opts.fillColor;
            ctx.lineWidth = opts.lineWidth;
            if (opts.maxWidth) {
                ctx.strokeText(text, x, canvasY, opts.maxWidth);
            } else {
                ctx.strokeText(text, x, canvasY);
            }
        }
        
        ctx.restore();
    }
    
    // 测量文字尺寸
    function measureText(text, font = '16px Arial') {
        if (!canvas || !ctx) {
            console.error('Canvas未初始化，请先调用createSaruCanvas()');
            return { width: 0, height: 0 };
        }
        
        ctx.save();
        ctx.font = font;
        const metrics = ctx.measureText(text);
        ctx.restore();
        
        return {
            width: metrics.width,
            height: parseInt(font) || 16  // 简单估算高度
        };
    }
    
    // 清空画布
    function clearCanvas() {
        if (!canvas || !ctx) {
            console.error('Canvas未初始化，请先调用createSaruCanvas()');
            return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // 清空图片绘制状态记录
        drawnImages.clear();
    }
    
    // 获取canvas和context的便捷方法
    function getCanvas() {
        return canvas;
    }
    
    function getContext() {
        return ctx;
    }
    
    // ========== 动画和游戏功能 ==========
    
    let animationId = null;
    let isAnimating = false;
    let frameCount = 0;
    let lastTime = 0;
    let fps = 60;
    let frameInterval = 1000 / fps;
    
    // FPS计算变量
    let fpsCounter = 0;
    let lastFpsTime = 0;
    let currentFps = 0;
    let fpsHistory = [];
    let maxFpsHistory = 60;
    
    let gameLoopCallback = null;
    
    // 开始动画循环
    function startAnimation(callback, targetFps = 60) {
        if (isAnimating) {
            console.warn('动画已在运行中');
            return;
        }
        
        fps = targetFps;
        frameInterval = 1000 / fps;
        gameLoopCallback = callback;
        isAnimating = true;
        frameCount = 0;
        lastTime = performance.now();
        
        function animate(currentTime) {
            if (!isAnimating) return;
            
            const deltaTime = currentTime - lastTime;
            
            if (deltaTime >= frameInterval) {
                frameCount++;
                updateFps(currentTime);
                
                if (gameLoopCallback && typeof gameLoopCallback === 'function') {
                    gameLoopCallback(deltaTime, frameCount);
                }
                
                lastTime = currentTime - (deltaTime % frameInterval);
            }
            
            animationId = requestAnimationFrame(animate);
        }
        
        animationId = requestAnimationFrame(animate);
        console.log(`动画循环已启动，目标FPS: ${fps}`);
    }
    
    // 停止动画循环
    function stopAnimation() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        isAnimating = false;
        console.log('动画循环已停止');
    }
    
    // 更新FPS计算
    function updateFps(currentTime) {
        fpsCounter++;
        
        if (currentTime - lastFpsTime >= 1000) {
            currentFps = Math.round(fpsCounter * 1000 / (currentTime - lastFpsTime));
            fpsHistory.push(currentFps);
            
            if (fpsHistory.length > maxFpsHistory) {
                fpsHistory.shift();
            }
            
            fpsCounter = 0;
            lastFpsTime = currentTime;
        }
    }
    
    // 获取当前FPS
    function getFps() {
        return currentFps;
    }
    
    // 获取动画信息
    function getAnimationInfo() {
        return {
            isAnimating: isAnimating,
            frameCount: frameCount,
            currentFps: currentFps,
            targetFps: fps,
            fpsHistory: [...fpsHistory],
            averageFps: fpsHistory.length > 0 ? Math.round(fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length) : 0,
            animationId: animationId,
            lastTime: lastTime
        };
    }
    
    // ========== 输入系统 ==========
    
    const keyListeners = new Map();
    let isKeySystemInitialized = false;
    
    // ========== 点击和触摸系统 ==========
    
    const clickableElements = new Map();
    let isClickSystemInitialized = false;
    let globalClickListeners = [];
    
    // 可点击元素类
    class ClickableElement {
        constructor(id, x, y, width, height, centerX = null, centerY = null) {
            this.id = id;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            // 使用左下角坐标系，如果没有指定中心点则自动计算
            this.centerX = centerX !== null ? centerX : x + width / 2;
            this.centerY = centerY !== null ? centerY : y + height / 2;
            this.clickCallback = null;
            this.isVisible = true;
            this.isEnabled = true;
        }
        
        // 设置点击回调
        setOnClick(callback) {
            this.clickCallback = callback;
        }
        
        // 检查点击是否在元素内
        isPointInside(x, y) {
            if (!this.isVisible || !this.isEnabled) return false;
            
            return x >= this.x && x <= this.x + this.width &&
                   y >= this.y && y <= this.y + this.height;
        }
        
        // 触发点击事件
        triggerClick(x, y, event) {
            if (this.clickCallback && typeof this.clickCallback === 'function') {
                this.clickCallback({
                    elementId: this.id,
                    centerX: this.centerX,
                    centerY: this.centerY,
                    clickX: x,
                    clickY: y,
                    element: this,
                    originalEvent: event
                });
            }
        }
        
        // 更新位置
        updatePosition(x, y, width = null, height = null) {
            this.x = x;
            this.y = y;
            if (width !== null) this.width = width;
            if (height !== null) this.height = height;
            this.centerX = this.x + this.width / 2;
            this.centerY = this.y + this.height / 2;
        }
        
        // 设置可见性
        setVisible(visible) {
            this.isVisible = visible;
        }
        
        // 设置启用状态
        setEnabled(enabled) {
            this.isEnabled = enabled;
        }
    }
    
    // 坐标转换：从canvas坐标系转换为左下角坐标系
    function convertToBottomLeftCoords(canvasX, canvasY) {
        if (!canvas) return { x: canvasX, y: canvasY };
        
        return {
            x: canvasX,
            y: canvas.height - canvasY  // 翻转Y轴
        };
    }
    
    // 获取鼠标/触摸在canvas中的位置
    function getCanvasPosition(event) {
        if (!canvas) return { x: 0, y: 0 };
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        let clientX, clientY;
        
        if (event.touches && event.touches.length > 0) {
            // 触摸事件
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            // 鼠标事件
            clientX = event.clientX;
            clientY = event.clientY;
        }
        
        const canvasX = (clientX - rect.left) * scaleX;
        const canvasY = (clientY - rect.top) * scaleY;
        
        return convertToBottomLeftCoords(canvasX, canvasY);
    }
    
    // 处理点击事件
    function handleClick(event) {
        const position = getCanvasPosition(event);
        
        // 广播全局点击事件
        globalClickListeners.forEach(listener => {
            if (typeof listener === 'function') {
                listener({
                    x: position.x,
                    y: position.y,
                    originalEvent: event
                });
            }
        });
        
        // 检查可点击元素（从上到下检查，最后添加的元素优先）
        const elements = Array.from(clickableElements.values()).reverse();
        
        for (const element of elements) {
            if (element.isPointInside(position.x, position.y)) {
                element.triggerClick(position.x, position.y, event);
                event.preventDefault();
                break; // 只触发第一个匹配的元素
            }
        }
    }
    
    // 初始化点击系统
    function initClickSystem() {
        if (isClickSystemInitialized || !canvas) return;
        
        // 鼠标事件
        canvas.addEventListener('click', handleClick);
        canvas.addEventListener('mousedown', (event) => {
            // 可以在这里添加鼠标按下的处理
        });
        
        // 触摸事件
        canvas.addEventListener('touchstart', (event) => {
            event.preventDefault(); // 防止页面滚动
        });
        
        canvas.addEventListener('touchend', (event) => {
            event.preventDefault();
            handleClick(event);
        });
        
        // 防止右键菜单
        canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
        
        isClickSystemInitialized = true;
        console.log('点击和触摸系统已初始化');
    }
    
    // 添加可点击元素
    function addClickableElement(id, x, y, width, height, centerX = null, centerY = null) {
        const element = new ClickableElement(id, x, y, width, height, centerX, centerY);
        clickableElements.set(id, element);
        console.log(`添加可点击元素: ${id} at (${x}, ${y}) size ${width}x${height}`);
        return element;
    }
    
    // 移除可点击元素
    function removeClickableElement(id) {
        if (clickableElements.has(id)) {
            clickableElements.delete(id);
            console.log(`移除可点击元素: ${id}`);
            return true;
        }
        return false;
    }
    
    // 获取可点击元素
    function getClickableElement(id) {
        return clickableElements.get(id) || null;
    }
    
    // 添加全局点击监听器
    function addGlobalClickListener(callback) {
        if (typeof callback === 'function') {
            globalClickListeners.push(callback);
            console.log('添加全局点击监听器');
        }
    }
    
    // 移除全局点击监听器
    function removeGlobalClickListener(callback) {
        const index = globalClickListeners.indexOf(callback);
        if (index > -1) {
            globalClickListeners.splice(index, 1);
            console.log('移除全局点击监听器');
            return true;
        }
        return false;
    }
    
    // 清除所有可点击元素
    function clearClickableElements() {
        clickableElements.clear();
        console.log('清除所有可点击元素');
    }
    
    function initKeySystem() {
        if (isKeySystemInitialized) return;
        
        document.addEventListener('keydown', function(event) {
            const key = event.key.toLowerCase();
            if (keyListeners.has(key)) {
                const callbacks = keyListeners.get(key);
                callbacks.forEach(callback => {
                    if (typeof callback === 'function') {
                        callback(event);
                    }
                });
                event.preventDefault();
            }
        });
        
        isKeySystemInitialized = true;
        console.log('按键系统已初始化');
    }
    
    function listenKey(key, callback) {
        if (!isKeySystemInitialized) {
            initKeySystem();
        }
        
        const normalizedKey = key.toLowerCase();
        
        if (!keyListeners.has(normalizedKey)) {
            keyListeners.set(normalizedKey, []);
        }
        
        keyListeners.get(normalizedKey).push(callback);
        console.log(`已添加按键监听: ${key}`);
    }
    
    // ========== 场景管理系统 ==========
    
    const sceneManager = {
        scenes: new Map(),
        currentSceneId: null,
        isSceneLoading: false,
        
        loadScene: function(sceneId, scriptPath) {
            return new Promise((resolve, reject) => {
                if (this.scenes.has(sceneId)) {
                    console.log(`场景已存在: ${sceneId}`);
                    resolve(this.scenes.get(sceneId));
                    return;
                }
                
                this.isSceneLoading = true;
                
                const script = document.createElement('script');
                script.src = scriptPath;
                script.onload = () => {
                    if (window.currentScene) {
                        this.scenes.set(sceneId, window.currentScene);
                        window.currentScene = null;
                        console.log(`场景加载成功: ${sceneId}`);
                        resolve(this.scenes.get(sceneId));
                    } else {
                        reject(new Error(`场景脚本未正确注册: ${sceneId}`));
                    }
                    this.isSceneLoading = false;
                };
                script.onerror = () => {
                    reject(new Error(`场景脚本加载失败: ${scriptPath}`));
                    this.isSceneLoading = false;
                };
                
                document.head.appendChild(script);
            });
        },
        
        switchScene: function(sceneId) {
            if (!this.scenes.has(sceneId)) {
                console.error(`场景不存在: ${sceneId}`);
                return false;
            }
            
            if (this.currentSceneId && this.scenes.has(this.currentSceneId)) {
                const currentScene = this.scenes.get(this.currentSceneId);
                if (currentScene.stop && typeof currentScene.stop === 'function') {
                    currentScene.stop();
                }
            }
            
            this.currentSceneId = sceneId;
            const newScene = this.scenes.get(sceneId);
            
            if (newScene.start && typeof newScene.start === 'function') {
                newScene.start();
            }
            
            console.log(`场景切换成功: ${sceneId}`);
            return true;
        },
        
        getCurrentScene: function() {
            if (this.currentSceneId && this.scenes.has(this.currentSceneId)) {
                return this.scenes.get(this.currentSceneId);
            }
            return null;
        }
    };
    
    function loadScene(sceneId, scriptPath) {
        return sceneManager.loadScene(sceneId, scriptPath);
    }
    
    function switchScene(sceneId) {
        return sceneManager.switchScene(sceneId);
    }
    
    // ========== 文件加载系统 ==========
    
    function loadFile(filePath) {
        return new Promise((resolve, reject) => {
            fetch(filePath)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.text();
                })
                .then(data => {
                    console.log(`文件加载成功: ${filePath}`);
                    resolve(data);
                })
                .catch(error => {
                    console.error(`文件加载失败: ${filePath}`, error);
                    reject(error);
                });
        });
    }
    
    // ========== 图片加载系统 ==========
    
    const imageCache = new Map();
    
    // 加载图片
    function loadPic(imagePath, imageId = null) {
        return new Promise((resolve, reject) => {
            // 如果没有指定ID，使用文件路径作为ID
            const id = imageId || imagePath;
            
            // 检查缓存
            if (imageCache.has(id)) {
                console.log(`图片已缓存: ${id}`);
                resolve(imageCache.get(id));
                return;
            }
            
            // 创建图片对象
            const img = new Image();
            
            // 图片加载成功
            img.onload = function() {
                const imageData = {
                    id: id,
                    path: imagePath,
                    image: img,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    loaded: true
                };
                
                imageCache.set(id, imageData);
                console.log(`图片加载成功: ${id} (${img.naturalWidth}x${img.naturalHeight})`);
                resolve(imageData);
            };
            
            // 图片加载失败
            img.onerror = function() {
                console.error(`图片加载失败: ${imagePath}`);
                reject(new Error(`图片加载失败: ${imagePath}`));
            };
            
            // 设置跨域属性（如果需要）
            img.crossOrigin = 'anonymous';
            
            // 开始加载
            img.src = imagePath;
        });
    }
    
    // 图片绘制状态管理
    const drawnImages = new Map();
    
    // 绘制图片
    function drawPic(imageId, x, y, options = {}) {
        if (!canvas || !ctx) {
            console.error('Canvas未初始化，请先调用createSaruCanvas()');
            return false;
        }
        
        const imageData = imageCache.get(imageId);
        if (!imageData || !imageData.loaded) {
            console.error(`图片未加载或不存在: ${imageId}`);
            return false;
        }
        
        const defaultOptions = {
            width: imageData.width,
            height: imageData.height,
            rotation: 0,
            alpha: 1.0,
            flipX: false,
            flipY: false,
            centerX: null,
            centerY: null,
            clearPrevious: true  // 是否清除之前的绘制
        };
        
        const opts = { ...defaultOptions, ...options };
        
        // 如果需要清除之前的绘制，先清除该图片的上一个状态
        if (opts.clearPrevious && drawnImages.has(imageId)) {
            const prevState = drawnImages.get(imageId);
            clearImageArea(prevState);
        }
        
        // 转换坐标系（canvas使用左上角为原点，我们使用左下角）
        const canvasY = canvas.height - y - opts.height;
        
        ctx.save();
        
        // 设置透明度
        ctx.globalAlpha = opts.alpha;
        
        // 计算旋转中心
        const centerX = opts.centerX !== null ? opts.centerX : x + opts.width / 2;
        const centerY = opts.centerY !== null ? opts.centerY : canvasY + opts.height / 2;
        
        // 移动到旋转中心
        ctx.translate(centerX, centerY);
        
        // 旋转
        if (opts.rotation !== 0) {
            ctx.rotate(opts.rotation);
        }
        
        // 翻转
        if (opts.flipX || opts.flipY) {
            ctx.scale(opts.flipX ? -1 : 1, opts.flipY ? -1 : 1);
        }
        
        // 绘制图片（相对于旋转中心）
        ctx.drawImage(
            imageData.image,
            -opts.width / 2,
            -opts.height / 2,
            opts.width,
            opts.height
        );
        
        ctx.restore();
        
        // 记录当前绘制状态
        if (opts.clearPrevious) {
            drawnImages.set(imageId, {
                x: x,
                y: y,
                width: opts.width,
                height: opts.height,
                rotation: opts.rotation,
                canvasY: canvasY,
                centerX: centerX,
                centerY: centerY
            });
        }
        
        return true;
    }
    
    // 清除指定图片区域
    function clearImageArea(imageState) {
        if (!ctx || !imageState) return;
        
        ctx.save();
        
        // 计算需要清除的区域（考虑旋转）
        const { x, y, width, height, rotation, canvasY, centerX, centerY } = imageState;
        
        if (rotation === 0) {
            // 无旋转时直接清除矩形区域
            ctx.clearRect(x, canvasY, width, height);
        } else {
            // 有旋转时清除更大的区域以确保完全清除
            const diagonal = Math.sqrt(width * width + height * height);
            const clearSize = diagonal * 1.2; // 留一些余量
            
            ctx.clearRect(
                centerX - clearSize / 2,
                centerY - clearSize / 2,
                clearSize,
                clearSize
            );
        }
        
        ctx.restore();
    }
    
    // 清除指定图片的绘制状态
    function clearPicDrawing(imageId) {
        if (drawnImages.has(imageId)) {
            const imageState = drawnImages.get(imageId);
            clearImageArea(imageState);
            drawnImages.delete(imageId);
            console.log(`清除图片绘制: ${imageId}`);
            return true;
        }
        return false;
    }
    
    // 清除所有图片绘制状态
    function clearAllPicDrawings() {
        drawnImages.forEach((imageState, imageId) => {
            clearImageArea(imageState);
        });
        drawnImages.clear();
        console.log('清除所有图片绘制状态');
    }
    
    // 获取图片信息
    function getPicInfo(imageId) {
        const imageData = imageCache.get(imageId);
        if (!imageData) {
            return null;
        }
        
        return {
            id: imageData.id,
            path: imageData.path,
            width: imageData.width,
            height: imageData.height,
            loaded: imageData.loaded
        };
    }
    
    // 移除图片缓存
    function removePic(imageId) {
        if (imageCache.has(imageId)) {
            imageCache.delete(imageId);
            console.log(`图片缓存已移除: ${imageId}`);
            return true;
        }
        return false;
    }
    
    // 清除所有图片缓存
    function clearPicCache() {
        imageCache.clear();
        console.log('图片缓存已清空');
    }
    
    // 获取所有已加载的图片列表
    function getLoadedPics() {
        return Array.from(imageCache.keys());
    }
    
    // 预加载多张图片
    function preloadPics(imagePaths) {
        const promises = imagePaths.map(path => {
            if (typeof path === 'string') {
                return loadPic(path);
            } else if (typeof path === 'object' && path.path) {
                return loadPic(path.path, path.id);
            }
            return Promise.reject(new Error('无效的图片路径格式'));
        });
        
        return Promise.all(promises);
    }
    
    function loadFromUrl(url, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {},
            timeout: 10000,
            responseType: 'text'
        };
        
        const opts = { ...defaultOptions, ...options };
        
        return new Promise((resolve, reject) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), opts.timeout);
            
            fetch(url, {
                method: opts.method,
                headers: opts.headers,
                signal: controller.signal,
                ...options
            })
                .then(response => {
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    if (opts.responseType === 'json') {
                        return response.json();
                    } else if (opts.responseType === 'blob') {
                        return response.blob();
                    } else if (opts.responseType === 'arrayBuffer') {
                        return response.arrayBuffer();
                    } else {
                        return response.text();
                    }
                })
                .then(data => {
                    console.log(`网络资源加载成功: ${url}`);
                    resolve(data);
                })
                .catch(error => {
                    clearTimeout(timeoutId);
                    if (error.name === 'AbortError') {
                        console.error(`网络请求超时: ${url}`);
                        reject(new Error(`网络请求超时: ${url}`));
                    } else {
                        console.error(`网络资源加载失败: ${url}`, error);
                        reject(error);
                    }
                });
        });
    }
    
    // ========== Canvas管理系统 ==========
    
    // 移除当前canvas
    function removeCanvas() {
        if (canvas && canvas.parentNode) {
            // 停止动画
            stopAnimation();
            
            // 清除事件监听器
            if (isClickSystemInitialized) {
                canvas.removeEventListener('click', handleClick);
                canvas.removeEventListener('mousedown', () => {});
                canvas.removeEventListener('touchstart', () => {});
                canvas.removeEventListener('touchend', handleClick);
                canvas.removeEventListener('contextmenu', () => {});
            }
            
            // 从DOM中移除
            canvas.parentNode.removeChild(canvas);
            
            // 清理变量
            canvas = null;
            ctx = null;
            isClickSystemInitialized = false;
            
            // 清理缓存
            clearPicCache();
            clearClickableElements();
            keyListeners.clear();
            globalClickListeners.length = 0;
            
            console.log('saruCanvas已移除');
            return true;
        }
        
        console.warn('没有找到要移除的canvas');
        return false;
    }
    
    // 自定义创建canvas
    function customCreate(options = {}) {
        const defaultOptions = {
            width: 800,
            height: 600,
            backgroundColor: '#ffffff',
            showFPS: false,
            container: null,  // 容器ID或元素
            id: 'saruCanvas',
            border: '1px solid #ccc',
            margin: '20px auto',
            display: 'block'
        };
        
        const opts = { ...defaultOptions, ...options };
        
        // 如果已存在同ID的canvas，先移除
        const existingCanvas = document.getElementById(opts.id);
        if (existingCanvas) {
            console.warn(`Canvas ${opts.id} 已存在，将被替换`);
            if (existingCanvas.parentNode) {
                existingCanvas.parentNode.removeChild(existingCanvas);
            }
        }
        
        // 创建新的canvas
        const newCanvas = document.createElement('canvas');
        newCanvas.id = opts.id;
        newCanvas.width = opts.width;
        newCanvas.height = opts.height;
        
        // 设置样式
        newCanvas.style.border = opts.border;
        newCanvas.style.display = opts.display;
        newCanvas.style.margin = opts.margin;
        newCanvas.style.backgroundColor = opts.backgroundColor;
        
        // 确定容器
        let container;
        if (opts.container) {
            if (typeof opts.container === 'string') {
                container = document.getElementById(opts.container);
                if (!container) {
                    console.error(`容器元素未找到: ${opts.container}`);
                    container = document.body;
                }
            } else if (opts.container instanceof HTMLElement) {
                container = opts.container;
            } else {
                container = document.body;
            }
        } else {
            container = document.body;
        }
        
        // 添加到容器
        container.appendChild(newCanvas);
        
        // 更新全局变量
        canvas = newCanvas;
        ctx = canvas.getContext('2d');
        
        // 重新初始化系统
        initClickSystem();
        
        // 如果需要显示FPS，创建FPS显示元素
        if (opts.showFPS) {
            createFPSDisplay();
        }
        
        console.log(`自定义Canvas创建成功: ${opts.id} (${opts.width}x${opts.height})`);
        return {
            canvas: newCanvas,
            ctx: ctx,
            width: opts.width,
            height: opts.height,
            container: container
        };
    }
    
    // 创建FPS显示
    function createFPSDisplay() {
        // 移除已存在的FPS显示
        const existingFPS = document.getElementById('saruCanvas-fps');
        if (existingFPS) {
            existingFPS.remove();
        }
        
        const fpsDisplay = document.createElement('div');
        fpsDisplay.id = 'saruCanvas-fps';
        fpsDisplay.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 14px;
            z-index: 9999;
            pointer-events: none;
        `;
        fpsDisplay.textContent = 'FPS: 0';
        
        document.body.appendChild(fpsDisplay);
        
        // 启动FPS更新
        function updateFPSDisplay() {
            if (fpsDisplay && document.body.contains(fpsDisplay)) {
                fpsDisplay.textContent = `FPS: ${getFps()}`;
                requestAnimationFrame(updateFPSDisplay);
            }
        }
        updateFPSDisplay();
        
        return fpsDisplay;
    }
    
    // 移除FPS显示
    function removeFPSDisplay() {
        const fpsDisplay = document.getElementById('saruCanvas-fps');
        if (fpsDisplay) {
            fpsDisplay.remove();
            return true;
        }
        return false;
    }
    
    // 导出所有功能到saruCanvas命名空间
    window.saruCanvas = {
        createSaruCanvas,
        customCreate,
        removeCanvas,
        removeFPSDisplay,
        draw,
        drawRect,
        drawCir,
        makeText,
        measureText,
        clearCanvas,
        getCanvas,
        getContext,
        startAnimation,
        stopAnimation,
        getFps,
        getAnimationInfo,
        listenKey,
        loadScene,
        switchScene,
        loadFile,
        loadFromUrl,
        // 点击和触摸系统
        addClickableElement,
        removeClickableElement,
        getClickableElement,
        addGlobalClickListener,
        removeGlobalClickListener,
        clearClickableElements,
        convertToBottomLeftCoords,
        ClickableElement,
        // 图片加载系统
        loadPic,
        drawPic,
        getPicInfo,
        removePic,
        clearPicCache,
        getLoadedPics,
        preloadPics,
        clearPicDrawing,
        clearAllPicDrawings
    };
    
    // 同时导出所有函数到全局作用域，方便直接调用
    // 核心功能
    window.createSaruCanvas = createSaruCanvas;
    window.customCreate = customCreate;
    window.removeCanvas = removeCanvas;
    window.removeFPSDisplay = removeFPSDisplay;
    
    // 绘图功能
    window.draw = draw;
    window.drawRect = drawRect;
    window.drawCir = drawCir;
    window.makeText = makeText;
    window.measureText = measureText;
    window.clearCanvas = clearCanvas;
    
    // Canvas访问
    window.getCanvas = getCanvas;
    window.getContext = getContext;
    
    // 动画系统
    window.startAnimation = startAnimation;
    window.stopAnimation = stopAnimation;
    window.getFps = getFps;
    window.getAnimationInfo = getAnimationInfo;
    
    // 输入系统
    window.listenKey = listenKey;
    
    // 场景管理
    window.loadScene = loadScene;
    window.switchScene = switchScene;
    
    // 文件加载
    window.loadFile = loadFile;
    window.loadFromUrl = loadFromUrl;
    
    // 点击和触摸系统
    window.addClickableElement = addClickableElement;
    window.removeClickableElement = removeClickableElement;
    window.getClickableElement = getClickableElement;
    window.addGlobalClickListener = addGlobalClickListener;
    window.removeGlobalClickListener = removeGlobalClickListener;
    window.clearClickableElements = clearClickableElements;
    window.convertToBottomLeftCoords = convertToBottomLeftCoords;
    window.ClickableElement = ClickableElement;
    
    // 图片加载系统
    window.loadPic = loadPic;
    window.drawPic = drawPic;
    window.getPicInfo = getPicInfo;
    window.removePic = removePic;
    window.clearPicCache = clearPicCache;
    window.getLoadedPics = getLoadedPics;
    window.preloadPics = preloadPics;
    window.clearPicDrawing = clearPicDrawing;
    window.clearAllPicDrawings = clearAllPicDrawings;

    
    // 页面加载完成后自动创建canvas
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createSaruCanvas);
    } else {
        createSaruCanvas();
    }
    
})();