# DOKUMENTASI TEKNIS
## Digital Image Processing Tool - Aplikasi Penelitian

---

## 1. ARSITEKTUR SISTEM

### 1.1 Overview
Aplikasi ini adalah web-based digital image processing tool yang berjalan sepenuhnya di sisi client (browser) tanpa memerlukan backend server. Semua algoritma pemrosesan citra diimplementasikan menggunakan JavaScript murni dengan memanfaatkan Canvas API.

### 1.2 Komponen Sistem
```
┌─────────────────────────────────────────────┐
│           USER INTERFACE (HTML/CSS)         │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌─────────────────┐ │
│  │   Sidebar    │      │    Workspace    │ │
│  │   Controls   │      │   Canvas Area   │ │
│  └──────────────┘      └─────────────────┘ │
│                                             │
├─────────────────────────────────────────────┤
│         PROCESSING ENGINE (JavaScript)      │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │  Pre-processing Module               │  │
│  │  • Grayscale                         │  │
│  │  • Brightness/Contrast               │  │
│  │  • Gaussian Blur                     │  │
│  │  • Median Filter                     │  │
│  │  • Histogram Equalization            │  │
│  │  • Normalization                     │  │
│  │  • Resize                            │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │  Segmentation Module                 │  │
│  │  • Global Threshold                  │  │
│  │  • Otsu Threshold                    │  │
│  │  • Adaptive Threshold                │  │
│  │  • Sobel Edge                        │  │
│  │  • Canny Edge                        │  │
│  │  • K-Means Clustering                │  │
│  └──────────────────────────────────────┘  │
│                                             │
├─────────────────────────────────────────────┤
│           CANVAS API (Browser)              │
└─────────────────────────────────────────────┘
```

---

## 2. ALGORITMA DAN METODE

### 2.1 Pre-processing Algorithms

#### A. Konversi Grayscale
**Metode:** Luminosity Method  
**Formula:** `Y = 0.299*R + 0.587*G + 0.114*B`  
**Kompleksitas:** O(n), dimana n = jumlah pixel  
**Referensi:** ITU-R BT.601 standard

**Penjelasan:**
Mengkonversi citra berwarna (RGB) menjadi citra grayscale dengan mempertimbangkan persepsi visual manusia terhadap warna. Koefisien 0.299, 0.587, 0.114 mencerminkan sensitivitas mata manusia terhadap merah, hijau, dan biru.

#### B. Brightness & Contrast Adjustment
**Formula:** 
```
output = factor * (input - 128) + 128 + brightness
factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100))
```
**Kompleksitas:** O(n)

**Penjelasan:**
- Brightness: Menggeser nilai intensitas pixel secara linear
- Contrast: Mengubah rentang nilai intensitas dengan pivot point di 128

#### C. Gaussian Blur
**Metode:** Separable Convolution  
**Kernel:** 1D Gaussian dengan σ = radius/3  
**Formula:** `G(x) = exp(-(x²)/(2σ²))`  
**Kompleksitas:** O(n × k), k = kernel size  
**Optimasi:** Menggunakan 2-pass (horizontal & vertical) untuk efisiensi

**Penjelasan:**
Filter smoothing yang mengurangi noise dan detail menggunakan distribusi Gaussian. Implementasi separable lebih efisien daripada konvolusi 2D penuh.

#### D. Median Filter
**Metode:** Non-linear filter  
**Window:** 3×3, 5×5, 7×7, atau 9×9  
**Kompleksitas:** O(n × k² × log(k²))

**Penjelasan:**
Mengganti setiap pixel dengan nilai median dari neighborhood-nya. Sangat efektif untuk menghilangkan salt-and-pepper noise sambil mempertahankan edge.

#### E. Histogram Equalization
**Metode:** CDF-based intensity transformation  
**Kompleksitas:** O(n)  
**Referensi:** Gonzalez & Woods - Digital Image Processing

**Penjelasan:**
Meningkatkan kontras global dengan meratakan distribusi intensitas menggunakan Cumulative Distribution Function (CDF). Formula:
```
output[i] = ((CDF[i] - CDF_min) / (total_pixels - CDF_min)) × 255
```

