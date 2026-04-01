// content.js - Lógica aislada para Batch Click (Automatización)

let batchElements = [];
let batchIndex = 0;
let lastBatchParams = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "RUN_BATCH_CLICK") {
        runBatchClick(request.text, request.selector, request.batchSize);
        sendResponse({ status: "batch_started" });
    }
    if (request.action === "RESET_BATCH") {
        batchElements = [];
        batchIndex = 0;
        lastBatchParams = null;
        sendResponse({ status: "batch_reset" });
    }
    return true;
});

function runBatchClick(searchText, selectorFilter, batchSize) {
    // Si cambian los parámetros, buscar los elementos de nuevo
    const currentParams = JSON.stringify({ searchText, selectorFilter });
    if (lastBatchParams !== currentParams || batchElements.length === 0) {
        batchElements = findMatchingElements(searchText, selectorFilter);
        batchIndex = 0;
        lastBatchParams = currentParams;
    }

    if (batchElements.length === 0) {
        chrome.runtime.sendMessage({ action: "BATCH_PROGRESS", total: 0, processed: batchIndex }).catch(() => {});
        return;
    }

    const endIndex = Math.min(batchIndex + batchSize, batchElements.length);
    const elementsInBatch = endIndex - batchIndex;

    // Procesar el lote
    for (let i = batchIndex; i < endIndex; i++) {
        const element = batchElements[i];
        const delayIndex = i - batchIndex;
        
        setTimeout(() => {
            if (element.tagName === 'A' && element.href) {
                chrome.runtime.sendMessage({
                    action: "OPEN_BACKGROUND_TAB",
                    url: element.href
                }).catch(() => {});
            } else {
                simulateBatchClick(element);
            }
        }, delayIndex * 300); // 300ms de retraso entre cada clic
    }

    batchIndex = endIndex;
    setTimeout(() => {
        chrome.runtime.sendMessage({
            action: "BATCH_PROGRESS",
            total: batchElements.length,
            processed: batchIndex
        }).catch(() => {});
    }, elementsInBatch * 300 + 500);
}

function findMatchingElements(searchText, selectorFilter) {
    const query = "button, a, input, select, textarea, [role='button'], [tabindex='0'], .btn, .button";
    const elements = document.querySelectorAll(query);
    const matched = [];

    elements.forEach(el => {
        // Ignorar ocultos
        if (el.offsetWidth <= 0 && el.offsetHeight <= 0) return;

        const elementText = (el.innerText || el.placeholder || el.value || el.getAttribute('aria-label') || "").trim().toLowerCase();
        const searchLower = searchText.toLowerCase();
        const textMatches = elementText.includes(searchLower) || elementText === searchLower;

        if (!textMatches) return;

        const generatedSelector = generateBestSelector(el);
        const selectorMatches = generatedSelector.includes(selectorFilter) || el.matches(selectorFilter);

        // Comprobación secundaria
        if (selectorMatches || selectorFilter.split(',').some(s => el.matches(s.trim()))) {
            matched.push(el);
        }
    });

    return matched;
}

function simulateBatchClick(el) {
    el.focus();
    ['mousedown', 'mouseup', 'click'].forEach(eventType => {
        const event = new MouseEvent(eventType, {
            view: window,
            bubbles: true,
            cancelable: true,
            buttons: 1,
            ctrlKey: true, // Forzar en nueva pestaña si es posible
            metaKey: true  // Para MacOS
        });
        el.dispatchEvent(event);
    });
}

function generateBestSelector(el) {
    if (el.id) return `#${el.id}`;
    if (el.getAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
    if (el.name) return `[name="${el.name}"]`;
    let selector = el.tagName.toLowerCase();
    if (el.classList.length > 0) {
        const firstClass = el.classList[0];
        if (!firstClass.includes(':')) selector += `.${firstClass}`;
    }
    return selector;
}