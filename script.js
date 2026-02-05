/**
 * ============================================================
 * DIGITAL IMAGE PROCESSING TOOL
 * Aplikasi Pre-processing & Segmentasi Citra Berbasis Web
 * 
 * Arsitektur: Full Client-Side Processing
 * Teknologi: Vanilla JavaScript + Canvas API
 * ============================================================
 */

// ============================================================
// 1. STATE MANAGEMENT
// ============================================================

const AppState = {
    originalImage: null,
    currentImage: null,
    processedImage: null,
    imageData: null,
    originalImageData: null,
    processHistory: [],
    
    // Canvas references
    canvases: {
        original: null,
        processed: null,
        histOriginal: null,
        histProcessed: null
    },
    
    contexts: {
        original: null,
        processed: null,
        histOriginal: null,
        histProcessed: null
    }
};

// ============================================================
// 2. INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    addLog('Aplikasi berhasil diinisialisasi', 'success');
});

function initializeApp() {
    // Get canvas references
    AppState.canvases.original = document.getElementById('originalCanvas');
    AppState.canvases.processed = document.getElementById('processedCanvas');
    AppState.canvases.histOriginal = document.getElementById('histogramOriginal');
    AppState.canvases.histProcessed = document.getElementById('histogramProcessed');
    
    // Get 2D contexts
    AppState.contexts.original = AppState.canvases.original.getContext('2d');
    AppState.contexts.processed = AppState.canvases.processed.getContext('2d');
    AppState.contexts.histOriginal = AppState.canvases.histOriginal.getContext('2d');
    AppState.contexts.histProcessed = AppState.canvases.histProcessed.getContext('2d');
}

// ============================================================
// 3. EVENT LISTENERS SETUP
// ============================================================

function setupEventListeners() {
    // Upload handlers
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Reset button
    document.getElementById('resetBtn').addEventListener('click', resetToOriginal);
    
    // Pre-processing controls
    document.getElementById('grayscaleCheck').addEventListener('change', updatePreview);
    document.getElementById('brightnessSlider').addEventListener('input', updateSliderValue);
    document.getElementById('contrastSlider').addEventListener('input', updateSliderValue);
    document.getElementById('blurSlider').addEventListener('input', updateSliderValue);
    document.getElementById('medianSlider').addEventListener('input', updateSliderValue);
    document.getElementById('histEqCheck').addEventListener('change', updatePreview);
    document.getElementById('normalizeCheck').addEventListener('change', updatePreview);
    document.getElementById('scaleSlider').addEventListener('input', updateSliderValue);
    
    document.getElementById('applyPreprocessBtn').addEventListener('click', applyPreprocessing);
    
    // Segmentation controls
    document.getElementById('segmentMethod').addEventListener('change', handleSegmentMethodChange);
    document.getElementById('thresholdSlider').addEventListener('input', updateSliderValue);
    document.getElementById('cannyLowSlider').addEventListener('input', updateSliderValue);
    document.getElementById('cannyHighSlider').addEventListener('input', updateSliderValue);
    document.getElementById('kmeansSlider').addEventListener('input', updateSliderValue);
    document.getElementById('applySegmentBtn').addEventListener('click', applySegmentation);
    
    // View toggle
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', handleViewToggle);
    });
    
    // Download buttons
    document.getElementById('downloadBtn').addEventListener('click', downloadResult);
    document.getElementById('downloadAllBtn').addEventListener('click', downloadAllStages);
}

function updateSliderValue(e) {
    const slider = e.target;
    const valueSpan = document.getElementById(slider.id.replace('Slider', 'Value'));
    let value = slider.value;
    
    if (slider.id === 'contrastSlider') {
        value = parseFloat(value).toFixed(1);
    } else if (slider.id === 'scaleSlider') {
        value = value + '%';
    } else if (slider.id === 'blurSlider') {
        value = value + ' px';
    }
    
    valueSpan.textContent = value;
}

// ============================================================
// 4. FILE HANDLING
// ============================================================

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        loadImageFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        loadImageFile(file);
    }
}

