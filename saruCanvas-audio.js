// saruCanvas-audio.js - 音频管理器扩展

(function () {
    'use strict';

    // ========== 音频管理器 ==========

    class AudioManager {
        constructor() {
            this.tracks = new Map();
            this.masterVolume = 1.0;
            this.context = null;
            this.init();
        }

        init() {
            try {
                this.context = new (window.AudioContext || window.webkitAudioContext)();
                console.log('AudioManager 初始化成功');
            } catch (error) {
                console.error('AudioManager 初始化失败:', error);
            }
        }

        loadTrack(trackId, audioSrc, options = {}) {
            const audio = new Audio();
            audio.src = audioSrc;
            audio.volume = (options.volume || 1.0) * this.masterVolume;
            audio.loop = options.loop || false;

            const track = {
                id: trackId,
                audio: audio,
                volume: options.volume || 1.0,
                loop: options.loop || false,
                isPlaying: false,
                isPaused: false
            };

            this.tracks.set(trackId, track);

            audio.addEventListener('loadeddata', () => {
                console.log(`音轨加载完成: ${trackId}`);
            });

            audio.addEventListener('error', (e) => {
                console.error(`音轨加载失败: ${trackId}`, e);
            });

            return track;
        }

        play(trackId, options = {}) {
            const track = this.tracks.get(trackId);
            if (!track) {
                console.error(`音轨不存在: ${trackId}`);
                return false;
            }

            try {
                if (options.volume !== undefined) {
                    track.volume = options.volume;
                    track.audio.volume = track.volume * this.masterVolume;
                }

                track.audio.play();
                track.isPlaying = true;
                track.isPaused = false;

                console.log(`音轨开始播放: ${trackId}`);
                return true;
            } catch (error) {
                console.error(`播放音轨失败: ${trackId}`, error);
                return false;
            }
        }

        pause(trackId) {
            const track = this.tracks.get(trackId);
            if (!track) return false;

            track.audio.pause();
            track.isPlaying = false;
            track.isPaused = true;

            console.log(`音轨已暂停: ${trackId}`);
            return true;
        }

        stop(trackId) {
            const track = this.tracks.get(trackId);
            if (!track) return false;

            track.audio.pause();
            track.audio.currentTime = 0;
            track.isPlaying = false;
            track.isPaused = false;

            console.log(`音轨已停止: ${trackId}`);
            return true;
        }

        removeTrack(trackId) {
            const track = this.tracks.get(trackId);
            if (!track) return false;

            this.stop(trackId);
            track.audio.src = '';
            this.tracks.delete(trackId);

            console.log(`音轨已移除: ${trackId}`);
            return true;
        }

        setMasterVolume(volume) {
            this.masterVolume = Math.max(0, Math.min(1, volume));
            this.tracks.forEach(track => {
                track.audio.volume = track.volume * this.masterVolume;
            });
        }

        setTrackVolume(trackId, volume) {
            const track = this.tracks.get(trackId);
            if (!track) return false;

            track.volume = Math.max(0, Math.min(1, volume));
            track.audio.volume = track.volume * this.masterVolume;
            return true;
        }

        isTrackPlaying(trackId) {
            const track = this.tracks.get(trackId);
            return track ? track.isPlaying : false;
        }

        getTrackProgress(trackId) {
            const track = this.tracks.get(trackId);
            if (!track || !track.audio.duration) return 0;
            return track.audio.currentTime / track.audio.duration;
        }

        setTrackProgress(trackId, progress) {
            const track = this.tracks.get(trackId);
            if (!track || !track.audio.duration) return false;

            track.audio.currentTime = progress * track.audio.duration;
            return true;
        }

        hasTrack(trackId) {
            return this.tracks.has(trackId);
        }

        getTrackCurrentTime(trackId) {
            const track = this.tracks.get(trackId);
            if (!track) return 0;
            return track.audio.currentTime;
        }

        getTrackDuration(trackId) {
            const track = this.tracks.get(trackId);
            if (!track) return 0;
            return track.audio.duration;
        }

        getTrackVolume(trackId) {
            const track = this.tracks.get(trackId);
            if (!track) return 0;
            return track.volume;
        }
        fadeIn(trackId, duration = 1000) {
            const track = this.tracks.get(trackId);
            if (!track) return false;

            const startVolume = track.volume;
            const endVolume = 1.0;
            const startTime = Date.now();
            const endTime = startTime + duration;

            const fadeIn = () => {
                const now = Date.now();
                if (now >= endTime) {
                    track.volume = endVolume;
                    track.audio.volume = track.volume * this.masterVolume;
                    return;
                }

                const progress = (now - startTime) / duration;
                const volume = startVolume + (endVolume - startVolume) * progress;
                track.volume = volume;
                track.audio.volume = track.volume * this.masterVolume;

                requestAnimationFrame(fadeIn);
            };
        }

        isLooping(trackId) {
            const track = this.tracks.get(trackId);
            if (!track) return false;
            return track.loop;
        }
        setVolume(trackId, volume) {
            this.setTrackVolume(trackId, volume)
        }
        fadeOut(trackId, duration = 1000) {
            const track = this.tracks.get(trackId);
            if (!track) return false;

            const startVolume = track.volume;
            const endVolume = 0.0;
            const startTime = Date.now();
            const endTime = startTime + duration;

            const fadeOut = () => {
                const now = Date.now();
                if (now >= endTime) {
                    track.volume = endVolume;
                    track.audio.volume = track.volume * this.masterVolume;
                    return;
                }

                const progress = (now - startTime) / duration;
                const volume = startVolume - (startVolume - endVolume) * progress;
                track.volume = volume;
                track.audio.volume = track.volume * this.masterVolume;

                requestAnimationFrame(fadeOut);
            };
        }
        setLoop(trackId, loop){
            const track = this.tracks.get(trackId);
            if (!track) return false;
            track.loop = loop;
            track.audio.loop = loop;
            return true;
        }
        isPlaying(trackId) {
            const track = this.tracks.get(trackId);
            if (!track) return false;
            return track.isPlaying;
        }
        getMasterVolume(){
            return this.masterVolume;
        }
        getProgress(trackId) {
            this.getTrackProgress(trackId)
        }
    }

    // 创建全局音频管理器实例
    const audioManager = new AudioManager();
    window.AudioManager = AudioManager;
    // 扩展saruCanvas对象
    if (window.saruCanvas) {
        window.saruCanvas.audioManager = audioManager;
        window.saruCanvas.AudioManager = AudioManager;
    }

})();