#### F. Normalisasi Intensitas
**Metode:** Min-Max Normalization  
**Formula:** `normalized = ((value - min) / (max - min)) × 255`  
**Kompleksitas:** O(n)

**Penjelasan:**
Menyesuaikan rentang intensitas citra ke [0, 255] untuk meningkatkan kontras dan memfasilitasi pemrosesan lebih lanjut.

#### G. Resize Image
**Metode:** Bilinear Interpolation  
**Kompleksitas:** O(n × m), n,m = dimensi target

**Penjelasan:**
Mengubah ukuran citra dengan interpolasi bilinear untuk hasil yang smooth.

---

### 2.2 Segmentation Algorithms

#### A. Global Thresholding
**Formula:** 
```
if pixel > T then white (255)
else black (0)
```
**Kompleksitas:** O(n)

**Penjelasan:**
Metode segmentasi paling sederhana. Memisahkan objek dari background berdasarkan threshold global T yang ditentukan pengguna.

#### B. Otsu's Thresholding
**Metode:** Automatic threshold selection  
**Prinsip:** Memaksimalkan between-class variance  
**Kompleksitas:** O(n + 256)  
**Referensi:** Otsu, N. (1979) - A Threshold Selection Method from Gray-Level Histograms

**Penjelasan:**
Algoritma ini secara otomatis menemukan threshold optimal dengan cara:
1. Menghitung histogram citra
2. Untuk setiap nilai threshold T (0-255):
   - Hitung variance antara foreground dan background
3. Pilih T yang menghasilkan variance maksimum

**Formula:**
```
σ²_between = w₀ × w₁ × (μ₀ - μ₁)²
dimana:
w₀, w₁ = probabilitas kelas 0 dan 1
μ₀, μ₁ = mean intensitas kelas 0 dan 1
```

#### C. Adaptive Thresholding
**Metode:** Local threshold  
**Window:** 15×15 (default)  
**Formula:** `T(x,y) = mean(neighborhood) - C`  
**Kompleksitas:** O(n × k²)

**Penjelasan:**
Menghitung threshold secara lokal untuk setiap pixel berdasarkan mean neighborhood-nya. Efektif untuk citra dengan pencahayaan tidak merata.

#### D. Sobel Edge Detection
**Kernel X:**
```
[-1  0  1]
[-2  0  2]
[-1  0  1]
```

**Kernel Y:**
```
[-1 -2 -1]
[ 0  0  0]
[ 1  2  1]
```

**Formula:** `magnitude = √(Gx² + Gy²)`  
**Kompleksitas:** O(n)

**Penjelasan:**
Mendeteksi edge dengan menghitung gradient intensitas menggunakan operator Sobel. Gx dan Gy masing-masing mendeteksi edge horizontal dan vertikal.

#### E. Canny Edge Detection
**Tahapan:**
1. Gaussian Smoothing (σ = 2)
2. Gradient Calculation (Sobel)
3. Non-Maximum Suppression
4. Hysteresis Thresholding (dual threshold)

**Kompleksitas:** O(n)  
**Referensi:** Canny, J. (1986) - A Computational Approach to Edge Detection

**Penjelasan:**
Multi-stage algorithm untuk deteksi edge yang robust:
- **Stage 1:** Noise reduction dengan Gaussian blur
- **Stage 2:** Menghitung gradient magnitude dan direction
- **Stage 3:** Mempertahankan hanya local maxima (thin edges)
- **Stage 4:** Edge tracking dengan dual threshold untuk mengurangi false edges

#### F. K-Means Color Segmentation
**Metode:** Unsupervised clustering  
**Kompleksitas:** O(n × K × iterations)  
**Default iterations:** 10

**Algoritma:**
```
1. Inisialisasi K centroids secara random
2. Repeat:
   a. Assign setiap pixel ke centroid terdekat (Euclidean distance dalam RGB space)
   b. Update centroid = mean dari semua pixel dalam cluster
3. Until convergence atau max iterations
```

**Penjelasan:**
Mengelompokkan pixel berdasarkan similarity warna dalam RGB color space. Menggunakan Euclidean distance untuk mengukur kesamaan warna.

---

## 3. STRUKTUR DATA