function loadImageFile(file) {
    if (!file.type.match('image.*')) {
        alert('File yang dipilih bukan gambar!');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            AppState.originalImage = img;
            AppState.currentImage = img;
            displayImage(img);
            displayImageInfo(file, img);
            enableControls();
            addLog(`Gambar berhasil dimuat: ${file.name}`, 'success');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function displayImage(img) {
    // Display on original canvas
    AppState.canvases.original.width = img.width;
    AppState.canvases.original.height = img.height;
    AppState.contexts.original.drawImage(img, 0, 0);
    
    // Copy to processed canvas
    AppState.canvases.processed.width = img.width;
    AppState.canvases.processed.height = img.height;
    AppState.contexts.processed.drawImage(img, 0, 0);
    
    // Store original ImageData
    AppState.originalImageData = AppState.contexts.original.getImageData(0, 0, img.width, img.height);
    AppState.imageData = AppState.contexts.processed.getImageData(0, 0, img.width, img.height);
    
    // Draw histograms
    drawHistogram(AppState.originalImageData, AppState.contexts.histOriginal);
    drawHistogram(AppState.imageData, AppState.contexts.histProcessed);
}

function displayImageInfo(file, img) {
    document.getElementById('infoResolution').textContent = `${img.width} x ${img.height} px`;
    document.getElementById('infoSize').textContent = formatFileSize(file.size);
    document.getElementById('infoFormat').textContent = file.type.split('/')[1].toUpperCase();
    document.getElementById('imageInfo').style.display = 'block';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
}

function enableControls() {
    document.getElementById('resetBtn').disabled = false;
    document.getElementById('applyPreprocessBtn').disabled = false;
    document.getElementById('downloadBtn').disabled = false;
    document.getElementById('downloadAllBtn').disabled = false;
}

function resetToOriginal() {
    if (!AppState.originalImage) return;
    
    AppState.currentImage = AppState.originalImage;
    displayImage(AppState.originalImage);
    
    // Reset all controls
    document.getElementById('grayscaleCheck').checked = false;
    document.getElementById('brightnessSlider').value = 0;
    document.getElementById('contrastSlider').value = 1;
    document.getElementById('blurSlider').value = 0;
    document.getElementById('medianSlider').value = 0;
    document.getElementById('histEqCheck').checked = false;
    document.getElementById('normalizeCheck').checked = false;
    document.getElementById('scaleSlider').value = 100;
    
    // Update displays
    document.querySelectorAll('[id$="Value"]').forEach(span => {
        const id = span.id.replace('Value', 'Slider');
        const slider = document.getElementById(id);
        if (slider) {
            updateSliderValue({ target: slider });
        }
    });
    
    AppState.processHistory = [];
    addLog('Citra direset ke kondisi awal', 'info');
}

// ============================================================
// 5. HISTOGRAM COMPUTATION
// ============================================================

function drawHistogram(imageData, ctx) {
    const histogram = computeHistogram(imageData);
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Find max value for normalization
    const maxValue = Math.max(...histogram.r, ...histogram.g, ...histogram.b);
    
    // Draw histogram bars
    const barWidth = width / 256;
    
    for (let i = 0; i < 256; i++) {
        const x = i * barWidth;
        
        // Red channel
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        const rHeight = (histogram.r[i] / maxValue) * height;
        ctx.fillRect(x, height - rHeight, barWidth, rHeight);
        
        // Green channel
        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
        const gHeight = (histogram.g[i] / maxValue) * height;
        ctx.fillRect(x, height - gHeight, barWidth, gHeight);
        
        // Blue channel
        ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
        const bHeight = (histogram.b[i] / maxValue) * height;
        ctx.fillRect(x, height - bHeight, barWidth, bHeight);
    }
}

function computeHistogram(imageData) {
    const histogram = {
        r: new Array(256).fill(0),
        g: new Array(256).fill(0),
        b: new Array(256).fill(0)
    };
    
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        histogram.r[data[i]]++;
        histogram.g[data[i + 1]]++;
        histogram.b[data[i + 2]]++;
    }
    
    return histogram;
}

// ============================================================
// 6. PRE-PROCESSING ALGORITHMS
// ============================================================

function applyPreprocessing() {
    if (!AppState.originalImageData) return;
    
    showLoading(true);
    addLog('Memulai pre-processing...', 'info');
    
    setTimeout(() => {
        try {
            let imageData = cloneImageData(AppState.originalImageData);
            
            // Apply transformations in order
            if (document.getElementById('grayscaleCheck').checked) {
                imageData = convertToGrayscale(imageData);
                addLog('✓ Konversi grayscale', 'success');
            }
            
            const brightness = parseInt(document.getElementById('brightnessSlider').value);
            const contrast = parseFloat(document.getElementById('contrastSlider').value);
            if (brightness !== 0 || contrast !== 1) {
                imageData = adjustBrightnessContrast(imageData, brightness, contrast);
                addLog(`✓ Brightness: ${brightness}, Contrast: ${contrast}`, 'success');
            }
            
            if (document.getElementById('normalizeCheck').checked) {
                imageData = normalizeIntensity(imageData);
                addLog('✓ Normalisasi intensitas', 'success');
            }
            
            const blurRadius = parseInt(document.getElementById('blurSlider').value);
            if (blurRadius > 0) {
                imageData = applyGaussianBlur(imageData, blurRadius);
                addLog(`✓ Gaussian blur (radius: ${blurRadius})`, 'success');
            }
            
            const medianSize = parseInt(document.getElementById('medianSlider').value);
            if (medianSize > 0) {
                imageData = applyMedianFilter(imageData, medianSize);
                addLog(`✓ Median filter (kernel: ${medianSize}x${medianSize})`, 'success');
            }
            
            if (document.getElementById('histEqCheck').checked) {
                imageData = histogramEqualization(imageData);
                addLog('✓ Histogram equalization', 'success');
            }
            
            const scale = parseInt(document.getElementById('scaleSlider').value);
            if (scale !== 100) {
                imageData = resizeImage(imageData, scale / 100);
                addLog(`✓ Resize: ${scale}%`, 'success');
            }
            
            // Update canvas
            AppState.canvases.processed.width = imageData.width;
            AppState.canvases.processed.height = imageData.height;
            AppState.contexts.processed.putImageData(imageData, 0, 0);
            AppState.imageData = imageData;
            
            // Update histogram
            drawHistogram(imageData, AppState.contexts.histProcessed);
            
            addLog('Pre-processing selesai!', 'success');
        } catch (error) {
            addLog('Error: ' + error.message, 'error');
        } finally {
            showLoading(false);
        }
    }, 100);
}

/**
 * Convert image to grayscale using luminosity method
 * Formula: Y = 0.299*R + 0.587*G + 0.114*B
 * Complexity: O(n) where n = number of pixels
 */
function convertToGrayscale(imageData) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = data[i + 1] = data[i + 2] = gray;
    }
    return imageData;
}

