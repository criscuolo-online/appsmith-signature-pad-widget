import SignaturePad from "https://cdn.jsdelivr.net/npm/signature_pad@4.1.7/+esm";

appsmith.onReady(() => {
  const widget = document.getElementById("signatureWidget");
  const canvas = document.getElementById("signatureCanvas");
  const canvasWrap = document.getElementById("canvasWrap");
  const canvasLabel = document.getElementById("canvasLabel");
  const clearButton = document.getElementById("clearButton");
  const confirmButton = document.getElementById("confirmButton");
  const status = document.getElementById("signatureStatus");

  let confirmed = false;
  let busy = false;
  let currentRatio = 1;

  const signaturePad = new SignaturePad(canvas, {
    penColor: "#111827",
    minWidth: 1.2,
    maxWidth: 3,
    velocityFilterWeight: 0.7
  });

  function parseColor(value) {
    if (typeof value !== "string") return null;

    let hex = value.trim().replace("#", "");

    if (/^[0-9a-f]{3}$/i.test(hex)) {
      hex = hex.split("").map(c => c + c).join("");
    }

    if (/^[0-9a-f]{6}$/i.test(hex)) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16)
      ];
    }

    const match = value.match(
      /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i
    );

    return match ? match.slice(1, 4).map(Number) : null;
  }

  function isDarkColor(value, fallback = false) {
    const rgb = parseColor(value);

    if (!rgb) return fallback;

    const [r, g, b] = rgb;

    return (
      0.2126 * r +
      0.7152 * g +
      0.0722 * b
    ) < 150;
  }

  function applyTheme(theme = {}) {
    const darkBackground = isDarkColor(
      theme.backgroundColor,
      false
    );

    const darkPrimary = isDarkColor(
      theme.primaryColor,
      true
    );

    widget.style.setProperty(
      "--text",
      darkBackground ? "#f9fafb" : "#111827"
    );

    widget.style.setProperty(
      "--muted",
      darkBackground ? "#cbd5e1" : "#6b7280"
    );

    widget.style.setProperty(
      "--border",
      "#c0c5ce"
    );

    widget.style.setProperty(
      "--primary-foreground",
      darkPrimary ? "#ffffff" : "#111827"
    );
  }

  function applyModel(model = {}) {
    const fields = {
      title: ["widgetTitle", "Digital Signature"],
      subtitle: [
        "widgetSubtitle",
        "Draw your signature in the area below"
      ],
      placeholder: ["placeholderText", "Sign here"],
      confirmText: ["confirmText", "Confirm Signature"]
    };

    Object.entries(fields).forEach(([key, config]) => {
      const [id, fallback] = config;
      const element = document.getElementById(id);

      element.textContent =
        typeof model[key] === "string"
          ? model[key]
          : fallback;
    });
  }

  function updateUI() {
    const empty = signaturePad.isEmpty();

    canvasWrap.classList.toggle(
      "signed",
      !empty && !confirmed
    );

    canvasLabel.classList.toggle(
      "hidden",
      !empty
    );

    confirmButton.disabled =
      empty || confirmed || busy;

    clearButton.disabled =
      empty || busy;

    canvas.classList.toggle("locked", busy);
  }

  function clearStatus() {
    status.className = "status";
    status.textContent = "";
  }

  function showStatus(type, message) {
    status.className = `status ${type}`;
    status.textContent = message;
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();

    if (rect.width <= 0 || rect.height <= 0) return;

    const nextRatio = Math.max(
      window.devicePixelRatio || 1,
      1
    );

    const nextWidth = Math.round(
      rect.width * nextRatio
    );

    const nextHeight = Math.round(
      rect.height * nextRatio
    );

    if (
      canvas.width === nextWidth &&
      canvas.height === nextHeight
    ) {
      return;
    }

    const previousWidth =
      canvas.width / currentRatio;

    const previousHeight =
      canvas.height / currentRatio;

    const scaleX = previousWidth
      ? rect.width / previousWidth
      : 1;

    const scaleY = previousHeight
      ? rect.height / previousHeight
      : 1;

    const strokes = signaturePad.toData().map(
      group => ({
        ...group,
        points: group.points.map(point => ({
          ...point,
          x: point.x * scaleX,
          y: point.y * scaleY
        }))
      })
    );

    canvas.width = nextWidth;
    canvas.height = nextHeight;

    currentRatio = nextRatio;

    canvas.getContext("2d").setTransform(
      nextRatio, 0, 0, nextRatio, 0, 0
    );

    signaturePad.clear();

    if (strokes.length > 0) {
      signaturePad.fromData(strokes);
    }

    updateUI();
  }

  signaturePad.addEventListener(
    "beginStroke",
    () => {
      if (confirmed) {
        confirmed = false;

        appsmith.updateModel({
          signature: null
        }).catch(error => {
          console.error(
            "Failed to reset signature:",
            error
          );
        });
      }

      canvasWrap.classList.add("active");
      canvasLabel.classList.add("hidden");

      clearStatus();
    }
  );

  signaturePad.addEventListener(
    "endStroke",
    () => {
      canvasWrap.classList.remove("active");
      updateUI();
    }
  );

  clearButton.addEventListener(
    "click",
    async () => {
      if (busy) return;

      busy = true;
      updateUI();

      try {
        await appsmith.updateModel({
          signature: null
        });

        signaturePad.clear();
        confirmed = false;

        canvasWrap.classList.remove(
          "active",
          "signed"
        );

        clearStatus();
      } catch (error) {
        console.error(
          "Failed to clear signature:",
          error
        );

        showStatus(
          "error",
          "Unable to clear the signature."
        );
      } finally {
        busy = false;
        updateUI();
      }
    }
  );

  confirmButton.addEventListener(
    "click",
    async () => {
      if (
        signaturePad.isEmpty() ||
        confirmed ||
        busy
      ) {
        return;
      }

      busy = true;
      updateUI();
      clearStatus();

      const signature = signaturePad.toDataURL(
        "image/png"
      );

      try {
        await appsmith.updateModel({
          signature
        });

        confirmed = true;

        showStatus(
          "success",
          appsmith.model?.successMessage ||
            "Signature captured successfully!"
        );

        updateUI();

        try {
          await appsmith.triggerEvent(
            "onConfirm",
            { signature }
          );
        } catch (eventError) {
          console.warn(
            "Confirmation event was not executed:",
            eventError
          );
        }
      } catch (error) {
        confirmed = false;

        console.error(
          "Failed to confirm signature:",
          error
        );

        showStatus(
          "error",
          "Unable to confirm the signature."
        );
      } finally {
        busy = false;
        updateUI();
      }
    }
  );

  applyModel(appsmith.model);
  applyTheme(appsmith.theme);

  appsmith.onModelChange(newModel => {
    applyModel(newModel);
  });

  appsmith.onThemeChange(newTheme => {
    applyTheme(newTheme);
  });

  const resizeObserver = new ResizeObserver(
    resizeCanvas
  );

  resizeObserver.observe(canvas);

  window.addEventListener(
    "resize",
    resizeCanvas
  );

  resizeCanvas();
  updateUI();
});