### 3.1 AppState Object
```javascript
AppState = {
    originalImage: HTMLImageElement,      // Gambar asli
    currentImage: HTMLImageElement,       // Gambar saat ini
    processedImage: ImageData,            // Hasil pemrosesan
    imageData: ImageData,                 // Working image data
    originalImageData: ImageData,         // Backup original
    processHistory: Array,                // Log history
    canvases: Object,                     // Canvas references
    contexts: Object                      // 2D context references
}
```

### 3.2 ImageData Structure
```javascript
ImageData {
    width: integer,
    height: integer,
    data: Uint8ClampedArray  // [R, G, B, A, R, G, B, A, ...]
}
```

Setiap pixel direpresentasikan dengan 4 nilai berurutan:
- data[i]     = Red
- data[i+1]   = Green
- data[i+2]   = Blue
- data[i+3]   = Alpha (opacity)

---

## 4. PERFORMA DAN OPTIMASI

### 4.1 Optimization Techniques

#### A. Separable Convolution (Gaussian Blur)
- **Before:** O(n × k²) - 2D convolution
- **After:** O(n × k) - Two 1D passes
- **Speed-up:** Hingga 10x untuk kernel besar

#### B. Typed Arrays
Menggunakan `Uint8ClampedArray` untuk representasi pixel data, yang lebih cepat daripada Array biasa.

#### C. Asynchronous Processing
Menggunakan `setTimeout` untuk processing yang berat agar UI tetap responsive:
```javascript
setTimeout(() => {
    // Heavy processing here
}, 100);
```

### 4.2 Performance Benchmarks (Estimasi)
Untuk citra 1920×1080 (2.07 megapixel):

| Operasi                | Kompleksitas | Waktu (approx) |
|------------------------|--------------|----------------|
| Grayscale              | O(n)         | ~10 ms         |
| Brightness/Contrast    | O(n)         | ~10 ms         |
| Gaussian Blur (r=5)    | O(n×k)       | ~50 ms         |
| Median Filter (3×3)    | O(n×k²)      | ~200 ms        |
| Histogram Eq.          | O(n)         | ~20 ms         |
| Otsu Threshold         | O(n)         | ~20 ms         |
| Sobel Edge             | O(n)         | ~30 ms         |
| Canny Edge             | O(n)         | ~150 ms        |
| K-Means (K=3)          | O(n×K×iter)  | ~500 ms        |

*Note: Waktu aktual bergantung pada hardware dan browser*

---

## 5. CARA MENJALANKAN APLIKASI