/**
 * Adjust brightness and contrast
 * Formula: output = (input * contrast) + brightness
 * Complexity: O(n)
 */
function adjustBrightnessContrast(imageData, brightness, contrast) {
    const data = imageData.data;
    const factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100));
    
    for (let i = 0; i < data.length; i += 4) {
        data[i] = clamp(factor * (data[i] - 128) + 128 + brightness);
        data[i + 1] = clamp(factor * (data[i + 1] - 128) + 128 + brightness);
        data[i + 2] = clamp(factor * (data[i + 2] - 128) + 128 + brightness);
    }
    return imageData;
}

/**
 * Gaussian blur filter
 * Uses separable convolution for efficiency
 * Complexity: O(n * k) where k = kernel size
 */
function applyGaussianBlur(imageData, radius) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const output = new Uint8ClampedArray(data);
    
    const kernel = createGaussianKernel(radius);
    const kernelSize = kernel.length;
    const half = Math.floor(kernelSize / 2);
    
    // Horizontal pass
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let r = 0, g = 0, b = 0;
            
            for (let k = 0; k < kernelSize; k++) {
                const px = Math.min(width - 1, Math.max(0, x + k - half));
                const offset = (y * width + px) * 4;
                r += data[offset] * kernel[k];
                g += data[offset + 1] * kernel[k];
                b += data[offset + 2] * kernel[k];
            }
            
            const idx = (y * width + x) * 4;
            output[idx] = r;
            output[idx + 1] = g;
            output[idx + 2] = b;
        }
    }
    
    // Vertical pass
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let r = 0, g = 0, b = 0;
            
            for (let k = 0; k < kernelSize; k++) {
                const py = Math.min(height - 1, Math.max(0, y + k - half));
                const offset = (py * width + x) * 4;
                r += output[offset] * kernel[k];
                g += output[offset + 1] * kernel[k];
                b += output[offset + 2] * kernel[k];
            }
            
            const idx = (y * width + x) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
        }
    }
    
    return imageData;
}

