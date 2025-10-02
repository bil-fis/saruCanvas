// saruCanvas-video.js - 优化的视频播放系统

(function() {
    'use strict';
    
    // ========== 视频播放系统 ==========
    
    const videoManager = {
        videos: new Map(),
        
        loadVideo(videoId, videoSrc, options = {}) {
            const defaultOptions = {
                x: 0,
                y: 0,
                width: null,
                height: null,
                loop: false,
                volume: 1.0,
                playbackRate: 1.0,
                fit: 'contain'
            };
            
            const opts = { ...defaultOptions, ...options };
            
            return new Promise((resolve, reject) => {
                const canvas = window.saruCanvas ? window.saruCanvas.getCanvas() : null;
                const ctx = window.saruCanvas ? window.saruCanvas.getContext() : null;
                
                if (!canvas || !ctx) {
                    reject(new Error('Canvas未初始化'));
                    return;
                }
                
                // 设置默认尺寸
                if (opts.width === null) opts.width = canvas.width;
                if (opts.height === null) opts.height = canvas.height;
                
                // 如果视频已存在，先卸载
                if (this.videos.has(videoId)) {
                    this.unloadVideo(videoId);
                }
                
                // 创建视频元素
                const video = document.createElement('video');
                video.src = videoSrc;
                video.loop = opts.loop;
                video.volume = 0; // 视频静音，音频单独管理
                video.playbackRate = opts.playbackRate;
                video.crossOrigin = 'anonymous';
                video.preload = 'auto';
                video.muted = true;
                
                // 创建视频对象
                const videoObj = {
                    id: videoId,
                    video: video,
                    options: opts,
                    isPlaying: false,
                    isPaused: false,
                    isLoaded: false,
                    audioTrackId: `${videoId}_audio`,
                    renderFrameId: null
                };
                
                // 视频加载完成
                video.addEventListener('loadedmetadata', () => {
                    videoObj.isLoaded = true;
                    
                    // 如果没有指定尺寸，使用视频原始尺寸
                    if (options.width === undefined) opts.width = video.videoWidth;
                    if (options.height === undefined) opts.height = video.videoHeight;
                    
                    // 加载音频轨道
                    if (window.saruCanvas && window.saruCanvas.audioManager) {
                        window.saruCanvas.audioManager.loadTrack(videoObj.audioTrackId, videoSrc, {
                            volume: opts.volume,
                            loop: opts.loop
                        });
                    }
                    
                    console.log(`视频加载完成: ${videoId} (${video.videoWidth}x${video.videoHeight})`);
                    resolve(videoObj);
                });
                
                // 视频加载错误
                video.addEventListener('error', (e) => {
                    console.error(`视频加载失败: ${videoId}`, e);
                    reject(new Error(`视频加载失败: ${videoId}`));
                });
                
                this.videos.set(videoId, videoObj);
            });
        },
        
        playVideo(videoId) {
            const videoObj = this.videos.get(videoId);
            if (!videoObj || !videoObj.isLoaded) {
                console.error(`视频不存在或未加载: ${videoId}`);
                return false;
            }
            
            if (videoObj.isPlaying) {
                console.warn(`视频已在播放: ${videoId}`);
                return true;
            }
            
            try {
                videoObj.isPlaying = true;
                videoObj.isPaused = false;
                
                // 让video元素自然播放，不强制同步时间
                videoObj.video.play().then(() => {
                    // 同步播放音频
                    if (window.saruCanvas && window.saruCanvas.audioManager) {
                        window.saruCanvas.audioManager.play(videoObj.audioTrackId, {
                            volume: videoObj.options.volume
                        });
                    }
                    
                    // 开始渲染循环
                    this.startRenderLoop(videoId);
                }).catch(error => {
                    console.error(`视频播放失败: ${videoId}`, error);
                    videoObj.isPlaying = false;
                });
                
                console.log(`视频开始播放: ${videoId}`);
                return true;
            } catch (error) {
                console.error(`播放视频失败: ${videoId}`, error);
                return false;
            }
        },
        
        startRenderLoop(videoId) {
            const videoObj = this.videos.get(videoId);
            if (!videoObj) return;
            
            const renderLoop = () => {
                if (!videoObj.isPlaying) return;
                
                // 简单高效的渲染
                this.renderVideoFrame(videoObj);
                
                // 检查播放状态
                if (videoObj.video.ended && !videoObj.options.loop) {
                    this.stopVideo(videoId);
                    return;
                }
                
                // 继续下一帧 - 使用浏览器优化的requestAnimationFrame
                videoObj.renderFrameId = requestAnimationFrame(renderLoop);
            };
            
            renderLoop();
        },
        
        renderVideoFrame(videoObj) {
            if (!videoObj.video || videoObj.video.readyState < 2) return;
            
            const ctx = window.saruCanvas ? window.saruCanvas.getContext() : null;
            if (!ctx) return;
            
            const { video, options } = videoObj;
            const { x, y, width, height, fit } = options;
            
            try {
                // 计算渲染尺寸和位置
                const renderInfo = this.calculateRenderSize(
                    video.videoWidth, video.videoHeight,
                    width, height, fit
                );
                
                // 直接渲染，避免额外的canvas操作
                ctx.clearRect(x, y, width, height);
                ctx.drawImage(
                    video,
                    x + renderInfo.offsetX, y + renderInfo.offsetY,
                    renderInfo.renderWidth, renderInfo.renderHeight
                );
            } catch (error) {
                // 忽略渲染错误
            }
        },
        
        calculateRenderSize(videoWidth, videoHeight, targetWidth, targetHeight, fit) {
            const videoAspect = videoWidth / videoHeight;
            const targetAspect = targetWidth / targetHeight;
            
            let renderWidth, renderHeight, offsetX = 0, offsetY = 0;
            
            switch (fit) {
                case 'contain':
                    if (videoAspect > targetAspect) {
                        renderWidth = targetWidth;
                        renderHeight = targetWidth / videoAspect;
                        offsetY = (targetHeight - renderHeight) / 2;
                    } else {
                        renderWidth = targetHeight * videoAspect;
                        renderHeight = targetHeight;
                        offsetX = (targetWidth - renderWidth) / 2;
                    }
                    break;
                    
                case 'cover':
                    if (videoAspect > targetAspect) {
                        renderWidth = targetHeight * videoAspect;
                        renderHeight = targetHeight;
                        offsetX = (targetWidth - renderWidth) / 2;
                    } else {
                        renderWidth = targetWidth;
                        renderHeight = targetWidth / videoAspect;
                        offsetY = (targetHeight - renderHeight) / 2;
                    }
                    break;
                    
                case 'fill':
                    renderWidth = targetWidth;
                    renderHeight = targetHeight;
                    break;
                    
                case 'none':
                default:
                    renderWidth = videoWidth;
                    renderHeight = videoHeight;
                    offsetX = (targetWidth - renderWidth) / 2;
                    offsetY = (targetHeight - renderHeight) / 2;
                    break;
            }
            
            return { renderWidth, renderHeight, offsetX, offsetY };
        },
        
        pauseVideo(videoId) {
            const videoObj = this.videos.get(videoId);
            if (!videoObj) return false;
            
            videoObj.isPlaying = false;
            videoObj.isPaused = true;
            videoObj.video.pause();
            
            // 暂停音频
            if (window.saruCanvas && window.saruCanvas.audioManager) {
                window.saruCanvas.audioManager.pause(videoObj.audioTrackId);
            }
            
            // 停止渲染
            if (videoObj.renderFrameId) {
                cancelAnimationFrame(videoObj.renderFrameId);
                videoObj.renderFrameId = null;
            }
            
            console.log(`视频已暂停: ${videoId}`);
            return true;
        },
        
        stopVideo(videoId) {
            const videoObj = this.videos.get(videoId);
            if (!videoObj) return false;
            
            videoObj.isPlaying = false;
            videoObj.isPaused = false;
            videoObj.video.pause();
            videoObj.video.currentTime = 0;
            
            // 停止音频
            if (window.saruCanvas && window.saruCanvas.audioManager) {
                window.saruCanvas.audioManager.stop(videoObj.audioTrackId);
            }
            
            // 停止渲染
            if (videoObj.renderFrameId) {
                cancelAnimationFrame(videoObj.renderFrameId);
                videoObj.renderFrameId = null;
            }
            
            console.log(`视频已停止: ${videoId}`);
            return true;
        },
        
        unloadVideo(videoId) {
            const videoObj = this.videos.get(videoId);
            if (!videoObj) return false;
            
            this.stopVideo(videoId);
            
            // 移除音频轨道
            if (window.saruCanvas && window.saruCanvas.audioManager) {
                window.saruCanvas.audioManager.removeTrack(videoObj.audioTrackId);
            }
            
            // 清理视频元素
            videoObj.video.src = '';
            videoObj.video.load();
            
            this.videos.delete(videoId);
            
            console.log(`视频已卸载: ${videoId}`);
            return true;
        },
        
        getVideoInfo(videoId) {
            const videoObj = this.videos.get(videoId);
            if (!videoObj) return null;
            
            return {
                id: videoId,
                isPlaying: videoObj.isPlaying,
                isPaused: videoObj.isPaused,
                isLoaded: videoObj.isLoaded,
                duration: videoObj.video.duration || 0,
                currentTime: videoObj.video.currentTime || 0,
                progress: videoObj.video.duration ? 
                    (videoObj.video.currentTime / videoObj.video.duration) : 0,
                volume: videoObj.options.volume,
                width: videoObj.options.width,
                height: videoObj.options.height,
                loop: videoObj.options.loop,
                playbackRate: videoObj.options.playbackRate
            };
        }
    };
    
    // 视频播放便捷方法
    function playVideo(videoId, videoSrc, options = {}) {
        return videoManager.loadVideo(videoId, videoSrc, options)
            .then(() => videoManager.playVideo(videoId));
    }
    
    function pauseVideo(videoId) {
        return videoManager.pauseVideo(videoId);
    }
    
    function stopVideo(videoId) {
        return videoManager.stopVideo(videoId);
    }
    
    function unloadVideo(videoId) {
        return videoManager.unloadVideo(videoId);
    }
    
    function getVideoInfo(videoId) {
        return videoManager.getVideoInfo(videoId);
    }
    
    // 扩展saruCanvas对象
    if (window.saruCanvas) {
        window.saruCanvas.playVideo = playVideo;
        window.saruCanvas.pauseVideo = pauseVideo;
        window.saruCanvas.stopVideo = stopVideo;
        window.saruCanvas.unloadVideo = unloadVideo;
        window.saruCanvas.getVideoInfo = getVideoInfo;
        window.saruCanvas.videoManager = videoManager;
    }
    
})();