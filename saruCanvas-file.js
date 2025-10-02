// saruCanvas-file.js - 文件操作系统扩展

(function() {
    'use strict';
    
    // ========== 文件操作系统 ==========
    
    function openFile(options = {}) {
        const defaultOptions = {
            accept: '*/*',
            multiple: false,
            readAs: 'text'
        };
        
        const opts = { ...defaultOptions, ...options };
        
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = opts.accept;
            input.multiple = opts.multiple;
            input.style.display = 'none';
            
            input.addEventListener('change', function(event) {
                const files = event.target.files;
                
                if (files.length === 0) {
                    reject(new Error('没有选择文件'));
                    return;
                }
                
                if (!opts.multiple) {
                    const file = files[0];
                    readSingleFile(file, opts.readAs, resolve, reject);
                } else {
                    const filePromises = Array.from(files).map(file => {
                        return new Promise((fileResolve, fileReject) => {
                            readSingleFile(file, opts.readAs, fileResolve, fileReject);
                        });
                    });
                    
                    Promise.all(filePromises)
                        .then(results => resolve(results))
                        .catch(error => reject(error));
                }
                
                document.body.removeChild(input);
            });
            
            document.body.appendChild(input);
            input.click();
        });
    }
    
    function readSingleFile(file, readAs, resolve, reject) {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            const result = {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified,
                content: event.target.result
            };
            resolve(result);
        };
        
        reader.onerror = function() {
            reject(new Error(`文件读取失败: ${file.name}`));
        };
        
        switch (readAs) {
            case 'dataURL':
                reader.readAsDataURL(file);
                break;
            case 'arrayBuffer':
                reader.readAsArrayBuffer(file);
                break;
            case 'text':
            default:
                reader.readAsText(file);
                break;
        }
    }
    
    function saveFile(content, filename, mimeType = 'text/plain') {
        try {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            console.log(`文件保存成功: ${filename}`);
            return true;
        } catch (error) {
            console.error(`文件保存失败: ${filename}`, error);
            return false;
        }
    }
    
    function openImageFile(multiple = false) {
        return openFile({
            accept: 'image/*',
            multiple: multiple,
            readAs: 'dataURL'
        });
    }
    
    function openTextFile(multiple = false) {
        return openFile({
            accept: '.txt,.json,.js,.css,.html',
            multiple: multiple,
            readAs: 'text'
        });
    }
    
    function openAudioFile(multiple = false) {
        return openFile({
            accept: 'audio/*',
            multiple: multiple,
            readAs: 'arrayBuffer'
        });
    }
    
    function openVideoFile(multiple = false) {
        return openFile({
            accept: 'video/*',
            multiple: multiple,
            readAs: 'dataURL'
        });
    }
    
    // 扩展saruCanvas对象
    if (window.saruCanvas) {
        window.saruCanvas.openFile = openFile;
        window.saruCanvas.saveFile = saveFile;
        window.saruCanvas.openImageFile = openImageFile;
        window.saruCanvas.openTextFile = openTextFile;
        window.saruCanvas.openAudioFile = openAudioFile;
        window.saruCanvas.openVideoFile = openVideoFile;
    }
    
})();