function createGaussianKernel(radius) {
    const size = radius * 2 + 1;
    const kernel = new Array(size);
    const sigma = radius / 3;
    let sum = 0;
    
    for (let i = 0; i < size; i++) {
        const x = i - radius;
        kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
        sum += kernel[i];
    }
    
    // Normalize
    for (let i = 0; i < size; i++) {
        kernel[i] /= sum;
    }
    
    return kernel;
}

/**
 * Median filter for noise reduction
 * Complexity: O(n * k^2 * log(k^2)) where k = kernel size
 */
function applyMedianFilter(imageData, size) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const output = new Uint8ClampedArray(data);
    const half = Math.floor(size / 2);
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const rValues = [];
            const gValues = [];
            const bValues = [];
            
            for (let ky = -half; ky <= half; ky++) {
                for (let kx = -half; kx <= half; kx++) {
                    const px = Math.min(width - 1, Math.max(0, x + kx));
                    const py = Math.min(height - 1, Math.max(0, y + ky));
                    const offset = (py * width + px) * 4;
                    
                    rValues.push(data[offset]);
                    gValues.push(data[offset + 1]);
                    bValues.push(data[offset + 2]);
                }
            }
            
            rValues.sort((a, b) => a - b);
            gValues.sort((a, b) => a - b);
            bValues.sort((a, b) => a - b);
            
            const medianIndex = Math.floor(rValues.length / 2);
            const idx = (y * width + x) * 4;
            
            output[idx] = rValues[medianIndex];
            output[idx + 1] = gValues[medianIndex];
            output[idx + 2] = bValues[medianIndex];
            output[idx + 3] = data[idx + 3];
        }
    }
    
    imageData.data.set(output);
    return imageData;
}

/**
 * Histogram Equalization for contrast enhancement
 * Complexity: O(n)
 */
function histogramEqualization(imageData) {
    const data = imageData.data;
    const histogram = new Array(256).fill(0);
    const totalPixels = data.length / 4;
    
    // Calculate histogram
    for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        histogram[gray]++;
    }
    
    // Calculate CDF (Cumulative Distribution Function)
    const cdf = new Array(256);
    cdf[0] = histogram[0];
    for (let i = 1; i < 256; i++) {
        cdf[i] = cdf[i - 1] + histogram[i];
    }
    
    // Normalize CDF
    const cdfMin = cdf.find(val => val > 0);
    const lookupTable = new Array(256);
    for (let i = 0; i < 256; i++) {
        lookupTable[i] = Math.round(((cdf[i] - cdfMin) / (totalPixels - cdfMin)) * 255);
    }
    
    // Apply equalization
    for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        const newValue = lookupTable[gray];
        data[i] = data[i + 1] = data[i + 2] = newValue;
    }
    
    return imageData;
}

/**
 * Normalize intensity to [0, 255] range
 * Complexity: O(n)
 */
