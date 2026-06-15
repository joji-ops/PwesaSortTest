/* ===========================
   Number Sort & Merge Tool
   =========================== */

document.addEventListener("DOMContentLoaded", () => {
  // ---- Element references ----
  const col1Count = document.getElementById("col1Count");
  const col1GoBtn = document.getElementById("col1GoBtn");
  const col1Fields = document.getElementById("col1Fields");
  const col1CountDisplay = document.getElementById("col1CountDisplay");
  const col1OcrStatus = document.getElementById("col1OcrStatus");
  const lensBtn1 = document.getElementById("lensBtn1");
  const col1CameraInput = document.getElementById("col1CameraInput");
  const col1GalleryInput = document.getElementById("col1GalleryInput");

  const col2Select = document.getElementById("col2Select");
  const col2Fields = document.getElementById("col2Fields");
  const col2CountDisplay = document.getElementById("col2CountDisplay");
  const col2OcrStatus = document.getElementById("col2OcrStatus");
  const lensBtn2 = document.getElementById("lensBtn2");
  const col2CameraInput = document.getElementById("col2CameraInput");
  const col2GalleryInput = document.getElementById("col2GalleryInput");

  const processBtn = document.getElementById("processBtn");
  const resetBtn = document.getElementById("resetBtn");
  const exportBtn = document.getElementById("exportBtn");

  const resultsCard = document.getElementById("resultsCard");
  const result1List = document.getElementById("result1List");
  const result2List = document.getElementById("result2List");
  const resultCombinedList = document.getElementById("resultCombinedList");
  const result1Count = document.getElementById("result1Count");
  const result2Count = document.getElementById("result2Count");
  const resultCombinedCount = document.getElementById("resultCombinedCount");

  const darkModeToggle = document.getElementById("darkModeToggle");
  const settingsBtn = document.getElementById("settingsBtn");
  const settingsModal = document.getElementById("settingsModal");
  const ocrApiKeyInput = document.getElementById("ocrApiKeyInput");
  const settingsCancelBtn = document.getElementById("settingsCancelBtn");
  const settingsSaveBtn = document.getElementById("settingsSaveBtn");

  const ocrModal = document.getElementById("ocrModal");
  const ocrModalText = document.getElementById("ocrModalText");
  const toast = document.getElementById("toast");

  const reviewModal = document.getElementById("reviewModal");
  const reviewList = document.getElementById("reviewList");
  const reviewAddBtn = document.getElementById("reviewAddBtn");
  const reviewCancelBtn = document.getElementById("reviewCancelBtn");
  const reviewConfirmBtn = document.getElementById("reviewConfirmBtn");

  let lastSorted = { col1: [], col2: [], combined: [] };

  // ---- Dark mode ----
  function applyTheme(theme) {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      darkModeToggle.textContent = "☀️";
    } else {
      document.documentElement.removeAttribute("data-theme");
      darkModeToggle.textContent = "🌙";
    }
    localStorage.setItem("numsort-theme", theme);
  }

  const savedTheme = localStorage.getItem("numsort-theme");
  if (savedTheme) {
    applyTheme(savedTheme);
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    applyTheme("dark");
  }

  darkModeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
  });

  // ---- OCR Settings (API key) ----
  function getOcrApiKey() {
    return localStorage.getItem("numsort-ocr-key") || "helloworld";
  }

  settingsBtn.addEventListener("click", () => {
    const saved = localStorage.getItem("numsort-ocr-key") || "";
    ocrApiKeyInput.value = saved;
    settingsModal.hidden = false;
  });

  settingsCancelBtn.addEventListener("click", () => {
    settingsModal.hidden = true;
  });

  settingsSaveBtn.addEventListener("click", () => {
    const key = ocrApiKeyInput.value.trim();
    if (key) {
      localStorage.setItem("numsort-ocr-key", key);
    } else {
      localStorage.removeItem("numsort-ocr-key");
    }
    settingsModal.hidden = true;
    showToast("OCR settings saved.");
  });

  // ---- Toast helper ----
  let toastTimer;
  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.hidden = true;
    }, 3000);
  }

  // ---- Generate input fields ----
  function generateFields(container, count, countDisplayEl, label) {
    container.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const input = document.createElement("input");
      input.type = "text";
      input.inputMode = "decimal";
      input.className = "num-field";
      input.placeholder = `#${i + 1}`;
      input.dataset.index = i;
      container.appendChild(input);
    }
    updateCountDisplay(container, countDisplayEl, label);
    attachValidation(container, countDisplayEl, label);
  }

  function attachValidation(container, countDisplayEl, label) {
    container.querySelectorAll(".num-field").forEach((field) => {
      field.addEventListener("input", () => {
        validateField(field);
        updateCountDisplay(container, countDisplayEl, label);
      });
    });
  }

  function validateField(field) {
    const value = field.value.trim();
    if (value === "") {
      field.classList.remove("invalid");
      return;
    }
    const isNumeric = /^-?\d*\.?\d+$/.test(value);
    field.classList.toggle("invalid", !isNumeric);
  }

  function updateCountDisplay(container, countDisplayEl, label) {
    const fields = container.querySelectorAll(".num-field");
    const filled = Array.from(fields).filter((f) => f.value.trim() !== "").length;
    if (countDisplayEl) {
      countDisplayEl.textContent = `${label}: ${filled} / ${fields.length} numbers entered`;
    }
  }

  // ---- Column 1: Go button ----
  col1GoBtn.addEventListener("click", () => {
    const count = parseInt(col1Count.value, 10);
    if (!count || count < 1) {
      showToast("Please enter a valid number of fields (1 or more).");
      return;
    }
    if (count > 100) {
      showToast("Please enter a smaller number (max 100).");
      return;
    }
    generateFields(col1Fields, count, col1CountDisplay, "Column 1");
  });

  // Allow Enter key to trigger Go
  col1Count.addEventListener("keypress", (e) => {
    if (e.key === "Enter") col1GoBtn.click();
  });

  // ---- Column 2: select dropdown ----
  col2Select.addEventListener("change", () => {
    const count = parseInt(col2Select.value, 10);
    if (!count) {
      col2Fields.innerHTML = "";
      col2CountDisplay.textContent = "";
      return;
    }
    generateFields(col2Fields, count, col2CountDisplay, "Column 2");
  });

  // ---- Collect numbers from a fields container ----
  function collectNumbers(container) {
    const fields = container.querySelectorAll(".num-field");
    const numbers = [];
    fields.forEach((field) => {
      const value = field.value.trim();
      if (value !== "" && /^-?\d*\.?\d+$/.test(value)) {
        numbers.push(parseFloat(value));
      }
    });
    return numbers;
  }

  // ---- Process button ----
  processBtn.addEventListener("click", () => {
    if (col1Fields.children.length === 0 && col2Fields.children.length === 0) {
      showToast("Please generate and fill in at least one column first.");
      return;
    }

    const col1Numbers = collectNumbers(col1Fields).sort((a, b) => a - b);
    const col2Numbers = collectNumbers(col2Fields).sort((a, b) => a - b);

    if (col1Numbers.length === 0 && col2Numbers.length === 0) {
      showToast("Please enter at least one valid number.");
      return;
    }

    // Build combined list with source tags
    const combined = [
      ...col1Numbers.map((n) => ({ value: n, source: "col1" })),
      ...col2Numbers.map((n) => ({ value: n, source: "col2" })),
    ].sort((a, b) => a.value - b.value);

    lastSorted = { col1: col1Numbers, col2: col2Numbers, combined };

    renderResults(col1Numbers, col2Numbers, combined);
    resultsCard.hidden = false;
    resultsCard.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  function renderResults(col1Numbers, col2Numbers, combined) {
    // Column 1 results
    result1List.innerHTML = "";
    col1Numbers.forEach((n) => {
      const chip = document.createElement("span");
      chip.className = "result-chip red";
      chip.textContent = n;
      result1List.appendChild(chip);
    });
    result1Count.textContent = `${col1Numbers.length} numbers`;

    // Column 2 results
    result2List.innerHTML = "";
    col2Numbers.forEach((n) => {
      const chip = document.createElement("span");
      chip.className = "result-chip green";
      chip.textContent = n;
      result2List.appendChild(chip);
    });
    result2Count.textContent = `${col2Numbers.length} numbers`;

    // Combined results
    resultCombinedList.innerHTML = "";
    combined.forEach((item) => {
      const chip = document.createElement("span");
      chip.className = `result-chip ${item.source === "col1" ? "red" : "green"}`;
      chip.textContent = item.value;
      resultCombinedList.appendChild(chip);
    });
    resultCombinedCount.textContent = `${combined.length} numbers`;
  }

  // ---- Reset button ----
  resetBtn.addEventListener("click", () => {
    col1Count.value = "";
    col2Select.value = "";
    col1Fields.innerHTML = "";
    col2Fields.innerHTML = "";
    col1CountDisplay.textContent = "";
    col2CountDisplay.textContent = "";
    col1OcrStatus.textContent = "";
    col2OcrStatus.textContent = "";
    resultsCard.hidden = true;
    result1List.innerHTML = "";
    result2List.innerHTML = "";
    resultCombinedList.innerHTML = "";
    lastSorted = { col1: [], col2: [], combined: [] };
    showToast("All data cleared.");
  });

  // ---- Export to CSV ----
  exportBtn.addEventListener("click", () => {
    if (
      lastSorted.col1.length === 0 &&
      lastSorted.col2.length === 0 &&
      lastSorted.combined.length === 0
    ) {
      showToast("Please process numbers before exporting.");
      return;
    }

    let csv = "Section,Value,Source\n";
    lastSorted.col1.forEach((n) => {
      csv += `Column 1,${n},Column 1\n`;
    });
    lastSorted.col2.forEach((n) => {
      csv += `Column 2,${n},Column 2\n`;
    });
    lastSorted.combined.forEach((item) => {
      const source = item.source === "col1" ? "Column 1" : "Column 2";
      csv += `Combined,${item.value},${source}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "number_sort_results.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("CSV exported successfully!");
  });

  // ---- OCR functionality ----
  const ocrCancelBtn = document.getElementById("ocrCancelBtn");
  let ocrCancelled = false;
  let ocrTimeoutId = null;
  let ocrAbortController = null;

  // ---- Live camera modal (Take Photo / Switch Camera / Gallery) ----
  const cameraModal = document.getElementById("cameraModal");
  const cameraVideo = document.getElementById("cameraVideo");
  const cameraCanvas = document.getElementById("cameraCanvas");
  const cameraLabel = document.getElementById("cameraLabel");
  const cameraCloseBtn = document.getElementById("cameraCloseBtn");
  const cameraSwitchBtn = document.getElementById("cameraSwitchBtn");
  const cameraShutterBtn = document.getElementById("cameraShutterBtn");
  const cameraGalleryBtn = document.getElementById("cameraGalleryBtn");
  const cameraError = document.getElementById("cameraError");
  const cameraErrorText = document.getElementById("cameraErrorText");
  const cameraFallbackBtn = document.getElementById("cameraFallbackBtn");
  const cameraErrorGalleryBtn = document.getElementById("cameraErrorGalleryBtn");

  let cameraStream = null;
  let currentFacingMode = "environment";
  let cameraTarget = null; // { fieldsContainer, countDisplayEl, statusEl, label, galleryInput, cameraInput }

  function stopCameraStream() {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      cameraStream = null;
    }
    cameraVideo.srcObject = null;
  }

  async function startCamera(facingMode) {
    stopCameraStream();
    cameraError.hidden = true;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showCameraError(
        "Live camera isn't supported in this browser. You can still scan a photo using your device's camera app or pick one from your gallery."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      cameraStream = stream;
      cameraVideo.srcObject = stream;
      await cameraVideo.play().catch(() => {});

      // Show the switch-camera button only if more than one camera is available
      if (navigator.mediaDevices.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter((d) => d.kind === "videoinput");
          cameraSwitchBtn.hidden = videoInputs.length < 2;
        } catch {
          cameraSwitchBtn.hidden = true;
        }
      }
    } catch (err) {
      console.error("getUserMedia error:", err);
      let message =
        "Couldn't access the camera. You can scan a photo using your device's camera app or pick one from your gallery instead.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        message =
          "Camera access was denied. Please allow camera permission for this site, or use your device's camera app / gallery instead.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        message = "No camera was found on this device. You can pick a photo from your gallery instead.";
      } else if (location.protocol !== "https:" && location.hostname !== "localhost") {
        message =
          "Live camera requires a secure (HTTPS) connection. You can scan a photo using your device's camera app or pick one from your gallery instead.";
      }
      showCameraError(message);
    }
  }

  function showCameraError(message) {
    cameraErrorText.textContent = message;
    cameraError.hidden = false;
  }

  function openCameraModal(target) {
    cameraTarget = target;
    cameraLabel.textContent = `Scan ${target.label}`;
    cameraSwitchBtn.hidden = true;
    cameraModal.hidden = false;
    currentFacingMode = "environment";
    startCamera(currentFacingMode);
  }

  function closeCameraModal() {
    stopCameraStream();
    cameraModal.hidden = true;
    cameraTarget = null;
  }

  cameraCloseBtn.addEventListener("click", () => closeCameraModal());

  cameraSwitchBtn.addEventListener("click", () => {
    currentFacingMode = currentFacingMode === "environment" ? "user" : "environment";
    startCamera(currentFacingMode);
  });

  // Capture the current video frame and run OCR on it
  cameraShutterBtn.addEventListener("click", () => {
    if (!cameraStream || !cameraTarget) return;

    const width = cameraVideo.videoWidth;
    const height = cameraVideo.videoHeight;
    if (!width || !height) return;

    cameraCanvas.width = width;
    cameraCanvas.height = height;
    const ctx = cameraCanvas.getContext("2d");
    ctx.drawImage(cameraVideo, 0, 0, width, height);

    cameraCanvas.toBlob(
      (blob) => {
        const target = cameraTarget;
        closeCameraModal();
        if (blob) {
          processImageFile(blob, target.fieldsContainer, target.countDisplayEl, target.statusEl, target.label);
        }
      },
      "image/jpeg",
      0.92
    );
  });

  // Gallery shortcut inside the camera viewfinder
  cameraGalleryBtn.addEventListener("click", () => {
    const target = cameraTarget;
    closeCameraModal();
    if (target) target.galleryInput.click();
  });

  cameraErrorGalleryBtn.addEventListener("click", () => {
    const target = cameraTarget;
    closeCameraModal();
    if (target) target.galleryInput.click();
  });

  // Fallback to the device's native camera app (file input with capture attribute)
  cameraFallbackBtn.addEventListener("click", () => {
    const target = cameraTarget;
    closeCameraModal();
    if (target) target.cameraInput.click();
  });

  lensBtn1.addEventListener("click", (e) => {
    e.stopPropagation();
    openCameraModal({
      fieldsContainer: col1Fields,
      countDisplayEl: col1CountDisplay,
      statusEl: col1OcrStatus,
      label: "Column 1",
      galleryInput: col1GalleryInput,
      cameraInput: col1CameraInput,
    });
  });

  lensBtn2.addEventListener("click", (e) => {
    e.stopPropagation();
    openCameraModal({
      fieldsContainer: col2Fields,
      countDisplayEl: col2CountDisplay,
      statusEl: col2OcrStatus,
      label: "Column 2",
      galleryInput: col2GalleryInput,
      cameraInput: col2CameraInput,
    });
  });

  // ---- File input change handlers (native camera app / gallery picker) ----
  col1CameraInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (file) processImageFile(file, col1Fields, col1CountDisplay, col1OcrStatus, "Column 1");
  });

  col1GalleryInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (file) processImageFile(file, col1Fields, col1CountDisplay, col1OcrStatus, "Column 1");
  });

  col2CameraInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (file) processImageFile(file, col2Fields, col2CountDisplay, col2OcrStatus, "Column 2");
  });

  col2GalleryInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (file) processImageFile(file, col2Fields, col2CountDisplay, col2OcrStatus, "Column 2");
  });

  ocrCancelBtn.addEventListener("click", () => {
    ocrCancelled = true;
    ocrModal.hidden = true;
    if (ocrTimeoutId) clearTimeout(ocrTimeoutId);
    if (ocrAbortController) ocrAbortController.abort();
    showToast("OCR scan cancelled.");
  });

  // Downscale/compress the image before upload — OCR.space free tier caps
  // requests at 1MB, and large camera photos easily exceed that.
  function prepareImageForOcr(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        const MAX_DIM = 2000;
        let { width, height } = img;
        const scale = Math.min(1, MAX_DIM / Math.max(width, height));
        width = Math.round(width * scale);
        height = Math.round(height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Try decreasing JPEG quality until under ~1MB
        const tryQuality = (quality) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Could not process image."));
                return;
              }
              if (blob.size > 1024 * 1024 && quality > 0.4) {
                tryQuality(quality - 0.15);
              } else {
                resolve(blob);
              }
            },
            "image/jpeg",
            quality
          );
        };

        tryQuality(0.92);
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Could not load the selected image."));
      };

      img.src = objectUrl;
    });
  }

  // Send the image to the free OCR.space API and return the raw recognized text
  async function recognizeWithOcrSpace(blob, signal) {
    const apiKey = getOcrApiKey();

    const formData = new FormData();
    formData.append("apikey", apiKey);
    formData.append("file", blob, "scan.jpg");
    formData.append("language", "eng");
    formData.append("OCREngine", "2");
    formData.append("scale", "true");
    formData.append("isTable", "false");

    let response;
    try {
      response = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        body: formData,
        signal,
      });
    } catch (err) {
      if (err.name === "AbortError") throw err;
      throw new Error("Couldn't reach the OCR service. Check your internet connection.");
    }

    if (!response.ok) {
      throw new Error(`OCR service error (HTTP ${response.status}). Please try again.`);
    }

    const result = await response.json();

    if (result.IsErroredOnProcessing) {
      const msg = Array.isArray(result.ErrorMessage) ? result.ErrorMessage.join(" ") : result.ErrorMessage;
      throw new Error(msg || "OCR service could not process this image.");
    }

    const parsed = (result.ParsedResults || []).map((r) => r.ParsedText || "").join("\n");
    return parsed;
  }

  function processImageFile(file, fieldsContainer, countDisplayEl, statusEl, label) {
    if (!file) return;

    if (fieldsContainer.children.length === 0) {
      showToast(`Please generate the input fields for ${label} first.`);
      return;
    }

    if (file.type && !file.type.startsWith("image/")) {
      showToast("Please select a valid image file.");
      return;
    }

    ocrCancelled = false;
    ocrModal.hidden = false;
    ocrModalText.textContent = "Preparing image...";
    statusEl.textContent = "";

    ocrAbortController = new AbortController();

    // Safety timeout — never let the modal hang forever
    if (ocrTimeoutId) clearTimeout(ocrTimeoutId);
    ocrTimeoutId = setTimeout(() => {
      if (!ocrModal.hidden) {
        ocrModal.hidden = true;
        showToast("OCR is taking too long. Check your internet connection and try again.");
        console.error("OCR.space request timed out after 30s.");
        if (ocrAbortController) ocrAbortController.abort();
      }
    }, 30000);

    (async () => {
      try {
        const preparedBlob = await prepareImageForOcr(file);
        if (ocrCancelled) return;

        ocrModalText.textContent = "Uploading image to OCR service...";
        const text = await recognizeWithOcrSpace(preparedBlob, ocrAbortController.signal);
        if (ocrCancelled) return;

        clearTimeout(ocrTimeoutId);
        ocrModal.hidden = true;

        console.log("OCR raw text:", text);

        const numbers = extractNumbers(text);

        if (numbers.length === 0) {
          statusEl.textContent = "";
          showToast("No numbers detected in the image. Try a clearer, well-lit photo.");
          return;
        }

        openReviewModal(numbers, fieldsContainer, countDisplayEl, statusEl, label);
      } catch (err) {
        clearTimeout(ocrTimeoutId);
        ocrModal.hidden = true;
        if (err.name === "AbortError") return;
        console.error("OCR error:", err);
        showToast(`OCR failed: ${err.message || "please try again with a clearer image."}`);
      }
    })();
  }

  // Extract numeric tokens from raw OCR text
  function extractNumbers(text) {
    const matches = text.match(/-?\d*\.?\d+/g);
    if (!matches) return [];
    return matches
      .map((m) => m.trim())
      .filter((m) => m !== "" && m !== "." && m !== "-")
      .map((m) => parseFloat(m))
      .filter((n) => !isNaN(n));
  }

  // ---- Review modal: let the user confirm/edit detected numbers before filling ----
  let reviewContext = null; // { fieldsContainer, countDisplayEl, statusEl, label }

  function openReviewModal(numbers, fieldsContainer, countDisplayEl, statusEl, label) {
    reviewContext = { fieldsContainer, countDisplayEl, statusEl, label };
    reviewList.innerHTML = "";
    numbers.forEach((n) => addReviewRow(n));
    reviewModal.hidden = false;
  }

  function addReviewRow(value) {
    const row = document.createElement("div");
    row.className = "review-row";

    const input = document.createElement("input");
    input.type = "text";
    input.inputMode = "decimal";
    input.value = value === undefined || value === null ? "" : value;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "✕";
    removeBtn.title = "Remove";
    removeBtn.addEventListener("click", () => row.remove());

    row.appendChild(input);
    row.appendChild(removeBtn);
    reviewList.appendChild(row);
    input.focus();
  }

  reviewAddBtn.addEventListener("click", () => addReviewRow(""));

  reviewCancelBtn.addEventListener("click", () => {
    reviewModal.hidden = true;
    reviewContext = null;
  });

  reviewConfirmBtn.addEventListener("click", () => {
    if (!reviewContext) return;
    const { fieldsContainer, countDisplayEl, statusEl, label } = reviewContext;

    const numbers = Array.from(reviewList.querySelectorAll("input"))
      .map((inp) => inp.value.trim())
      .filter((v) => v !== "" && /^-?\d*\.?\d+$/.test(v))
      .map((v) => parseFloat(v))
      .filter((n) => !isNaN(n));

    reviewModal.hidden = true;
    reviewContext = null;

    if (numbers.length === 0) {
      showToast("No numbers to fill — add or edit values and try again.");
      return;
    }

    populateFields(fieldsContainer, numbers);
    updateCountDisplay(fieldsContainer, countDisplayEl, label);

    statusEl.textContent = `✅ ${numbers.length} number(s) filled.`;
    showToast("Fields updated successfully!");
  });

  // Fill empty fields first, then fill remaining (overwrite) if more numbers than empty fields
  function populateFields(container, numbers) {
    const fields = Array.from(container.querySelectorAll(".num-field"));
    let numIndex = 0;

    // Fill empty fields first
    for (let i = 0; i < fields.length && numIndex < numbers.length; i++) {
      if (fields[i].value.trim() === "") {
        fields[i].value = numbers[numIndex];
        validateField(fields[i]);
        numIndex++;
      }
    }

    // If numbers remain and all fields were full, overwrite from the start
    for (let i = 0; i < fields.length && numIndex < numbers.length; i++) {
      fields[i].value = numbers[numIndex];
      validateField(fields[i]);
      numIndex++;
    }
  }
});