### 5.1 Persyaratan
- Browser modern (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- JavaScript enabled
- Minimal RAM 4GB (untuk processing citra besar)

### 5.2 Langkah Instalasi
1. Download ketiga file: `index.html`, `style.css`, `script.js`
2. Pastikan ketiga file berada dalam folder yang sama
3. Buka `index.html` dengan browser

### 5.3 Struktur Folder
```
project-folder/
├── index.html
├── style.css
└── script.js
```

**PENTING:** Tidak memerlukan web server, dapat dibuka langsung dari file system.

### 5.4 Workflow Penggunaan
1. **Upload Image**
   - Drag & drop atau klik area upload
   - Format: PNG, JPG, JPEG, GIF, WebP
   
2. **Pre-processing (Optional)**
   - Atur parameter yang diinginkan
   - Klik "Terapkan Pre-processing"
   
3. **Segmentation**
   - Pilih metode segmentasi
   - Atur parameter (jika ada)
   - Klik "Terapkan Segmentasi"
   
4. **Visualisasi**
   - Toggle view: Split, Before, After, Overlay
   - Lihat histogram citra
   - Cek log pemrosesan
   
5. **Download**
   - Download hasil akhir (PNG)
   - Download semua tahap (multiple files)

---

## 6. VALIDITAS ILMIAH

### 6.1 Kesesuaian dengan Literatur

Semua algoritma yang diimplementasikan mengikuti definisi standar dari textbook dan paper akademis:

1. **Grayscale Conversion:** ITU-R BT.601 standard
2. **Histogram Equalization:** Gonzalez & Woods (2008)
3. **Otsu Thresholding:** Otsu (1979)
4. **Gaussian Filter:** Computer Vision textbooks
5. **Sobel Operator:** Sobel & Feldman (1968)
6. **Canny Edge:** Canny (1986)
7. **K-Means:** Lloyd (1982), MacQueen (1967)

### 6.2 Keterbatasan

1. **Performance:** 
   - Citra sangat besar (>10MP) mungkin lambat
   - Median filter dengan kernel besar memerlukan waktu
   
2. **Presisi:**
   - Menggunakan integer arithmetic (0-255)
   - Floating point operations di-round
   
3. **Fitur Lanjutan:**
   - Tidak ada morphological operations (erosion, dilation)
   - Tidak ada watershed segmentation
   - Tidak ada region growing
   
4. **Browser Limitation:**
   - Canvas max size: ~16384×16384 px (browser dependent)
   - Memory limitation untuk citra sangat besar

---

## 7. PENGEMBANGAN LEBIH LANJUT

### 7.1 Fitur yang Dapat Ditambahkan

1. **Morphological Operations**
   - Erosion
   - Dilation
   - Opening / Closing
   
2. **Advanced Segmentation**
   - Watershed algorithm
   - Region growing
   - Graph cut
   
3. **Feature Extraction**
   - SIFT / SURF
   - HOG (Histogram of Oriented Gradients)
   - Texture features
   
4. **Color Space**
   - HSV / HSL conversion
   - LAB color space
   
5. **Performance**
   - WebGL acceleration
   - Web Workers untuk parallel processing
   - Progressive rendering

### 7.2 Integrasi OpenCV.js (Optional)

Untuk algoritma yang lebih kompleks, dapat mengintegrasikan OpenCV.js:

```html
<script src="https://docs.opencv.org/4.x/opencv.js"></script>
```

Kemudian gunakan cv.* functions untuk operasi lanjutan.

---

## 8. TROUBLESHOOTING

### 8.1 Common Issues

**Q: Gambar tidak muncul setelah upload**
A: Periksa format file (harus image/*), coba dengan gambar lain

**Q: Processing sangat lambat**
A: Citra terlalu besar, coba resize dulu atau gunakan citra lebih kecil

**Q: Browser freeze saat processing**
A: Normal untuk operasi berat, tunggu hingga selesai. Jika terlalu lama, refresh page.

**Q: Histogram tidak update**
A: Pastikan sudah klik tombol "Terapkan" setelah mengubah parameter

**Q: Download tidak berfungsi**
A: Periksa browser permission untuk download file

### 8.2 Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome  | 90+     | ✓ Full |
| Firefox | 88+     | ✓ Full |
| Safari  | 14+     | ✓ Full |
| Edge    | 90+     | ✓ Full |
| Opera   | 76+     | ✓ Full |

---

## 9. REFERENSI AKADEMIS

1. Gonzalez, R. C., & Woods, R. E. (2008). *Digital Image Processing* (3rd ed.). Pearson.

2. Otsu, N. (1979). A threshold selection method from gray-level histograms. *IEEE Transactions on Systems, Man, and Cybernetics*, 9(1), 62-66.

3. Canny, J. (1986). A computational approach to edge detection. *IEEE Transactions on Pattern Analysis and Machine Intelligence*, 8(6), 679-698.

4. Sobel, I., & Feldman, G. (1968). A 3×3 isotropic gradient operator for image processing. *Pattern Classification and Scene Analysis*, 271-272.

5. MacQueen, J. (1967). Some methods for classification and analysis of multivariate observations. *Proceedings of the Fifth Berkeley Symposium on Mathematical Statistics and Probability*, 281-297.

6. ITU-R Recommendation BT.601-7 (2011). Studio encoding parameters of digital television for standard 4:3 and wide-screen 16:9 aspect ratios.

---

## 10. LISENSI & PENGGUNAAN

Aplikasi ini dikembangkan untuk keperluan akademis dan penelitian.

**Penggunaan untuk Skripsi:**
- ✓ Boleh digunakan sebagai implementasi
- ✓ Boleh dimodifikasi sesuai kebutuhan penelitian
- ✓ Boleh di-extend dengan algoritma tambahan
- ✓ Wajib mencantumkan referensi yang sesuai

**Catatan:**
Pastikan untuk memahami setiap algoritma yang digunakan dan dapat menjelaskannya dalam laporan penelitian Anda.

---

**Versi:** 1.0  
**Tanggal:** 2025  
**Status:** Production Ready untuk Penelitian Akademis