function normalizeIntensity(imageData) {
    const data = imageData.data;
    let min = 255, max = 0;
    
    // Find min and max
    for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        min = Math.min(min, gray);
        max = Math.max(max, gray);
    }
    
    // Normalize
    const range = max - min;
    if (range > 0) {
        for (let i = 0; i < data.length; i += 4) {
            data[i] = ((data[i] - min) / range) * 255;
            data[i + 1] = ((data[i + 1] - min) / range) * 255;
            data[i + 2] = ((data[i + 2] - min) / range) * 255;
        }
    }
    
    return imageData;
}

/**
 * Resize image using bilinear interpolation
 * Complexity: O(n * m) where n, m are target dimensions
 */
function resizeImage(imageData, scale) {
    const oldWidth = imageData.width;
    const oldHeight = imageData.height;
    const newWidth = Math.round(oldWidth * scale);
    const newHeight = Math.round(oldHeight * scale);
    
    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext('2d');
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = oldWidth;
    tempCanvas.height = oldHeight;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.putImageData(imageData, 0, 0);
    
    ctx.drawImage(tempCanvas, 0, 0, newWidth, newHeight);
    return ctx.getImageData(0, 0, newWidth, newHeight);
}

// ============================================================
// 7. SEGMENTATION ALGORITHMS
// ============================================================

function handleSegmentMethodChange(e) {
    const method = e.target.value;
    
    // Hide all controls
    document.getElementById('thresholdControl').style.display = 'none';
    document.getElementById('cannyControl').style.display = 'none';
    document.getElementById('kmeansControl').style.display = 'none';
    
    // Show relevant controls
    if (method === 'global') {
        document.getElementById('thresholdControl').style.display = 'block';
    } else if (method === 'canny') {
        document.getElementById('cannyControl').style.display = 'block';
    } else if (method === 'kmeans') {
        document.getElementById('kmeansControl').style.display = 'block';
    }
    
    // Enable/disable apply button
    document.getElementById('applySegmentBtn').disabled = !method;
}

function applySegmentation() {
    if (!AppState.imageData) return;
    
    const method = document.getElementById('segmentMethod').value;
    if (!method) return;
    
    showLoading(true);
    addLog(`Memulai segmentasi: ${method}...`, 'info');
    
    setTimeout(() => {
        try {
            let imageData = cloneImageData(AppState.imageData);
            let result;
            
            switch (method) {
                case 'global':
                    const threshold = parseInt(document.getElementById('thresholdSlider').value);
                    result = globalThreshold(imageData, threshold);
                    addLog(`✓ Global threshold (T=${threshold})`, 'success');
                    break;
                    
                case 'otsu':
                    result = otsuThreshold(imageData);
                    addLog('✓ Otsu threshold', 'success');
                    break;
                    
                case 'adaptive':
                    result = adaptiveThreshold(imageData);
                    addLog('✓ Adaptive threshold', 'success');
                    break;
                    
                case 'sobel':
                    result = sobelEdgeDetection(imageData);
                    addLog('✓ Sobel edge detection', 'success');
                    break;
                    
                case 'canny':
                    const low = parseInt(document.getElementById('cannyLowSlider').value);
                    const high = parseInt(document.getElementById('cannyHighSlider').value);
                    result = cannyEdgeDetection(imageData, low, high);
                    addLog(`✓ Canny edge (low=${low}, high=${high})`, 'success');
                    break;
                    
                case 'kmeans':
                    const k = parseInt(document.getElementById('kmeansSlider').value);
                    result = kMeansSegmentation(imageData, k);
                    addLog(`✓ K-Means segmentation (K=${k})`, 'success');
                    break;
            }
            
            if (result) {
                AppState.canvases.processed.width = result.width;
                AppState.canvases.processed.height = result.height;
                AppState.contexts.processed.putImageData(result, 0, 0);
                AppState.processedImage = result;
                
                drawHistogram(result, AppState.contexts.histProcessed);
                addLog('Segmentasi selesai!', 'success');
            }
        } catch (error) {
            addLog('Error: ' + error.message, 'error');
        } finally {
            showLoading(false);
        }
    }, 100);
}

/**
 * Global Thresholding
 * Binary classification: pixel > T → white, else → black
 * Complexity: O(n)
 */
function globalThreshold(imageData, threshold) {
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const binary = gray > threshold ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = binary;
    }
    
    return imageData;
}

/**
 * Otsu's Thresholding
 * Automatically finds optimal threshold by maximizing between-class variance
 * Complexity: O(n + 256)
 */
function otsuThreshold(imageData) {
    const data = imageData.data;
    const histogram = new Array(256).fill(0);
    const totalPixels = data.length / 4;
    
    // Calculate histogram
    for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        histogram[gray]++;
    }
    
    // Find optimal threshold
    let sum = 0;
    for (let i = 0; i < 256; i++) {
        sum += i * histogram[i];
    }
    
    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let maxVariance = 0;
    let threshold = 0;
    
    for (let t = 0; t < 256; t++) {
        wB += histogram[t];
        if (wB === 0) continue;
        
        wF = totalPixels - wB;
        if (wF === 0) break;
        
        sumB += t * histogram[t];
        const mB = sumB / wB;
        const mF = (sum - sumB) / wF;
        
        const variance = wB * wF * (mB - mF) * (mB - mF);
        
        if (variance > maxVariance) {
            maxVariance = variance;
            threshold = t;
        }
    }
    
    addLog(`  Optimal threshold: ${threshold}`, 'info');
    return globalThreshold(imageData, threshold);
}

/**
 * Adaptive Thresholding
 * Local threshold based on neighborhood mean
 * Complexity: O(n * k^2) where k = window size
 */
function adaptiveThreshold(imageData) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const output = new Uint8ClampedArray(data);
    const windowSize = 15;
    const half = Math.floor(windowSize / 2);
    const C = 10; // Constant subtracted from mean
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let sum = 0;
            let count = 0;
            
            for (let ky = -half; ky <= half; ky++) {
                for (let kx = -half; kx <= half; kx++) {
                    const px = Math.min(width - 1, Math.max(0, x + kx));
                    const py = Math.min(height - 1, Math.max(0, y + ky));
                    const offset = (py * width + px) * 4;
                    const gray = 0.299 * data[offset] + 0.587 * data[offset + 1] + 0.114 * data[offset + 2];
                    sum += gray;
                    count++;
                }
            }
            
            const mean = sum / count;
            const idx = (y * width + x) * 4;
            const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
            const binary = gray > (mean - C) ? 255 : 0;
            
            output[idx] = output[idx + 1] = output[idx + 2] = binary;
            output[idx + 3] = data[idx + 3];
        }
    }
    
    imageData.data.set(output);
    return imageData;
}

/**
 * Sobel Edge Detection
 * Uses Sobel operators for gradient computation
 * Complexity: O(n)
 */
function sobelEdgeDetection(imageData) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const output = new Uint8ClampedArray(data.length);
    
    // Sobel kernels
    const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
    
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            let gx = 0, gy = 0;
            
            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    const offset = ((y + ky) * width + (x + kx)) * 4;
                    const gray = 0.299 * data[offset] + 0.587 * data[offset + 1] + 0.114 * data[offset + 2];
                    
                    gx += gray * sobelX[ky + 1][kx + 1];
                    gy += gray * sobelY[ky + 1][kx + 1];
                }
            }
            
            const magnitude = Math.sqrt(gx * gx + gy * gy);
            const idx = (y * width + x) * 4;
            
            output[idx] = output[idx + 1] = output[idx + 2] = clamp(magnitude);
            output[idx + 3] = 255;
        }
    }
    
    imageData.data.set(output);
    return imageData;
}

/**
 * Canny Edge Detection
 * Multi-stage algorithm: Gaussian blur → Gradient → Non-max suppression → Hysteresis
 * Complexity: O(n)
 */
function cannyEdgeDetection(imageData, lowThreshold, highThreshold) {
    const width = imageData.width;
    const height = imageData.height;
    let data = imageData.data;
    
    // 1. Apply Gaussian blur
    imageData = applyGaussianBlur(cloneImageData(imageData), 2);
    data = imageData.data;
    
    // 2. Calculate gradients
    const gradients = new Float32Array(width * height);
    const angles = new Float32Array(width * height);
    
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x;
            
            const topLeft = getGray(data, (y - 1) * width + (x - 1));
            const top = getGray(data, (y - 1) * width + x);
            const topRight = getGray(data, (y - 1) * width + (x + 1));
            const left = getGray(data, y * width + (x - 1));
            const right = getGray(data, y * width + (x + 1));
            const bottomLeft = getGray(data, (y + 1) * width + (x - 1));
            const bottom = getGray(data, (y + 1) * width + x);
            const bottomRight = getGray(data, (y + 1) * width + (x + 1));
            
            const gx = -topLeft - 2 * left - bottomLeft + topRight + 2 * right + bottomRight;
            const gy = -topLeft - 2 * top - topRight + bottomLeft + 2 * bottom + bottomRight;
            
            gradients[idx] = Math.sqrt(gx * gx + gy * gy);
            angles[idx] = Math.atan2(gy, gx);
        }
    }
    
    // 3. Non-maximum suppression
    const suppressed = new Uint8ClampedArray(width * height);
    
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x;
            const angle = angles[idx] * 180 / Math.PI;
            let normalized = angle < 0 ? angle + 180 : angle;
            
            let neighbor1 = 0, neighbor2 = 0;
            
            if ((normalized >= 0 && normalized < 22.5) || (normalized >= 157.5 && normalized <= 180)) {
                neighbor1 = gradients[y * width + (x - 1)];
                neighbor2 = gradients[y * width + (x + 1)];
            } else if (normalized >= 22.5 && normalized < 67.5) {
                neighbor1 = gradients[(y - 1) * width + (x + 1)];
                neighbor2 = gradients[(y + 1) * width + (x - 1)];
            } else if (normalized >= 67.5 && normalized < 112.5) {
                neighbor1 = gradients[(y - 1) * width + x];
                neighbor2 = gradients[(y + 1) * width + x];
            } else {
                neighbor1 = gradients[(y - 1) * width + (x - 1)];
                neighbor2 = gradients[(y + 1) * width + (x + 1)];
            }
            
            if (gradients[idx] >= neighbor1 && gradients[idx] >= neighbor2) {
                suppressed[idx] = clamp(gradients[idx]);
            }
        }
    }
    
    // 4. Hysteresis thresholding
    const output = new Uint8ClampedArray(data.length);
    const strong = 255;
    const weak = 75;
    
    for (let i = 0; i < suppressed.length; i++) {
        if (suppressed[i] >= highThreshold) {
            suppressed[i] = strong;
        } else if (suppressed[i] >= lowThreshold) {
            suppressed[i] = weak;
        } else {
            suppressed[i] = 0;
        }
    }
    
    // Edge tracking
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x;
            
            if (suppressed[idx] === weak) {
                let hasStrongNeighbor = false;
                
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        if (suppressed[(y + ky) * width + (x + kx)] === strong) {
                            hasStrongNeighbor = true;
                            break;
                        }
                    }
                    if (hasStrongNeighbor) break;
                }
                
                suppressed[idx] = hasStrongNeighbor ? strong : 0;
            }
            
            const pixelIdx = idx * 4;
            output[pixelIdx] = output[pixelIdx + 1] = output[pixelIdx + 2] = suppressed[idx];
            output[pixelIdx + 3] = 255;
        }
    }
    
    imageData.data.set(output);
    return imageData;
}

/**
 * K-Means Color Segmentation
 * Clusters pixels into K groups based on color similarity
 * Complexity: O(n * K * iterations)
 */
function kMeansSegmentation(imageData, k, maxIterations = 10) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const pixels = [];
    
    // Extract pixels
    for (let i = 0; i < data.length; i += 4) {
        pixels.push({
            r: data[i],
            g: data[i + 1],
            b: data[i + 2],
            cluster: 0
        });
    }
    
    // Initialize centroids randomly
    const centroids = [];
    for (let i = 0; i < k; i++) {
        const randomIdx = Math.floor(Math.random() * pixels.length);
        centroids.push({
            r: pixels[randomIdx].r,
            g: pixels[randomIdx].g,
            b: pixels[randomIdx].b
        });
    }
    
    // K-Means iterations
    for (let iter = 0; iter < maxIterations; iter++) {
        // Assign pixels to nearest centroid
        for (let i = 0; i < pixels.length; i++) {
            let minDist = Infinity;
            let bestCluster = 0;
            
            for (let j = 0; j < k; j++) {
                const dist = colorDistance(pixels[i], centroids[j]);
                if (dist < minDist) {
                    minDist = dist;
                    bestCluster = j;
                }
            }
            
            pixels[i].cluster = bestCluster;
        }
        
        // Update centroids
        const sums = Array(k).fill(null).map(() => ({ r: 0, g: 0, b: 0, count: 0 }));
        
        for (let i = 0; i < pixels.length; i++) {
            const cluster = pixels[i].cluster;
            sums[cluster].r += pixels[i].r;
            sums[cluster].g += pixels[i].g;
            sums[cluster].b += pixels[i].b;
            sums[cluster].count++;
        }
        
        for (let j = 0; j < k; j++) {
            if (sums[j].count > 0) {
                centroids[j].r = sums[j].r / sums[j].count;
                centroids[j].g = sums[j].g / sums[j].count;
                centroids[j].b = sums[j].b / sums[j].count;
            }
        }
    }
    
    // Apply segmentation
    for (let i = 0; i < pixels.length; i++) {
        const cluster = pixels[i].cluster;
        const idx = i * 4;
        data[idx] = centroids[cluster].r;
        data[idx + 1] = centroids[cluster].g;
        data[idx + 2] = centroids[cluster].b;
    }
    
    return imageData;
}

function colorDistance(p1, p2) {
    const dr = p1.r - p2.r;
    const dg = p1.g - p2.g;
    const db = p1.b - p2.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
}

// ============================================================
// 8. VIEW CONTROLS
// ============================================================

function handleViewToggle(e) {
    const view = e.target.dataset.view;
    const container = document.getElementById('canvasContainer');
    
    // Update active button
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    // Update container class
    container.className = 'canvas-container';
    if (view !== 'split') {
        container.classList.add(`view-${view}`);
    }
}

// ============================================================
// 9. DOWNLOAD FUNCTIONS
// ============================================================

function downloadResult() {
    const canvas = AppState.canvases.processed;
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    link.download = `processed_image_${timestamp}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    addLog('Hasil didownload', 'success');
}

function downloadAllStages() {
    // Note: For a full ZIP implementation, you would need JSZip library
    // Here we'll download individual files
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    
    // Download original
    const linkOriginal = document.createElement('a');
    linkOriginal.download = `1_original_${timestamp}.png`;
    linkOriginal.href = AppState.canvases.original.toDataURL('image/png');
    linkOriginal.click();
    
    // Download processed
    setTimeout(() => {
        const linkProcessed = document.createElement('a');
        linkProcessed.download = `2_processed_${timestamp}.png`;
        linkProcessed.href = AppState.canvases.processed.toDataURL('image/png');
        linkProcessed.click();
        
        addLog('Semua tahap didownload', 'success');
    }, 500);
}

// ============================================================
// 10. UTILITY FUNCTIONS
// ============================================================

function cloneImageData(imageData) {
    return new ImageData(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height
    );
}

function clamp(value, min = 0, max = 255) {
    return Math.max(min, Math.min(max, value));
}

function getGray(data, idx) {
    const offset = idx * 4;
    return 0.299 * data[offset] + 0.587 * data[offset + 1] + 0.114 * data[offset + 2];
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}

function addLog(message, type = 'info') {
    const logContent = document.getElementById('logContent');
    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${message}`;
    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;
}

function updatePreview() {
    // This function can be extended to show real-time preview
    // For now, it's a placeholder for future enhancements
}
